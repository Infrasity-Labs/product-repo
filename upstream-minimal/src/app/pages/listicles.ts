/*
 * "Listicles" page: port of main's `components/geo/overview/listicles-page.tsx` (route /content-hub/[company]/geo/listicles).
 * Stat cards, outreach pipeline, cluster tabs, listing-status toggle + search, per-prompt listicle groups (collapsible, paged)
 * and the pitch dialog.
 */
import { ri } from '../../lib/icons'
import { wireTabsBase, esc } from '../base'
import { dashButton, fmt, panel, wireToggle } from '../dash-ui'
import { clusterOptions, defaultFilter, mountFilterBar, pageBar } from '../dash-header'
import type { FilterValue } from '../dash-header'
import { pager, wirePager } from '../dash-parts'
import { BRAND, ENGINES } from '../data'
import { downloadCsv } from '../csv'
import { clusterTabs as clusterTabData, listicleGroups } from '../listicles-data'
import type { ListiclePromptGroup, ListicleRow } from '../listicles-data'
import { buildPitchDraft, clusterTabs, groupKey, listedToggle, listicleStats, outreachPipeline, pitchDialog, promptGroup } from '../listicles-sections'
import type { ListedFilter, ListicleStatsData, PitchState } from '../listicles-sections'
import { openOverlay } from '../model-results-overlay'
import type { Overlay } from '../model-results-overlay'

export const meta = { id: 'listicles', label: 'Listicles', icon: 'ListNumbers', order: 50 }

const GROUPS_PER_PAGE = 20
const LAST_SCAN = 'Nov 6, 09:12'

/* ------------------------------------------------------------------ derived data */
interface State { f: FilterValue; q: string; listed: ListedFilter; page: number; groups: Map<string, { open: boolean; page: number }> }

function filteredGroups(s: Pick<State, 'f' | 'q' | 'listed'>, groups: ListiclePromptGroup[] = listicleGroups): ListiclePromptGroup[] {
  const needle = s.q.trim().toLowerCase()
  return groups
    .filter((g) => s.f.cluster === 'all' || g.cluster_slug === s.f.cluster)
    .map((g) => {
      const listicles = g.listicles.filter((r) => {
        if (s.f.engines.length > 0 && !r.engines.some((e) => s.f.engines.includes(e))) return false
        if (s.listed === 'missing' && r.co_cited_with_you) return false
        if (s.listed === 'listed' && !r.co_cited_with_you) return false
        return !needle || g.prompt.toLowerCase().includes(needle) || r.url.toLowerCase().includes(needle) || r.domain.toLowerCase().includes(needle)
      })
      return { ...g, listicles, missing_count: listicles.filter((r) => !r.co_cited_with_you).length }
    })
    .filter((g) => g.listicles.length > 0)
}

function statsFor(f: FilterValue): ListicleStatsData {
  const groups = listicleGroups.filter((g) => f.cluster === 'all' || g.cluster_slug === f.cluster)
  const all = groups.flatMap((g) => g.listicles)
  const unique = new Map(all.map((r) => [r.url, r]))
  return {
    listicle_citations: all.reduce((a, r) => a + r.citations, 0), listicle_citations_caption: `across ${all.length} cited pages`,
    your_listicle_citations: all.filter((r) => r.co_cited_with_you).reduce((a, r) => a + r.citations, 0), your_listicle_citations_caption: 'cited alongside you',
    listicles_tracked: unique.size, listicles_tracked_clusters: new Set(groups.map((g) => g.cluster_slug)).size,
    not_listing_you: [...unique.values()].filter((r) => !r.co_cited_with_you).length,
  }
}

const examplesOf = (groups: ListiclePromptGroup[]) =>
  groups.flatMap((g) => g.listicles.filter((r) => !r.co_cited_with_you).map((r) => r.domain)).filter((d, i, a) => a.indexOf(d) === i).slice(0, 3)

const counts = (groups: ListiclePromptGroup[]) => {
  const total = groups.reduce((a, g) => a + g.listicles.length, 0)
  const missing = groups.reduce((a, g) => a + g.missing_count, 0)
  return { total, missing, listed: total - missing }
}

/* ------------------------------------------------------------------ cards for the landing sections */
export function listiclesPipelineCard(groups: ListiclePromptGroup[] = listicleGroups): string {
  const unique = new Map(groups.flatMap((g) => g.listicles).map((r) => [r.url, r]))
  return outreachPipeline([...unique.values()].filter((r) => !r.co_cited_with_you).length, examplesOf(groups))
}

/** The first prompt groups of the page (first one open), as shown under the filters. */
export function listiclesCard(): string {
  return `<div class="space-y-4">${listicleGroups.slice(0, 2).map((g, i) => promptGroup(g, { open: i === 0, page: 1 })).join('')}</div>`
}

/* ------------------------------------------------------------------ pitch dialog */
function openPitch(row: ListicleRow, prompt: string): void {
  const st: PitchState = { channel: 'email', intent: row.co_cited_with_you ? 'update' : 'add', draft: null, copied: false }
  const render = () => pitchDialog(row, prompt, st)
  const wire = (el: HTMLElement, o: Overlay) => {
    el.onclick = (e) => {
      const t = e.target as HTMLElement
      const ch = t.closest<HTMLElement>('[data-channel]')
      const it = t.closest<HTMLElement>('[data-intent]')
      if (ch) { st.channel = ch.dataset.channel as PitchState['channel']; o.update(render()) }
      else if (it) { st.intent = it.dataset.intent as PitchState['intent']; o.update(render()) }
      else if (t.closest('[data-create]')) { st.draft = buildPitchDraft(row, BRAND.name, st.channel, st.intent); st.copied = false; o.update(render()) }
      else if (t.closest('[data-copy]') && st.draft) {
        void navigator.clipboard?.writeText(st.draft).catch(() => undefined)
        st.copied = true; o.update(render())
        setTimeout(() => { st.copied = false; if (el.isConnected) o.update(render()) }, 1500)
      }
    }
  }
  openOverlay({ html: render(), wire })
}

/* ------------------------------------------------------------------ page */
const initial = (): State => ({ f: defaultFilter(), q: '', listed: 'all', page: 1, groups: new Map() })

function groupsHtml(s: State): string {
  const groups = filteredGroups(s)
  const pages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE))
  const cur = Math.min(s.page, pages)
  const visible = groups.slice((cur - 1) * GROUPS_PER_PAGE, cur * GROUPS_PER_PAGE)
  if (!visible.length) {
    return panel(`<div class="px-5 py-10 text-center"><p class="text-body-medium text-text-primary">No listicles match these filters</p>
      <p class="mt-1 text-body-regular text-text-secondary">${listicleGroups.length ? 'Try another cluster, engine or search term.' : 'No listicle pages were cited in this window.'}</p></div>`)
  }
  return `<div class="space-y-4">${visible.map((g, i) => {
    const gs = s.groups.get(groupKey(g)) ?? { open: i === 0, page: 1 }
    return promptGroup(g, gs)
  }).join('')}${groups.length > GROUPS_PER_PAGE ? panel(pager('groups', cur, pages, groups.length, GROUPS_PER_PAGE, 'prompts')) : ''}</div>`
}

function listedHtml(s: State): string {
  const c = counts(filteredGroups({ f: s.f, q: s.q, listed: 'all' }))
  return listedToggle(s.listed, c.total, c.missing, c.listed)
}

const footHtml = (s: State) => {
  const groups = filteredGroups(s)
  const name = s.f.cluster === 'all' ? 'All clusters' : (clusterTabData.find((c) => c.slug === s.f.cluster)?.name ?? s.f.cluster)
  return `${fmt(groups.reduce((a, g) => a + g.listicles.length, 0))} listicles across ${fmt(groups.length)} prompts in ${esc(name)}.`
}

export function html(): string {
  const s = initial()
  const groups = filteredGroups(s)
  return `<div data-listicles-page class="min-h-screen bg-background-secondary-default text-body-regular text-text-primary antialiased">
    ${pageBar('Listicles')}
    <div data-filter-bar></div>
    <main class="mx-auto max-w-[1760px] space-y-4 px-4 pb-10 pt-5 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-title-2-semibold text-text-primary">Listicles</h1>
          <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-body-regular text-text-secondary">&ldquo;Best X&rdquo; roundups AI engines cite. Get onto the ones that skip you.<span aria-hidden="true">·</span><span>last scan ${LAST_SCAN}</span></p>
        </div>
        <div class="flex items-center gap-2">
          ${dashButton('Refresh', { variant: 'outline', size: 'small', leadingIcon: 'RiRefreshLine', attrs: 'data-refresh' })}
          ${dashButton('Share report', { variant: 'outline', size: 'small', attrs: 'data-share' })}
        </div>
      </div>
      <div class="space-y-4">
        <div data-stats>${listicleStats(statsFor(s.f))}</div>
        <div data-pipeline>${outreachPipeline(statsFor(s.f).not_listing_you, examplesOf(groups))}</div>
        <div class="space-y-4">
          <div data-cluster-tabs>${clusterTabs(clusterTabData, s.f.cluster)}</div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div data-listed>${listedHtml(s)}</div>
            <label class="relative block"><span class="sr-only">Search prompts, domains, pages</span>${ri('RiSearchLine', 'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary')}
              <input data-q value="" placeholder="Search prompts, domains, pages" class="h-8 w-64 max-w-full rounded-lg border border-border-button-default bg-background-full pl-9 pr-3 text-body-regular text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring/20" /></label>
          </div>
          <div data-groups>${groupsHtml(s)}</div>
          <p class="text-caption-1-regular text-text-tertiary" data-foot>${footHtml(s)}</p>
        </div>
      </div>
    </main>
  </div>`
}

export function mount(host: HTMLElement): void {
  // Listeners go on this page's own element: the shell reuses `host` across visits, so listeners on it would pile up.
  const root = host.querySelector<HTMLElement>('[data-listicles-page]') as HTMLElement
  const s = initial()
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel) as T
  let filterBar: { set: (v: FilterValue) => void }

  const drawGroups = () => { q('[data-groups]').innerHTML = groupsHtml(s); q('[data-foot]').innerHTML = footHtml(s) }
  const drawListed = () => {
    q('[data-listed]').innerHTML = listedHtml(s)
    wireToggle(root, 'lst-listed', (v) => { s.listed = v as ListedFilter; s.page = 1; drawListed(); drawGroups(); drawPipeline() })
  }
  const drawPipeline = () => { q('[data-pipeline]').innerHTML = outreachPipeline(statsFor(s.f).not_listing_you, examplesOf(filteredGroups(s))) }
  const drawTabs = () => {
    q('[data-cluster-tabs]').innerHTML = clusterTabs(clusterTabData, s.f.cluster)
    wireTabsBase(root, 'lst-cluster', (v) => { setFilter({ ...s.f, cluster: v }); filterBar.set(s.f) })
  }
  const setFilter = (f: FilterValue) => {
    const clusterChanged = f.cluster !== s.f.cluster
    s.f = f; s.page = 1
    q('[data-stats]').innerHTML = listicleStats(statsFor(s.f))
    if (clusterChanged) drawTabs()
    drawListed(); drawGroups(); drawPipeline()
  }
  filterBar = mountFilterBar(q('[data-filter-bar]'), { value: s.f, clusters: clusterOptions(), engines: [...ENGINES], issues: 0, onChange: setFilter })
  drawTabs()
  drawListed()
  wirePager(root, 'groups', (p) => { s.page = p; drawGroups() })

  q('[data-q]').addEventListener('input', (e) => { s.q = (e.target as HTMLInputElement).value; s.page = 1; drawListed(); drawGroups(); drawPipeline() })
  const refresh = () => { drawListed(); drawGroups(); drawPipeline() }
  const keyedGroup = (el: HTMLElement) => {
    const wrap = el.closest<HTMLElement>('[data-group]')
    const key = wrap?.dataset.group as string
    return { wrap: wrap as HTMLElement, key, group: listicleGroups.find((g) => groupKey(g) === key) }
  }
  const redrawGroup = (wrap: HTMLElement, key: string) => {
    const g = filteredGroups(s).find((x) => groupKey(x) === key)
    if (!g) return
    const gs = s.groups.get(key) ?? { open: false, page: 1 }
    wrap.outerHTML = promptGroup(g, gs)
  }

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-refresh]')) { refresh(); return }
    const share = t.closest<HTMLElement>('[data-share]')
    if (share) {
      void navigator.clipboard?.writeText(location.href).catch(() => undefined)
      if (share.lastChild) share.lastChild.textContent = 'Link copied'
      setTimeout(() => { if (share.isConnected && share.lastChild) share.lastChild.textContent = 'Share report' }, 1800)
      return
    }
    const tog = t.closest<HTMLElement>('[data-group-toggle]')
    if (tog) {
      const { wrap, key } = keyedGroup(tog)
      const idx = filteredGroups(s).findIndex((g) => groupKey(g) === key)
      const cur = s.groups.get(key) ?? { open: idx === 0 && s.page === 1, page: 1 }
      s.groups.set(key, { ...cur, open: !cur.open })
      redrawGroup(wrap, key)
      return
    }
    const pg = t.closest<HTMLElement>('[data-pager^="lg:"] [data-pg]')
    if (pg && !pg.hasAttribute('disabled')) {
      const { wrap, key } = keyedGroup(pg)
      const cur = s.groups.get(key) ?? { open: true, page: 1 }
      s.groups.set(key, { ...cur, page: Number(pg.dataset.pg) })
      redrawGroup(wrap, key)
      return
    }
    const pitch = t.closest<HTMLElement>('[data-pitch]')
    if (pitch) {
      const g = listicleGroups.find((x) => groupKey(x) === pitch.dataset.pitch)
      const row = g?.listicles.find((r) => r.url === pitch.dataset.url)
      if (row) openPitch(row, pitch.dataset.prompt as string)
      return
    }
    if (t.closest('[data-export]')) {
      downloadCsv(`geo-listicles-${BRAND.company}-${s.f.range}d.csv`, ['Cluster', 'Prompt', 'Listicle URL', 'Domain', 'Citations', 'Co-cited with you', 'Engines', 'Next step'],
        filteredGroups(s).flatMap((g) => g.listicles.map((r) => [g.cluster_name, g.prompt, r.url, r.domain, r.citations, r.co_cited_with_you ? 'Yes' : 'No', r.engines.join('; '), r.next_step ?? ''])))
    }
  })
}
