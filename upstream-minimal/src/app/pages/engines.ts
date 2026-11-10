/*
 * "Engines" (port of main's `geo/overview/engines-page.tsx` + `dash/engines-sections.tsx`): how each tracked engine treats you.
 * Page bar + filter bar, engine coverage, per-engine cards, engines over time, clusters by engine, the pages each engine cites and a
 * prompt-by-engine grid (20 per page; a row opens the prompt popup). All numbers derive from the same prompts as the Prompts page.
 */
import { mount as mountCharts, multiLine, spark, type LineSeries } from '../charts'
import { clusterOptions, defaultFilter, mountFilterBar, pageBar, type FilterValue } from '../dash-header'
import { engineCell, pager, wirePager } from '../dash-parts'
import { dashButton, dchip, engineCardSpan, fmt, fmtPct, MONO, panel, panelHead, toggle, wireToggle } from '../dash-ui'
import { clusters, dates, ENGINES, engineRows, kpis, type PromptRow } from '../data'
import { ENGINE_DAYS, ENGINE_PAGES, type EnginePageDetail } from '../engines-data'
import { openPromptDialog } from '../prompt-dialog'
import { allPrompts } from '../prompts-data'
import { cx, domainLogo, ENGINE_META, engineLogo, esc } from '../ui'

export const meta = { id: 'engines', label: 'Engines', icon: 'RiCpuLine', order: 20 }

const th = 'px-3 py-3 text-caption-1-medium'
const PAGE_SIZE = 20
const NOT_TRACKED = [{ name: 'Google AI Mode', domain: 'google.com' }]
const TOTAL_ANSWERS = kpis.answers

/** Fewer than 30 answers (or 3% of all) on an engine is "low data". */
const isLowData = (answers: number, total: number) => answers < Math.max(30, total * 0.03)

const scopedPrompts = (cluster: string) => (cluster === 'all' ? allPrompts : allPrompts.filter((p) => p.cluster_slug === cluster))
const nameOf = (cluster: string) => (cluster === 'all' ? 'All clusters' : clusters.find((c) => c.slug === cluster)?.name ?? cluster)

interface EngineInfo { engine: string; answers: number; citation_rate: number | null }
/** One engine's answers + citation rate in a cluster scope ("all" uses the same figures as the overview's engine table). */
function engineInfo(engine: string, cluster: string): EngineInfo {
  if (cluster === 'all') { const r = engineRows.find((x) => x.engine === engine); return { engine, answers: r?.answers ?? 0, citation_rate: r?.citation_rate ?? null } }
  let answers = 0
  let cited = 0
  for (const p of scopedPrompts(cluster)) { const b = p.by_engine.find((x) => x.engine === engine); if (b) { answers += b.answers; cited += b.cited_answers } }
  return { engine, answers, citation_rate: answers ? Math.round((cited / answers) * 1000) / 10 : null }
}
const totalAnswers = (cluster: string) => (cluster === 'all' ? TOTAL_ANSWERS : ENGINES.reduce((a, e) => a + engineInfo(e, cluster).answers, 0))

function engineTile(engine: string, size = 16): string {
  return `<span class="grid size-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-separator-border" style="background:${ENGINE_META[engine]?.soft ?? 'var(--color-background-tertiary-default)'}">${engineLogo(engine, size)}</span>`
}

/* ------------------------------------------------------------------ coverage */
function coveragePanel(cluster: string): string {
  const total = totalAnswers(cluster)
  return panel(`
    ${panelHead({ title: 'Engine coverage', right: `<span>${ENGINES.length} of ${ENGINES.length + NOT_TRACKED.length} tracked</span>` })}
    <div class="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
      ${ENGINES.map((e) => {
        const low = isLowData(engineInfo(e, cluster).answers, total)
        return `<div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 rounded-xl border border-separator-border bg-background-secondary-default px-4 py-3">
          <span class="flex min-w-0 items-center gap-2 text-body-medium text-text-primary">${engineTile(e)}<span class="truncate" title="${e}">${e}</span></span>
          ${dchip(low ? 'warn' : 'good', low ? 'Low data' : 'Tracked', { dot: true })}
        </div>`
      }).join('')}
      ${NOT_TRACKED.map((n) => `<div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 rounded-xl border border-dashed border-separator-border bg-transparent px-4 py-3">
        <span class="flex min-w-0 items-center gap-2 text-body-medium text-text-tertiary"><span class="grid size-7 shrink-0 place-items-center rounded-lg bg-background-tertiary-default opacity-80 grayscale">${domainLogo(n.domain, 16)}</span><span class="truncate">${n.name}</span></span>
        ${dashButton('Add', { variant: 'outline', size: 'xs', disabled: true, title: 'Coming soon', leadingIcon: 'RiAddLine' })}
      </div>`).join('')}
    </div>`)
}

/* ------------------------------------------------------------------ per-engine cards */
const rateSeries = (engine: string, cluster: string): number[] => {
  const days = ENGINE_DAYS[engine] ?? []
  const all = engineRows.find((r) => r.engine === engine)?.citation_rate ?? 1
  const k = cluster === 'all' ? 1 : (engineInfo(engine, cluster).citation_rate ?? all) / all
  return days.map((d) => Math.round((d.rate ?? 0) * k * 10) / 10)
}

/** The four per-engine cards (also embedded on the landing page). */
export function engineCards(cluster = 'all'): string {
  const total = totalAnswers(cluster)
  return `<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">${ENGINES.map((e, i) => {
    const info = engineInfo(e, cluster)
    const page = ENGINE_PAGES.find((p) => p.engine === e)
    const low = isLowData(info.answers, total)
    const color = ENGINE_META[e]?.color ?? '#737373'
    return panel(`
      <div class="flex items-center justify-between gap-2">
        <h3 class="flex min-w-0 items-center gap-2 text-body-semibold text-text-primary">${engineTile(e)}<span class="truncate">${e}</span></h3>
        ${low ? dchip('warn', 'Low data', { dot: true }) : ''}
      </div>
      <p class="mt-4 text-title-3-medium tabular-nums text-text-primary">${low ? '–' : fmtPct(info.citation_rate, 1)}</p>
      <p class="mt-1 text-caption-1-regular text-text-tertiary">${low ? `${fmt(info.answers)} prompts in this range. Re-run before trusting it.` : `<span class="tabular-nums">${fmt(info.answers)}</span> prompts${page ? ` &middot; <span class="tabular-nums">${fmt(page.citations_to_you)}</span> citations to you &middot; ${fmtPct(page.total_cites ? (page.own_cites / page.total_cites) * 100 : null, 1)} share` : ''}`}</p>
      ${low ? '' : spark({ values: rateSeries(e, cluster), color, cls: 'mt-2 h-9 w-full' })}`, cx('min-w-0 p-5', engineCardSpan(i, ENGINES.length)))
  }).join('')}</div>`
}

/* ------------------------------------------------------------------ engines over time */
type Metric = 'rate' | 'avg_position' | 'sov'
const METRICS: Array<{ value: Metric; label: string; fmt: (n: number) => string }> = [
  { value: 'rate', label: 'Citation rate', fmt: (n) => `${Math.round(n)}%` },
  { value: 'avg_position', label: 'Position', fmt: (n) => `#${Math.round(n * 10) / 10}` },
  { value: 'sov', label: 'Share of voice', fmt: (n) => `${Math.round(n)}%` },
]
const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function overTimePanel(metric: Metric, cluster: string): string {
  const M = METRICS.find((m) => m.value === metric)!
  const lowerIsBetter = metric === 'avg_position'
  const total = totalAnswers(cluster)
  const days = dates.map(dayLabel)
  const series: LineSeries[] = ENGINES.filter((e) => !isLowData(engineInfo(e, cluster).answers, total)).map((e) => ({
    id: e, color: ENGINE_META[e]?.color ?? '#a3a3a3', logo: ENGINE_META[e]?.src,
    points: (ENGINE_DAYS[e] ?? []).map((p, i) => ({ x: dayLabel(p.date), y: metric === 'rate' ? rateSeries(e, cluster)[i] : p[metric], answers: p.answers })),
  }))
  const vals = series.flatMap((s) => s.points.map((p) => p.y).filter((y): y is number => y != null))
  const max = metric === 'avg_position' ? Math.max(5, Math.ceil(Math.max(...vals, 1) + 1)) : 100
  return panel(`
    ${panelHead({ title: 'Engines over time', right: toggle('eng-metric', metric, METRICS.map((m) => ({ value: m.value, label: m.label })), 'Metric') })}
    <div class="px-5 pb-5">
      ${days.length < 2 || !series.length ? '<p class="py-10 text-center text-body-regular text-text-secondary">Not enough scans in this range to draw a trend yet.</p>' : `
        <div class="${cx('h-[240px] w-full', MONO)}">${multiLine({ series, days, fmt: M.fmt, yMin: lowerIsBetter ? 1 : 0, yMax: max, lowerIsBetter, fillMissing: lowerIsBetter ? max : 0, bottomLabel: lowerIsBetter ? 'None' : undefined })}</div>
        <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-body-regular text-text-secondary">${series.map((s) => `<span class="inline-flex items-center gap-1.5">${s.logo ? `<img src="${s.logo}" alt="" width="13" height="13"/>` : `<span class="size-2 rounded-full" style="background:${s.color}"></span>`}${esc(s.id)}</span>`).join('')}</div>`}
    </div>`)
}

/* ------------------------------------------------------------------ clusters by engine */
/** Prompts-per-cluster by engine: how many prompts the engine cites you on. */
export function clustersByEngineCard(cluster = 'all'): string {
  const total = totalAnswers(cluster)
  const rows = clusters.filter((c) => c.tracked && (cluster === 'all' || c.slug === cluster) && allPrompts.some((p) => p.cluster_slug === c.slug)).map((c) => ({ slug: c.slug, name: c.name, prompts: allPrompts.filter((p) => p.cluster_slug === c.slug) }))
  const low = (e: string) => isLowData(engineInfo(e, cluster).answers, total)
  const head = ENGINES.map((e) => `<th class="${cx(th, 'whitespace-nowrap text-center')}"><span class="inline-flex items-center gap-1.5">${engineLogo(e, 13)}${e}</span></th>`).join('')
  return panel(`
    ${panelHead({ title: 'Clusters by engine', right: '<span>prompts where the engine cites you</span>' })}
    ${!rows.length ? '<p class="px-5 pb-5 text-body-regular text-text-secondary">No tracked clusters in this range.</p>' : `
      <div class="w-full overflow-x-auto"><table class="bui-table min-w-[900px]">
        <thead><tr><th class="${cx(th, 'pl-4')}">Cluster</th>${head}</tr></thead>
        <tbody>${rows.map((r) => `<tr data-nav="cluster" data-cluster="${r.slug}" class="cursor-pointer hover:bg-background-secondary-hover">
          <td class="py-3 pl-4 pr-3 text-body-semibold text-text-primary">${esc(r.name)}</td>
          ${ENGINES.map((e) => {
            if (low(e)) return `<td class="px-3 py-3 text-center">${dchip('warn', 'Low data')}</td>`
            const cited = r.prompts.filter((p) => p.by_engine.some((x) => x.engine === e && x.cited_answers > 0)).length
            const ratio = cited / Math.max(1, r.prompts.length)
            return `<td class="px-3 py-3 text-center">${dchip(ratio >= 0.6 ? 'good' : ratio >= 0.3 ? 'warn' : 'bad', `${cited}/${r.prompts.length}`, { cls: 'px-2 tabular-nums' })}</td>`
          }).join('')}
        </tr>`).join('')}</tbody>
      </table></div>`}`, 'overflow-hidden')
}

/* ------------------------------------------------------------------ pages each engine cites */
/** "Pages <engine> cites": one panel per engine (page types, your top pages, top third-party source). */
export function pagesEachEngineCites(cluster = 'all'): string {
  const total = totalAnswers(cluster)
  const shown = ENGINES.filter((e) => !isLowData(engineInfo(e, cluster).answers, total))
  const rem = shown.length % 3
  const xlSpan = (i: number) => (i >= shown.length - rem && rem === 1 ? 'xl:col-span-6' : i >= shown.length - rem && rem === 2 ? 'xl:col-span-3' : 'xl:col-span-2')
  return `<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-6">${shown.map((e, i) => {
    const p: EnginePageDetail | undefined = ENGINE_PAGES.find((x) => x.engine === e)
    const color = ENGINE_META[e]?.color ?? '#737373'
    const types = [...(p?.your_page_types ?? [])].sort((a, b) => b.count - a.count)
    const max = Math.max(1, ...types.map((t) => t.count))
    const third = p?.third_party_pages.find((x) => x.domain === p.top_third_party)
    return panel(`
      ${panelHead({ title: `<span class="flex items-center gap-2">${engineTile(e)}Pages ${e} cites</span>`, right: `<span>${p ? `${p.your_pages_cited} of your pages` : ''}</span>` })}
      ${!p ? '<p class="px-5 pb-5 text-body-regular text-text-secondary">No citations recorded.</p>' : `<div class="space-y-4 px-5 pb-5">
        <ul class="space-y-2">${types.slice(0, 4).map((t) => `<li class="grid grid-cols-[78px_1fr_auto] items-center gap-3 text-body-regular"><span class="text-text-secondary">${t.type}</span><span class="h-1.5 overflow-hidden rounded-full bg-background-tertiary-default"><span class="block h-full rounded-full" style="width:${Math.max(3, (t.count / max) * 100)}%;background:${color}"></span></span><span class="w-10 text-right tabular-nums text-text-secondary">${fmt(t.count)}</span></li>`).join('')}</ul>
        ${p.your_pages.length > 0 ? `<div>
          <p class="mb-1.5 text-caption-1-medium text-text-tertiary">Your top pages here</p>
          <ul class="space-y-1">${p.your_pages.slice(0, 3).map((pg) => `<li class="flex items-center justify-between gap-3 text-body-regular"><span class="min-w-0 truncate text-text-secondary" title="${esc(pg.path)}">${esc(pg.path)}</span><span class="shrink-0 tabular-nums text-text-tertiary">${fmt(pg.cites)}</span></li>`).join('')}</ul>
        </div>` : ''}
        <p class="flex items-center gap-2 rounded-xl bg-background-secondary-default px-3 py-2 text-body-regular text-text-secondary ring-1 ring-inset ring-separator-border">
          ${domainLogo(p.top_third_party, 16)}
          <span>Top third-party source: <strong class="text-body-semibold text-text-primary">${esc(p.top_third_party)}</strong> &middot; <span class="tabular-nums">${fmt(third?.cites ?? p.third_party_pages[0]?.cites ?? 0)}</span> citations</span>
        </p>
      </div>`}`, cx('flex flex-col', xlSpan(i), i === shown.length - 1 && shown.length % 2 === 1 && 'lg:max-xl:col-span-2'))
  }).join('')}</div>`
}

/* ------------------------------------------------------------------ prompt by engine */
/** The prompt × engine grid with a pager (20 per page); a row opens the prompt popup. */
export function promptByEngineCard(cluster = 'all', page = 1): string {
  const prompts: PromptRow[] = scopedPrompts(cluster)
  const pages = Math.max(1, Math.ceil(prompts.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const rows = prompts.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  return panel(`
    ${panelHead({ title: 'Prompt by engine', right: `<span>${fmt(prompts.length)} prompts &middot; ${esc(nameOf(cluster))}</span>` })}
    ${!rows.length ? '<p class="px-5 pb-5 text-body-regular text-text-secondary">No prompts scanned in this range.</p>' : `
      <div class="w-full overflow-x-auto"><table class="bui-table min-w-[960px]">
        <thead><tr><th class="${cx(th, 'pl-4')}">Prompt</th>${ENGINES.map((e) => `<th class="${cx(th, 'whitespace-nowrap text-center')}"><span class="inline-flex items-center gap-1.5">${engineLogo(e, 13)}${e}</span></th>`).join('')}</tr></thead>
        <tbody>${rows.map((p) => `<tr data-open data-cluster-slug="${esc(p.cluster_slug)}" data-prompt="${esc(p.prompt)}" class="cursor-pointer hover:bg-background-secondary-hover">
          <td class="max-w-[420px] whitespace-normal py-3 pl-4 pr-3"><span class="text-body-regular text-text-primary">${esc(p.prompt)}</span><span class="block text-caption-1-regular text-text-tertiary">${esc(p.cluster)}</span></td>
          ${ENGINES.map((e) => `<td class="px-3 py-3 text-center">${engineCell(p, e)}</td>`).join('')}
        </tr>`).join('')}</tbody>
      </table></div>`}
    ${pager('eng-pager', cur, pages, prompts.length, PAGE_SIZE, 'prompts')}`, 'overflow-hidden')
}

/* ------------------------------------------------------------------ page */
const intro = (cluster: string) => `How each AI engine treats you across ${cluster === 'all' ? 'all tracked clusters' : esc(nameOf(cluster))}.`

interface BodyState { cluster: string; metric: Metric; page: number }
const bodyHtml = (s: BodyState) => `
  ${coveragePanel(s.cluster)}
  ${engineCards(s.cluster)}
  <div data-slot="over-time">${overTimePanel(s.metric, s.cluster)}</div>
  ${clustersByEngineCard(s.cluster)}
  ${pagesEachEngineCites(s.cluster)}
  <div data-slot="prompt-grid">${promptByEngineCard(s.cluster, s.page)}</div>`

export function html(params?: Record<string, string>): string {
  const cluster = params?.cluster && clusters.some((c) => c.slug === params.cluster) ? params.cluster : 'all'
  return `<div class="bg-background-secondary-default text-body-regular text-text-primary antialiased">
    ${pageBar('Engines')}
    <div data-slot="filterbar"></div>
    <main class="mx-auto max-w-[1760px] space-y-4 px-4 pb-10 pt-5 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-title-3-medium text-text-primary">Engines</h1>
          <p data-slot="intro" class="mt-1 flex items-center gap-2 text-body-regular text-text-secondary">${intro(cluster)}</p>
        </div>
        ${dashButton('Scan health &rarr;', { variant: 'outline', href: '#', attrs: 'data-nav="overview"' })}
      </div>
      <div data-slot="body" class="space-y-4">${bodyHtml({ cluster, metric: 'rate', page: 1 })}</div>
    </main>
  </div>`
}

function exportCsv(cluster: string): void {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const cell = (p: PromptRow, e: string) => { const x = p.by_engine.find((y) => y.engine === e); return !x || x.answers === 0 ? 'no data' : x.cited_answers === 0 ? 'not cited' : x.rank != null ? `#${x.rank}` : 'cited' }
  const lines = scopedPrompts(cluster).map((p) => [p.prompt, p.cluster, ...ENGINES.map((e) => cell(p, e))].map(q).join(','))
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([[['Prompt', 'Cluster', ...ENGINES].map(q).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }))
  a.download = 'geo-engines-tracewell.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function mount(root: HTMLElement, params?: Record<string, string>): void {
  const slot = (n: string) => root.querySelector<HTMLElement>(`[data-slot="${n}"]`)!
  const s: BodyState = { cluster: params?.cluster && clusters.some((c) => c.slug === params.cluster) ? params.cluster : 'all', metric: 'rate', page: 1 }
  let value: FilterValue = defaultFilter({ cluster: s.cluster })
  const wireOverTime = () => { wireToggle(root, 'eng-metric', (v) => { s.metric = v as Metric; slot('over-time').innerHTML = overTimePanel(s.metric, s.cluster); wireOverTime(); mountCharts(root) }) }
  const wireBody = () => { wireOverTime(); mountCharts(root) }
  mountFilterBar(slot('filterbar'), {
    value, clusters: clusterOptions(), engines: [...ENGINES], issues: clusters.some((c) => !c.tracked) ? 1 : 0,
    onChange: (v) => {
      value = v
      if (v.cluster === s.cluster) return
      s.cluster = v.cluster; s.page = 1
      slot('intro').innerHTML = intro(s.cluster)
      slot('body').innerHTML = bodyHtml(s)
      wireBody()
    },
  })
  wireBody()
  wirePager(root, 'eng-pager', (p) => { s.page = p; slot('prompt-grid').innerHTML = promptByEngineCard(s.cluster, s.page) })
  root.addEventListener('click', (e) => {
    const tr = (e.target as HTMLElement).closest<HTMLElement>('tr[data-open]')
    if (tr) openPromptDialog({ cluster: tr.dataset.clusterSlug as string, prompt: tr.dataset.prompt as string, origin: root })
  })
  root.querySelector('[data-export]')?.addEventListener('click', () => exportCsv(s.cluster))
}
