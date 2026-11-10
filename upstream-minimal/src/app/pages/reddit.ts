/*
 * "Reddit" page: port of main's `components/geo/overview/reddit-threads-page.tsx` (route /content-hub/[company]/geo/reddit-threads).
 * Stat strip, threads-cited-vs-mentions trend, cited-threads table (search, pager, Engage dialog, Recheck mentions), subreddit roll-up.
 */
import * as charts from '../charts'
import { esc } from '../base'
import { dashButton, dchip, wireToggle, toggle } from '../dash-ui'
import { clusterOptions, defaultFilter, mountFilterBar, pageBar } from '../dash-header'
import type { FilterValue } from '../dash-header'
import { wirePager } from '../dash-parts'
import { clusters, ENGINES } from '../data'
import { downloadCsv } from '../csv'
import { manageDialogHtml } from '../model-results-manage'
import { openOverlay } from '../model-results-overlay'
import type { Overlay } from '../model-results-overlay'
import { redditThreadRows, sprintOptions } from '../reddit-data'
import type { RedditThreadRow } from '../reddit-data'
import { redditStats, redditTrendPanel, subredditsPanel, threadsBody, threadsTable } from '../reddit-sections'
import type { RedditStatsData, SubredditRow } from '../reddit-sections'

export const meta = { id: 'reddit', label: 'Reddit', icon: 'ChatCircle', order: 40 }

const rowsFor = (f: FilterValue) =>
  redditThreadRows.filter((r) => (f.cluster === 'all' || r.cluster === f.cluster) && (!f.engines.length || Object.keys(r.engines).some((e) => f.engines.includes(e))))
const notMentioned = (rows: RedditThreadRow[]) => rows.slice(0, 10).filter((r) => r.mentioned !== true).length

function statsFor(rows: RedditThreadRow[], range: number): RedditStatsData {
  const total = rows.reduce((a, r) => a + r.citations, 0)
  const checked = rows.filter((r) => r.mentioned != null)
  const ment = checked.filter((r) => r.mentioned).length
  const subs = subredditRows(rows)
  const top = subs[0]
  return {
    threads_cited: rows.length, threads_cited_caption: `distinct threads in the last ${range} days`,
    total_citations: total, total_citations_caption: 'across tracked prompts',
    mention_rate_pct: checked.length ? Math.round((ment / checked.length) * 100) : null, mention_rate_caption: `${ment} of ${checked.length} checked threads`,
    top_share_pct: top ? top.share_pct : null, top_subreddit_caption: top ? `r/${top.subreddit} · ${top.total_citations} citations` : 'no Reddit citations yet',
  }
}

function subredditRows(rows: RedditThreadRow[]): SubredditRow[] {
  const total = rows.reduce((a, r) => a + r.citations, 0)
  const map = new Map<string, SubredditRow>()
  rows.forEach((r, i) => {
    const s = map.get(r.subreddit) ?? { subreddit: r.subreddit, threads_in_top10: 0, threads_tracked: 0, total_citations: 0, share_pct: 0 }
    s.threads_tracked++; s.total_citations += r.citations
    if (i < 10) s.threads_in_top10++
    map.set(r.subreddit, s)
  })
  return [...map.values()].map((s) => ({ ...s, share_pct: total ? Math.round((s.total_citations / total) * 1000) / 10 : 0 })).sort((a, b) => b.total_citations - a.total_citations)
}

/* ------------------------------------------------------------------ cards for the landing sections */
export const redditTrendCard = (): string => redditTrendPanel()
export const redditThreadsCard = (): string => threadsTable({ threads: redditThreadRows, q: '', page: 1, notMentionedTop10: notMentioned(redditThreadRows) })

/* ------------------------------------------------------------------ Engage dialog (add-to-sprint flow) */
function openEngage(r: RedditThreadRow): void {
  const st = { selected: (sprintOptions.find((s) => s.status === 'current') ?? sprintOptions[0]).id, done: false }
  const render = () => manageDialogHtml({
    title: 'Engage with this thread',
    description: `<span class="block truncate" title="${esc(r.title)}">r/${esc(r.subreddit)} · ${esc(r.title)}</span>`,
    body: st.done
      ? '<div class="rounded-xl bg-status-lime-background px-4 py-3 text-body-regular text-status-lime-text">Added to sprint. Find it in that sprint\'s Reddit tab to draft and track the actual reply.</div>'
      : `<div class="max-h-56 space-y-2 overflow-y-auto">${sprintOptions
          .map((s) => `<button type="button" data-sprint="${s.id}" aria-pressed="${st.selected === s.id}" class="${st.selected === s.id ? 'border-accent-200 bg-accent-50 text-text-primary' : 'border-separator-border text-text-primary hover:bg-background-secondary-hover'} flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-body-regular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring"><span class="truncate">${esc(s.name)}</span>${dchip(s.status === 'current' ? 'good' : s.status === 'pending' ? 'accent' : 'neutral', s.status)}</button>`)
          .join('')}</div>`,
    footer: st.done ? undefined : dashButton('Add to sprint', { variant: 'solid', size: 'medium', cls: 'w-full', attrs: 'data-submit' }),
  })
  const wire = (el: HTMLElement, o: Overlay) => {
    el.onclick = (e) => {
      const t = e.target as HTMLElement
      const sp = t.closest<HTMLElement>('[data-sprint]')
      if (sp) { st.selected = sp.dataset.sprint as string; o.update(render()) }
      else if (t.closest('[data-submit]')) { st.done = true; o.update(render()) }
    }
  }
  openOverlay({ html: render(), wire })
}

/* ------------------------------------------------------------------ page */
interface State { f: FilterValue; q: string; page: number }

const subtitle = (f: FilterValue) => `Reddit threads AI engines cite for ${f.cluster === 'all' ? 'All clusters' : (clusters.find((c) => c.slug === f.cluster)?.name ?? f.cluster)} prompts.`
const windowValue = (f: FilterValue) => (f.from && f.to ? '' : String(f.range))
const headRight = (s: State) => `${toggle('reddit-window', windowValue(s.f), [{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }], 'Window')}
  ${dashButton('Recheck mentions', { variant: 'outline', size: 'small', leadingIcon: 'RiRefreshLine', disabled: !redditThreadRows.length, attrs: 'data-recheck' })}
  ${dashButton('Send to Threadflow', { variant: 'outline', size: 'small', leadingIcon: 'RiSendPlane2Line', disabled: true, title: 'No outreach integration exists for this yet — coming soon.' })}`

function body(s: State): string {
  const rows = rowsFor(s.f)
  return `<div class="space-y-4">
    ${redditStats(statsFor(rows, s.f.range))}
    ${redditTrendPanel()}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div data-threads>${threadsTable({ threads: rows, q: s.q, page: s.page, notMentionedTop10: notMentioned(rows) })}</div>
      ${subredditsPanel(subredditRows(rows))}
    </div>
  </div>`
}

const initial = (): State => ({ f: defaultFilter(), q: '', page: 1 })

export function html(): string {
  const s = initial()
  return `<div data-reddit-page class="min-h-screen bg-background-secondary-default text-body-regular text-text-primary antialiased">
    ${pageBar('Reddit')}
    <div data-filter-bar></div>
    <main class="mx-auto max-w-[1760px] space-y-4 px-4 pb-10 pt-5 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-title-2-semibold text-text-primary">Reddit</h1>
          <p class="mt-1 flex flex-wrap items-center gap-x-2 text-body-regular text-text-secondary" data-sub>${subtitle(s.f)}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2" data-head-right>${headRight(s)}</div>
      </div>
      <div data-body>${body(s)}</div>
    </main>
  </div>`
}

export function mount(host: HTMLElement): void {
  // Listeners go on this page's own element: the shell reuses `host` across visits, so listeners on it would pile up.
  const root = host.querySelector<HTMLElement>('[data-reddit-page]') as HTMLElement
  const s = initial()
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel) as T
  const drawHead = () => {
    q('[data-head-right]').innerHTML = headRight(s)
    wireToggle(root, 'reddit-window', (v) => { s.f = { ...s.f, range: Number(v) as 30 | 90, from: undefined, to: undefined }; filterBar.set(s.f); drawBody() })
  }
  const drawBody = () => {
    q('[data-sub]').textContent = subtitle(s.f)
    q('[data-body]').innerHTML = body(s)
    charts.mount(root)
  }
  const drawTable = () => {
    const rows = rowsFor(s.f)
    q('[data-th-body]').innerHTML = threadsBody({ threads: rows, q: s.q, page: s.page, notMentionedTop10: notMentioned(rows) })
  }
  const filterBar = mountFilterBar(q('[data-filter-bar]'), {
    value: s.f, clusters: clusterOptions(), engines: [...ENGINES], issues: 0,
    onChange: (v) => { s.f = v; s.page = 1; s.q = ''; drawHead(); drawBody() },
  })
  drawHead()
  charts.mount(root)
  wirePager(root, 'threads', (p) => { s.page = p; drawTable() })

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    if (t.dataset.thQ == null) return
    s.q = t.value; s.page = 1; drawTable()
  })
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const eng = t.closest<HTMLElement>('[data-engage]')
    if (eng) {
      const r = redditThreadRows.find((x) => x.url === eng.dataset.engage)
      if (r) openEngage(r)
      return
    }
    if (t.closest('[data-recheck]')) {
      redditThreadRows.forEach((r, i) => { if (r.mentioned == null) r.mentioned = i % 2 === 0 })
      drawBody()
      return
    }
    if (t.closest('[data-export]')) {
      const rows = rowsFor(s.f)
      downloadCsv(`geo-reddit-tracewell.csv`, ['Rank', 'Subreddit', 'Title', 'URL', 'Citations', 'Share', 'Engines', 'Mention'],
        rows.map((r, i) => [i + 1, r.subreddit, r.title, r.url, r.citations, `${r.share_pct}%`, Object.entries(r.engines).map(([e, n]) => `${e} ${n}`).join('; '), r.mentioned == null ? 'not checked' : r.mentioned ? 'mentioned' : 'not mentioned']))
    }
  })
}
