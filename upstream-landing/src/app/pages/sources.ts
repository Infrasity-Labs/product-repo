/*
 * "Sources": port of main's `components/geo/overview/sources-page.tsx` (route /content-hub/[company]/geo/citation-domains; also
 * /competitors, which opens the Competitors tab). Stat strip + tabs: Domains (table, movers, types, tags, listing gaps),
 * Competitors (share of voice, head to head, rivals by cluster, leaderboard) and Your pages.
 */
import * as charts from '../charts'
import { select, wireSelect, wireTabsBase, esc } from '../base'
import { dashButton, fmt, fmtPct, wireToggle } from '../dash-ui'
import { wirePager } from '../dash-parts'
import { clusterOptions, defaultFilter, mountFilterBar, pageBar } from '../dash-header'
import type { FilterValue } from '../dash-header'
import { BRAND, domainTypes, ENGINES } from '../data'
import type { DomainType } from '../data'
import { downloadCsv } from '../csv'
import { domainStats, domainTable, movers, yourPages } from '../sources-data'
import { activeClusters, competitorLists, leaderboard, scopedPrompts, urlVariantsNote } from '../sources-overview-data'
import { openManageCompetitors } from '../sources-manage'
import { competitorAlerts, domainsBody, domainsTable, domainTypesPanel, headToHeadPanel, leaderboardTable, listingGapsPanel, moversList, moversPanel, newDomainsPanel, rivalsByCluster, sovPanel, statStrip, tabBar, tagsPanel, typesPopover, yourPagesTable } from '../sources-sections'
import type { MoverTab, SourcesTab, TagMap } from '../sources-sections'
import { ownedVsThirdCard } from '../overview-cards'

export const meta = { id: 'sources', label: 'Sources', icon: 'Globe', order: 30 }

/* ------------------------------------------------------------------ Domains table (card + page) */
export interface DomainsState { q: string; typeFilter: DomainType[]; typesOpen: boolean; page: number; tags: TagMap }
const initialDomains = (): DomainsState => ({ q: '', typeFilter: [], typesOpen: false, page: 1, tags: {} })

const totalCitations = domainTypes.reduce((s, t) => s + t.citations, 0)
const availableTypes = [...new Set(domainTable.map((r) => r.type))]

function domainRows(s: DomainsState) {
  const needle = s.q.trim().toLowerCase()
  return domainTable.filter((r) => {
    if (s.typeFilter.length && !s.typeFilter.includes(r.type)) return false
    if (!needle) return true
    return r.domain.toLowerCase().includes(needle) || (s.tags[r.domain] ?? []).some((t) => t.toLowerCase().includes(needle))
  })
}
const bodyArgs = (s: DomainsState) => ({ rows: domainRows(s), totalCitations, promptsTotal: domainStats.prompts_in_scope, tags: s.tags, page: s.page })

/** The Domains table card (search, type filter, export, tags, pager). Wire with `mountDomainsTable`. */
export function domainsCard(s: DomainsState = initialDomains()): string {
  return domainsTable({ ...bodyArgs(s), q: s.q, types: availableTypes, typeFilter: s.typeFilter, typesOpen: s.typesOpen })
}

/** Opens/closes `[data-pop]` popovers inside `root`; one open at a time; closes on outside press / Escape. */
function wirePops(root: HTMLElement, onToggle?: (id: string, open: boolean) => void) {
  const closeAll = (except?: HTMLElement) => root.querySelectorAll<HTMLElement>('[data-pop]').forEach((p) => {
    const panelEl = p.querySelector<HTMLElement>('[data-pop-panel]')
    if (p === except || !panelEl || panelEl.hidden) return
    panelEl.hidden = true
    onToggle?.(p.dataset.pop as string, false)
  })
  root.addEventListener('click', (e) => {
    const trig = (e.target as HTMLElement).closest<HTMLElement>('[data-pop-toggle]')
    if (!trig) return
    const pop = trig.closest<HTMLElement>('[data-pop]')
    const panelEl = pop?.querySelector<HTMLElement>('[data-pop-panel]')
    if (!pop || !panelEl) return
    closeAll(pop)
    panelEl.hidden = !panelEl.hidden
    onToggle?.(pop.dataset.pop as string, !panelEl.hidden)
    panelEl.querySelector<HTMLInputElement>('input')?.focus()
  })
  document.addEventListener('mousedown', (e) => {
    if (!root.isConnected) return
    if (!(e.target as HTMLElement).closest('[data-pop]')) closeAll()
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.isConnected) closeAll() })
}

export function mountDomainsTable(host: HTMLElement, s: DomainsState = initialDomains(), onTags?: () => void): void {
  const body = host.querySelector<HTMLElement>('[data-dom-body]') as HTMLElement
  const drawBody = () => { body.innerHTML = domainsBody(bodyArgs(s)) }
  const drawTypes = () => { (host.querySelector('[data-types-pop]') as HTMLElement).innerHTML = typesPopover(availableTypes, s.typeFilter, s.typesOpen) }
  const refilter = () => { s.page = 1; drawBody() }
  wirePops(host, (id, open) => { if (id === 'types') s.typesOpen = open })
  wirePager(host, 'dom', (p) => { s.page = p; drawBody() })
  host.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    if (t.dataset.domQ == null) return
    s.q = t.value
    refilter()
  })
  const addTag = (domain: string) => {
    const input = host.querySelector<HTMLInputElement>(`[data-tag-input="${CSS.escape(domain)}"]`)
    const t = (input?.value ?? '').trim().slice(0, 24)
    if (t && !(s.tags[domain] ?? []).includes(t)) s.tags[domain] = [...(s.tags[domain] ?? []), t]
    drawBody()
    onTags?.()
  }
  host.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement
    if (e.key === 'Enter' && t.dataset.tagInput != null) addTag(t.dataset.tagInput)
  })
  host.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const ty = t.closest<HTMLElement>('[data-type]')
    if (ty) {
      const v = ty.dataset.type as DomainType
      s.typeFilter = s.typeFilter.includes(v) ? s.typeFilter.filter((x) => x !== v) : [...s.typeFilter, v]
      drawTypes(); refilter(); return
    }
    if (t.closest('[data-types-clear]')) { s.typeFilter = []; drawTypes(); refilter(); return }
    const add = t.closest<HTMLElement>('[data-tag-add]')
    if (add) { addTag(add.dataset.tagAdd as string); return }
    const rm = t.closest<HTMLElement>('[data-tag-remove]')
    if (rm) {
      const d = rm.dataset.tagRemove as string
      const next = (s.tags[d] ?? []).filter((x) => x !== rm.dataset.tag)
      if (next.length) s.tags[d] = next
      else delete s.tags[d]
      drawBody(); onTags?.(); return
    }
    if (t.closest('[data-dom-export]')) {
      downloadCsv(`geo-sources-domains-${BRAND.company}.csv`, ['Domain', 'Type', 'Tags', 'Citations', 'Share %', '30d change', 'Prompts', 'Retrieved %'],
        domainRows(s).map((r) => [r.domain, r.type, (s.tags[r.domain] ?? []).join('; '), r.citation_count, +((r.citation_count / totalCitations) * 100).toFixed(1), r.citation_change ?? '', r.prompts, r.in_answers_pct]))
    }
  })
}

/* ------------------------------------------------------------------ cards for the landing sections */
export function domainStatsCard(): string {
  return statStrip(statCells(initialDomains()))
}
export const domainMoversCard = (): string => `<div data-movers-card>${moversPanel('new')}</div>`
export const domainTypesCard = (): string => domainTypesPanel(domainTypes)
export const listingGapsCard = (): string => listingGapsPanel(domainStats.listing_gaps)

/* ------------------------------------------------------------------ page */
interface PageState { tab: SourcesTab; f: FilterValue; dom: DomainsState; rival: string | null; lbPage: number; h2hPage: number; pagesPage: number }

const scopeName = (f: FilterValue) => (f.cluster === 'all' ? 'all clusters' : (activeClusters.find((c) => c.slug === f.cluster)?.name ?? f.cluster))
const board = (s: PageState) => leaderboard(s.f.cluster, scopedPrompts(s.f.cluster))
const rivalsOf = (s: PageState) => board(s).filter((d) => d.type !== 'You').map((d) => d.domain)

function statCells(s: Pick<PageState, 'dom'> | DomainsState) {
  void s
  const rank = domainTable.findIndex((r) => r.is_you) + 1
  const topRival = domainTable.find((r) => !r.is_you)
  const competitors = domainTable.filter((r) => r.type === 'Competitor')
  const topPct = topRival ? (topRival.citation_count / totalCitations) * 100 : null
  return [
    { label: 'Your share', value: fmtPct(domainStats.your_share_pct, 1), foot: rank ? `#${rank} of ${fmt(domainStats.domains_cited)}` : domainStats.your_domain },
    { label: 'Top rival', value: topRival?.domain ?? '–', foot: topRival ? `${topPct != null ? `${Math.round(topPct)}% share · ` : ''}${fmt(topRival.citation_count)} citations` : undefined },
    { label: 'Tagged competitors', value: fmt(competitors.length), foot: competitors[0]?.domain ?? 'none tagged yet' },
    { label: 'New domains', value: fmt(movers.new.length), foot: 'appeared this period' },
  ]
}

const rivalSelect = (s: PageState) => select('rival', s.rival ?? '', rivalsOf(s).map((r) => ({ value: r, label: esc(r) })), { size: 'sm', label: '', cls: 'w-auto', triggerCls: 'shadow-none' })

function competitorsBody(s: PageState): string {
  const rows = board(s)
  const rivals = rivalsOf(s)
  return `<div class="space-y-4">
    ${sovPanel(s.f.range)}
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
      ${headToHeadPanel({ rivals, rival: s.rival, prompts: scopedPrompts(s.f.cluster), page: s.h2hPage, selectHtml: rivalSelect(s) })}
      <div class="space-y-4">
        ${rivalsByCluster({ clusters: activeClusters.map((c) => ({ slug: c.slug, name: c.name, top_rival: c.top_rival, competitors: competitorLists[c.slug] })), busy: null })}
        ${competitorAlerts(s.f.range)}
      </div>
    </div>
    ${leaderboardTable({ rows, page: s.lbPage, tagBusy: null, rival: s.rival })}
    ${newDomainsPanel()}
  </div>`
}

function pagesBody(s: PageState): string {
  return `<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.9fr_1fr]">
    ${yourPagesTable(yourPages, s.pagesPage)}
    <div class="space-y-4">
      ${ownedVsThirdCard()}
      <p class="rounded-lg border border-accent-200 border-l-2 border-l-accent-600 bg-background-full px-3.5 py-3 text-caption-1-regular leading-5 text-text-primary">${esc(urlVariantsNote)}</p>
    </div>
  </div>`
}

function domainsTab(s: PageState): string {
  return `<div class="space-y-4">
    <div data-domains-table>${domainsCard(s.dom)}</div>
    <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      ${domainTypesPanel(domainTypes)}
      ${moversPanel('new')}
      <div data-tags>${tagsPanel(s.dom.tags)}</div>
      ${listingGapsPanel(domainStats.listing_gaps)}
    </div>
  </div>`
}

const tabBody = (s: PageState) => (s.tab === 'domains' ? domainsTab(s) : s.tab === 'competitors' ? competitorsBody(s) : pagesBody(s))

const headRight = (s: PageState) => (s.tab === 'competitors' ? dashButton('Manage competitors', { variant: 'outline', size: 'small', leadingIcon: 'RiGroupLine', attrs: 'data-manage' }) : '')
const subtitle = (s: PageState) => `Which websites AI engines pull from when they answer your prompts. ${fmt(domainStats.domains_cited)} domains in ${s.f.range} days${s.f.cluster !== 'all' ? ` · ${esc(scopeName(s.f))}` : ''}.`

const tabCounts = () => ({ domains: domainStats.domains_cited, competitors: domainTable.filter((r) => r.type === 'Competitor').length, pages: yourPages.length })
const initTab = (tab?: string): SourcesTab => (tab === 'competitors' || tab === 'pages' ? tab : 'domains')

export function html(params?: Record<string, string>): string {
  const s: PageState = { tab: initTab(params?.tab), f: defaultFilter(), dom: initialDomains(), rival: null, lbPage: 1, h2hPage: 1, pagesPage: 1 }
  s.rival = rivalsOf(s)[0] ?? null
  return `<div data-sources-page class="min-h-screen bg-background-secondary-default text-body-regular text-text-primary antialiased">
    ${pageBar('Sources')}
    <div data-filter-bar></div>
    <main class="mx-auto max-w-[1760px] space-y-4 px-4 pb-10 pt-5 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-title-2-semibold text-text-primary">Sources</h1>
          <p class="mt-1 flex items-center gap-2 text-body-regular text-text-secondary" data-sub>${subtitle(s)}</p>
        </div>
        <div data-head-right>${headRight(s)}</div>
      </div>
      <div data-stat>${statStrip(statCells(s))}</div>
      <div data-tabbar>${tabBar(s.tab, tabCounts())}</div>
      <div data-tab-body>${tabBody(s)}</div>
    </main>
  </div>`
}

export function mount(host: HTMLElement, params?: Record<string, string>): void {
  // Listeners go on this page's own element: the shell reuses `host` across visits, so listeners on it would pile up.
  const root = host.querySelector<HTMLElement>('[data-sources-page]') as HTMLElement
  const s: PageState = { tab: initTab(params?.tab), f: defaultFilter(), dom: initialDomains(), rival: null, lbPage: 1, h2hPage: 1, pagesPage: 1 }
  s.rival = rivalsOf(s)[0] ?? null
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel) as T
  const tabBodyEl = q('[data-tab-body]')

  const drawChrome = () => {
    q('[data-sub]').innerHTML = subtitle(s)
    q('[data-head-right]').innerHTML = headRight(s)
    q('[data-stat]').innerHTML = statStrip(statCells(s))
    q('[data-tabbar]').innerHTML = tabBar(s.tab, tabCounts())
    wireTabsBase(root, 'sources-tab', (v) => { s.tab = v as SourcesTab; drawTab() })
  }
  const wireTab = () => {
    wireSelect(tabBodyEl, 'rival', (v) => { s.rival = v; s.h2hPage = 1; drawTab() })
    wireToggle(tabBodyEl, 'movers-tab', (v) => { (tabBodyEl.querySelector('[data-movers]') as HTMLElement).innerHTML = moversList(v as MoverTab) })
    if (s.tab === 'domains') {
      mountDomainsTable(q('[data-domains-table]'), s.dom, () => { (tabBodyEl.querySelector('[data-tags]') as HTMLElement).innerHTML = tagsPanel(s.dom.tags) })
    }
    charts.mount(tabBodyEl)
  }
  const drawTab = () => {
    tabBodyEl.innerHTML = tabBody(s)
    q('[data-head-right]').innerHTML = headRight(s)
    wireTab()
  }
  drawChrome()
  wireTab()

  mountFilterBar(q('[data-filter-bar]'), {
    value: s.f, clusters: clusterOptions(), engines: [...ENGINES], issues: 0,
    onChange: (v) => {
      const clusterChanged = v.cluster !== s.f.cluster
      s.f = v
      if (clusterChanged) { s.lbPage = 1; s.h2hPage = 1; s.rival = rivalsOf(s)[0] ?? null }
      q('[data-sub]').innerHTML = subtitle(s)
      if (s.tab === 'competitors') drawTab()
    },
  })

  wirePager(root, 'lb', (p) => { s.lbPage = p; drawTab() })
  wirePager(root, 'h2h', (p) => { s.h2hPage = p; drawTab() })
  wirePager(root, 'pages', (p) => { s.pagesPage = p; drawTab() })

  const retag = (domain: string, on: boolean, scope: string) => {
    for (const c of scope === 'all' ? activeClusters : activeClusters.filter((x) => x.slug === scope)) {
      competitorLists[c.slug] = on ? Array.from(new Set([...competitorLists[c.slug], domain])) : competitorLists[c.slug].filter((x) => x !== domain)
    }
    drawTab()
  }
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-manage]')) { openManageCompetitors(s.f.cluster, drawTab); return }
    const tag = t.closest<HTMLElement>('[data-lb-tag]')
    if (tag) { retag(tag.dataset.lbTag as string, tag.dataset.on === 'true', s.f.cluster); return }
    const cmp = t.closest<HTMLElement>('[data-lb-compare]')
    if (cmp) { s.rival = cmp.dataset.lbCompare as string; s.h2hPage = 1; drawTab(); return }
    const tr = t.closest<HTMLElement>('[data-track]')
    if (tr) { const [cluster, domain] = (tr.dataset.track as string).split('|'); retag(domain, true, cluster); return }
    if (!t.closest('[data-export]')) return
    if (s.tab === 'domains') {
      downloadCsv(`geo-sources-domains-${BRAND.company}.csv`, ['Domain', 'Type', 'Tags', 'Citations', 'Share %', '30d change', 'Prompts', 'Retrieved %'],
        domainRows(s.dom).map((r) => [r.domain, r.type, (s.dom.tags[r.domain] ?? []).join('; '), r.citation_count, +((r.citation_count / totalCitations) * 100).toFixed(1), r.citation_change ?? '', r.prompts, r.in_answers_pct]))
    } else if (s.tab === 'competitors') {
      downloadCsv(`geo-sources-competitors-${BRAND.company}.csv`, ['Domain', 'Type', 'Share of voice %', 'Citations', 'Prompts topped'], board(s).map((d) => [d.domain, d.type, d.pct, d.citations, d.promptsTopped]))
    } else {
      downloadCsv(`geo-sources-pages-${BRAND.company}.csv`, ['URL', 'Citations', 'Avg position', 'In answers %', 'Prompts'], yourPages.map((r) => [r.url, r.citation_count, r.avg_position ?? '', r.in_answers_pct, r.prompts]))
    }
  })
}
