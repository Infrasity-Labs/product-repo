/*
 * "Prompts" (port of main's `geo/overview/prompts-page.tsx`): page bar + filter bar, a cluster tab strip, six status cards and the
 * prompt table (search, intent + sort selects, 20 rows per page; a row opens the prompt popup). Status definitions: `PromptStatus`.
 * `promptsTableCard` + `mountPromptsTable` are the table panel on its own (the landing sections embed it).
 */
import { ri } from '../../lib/icons'
import { select, tabs, wireSelect, wireTabsBase } from '../base'
import { dashButton, dchip, fmt, fmtPct, fmtPos, meter, MONO, move, panel } from '../dash-ui'
import { clusterOptions, defaultFilter, mountFilterBar, pageBar, type FilterBarApi } from '../dash-header'
import { engineCell, pager, statusFor, wirePager } from '../dash-parts'
import { clusters, ENGINES, type Intent, type PromptRow, type PromptStatus } from '../data'
import { wirePopMenu } from '../model-results-manage'
import { openPromptDialog } from '../prompt-dialog'
import { allPrompts } from '../prompts-data'
import { openAddPrompts, openDeletePrompt, openEditPrompt, promptActions } from '../prompts-manage'
import { cx, domainLogo, engineLogo, esc } from '../ui'

export const meta = { id: 'prompts', label: 'Prompts', icon: 'RiMessage2Line', order: 10 }

const PAGE_SIZE = 20
const th = 'px-3 py-3 text-caption-1-medium'

type StatusKey = 'all' | PromptStatus | 'pending'
type SortKey = 'answers' | 'cited_desc' | 'cited_asc' | 'rank' | 'share'
export interface PromptsState { status: StatusKey; intent: 'all' | Intent; sort: SortKey; q: string; page: number; cluster: string }

const INTENT_LABEL: Record<Intent, string> = { pricing: 'pricing', comparison: 'how-to-choose', roi: 'ROI', howto: 'how-to', list: 'best-of', other: 'other' }
const STATUS_CARDS: Array<{ key: StatusKey; label: string; note: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }> = [
  { key: 'all', label: 'All prompts', note: 'every tracked prompt' },
  { key: 'owned', label: 'Owned', note: '#1 in the latest scan', tone: 'good' },
  { key: 'weak', label: 'Cited, not first', note: 'cited, but not #1', tone: 'warn' },
  { key: 'dropped', label: 'Dropped', note: 'ranked before, not anymore', tone: 'bad' },
  { key: 'missing', label: 'Never cited', note: 'scanned, never cited', tone: 'bad' },
  { key: 'pending', label: 'Not scanned yet', note: 'new, or tracking is off', tone: 'neutral' },
]
const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'answers', label: 'Most prompts checked' }, { value: 'cited_desc', label: 'Highest citation rate' }, { value: 'cited_asc', label: 'Lowest citation rate' },
  { value: 'rank', label: 'Best rank' }, { value: 'share', label: 'Highest share' },
]

const isPending = (p: PromptRow) => p.answers === 0
const marginOfError = (cited: number, n: number) => (n > 0 ? Math.round(1.96 * Math.sqrt(((cited / n) * (1 - cited / n)) / n) * 1000) / 10 : null)

const INITIAL: PromptsState = { status: 'all', intent: 'all', sort: 'answers', q: '', page: 1, cluster: 'all' }
const initialState = (params?: Record<string, string>): PromptsState => ({ ...INITIAL, cluster: params?.cluster && clusters.some((c) => c.slug === params.cluster) ? params.cluster : 'all' })

const clusterScoped = (cluster: string) => (cluster === 'all' ? allPrompts : allPrompts.filter((p) => p.cluster_slug === cluster))
function countsOf(cluster: string): Record<StatusKey, number> {
  const c: Record<StatusKey, number> = { all: 0, owned: 0, weak: 0, missing: 0, dropped: 0, pending: 0 }
  for (const p of clusterScoped(cluster)) { c.all++; if (isPending(p)) c.pending++; else c[p.status]++ }
  return c
}
const intentsOf = (cluster: string) => [...new Set(clusterScoped(cluster).map((p) => p.intent))]

function rowsOf(s: PromptsState): PromptRow[] {
  const needle = s.q.trim().toLowerCase()
  const matches = (p: PromptRow) => (s.intent === 'all' || p.intent === s.intent) && (!needle || p.prompt.toLowerCase().includes(needle) || p.cluster.toLowerCase().includes(needle))
  const scanned = clusterScoped(s.cluster).filter((p) => matches(p) && (s.status === 'all' ? true : s.status === 'pending' ? isPending(p) : !isPending(p) && p.status === s.status))
  const rank = (p: PromptRow) => p.current_rank ?? 999
  const by: Record<SortKey, (a: PromptRow, b: PromptRow) => number> = {
    answers: (a, b) => b.answers - a.answers, cited_desc: (a, b) => (b.citation_rate ?? -1) - (a.citation_rate ?? -1), cited_asc: (a, b) => (a.citation_rate ?? 101) - (b.citation_rate ?? 101),
    rank: (a, b) => rank(a) - rank(b), share: (a, b) => (b.your_share ?? -1) - (a.your_share ?? -1),
  }
  return [...scanned.filter((p) => !isPending(p)).sort(by[s.sort]), ...scanned.filter(isPending)]
}

/* ------------------------------------------------------------------ table */
function rowHtml(p: PromptRow): string {
  const pending = isPending(p)
  const st = statusFor(p)
  const moe = marginOfError(p.cited_answers, p.answers)
  return `<tr data-open data-cluster-slug="${esc(p.cluster_slug)}" data-prompt="${esc(p.prompt)}" class="${cx(!pending && 'cursor-pointer', 'hover:bg-background-secondary-hover')}">
    <td class="min-w-[300px] max-w-[560px] whitespace-normal py-3 pl-4 pr-3">
      <button type="button" ${pending ? 'disabled' : ''} class="text-left text-body-medium text-text-primary outline-none hover:text-accent-700 focus-visible:underline">${esc(p.prompt)}</button>
      <p class="mt-0.5 text-caption-1-regular text-text-tertiary"><a href="#" data-nav="cluster" data-cluster="${esc(p.cluster_slug)}" class="hover:text-accent-700 hover:underline">${esc(p.cluster)}</a> &middot; <span class="capitalize">${p.intent}</span> &middot; ${pending ? 'waiting for the first scan' : `${fmt(p.answers)} prompts checked`}</p>
    </td>
    <td class="px-3 py-3">${dchip(st.tone, st.label, { dot: true })}</td>
    <td class="w-[120px] px-3 py-3 text-right tabular-nums">
      <span class="text-body-medium text-text-primary">${fmtPct(p.citation_rate, 1)}</span>${moe != null ? `<span class="${cx('ml-1 text-caption-1-regular text-text-tertiary', MONO)}">&plusmn;${moe}</span>` : ''}
      ${meter(p.citation_rate ?? 0, 'indigo', 'mt-1 h-1')}
    </td>
    <td class="px-3 py-3 text-right text-body-regular tabular-nums text-text-primary">${p.your_share == null ? '–' : `${p.your_share}%`}</td>
    <td class="whitespace-nowrap px-3 py-3 text-right tabular-nums"><span class="text-body-regular text-text-primary">${p.current_rank != null ? fmtPos(p.current_rank) : '–'}</span>${p.rank_delta ? move(p.rank_delta, '', 'up', false, 'ml-1.5 text-caption-1-regular') : ''}</td>
    ${ENGINES.map((e) => `<td class="px-2 py-3 text-center">${engineCell(p, e)}</td>`).join('')}
    <td class="px-3 py-3 text-body-regular text-text-secondary">${p.most_cited_domain ? `<span class="inline-flex items-center gap-1.5">${domainLogo(p.most_cited_domain.domain, 14, p.most_cited_domain.is_you)}<span class="${cx(p.most_cited_domain.is_you && 'text-body-semibold text-accent-600')}">${p.most_cited_domain.is_you ? 'You' : esc(p.most_cited_domain.domain)}</span><span class="tabular-nums text-text-tertiary">${Math.round(p.most_cited_domain.pct)}%</span></span>` : '–'}</td>
    <td class="py-2.5 pr-3">${promptActions(p.prompt, p.cluster_slug)}</td>
  </tr>`
}

function tableHtml(s: PromptsState): string {
  const rows = rowsOf(s)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const cur = Math.min(s.page, pages)
  const visible = rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  const body = !visible.length
    ? `<p class="px-4 py-8 text-center text-body-regular text-text-secondary">${clusterScoped(s.cluster).length ? 'No prompts match these filters.' : 'No prompts tracked in this range yet.'}</p>`
    : `<div class="w-full overflow-x-auto"><table class="bui-table min-w-[1240px]">
      <thead><tr>
        <th class="${cx(th, 'min-w-[300px] pl-4')}">Prompt</th>
        <th class="${th}">Status</th>
        <th class="${cx(th, 'text-right')}">Cited</th>
        <th class="${cx(th, 'text-right')}">Your share</th>
        <th class="${cx(th, 'text-right')}">Rank</th>
        ${ENGINES.map((e) => `<th class="${cx(th, 'text-center')}" title="${e}"><span class="inline-flex items-center gap-1">${engineLogo(e, 12)}<span class="hidden xl:inline">${e}</span></span></th>`).join('')}
        <th class="${th}">Most cited</th>
        <th class="${cx(th, 'w-8 pr-3')}"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>${visible.map(rowHtml).join('')}</tbody>
    </table></div>`
  return body + pager('pr-pager', cur, pages, rows.length, PAGE_SIZE, 'prompts')
}

const intentSelect = (s: PromptsState) => select('pr-intent', s.intent, [{ value: 'all', label: 'All intents' }, ...intentsOf(s.cluster).map((i) => ({ value: i, label: INTENT_LABEL[i] }))], { size: 'sm' })
const sortSelect = (s: PromptsState) => select('pr-sort', s.sort, SORTS.map((x) => ({ value: x.value, label: `Sort: ${x.label}` })), { size: 'sm' })

/** The toolbar + table panel (search, intent, sort, rows, pager). Wire with `mountPromptsTable`. */
export function promptsTableCard(s: PromptsState = INITIAL): string {
  return panel(`
    <div class="flex flex-wrap items-center gap-2 border-b border-separator-border px-4 py-3">
      <label class="relative min-w-[200px] flex-1 sm:max-w-xs">
        <span class="sr-only">Search prompts</span>
        ${ri('RiSearchLine', 'pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary')}
        <input data-search value="${esc(s.q)}" placeholder="Search prompts" class="h-8 w-full rounded-lg border border-border-button-default bg-background-full pl-8 pr-2.5 text-body-regular text-text-primary outline-none placeholder:text-text-tertiary hover:border-border-button-hover focus:ring-2 focus:ring-border-focus-ring"/>
      </label>
      <div data-slot="intent">${intentSelect(s)}</div>
      <div data-slot="sort">${sortSelect(s)}</div>
      <span data-slot="count" class="ml-auto text-body-regular tabular-nums text-text-secondary">${fmt(rowsOf(s).length)} prompts</span>
    </div>
    <div data-slot="table">${tableHtml(s)}</div>`, 'overflow-hidden', undefined).replace('<section ', '<section data-prompts-card ')
}

export interface PromptsTableApi { state: PromptsState; update: (patch: Partial<PromptsState>) => void }

/** Wire the table panel inside `root`. `onChange` fires after every state change (the page uses it to refresh its tabs and cards). */
export function mountPromptsTable(root: HTMLElement, onChange?: (s: PromptsState) => void, params?: Record<string, string>): PromptsTableApi {
  const s = initialState(params)
  const slot = (n: string) => root.querySelector<HTMLElement>(`[data-slot="${n}"]`)!
  const wireIntent = () => wireSelect(root, 'pr-intent', (v) => { s.intent = v as PromptsState['intent']; s.page = 1; refresh(false) })
  const refresh = (rebuildIntent: boolean) => {
    if (rebuildIntent) { slot('intent').innerHTML = intentSelect(s); wireIntent() }
    slot('table').innerHTML = tableHtml(s)
    slot('count').textContent = `${fmt(rowsOf(s).length)} prompts`
    onChange?.(s)
  }
  wireIntent()
  wireSelect(root, 'pr-sort', (v) => { s.sort = v as SortKey; s.page = 1; refresh(false) })
  wirePager(root, 'pr-pager', (p) => { s.page = p; refresh(false) })
  root.querySelector<HTMLInputElement>('[data-search]')!.addEventListener('input', (e) => { s.q = (e.target as HTMLInputElement).value; s.page = 1; refresh(false) })
  wirePopMenu(root, (action, btn) => {
    const [cluster, prompt] = (btn.dataset.popmenuId as string).split('|')
    if (action === 'edit') openEditPrompt(prompt, cluster)
    else openDeletePrompt(prompt, cluster)
  })
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('a, [data-popmenu]')) return
    const tr = t.closest<HTMLElement>('tr[data-open]')
    if (tr && !tr.querySelector('button[disabled]')) openPromptDialog({ cluster: tr.dataset.clusterSlug as string, prompt: tr.dataset.prompt as string, origin: root })
  })
  return {
    state: s,
    update: (patch) => {
      const clusterChanged = patch.cluster != null && patch.cluster !== s.cluster
      Object.assign(s, patch)
      if (clusterChanged && s.intent !== 'all' && !intentsOf(s.cluster).includes(s.intent)) s.intent = 'all'
      s.page = 1
      refresh(clusterChanged)
    },
  }
}

/* ------------------------------------------------------------------ page */
const clusterTabs = (s: PromptsState) => {
  const per = new Map<string, number>()
  for (const p of allPrompts) per.set(p.cluster_slug, (per.get(p.cluster_slug) ?? 0) + 1)
  const list = [{ value: 'all', label: 'All clusters', count: allPrompts.length }, ...clusters.filter((c) => (per.get(c.slug) ?? 0) > 0).map((c) => ({ value: c.slug, label: esc(c.name), count: per.get(c.slug) ?? 0 }))]
  return tabs('pr-cluster', s.cluster, list, 'overflow-x-auto')
}

function cardsHtml(s: PromptsState): string {
  const counts = countsOf(s.cluster)
  return STATUS_CARDS.map((c) => {
    const on = s.status === c.key
    return `<button type="button" data-status="${c.key}" aria-pressed="${on}" class="${cx('flex min-w-0 flex-col items-start rounded-2xl border bg-background-full p-5 text-left outline-none transition-colors hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring', on ? 'border-accent-600 ring-1 ring-accent-600/30' : 'border-separator-border')}">
      ${c.tone ? dchip(c.tone, c.label, { dot: true }) : `<span class="text-body-medium text-text-secondary">${c.label}</span>`}
      <span class="mt-3 text-title-3-medium tabular-nums text-text-primary">${counts[c.key]}</span>
      <span class="mt-1 text-caption-1-regular text-text-tertiary">${c.note}</span>
    </button>`
  }).join('')
}

export function html(params?: Record<string, string>): string {
  const s = initialState(params)
  return `<div class="bg-background-secondary-default text-body-regular text-text-primary antialiased">
    ${pageBar('Prompts')}
    <div data-slot="filterbar"></div>
    <main class="mx-auto max-w-[1760px] space-y-4 px-4 pb-10 pt-5 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-title-3-medium text-text-primary">Prompts</h1>
          <p class="mt-1 flex items-center gap-2 text-body-regular text-text-secondary">Every tracked prompt, how often AI answers cite you, and on which engine.</p>
        </div>
        <div class="flex items-center gap-2">
          ${dashButton('Export CSV', { variant: 'outline', attrs: 'data-export' })}
          ${dashButton('Add prompts', { variant: 'solid', leadingIcon: 'RiAddLine', attrs: 'data-add' })}
        </div>
      </div>
      <div class="space-y-4">
        <div data-slot="cluster-tabs">${clusterTabs(s)}</div>
        <div data-slot="cards" class="grid grid-cols-2 gap-3 lg:grid-cols-5">${cardsHtml(s)}</div>
        ${promptsTableCard(s)}
      </div>
    </main>
  </div>`
}

function exportCsv(rows: PromptRow[]): void {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Prompt', 'Cluster', 'Status', 'Intent', 'Prompts checked', 'Citation rate %', 'Your share %', 'Rank', 'Most cited']
  const lines = rows.map((p) => [p.prompt, p.cluster, isPending(p) ? 'not scanned yet' : p.status, p.intent, p.answers, p.citation_rate, p.your_share, p.current_rank, p.most_cited_domain?.domain ?? ''].map(q).join(','))
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([[head.map(q).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }))
  a.download = 'geo-prompts-tracewell.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function mount(root: HTMLElement, params?: Record<string, string>): void {
  const slot = (n: string) => root.querySelector<HTMLElement>(`[data-slot="${n}"]`)!
  let value = defaultFilter({ cluster: initialState(params).cluster })
  const api = mountPromptsTable(root, (s) => { slot('cards').innerHTML = cardsHtml(s) }, params)
  const drawTabs = () => {
    slot('cluster-tabs').innerHTML = clusterTabs(api.state)
    wireTabsBase(root, 'pr-cluster', (v) => { value = { ...value, cluster: v }; api.update({ cluster: v }); bar.set(value) })
  }
  const bar: FilterBarApi = mountFilterBar(slot('filterbar'), {
    value, clusters: clusterOptions(), engines: [...ENGINES], issues: clusters.some((c) => !c.tracked) ? 1 : 0,
    onChange: (v) => { value = v; if (v.cluster !== api.state.cluster) { api.update({ cluster: v.cluster }); drawTabs() } },
  })
  drawTabs()
  slot('cards').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-status]')
    if (b) api.update({ status: b.dataset.status as StatusKey })
  })
  root.querySelectorAll<HTMLElement>('[data-export]').forEach((b) => b.addEventListener('click', () => exportCsv(rowsOf(api.state))))
  root.querySelector('[data-add]')?.addEventListener('click', () => openAddPrompts(api.state.cluster !== 'all' ? api.state.cluster : undefined))
}
