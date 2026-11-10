/*
 * Port of the app's GEO overview (main branch `components/geo/overview/geo-overview.tsx` with `dash/dash-header.tsx`,
 * `dash/sections-top.tsx` and `dash/sections-tables.tsx`) as HTML-string panels with the same BoardUI classes.
 * Every panel is exported so a landing section can embed it on its own; `mountOverview(root)` wires whichever of them are
 * inside `root`. Count-up / reveal animations are rendered in their final state.
 *
 * Main's panel names -> exports: SummaryPanel headlineCard, KpiRow statStrip, TimelinePanel citationTimeline (trendCard is the
 * same panel as the cluster page uses it: "Citation rate over time", no engine mode), ClustersGlance clustersTable,
 * OwnersPanel whoOwnsCard, MovedPanel movedCard, ActionsPanel actionsCard, AttentionPanel attentionCard (issuesBanner),
 * PagesPanel topPagesCard, OwnedPanel ownedVsThirdCard, EnginesPanel engineTable.
 */
import { ri } from '../lib/icons'
import * as charts from './charts'
import { actions, BRAND, clusters, domains, engineRows, engineTrend, ENGINES, headline, kpis, moved, ownedVsThird, topPages, trend, type Cluster } from './data'
import { clusterOptions, defaultFilter, mountFilterBar } from './dash-header'
import { dchip, dashButton, engineCardSpan, fmt, fmtDay, fmtPct, fmtPos, iconTile, meter, MONO, move, panel, panelHead, toggle, wireToggle } from './dash-ui'
import { domainLogo, engineLogo, ENGINE_META, esc } from './ui'
import { isRealChange, marginOfError, summarize, type DayPoint } from './shell-stats'

const RANGE_DAYS = 30
const link = 'font-medium text-accent-700 hover:underline'
const th = 'h-10 whitespace-nowrap border-b border-separator-border bg-background-secondary-default px-3 text-left align-middle text-caption-1-medium font-medium text-text-secondary'
const clusterNav = (slug: string) => `data-nav="cluster" data-cluster="${slug}"`
const wrap = (ov: string, inner: string, extra = '') => `<div data-ov="${ov}" class="min-w-0"${extra}>${inner}</div>`

/** The previous period's counts, derived from the sample's rate change (the app reads them from the prior window). */
const prevOf = (cited: number, answers: number, deltaPts: number | null | undefined) => {
  const prevRate = (cited / Math.max(1, answers)) * 100 - (deltaPts ?? 0)
  return { cited: Math.max(0, Math.round((prevRate / 100) * answers)), answers }
}
const realChange = (cited: number, answers: number, deltaPts: number | null | undefined) => {
  const p = prevOf(cited, answers, deltaPts)
  return isRealChange(cited, answers, p.cited, p.answers)
}

/* ───────────────────────────── filter bar + title row ───────────────────────────── */

const LAST_SCAN = clusters.reduce((m, c) => (c.last_run > m ? c.last_run : m), '')
const fmtWhen = (iso: string) => new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const RUNS = clusters.reduce((n, c) => n + c.runs, 0)

/* Same derivation as the app's `needs_setup` / `untracked` issue: clusters that are not scanned add nothing to the numbers. */
const needsSetup = clusters.filter((c) => !c.tracked && c.prompts > 0).map((c) => ({ slug: c.slug, name: c.name, reason: c.prompts === 0 ? ('no_prompts' as const) : ('disabled' as const) }))
const unscanned = clusters.filter((c) => !c.tracked)
const issues = unscanned.length
  ? [{ code: 'untracked', title: `${unscanned.length} cluster${unscanned.length === 1 ? ' isn\'t' : 's aren\'t'} being tracked`, detail: `${unscanned.filter((c) => c.prompts === 0).length} ha${unscanned.filter((c) => c.prompts === 0).length === 1 ? 's' : 've'} no prompts, so ${unscanned.length === 1 ? 'it adds' : 'they add'} nothing to these numbers.` }]
  : []

/** The sticky filter bar host (cluster select, date range, engines, all filters, scan health); `mountOverview` fills it in. */
export function overviewFilters(): string {
  return `<div data-ov="filters"></div>`
}

/** `TitleRow` (without the export / generate / add buttons): title and the one-line scan summary. */
export function pageHeader(): string {
  return `<div class="flex flex-wrap items-end justify-between gap-3">
    <div class="min-w-0">
      <h1 class="text-title-2-medium font-semibold leading-tight tracking-[-0.015em] text-text-primary">AI visibility overview</h1>
      <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-caption-1-regular text-text-secondary">
        <span class="capitalize">${BRAND.company}</span><span aria-hidden="true">·</span>
        <span>last scan ${fmtWhen(LAST_SCAN)}</span><span aria-hidden="true">·</span>
        <span class="tabular-nums">${fmt(RUNS)} runs</span><span aria-hidden="true">·</span>
        <span class="tabular-nums">${fmt(kpis.answers)} prompts checked in ${RANGE_DAYS} days</span>
      </p>
    </div>
  </div>`
}

/* ───────────────────────────── summary ───────────────────────────── */

type CardTone = 'green' | 'crimson' | 'amber'

export function headlineCard(): string {
  const ranked = clusters.filter((r) => r.tracked && r.answers >= 10).sort((a, b) => b.citation_rate - a.citation_rate)
  const best = ranked[0]
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null
  const gap = actions.find((x) => x.type === 'content_brief')
  const parts = headline.split(/(\d+(?:\.\d+)?%|#\d+(?:\.\d+)?)/g)
  const sentence = parts.map((t, i) => (i % 2 === 1 ? `<strong class="font-semibold text-text-primary">${esc(t)}</strong>` : esc(t))).join('')
  const rateBig = (r: Cluster) => `${r.citation_rate.toFixed(1)}<span class="text-body-2-regular font-medium text-text-secondary">%</span>`
  const card = (o: { attrs: string; icon: string; label: string; tone: CardTone; title: string; big: string; meta: string; bar?: { pct: number; tone: 'indigo' | 'crimson' } }) =>
    `<a href="#" ${o.attrs} class="group flex min-w-0 flex-col rounded-lg border border-separator-border bg-background-full p-4 outline-none transition-all duration-200 hover:-translate-y-px hover:border-accent-200  focus-visible:ring-2 focus-visible:ring-border-focus-ring">
      <p class="flex items-center gap-2 text-caption-2-regular text-text-secondary">${iconTile(ri(o.icon, ''), o.tone)}${o.label}${ri('RiArrowRightUpLine', 'ml-auto h-3 w-3 text-text-tertiary transition-colors group-hover:text-accent-600')}</p>
      <p class="mt-1.5 truncate text-body-2-regular font-semibold text-text-primary" title="${esc(o.title)}">${esc(o.title)}</p>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span class="text-title-1-medium font-semibold leading-none tracking-[-0.02em] tabular-nums text-text-primary">${o.big}</span>
        <span class="text-caption-1-regular text-text-secondary">${o.meta}</span>
      </div>
      ${o.bar ? meter(o.bar.pct, o.bar.tone, 'mt-2.5') : ''}
    </a>`
  const cells: string[] = []
  if (best) cells.push(card({ attrs: clusterNav(best.slug), icon: 'RiArrowRightUpLine', label: 'Strongest cluster', tone: 'green', title: best.name, big: rateBig(best), meta: `citation rate ${move(best.citation_rate_delta, '', 'up', false, 'ml-0.5 text-caption-1-regular')}`, bar: { pct: best.citation_rate, tone: 'indigo' } }))
  if (worst) cells.push(card({ attrs: clusterNav(worst.slug), icon: 'RiArrowRightDownLine', label: 'Needs the most work', tone: 'crimson', title: worst.name, big: rateBig(worst), meta: `citation rate ${move(worst.citation_rate_delta, '', 'up', false, 'ml-0.5 text-caption-1-regular')}`, bar: { pct: worst.citation_rate, tone: 'crimson' } }))
  if (gap) cells.push(card({ attrs: '', icon: 'RiCrosshair2Line', label: 'Biggest content gap', tone: 'amber', title: gap.title, big: String(gap.prompts), meta: `prompt${gap.prompts === 1 ? '' : 's'} where others are cited instead` }))
  return panel(`
    <p class="flex items-center gap-1.5 text-caption-2-regular font-semibold uppercase tracking-[0.08em] text-accent-600"><span class="grid h-4 w-4 place-items-center rounded bg-accent-600 text-caption-2-regular text-text-white" aria-hidden="true">&#10022;</span>Summary</p>
    <p class="mt-2 max-w-[900px] text-body-regular leading-[1.6] text-text-secondary">${sentence}</p>
    ${cells.length ? `<div class="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">${cells.join('')}</div>` : ''}`, 'overflow-hidden bg-gradient-to-br from-accent-50 via-background-full to-background-full p-5')
}

/* ───────────────────────────── KPI row ───────────────────────────── */

export function statStrip(): string {
  const k = kpis
  const moe = marginOfError(k.cited_answers, k.answers)
  const real = realChange(k.cited_answers, k.answers, k.citation_rate_delta)
  const cell = (o: { label: string; icon: string; tone: 'indigo' | 'green' | 'amber' | 'slate'; value: string; extra?: string; body: string }) => `
    <div class="min-w-0 px-5 py-3.5 transition-colors hover:bg-background-secondary-default">
      <div class="flex items-center justify-between gap-2">
        <p class="text-caption-2-regular font-medium text-text-secondary">${o.label}</p>
        ${iconTile(ri(o.icon, ''), o.tone)}
      </div>
      <div class="mt-2 flex items-baseline gap-1.5">
        <span class="text-title-1-medium font-medium leading-none tracking-[-0.025em] tabular-nums text-text-primary">${o.value}</span>
        ${o.extra ?? ''}
      </div>
      <div class="mt-2 text-caption-2-regular leading-[1.5] text-text-secondary">${o.body}</div>
    </div>`
  return panel([
    cell({
      label: 'Citation rate', icon: 'RiDoubleQuotesL', tone: 'indigo', value: fmtPct(k.citation_rate, 1),
      extra: moe != null ? `<span class="text-caption-2-regular text-text-tertiary ${MONO}" title="95% margin of error on this rate">&plusmn;${moe}</span>` : '',
      body: `<span class="flex flex-wrap items-center gap-x-1.5 gap-y-1">${k.citation_rate_delta != null ? move(k.citation_rate_delta, ' pts') : ''}${real === true ? dchip('good', 'Real change', { dot: true }) : ''}${real === false ? dchip('neutral', 'Within noise') : ''}</span><span class="block tabular-nums">${fmt(k.cited_answers)} of ${fmt(k.answers)} prompts</span>`,
    }),
    cell({ label: 'Share of voice', icon: 'RiPieChartLine', tone: 'green', value: fmtPct(k.share_of_voice, 1), body: k.sov_rank ? `#${k.sov_rank} of ${fmt(k.sov_domains)} domains` : 'No cited domains yet' }),
    cell({ label: 'Avg position', icon: 'RiCompass3Line', tone: 'amber', value: fmtPos(k.avg_position), body: k.avg_position_best ? `best #${k.avg_position_best} &middot; lower is better` : 'lower is better' }),
    cell({ label: 'Prompts moving up', icon: 'RiArrowRightUpLine', tone: 'green', value: fmt(k.prompts_up), extra: k.prompts_down > 0 ? `<span class="text-caption-1-regular font-medium tabular-nums text-status-rose-text">&darr;${k.prompts_down}</span>` : '', body: 'vs the previous scan' }),
    cell({ label: 'Prompts tracked', icon: 'RiStackLine', tone: 'slate', value: fmt(k.prompts_tracked), body: `${k.active_clusters} of ${k.total_clusters} clusters &middot; ${k.engines} engines` }),
  ].join(''), 'grid grid-cols-1 divide-y divide-separator-border overflow-hidden sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x [&>*:nth-child(n+3)]:sm:border-t [&>*:nth-child(n+3)]:sm:border-separator-border lg:[&>*:nth-child(n+3)]:border-t-0')
}

/* ───────────────────────────── citation timeline ───────────────────────────── */

type Metric = 'rate' | 'avg_position' | 'sov'
type View = 'total' | 'engine'
const METRIC: Record<Metric, { label: string; sentence: string; fmt: (n: number) => string }> = {
  rate: { label: 'Citation rate', sentence: 'Share of prompts that cite you, per scanned day', fmt: (n) => `${Math.round(n)}%` },
  avg_position: { label: 'Position', sentence: 'Average position when cited, per scanned day (lower is better)', fmt: (n) => `#${Math.round(n * 10) / 10}` },
  sov: { label: 'Share of voice', sentence: 'Your share of every page cited, per scanned day', fmt: (n) => `${Math.round(n)}%` },
}
const METRICS: Metric[] = ['rate', 'avg_position', 'sov']
const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const dayPoints: DayPoint[] = trend.map((t) => ({ date: t.date, answers: t.answers, rate: t.rate, position: t.avg_position }))

/* Per-engine share of voice / position are not in the sample; they follow each engine's own citation rate. */
const engineValue = (rate: number | null, metric: Metric) => (rate == null ? null : metric === 'rate' ? rate : metric === 'sov' ? Math.round(rate * 5) / 10 : Math.round((4.6 - rate / 22) * 10) / 10)

interface TlState { id: string; title: string; rightText?: string; engineMode: boolean; view: View; metric: Metric }
const tlStates = new Map<string, TlState>()
let tlSeq = 0

function timelineInner(s: TlState): string {
  const sum = summarize(dayPoints)
  const days = RANGE_DAYS
  const solid = trend.filter((p) => p.answers >= 1 && p[s.metric] != null)
  const pts = solid.map((p) => ({ x: dayLabel(p.date), y: p[s.metric] as number, answers: p.answers }))
  const labels = solid.map((p) => dayLabel(p.date))
  const series: charts.LineSeries[] = engineTrend.map((e) => ({
    id: e.engine, color: ENGINE_META[e.engine]?.color ?? '#a3a3a3', logo: ENGINE_META[e.engine]?.src,
    points: e.points.filter((p) => solid.some((d) => d.date === p.date)).map((p) => ({ x: dayLabel(p.date), y: engineValue(p.rate, s.metric), answers: p.answers })),
  }))
  const M = METRIC[s.metric]
  const lowerIsBetter = s.metric === 'avg_position'
  const yMax = s.metric === 'avg_position' ? Math.max(5, Math.ceil(Math.max(...pts.map((p) => p.y), 1) + 1)) : 100
  const arrow = sum.change == null || sum.change === 0 ? null : sum.change > 0 ? 'RiArrowRightUpLine' : 'RiArrowRightDownLine'
  const changeTone = sum.change == null || sum.change === 0 ? 'text-text-secondary' : sum.change > 0 ? 'text-status-lime-text' : 'text-status-rose-text'
  const citedPct = sum.trackedDays ? Math.round((sum.citedDays / sum.trackedDays) * 100) : 0
  const tile = 'min-w-0 p-4'
  const label = 'flex items-center gap-1.5 text-caption-2-regular text-text-secondary'
  const big = 'mt-1 text-title-2-medium font-semibold leading-none tabular-nums text-text-primary'
  const rightText = s.rightText ?? `across every scan in the last ${days} days`
  const body = sum.verdict === 'no_data'
    ? '<p class="rounded-lg border border-dashed border-border-button-default px-5 py-8 text-center text-caption-1-regular text-text-secondary">No scans fall inside these dates. Pick a range with scans (days with scans are marked in the calendar).</p>'
    : `<div class="grid grid-cols-2 overflow-hidden rounded-lg border border-separator-border lg:grid-cols-4 lg:divide-x lg:divide-separator-border">
        <div class="${tile}">
          <p class="${label}">${iconTile(ri('RiDoubleQuotesL', ''), 'indigo', 'h-5 w-5')}Days cited</p>
          <p class="${big}">${sum.citedDays}<span class="text-body-regular font-normal text-text-tertiary"> / ${sum.trackedDays}</span></p>
          ${meter(citedPct, 'indigo', 'mt-2')}
        </div>
        <div class="${tile} border-l border-separator-border lg:border-l-0">
          <p class="${label}">${iconTile(ri('RiCompass3Line', ''), sum.longestGap ? 'crimson' : 'green', 'h-5 w-5')}Longest uncited stretch</p>
          <p class="${big} ${sum.longestGap ? '' : 'text-status-lime-text'}">${sum.longestGap ? `${sum.longestGap.days} ${sum.longestGap.days === 1 ? 'day' : 'days'}` : 'None'}</p>
          <p class="mt-1.5 truncate text-caption-2-regular text-text-secondary">${sum.longestGap ? `${fmtDay(sum.longestGap.from)} to ${fmtDay(sum.longestGap.to)}` : 'Cited on every scanned day'}</p>
        </div>
        <div class="${tile} border-t border-separator-border lg:border-t-0">
          <p class="${label}">${iconTile(ri('RiArrowRightUpLine', ''), 'green', 'h-5 w-5')}First cited</p>
          <p class="${big}">${sum.firstCited ? fmtDay(sum.firstCited) : '–'}</p>
          <p class="mt-1.5 text-caption-2-regular text-text-secondary">${sum.lastCited ? `last cited ${fmtDay(sum.lastCited)}` : 'not cited in this range'}</p>
        </div>
        <div class="${tile} border-l border-t border-separator-border lg:border-t-0">
          <p class="${label}">${iconTile(ri('RiPieChartLine', ''), sum.change != null && sum.change < 0 ? 'crimson' : 'green', 'h-5 w-5')}Change in citation rate</p>
          <p class="${big} flex items-center gap-1 ${changeTone}">${arrow ? ri(arrow, 'h-4 w-4') : ''}${sum.change == null ? '–' : `${sum.change > 0 ? '+' : ''}${sum.change} pts`}</p>
          <p class="mt-1.5 text-caption-2-regular text-text-secondary">${sum.startRate != null && sum.endRate != null ? `${sum.startRate}% → ${sum.endRate}%` : 'needs two or more scanned days'}${sum.positionChange ? ` · position ${sum.positionChange > 0 ? 'up' : 'down'} ${Math.abs(sum.positionChange)}` : ''}</p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p class="text-caption-1-regular text-text-secondary">${M.sentence}</p>
        <div class="flex flex-wrap items-center gap-2">
          ${s.engineMode ? toggle(`${s.id}-view`, s.view, [{ value: 'total', label: 'Total' }, { value: 'engine', label: 'By engine' }], 'Chart mode') : ''}
          ${toggle(`${s.id}-metric`, s.metric, METRICS.map((m) => ({ value: m, label: METRIC[m].label })), 'Metric')}
        </div>
      </div>
      ${s.engineMode && s.view === 'engine' ? `<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption-2-regular text-text-secondary">${series.map((e) => `<span class="inline-flex items-center gap-1">${e.logo ? `<img src="${e.logo}" alt="" width="12" height="12"/>` : `<span class="h-1.5 w-1.5 rounded-full" style="background:${e.color}"></span>`}${e.id}</span>`).join('')}</div>` : ''}
      <div class="mt-1 h-[210px] w-full ${MONO}">
        ${pts.length < 2
          ? '<p class="grid h-full place-items-center text-caption-1-regular text-text-secondary">Need two or more scanned days to draw a chart.</p>'
          : s.view === 'total' || !s.engineMode
            ? charts.trendLine({ points: pts, color: '#4f46e5', fmt: M.fmt, yMin: lowerIsBetter ? 1 : 0, yMax, lowerIsBetter, seriesLabel: M.label })
            : charts.multiLine({ series, days: labels, fmt: M.fmt, yMin: lowerIsBetter ? 1 : 0, yMax, lowerIsBetter, fillMissing: lowerIsBetter ? yMax : 0, bottomLabel: lowerIsBetter ? 'None' : undefined })}
      </div>`
  return panel(`${panelHead({ title: s.title, hint: 'When you were cited, when you were not, and whether it is improving, across every scanned day in the selected dates.', right: `<span>${rightText}</span>` })}
    <div class="px-5 pb-3.5">${body}</div>`)
}

function timelineCard(o: { title: string; rightText?: string; engineMode: boolean }): string {
  const s: TlState = { id: `tl${++tlSeq}`, ...o, view: 'total', metric: 'rate' }
  tlStates.set(s.id, s)
  return wrap('timeline', timelineInner(s), ` data-tl="${s.id}"`)
}

export const citationTimeline = (): string => timelineCard({ title: 'Citation timeline', engineMode: true })
export const trendCard = (): string => timelineCard({ title: 'Citation rate over time', rightText: `last ${RANGE_DAYS} days`, engineMode: false })

function mountTimeline(el: HTMLElement) {
  const s = tlStates.get(el.dataset.tl ?? '')
  if (!s) return
  const render = () => {
    el.innerHTML = timelineInner(s)
    wire()
    charts.mount(el)
  }
  const wire = () => {
    wireToggle(el, `${s.id}-view`, (v) => { s.view = v as View; render() })
    wireToggle(el, `${s.id}-metric`, (v) => { s.metric = v as Metric; render() })
  }
  wire()
}

/* ───────────────────────────── clusters at a glance ───────────────────────────── */

const HEALTH = [
  { key: 'owned', label: 'owned (#1)', cls: 'bg-status-lime-background text-status-lime-text' },
  { key: 'weak', label: 'cited, not first', cls: 'bg-status-yellow-background text-status-yellow-text' },
  { key: 'dropped', label: 'dropped', cls: 'bg-status-rose-background text-status-rose-text' },
  { key: 'missing', label: 'never cited', cls: 'bg-background-tertiary-default text-text-secondary' },
] as const

/** Prompt health per cluster: its prompts split by how the sampled answers treat you. */
function healthOf(c: Cluster): Record<string, number> {
  const cited = Math.round((c.prompts * c.citation_rate) / 100)
  const owned = Math.round(cited * 0.45)
  const dropped = Math.min(c.prompts - cited, c.citation_rate_delta < 0 ? 2 : 1)
  return { owned, weak: cited - owned, dropped, missing: c.prompts - cited - dropped }
}

function healthBar(counts: Record<string, number>, cluster: string): string {
  const total = HEALTH.reduce((n, h) => n + (counts[h.key] ?? 0), 0)
  if (!total) return '<span class="text-text-tertiary">–</span>'
  return `<div class="flex h-5 w-full min-w-[120px] max-w-[170px] gap-px overflow-hidden rounded-md" role="img" aria-label="${esc(cluster)} prompt health: ${HEALTH.map((h) => `${counts[h.key] ?? 0} ${h.label}`).join(', ')}">
    ${HEALTH.map((h) => (counts[h.key] ? `<span title="${counts[h.key]} ${h.label}" class="flex min-w-[18px] items-center justify-center text-caption-2-regular font-semibold tabular-nums ${h.cls}" style="flex-grow:${counts[h.key]}">${counts[h.key]}</span>` : '')).join('')}
  </div>`
}

export function clustersTable(): string {
  const tracked = clusters.filter((c) => c.tracked)
  const rows = tracked.map((r) => {
    const real = realChange(r.cited_answers, r.answers, r.citation_rate_delta)
    const moe = marginOfError(r.cited_answers, r.answers)
    const sparkColor = r.citation_rate_delta > 0 && real !== false ? '#039855' : r.citation_rate_delta < 0 && real !== false ? '#c01048' : '#4f46e5'
    return `<tr ${clusterNav(r.slug)} class="cursor-pointer border-b border-separator-border transition-colors last:border-b-0 hover:bg-background-secondary-default hover:shadow-[inset_2px_0_0_var(--color-accent-600)]">
      <td class="align-middle py-3 pl-5 pr-3">
        <a href="#" ${clusterNav(r.slug)} class="text-body-2-regular font-semibold text-text-primary outline-none hover:underline focus-visible:underline">${esc(r.name)}</a>
        <p class="text-caption-2-regular tabular-nums text-text-secondary">${r.prompts} prompts &middot; ${fmt(r.answers)} prompts checked</p>
      </td>
      <td class="align-middle px-3 py-3 text-right tabular-nums"><span class="text-body-2-regular font-medium text-text-primary">${fmtPct(r.citation_rate, 1)}</span>${moe != null ? `<span class="ml-1 text-caption-2-regular text-text-tertiary ${MONO}">&plusmn;${moe}</span>` : ''}</td>
      <td class="align-middle px-3 py-3 text-right">${move(r.citation_rate_delta, '', 'up', real === false, 'text-caption-1-regular')}${real === false ? '<p class="text-caption-2-regular text-text-secondary">within noise</p>' : ''}</td>
      <td class="align-middle px-3 py-3">${charts.spark({ values: r.trend, color: sparkColor, cls: 'h-6 w-[100px]' })}</td>
      <td class="align-middle px-3 py-3">${healthBar(healthOf(r), r.name)}</td>
      <td class="align-middle px-3 py-3 text-right tabular-nums"><span class="text-body-2-regular text-text-primary">${fmtPct(r.share_of_voice, 1)}</span>${r.sov_rank ? `<span class="ml-1.5 text-caption-2-regular text-text-secondary">#${r.sov_rank}</span>` : ''}</td>
      <td class="align-middle px-3 py-3 text-right text-body-2-regular tabular-nums text-text-primary">${fmtPos(r.avg_position)}</td>
      <td class="align-middle py-3 pl-3 pr-5 text-caption-1-regular">${r.top_rival ? `<span class="font-medium text-text-primary">${esc(r.top_rival.domain)}</span> <span class="tabular-nums text-text-secondary">${Math.round(r.top_rival.pct)}%</span>` : '<span class="text-text-tertiary">–</span>'}</td>
    </tr>`
  }).join('')
  return wrap('clusters', panel(`
    ${panelHead({ title: 'Clusters at a glance', right: '<span>click a cluster to open it</span>' })}
    ${!tracked.length
      ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No cluster is being tracked yet. Switch Auto-monitor on for a cluster to start scanning it.</p>'
      : `<div class="relative w-full overflow-x-auto"><table class="w-full caption-bottom border-collapse text-caption-1-regular min-w-[860px] text-caption-1-regular">
          <thead><tr class="border-b border-separator-border hover:bg-transparent">
            <th class="${th} pl-5">Cluster</th><th class="${th} text-right">Cited</th><th class="${th} text-right">Change</th><th class="${th}">${RANGE_DAYS} days</th>
            <th class="${th}">Prompt health</th><th class="${th} text-right">Share of voice</th><th class="${th} text-right">Avg pos</th><th class="${th} pr-5">Top rival</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`}
    <footer class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-separator-border px-5 py-3 text-caption-1-regular text-text-secondary">
      ${needsSetup.length > 0
        ? `<p>${needsSetup.length} more cluster${needsSetup.length === 1 ? ' has' : 's have'} prompts but tracking is off. <button type="button" data-setup-toggle class="${link}">Set them up &rarr;</button></p>`
        : '<p>Every cluster with prompts is being tracked.</p>'}
      <ul class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption-2-regular" aria-label="Prompt health key">
        ${HEALTH.map((h) => `<li class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-[2px] ${h.cls.split(' ')[0]}"></span>${h.label}</li>`).join('')}
      </ul>
    </footer>
    <ul data-setup-list hidden class="max-h-48 overflow-y-auto border-t border-separator-border bg-background-secondary-default px-5 py-1">
      ${needsSetup.map((c) => `<li class="flex items-center justify-between gap-3 border-b border-separator-border py-2 last:border-b-0">
        <span class="min-w-0 truncate text-caption-1-regular font-medium text-text-primary">${esc(c.name)}</span>
        <span class="flex shrink-0 items-center gap-2.5 text-caption-2-regular text-text-secondary">${c.reason === 'no_prompts' ? 'No prompts yet' : 'Tracking is off'}<a href="#" ${clusterNav(c.slug)} class="${link}">Open &rarr;</a></span>
      </li>`).join('')}
    </ul>`, 'overflow-hidden', 'clusters'))
}

function mountClusters(el: HTMLElement) {
  const btn = el.querySelector<HTMLElement>('[data-setup-toggle]')
  const list = el.querySelector<HTMLElement>('[data-setup-list]')
  if (!btn || !list) return
  btn.addEventListener('click', () => {
    list.hidden = !list.hidden
    btn.innerHTML = `${list.hidden ? 'Set them up' : 'Hide'} &rarr;`
  })
}

/* ───────────────────────────── who owns the answers ───────────────────────────── */

export function whoOwnsCard(): string {
  const rows = domains.slice(0, 8)
  const max = Math.max(1, ...rows.map((d) => d.pct))
  return panel(`
    ${panelHead({ title: 'Who owns the answers', right: '<span>share of all citations</span>' })}
    ${!rows.length ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No citations in this range yet.</p>' : `<ul class="space-y-2.5 px-5 pb-3">
      ${rows.map((d) => {
        const you = d.type === 'You'
        return `<li class="grid grid-cols-[minmax(110px,150px)_1fr_auto_auto] items-center gap-3 rounded-lg text-caption-1-regular ${you ? '-mx-2 bg-accent-50 px-2 py-1.5' : ''}">
          <span class="flex min-w-0 items-center gap-2 ${you ? 'font-semibold text-accent-600' : 'text-text-secondary'}" title="${esc(d.domain)}">${domainLogo(d.domain, 16, you)}<span class="truncate">${esc(d.domain)}</span></span>
          ${meter((d.pct / max) * 100, you ? 'indigo' : d.type === 'Competitor' ? 'crimson' : 'slate', 'h-1.5 bg-background-secondary-default')}
          <span class="w-8 text-right tabular-nums text-text-secondary">${Math.round(d.pct)}%</span>
          <span class="w-11 text-right tabular-nums text-text-secondary">${fmt(d.citations)}</span>
        </li>`
      }).join('')}
    </ul>`}
    <footer class="mt-auto px-5 pb-3 pt-0.5 text-caption-1-regular"><a href="#" data-nav="sources" class="text-text-secondary hover:text-text-primary">All ${fmt(kpis.sov_domains)} domains &rarr;</a></footer>`, 'flex flex-col')
}

/* ───────────────────────────── what moved since last run ───────────────────────────── */

type MoveTab = 'gained' | 'dropped' | 'never'
type MovedRow = { cluster: string; cluster_slug: string; prompt: string; from?: number | null; to?: number | null; answers?: number }
const movedItems = (tab: MoveTab): MovedRow[] => (tab === 'gained' ? moved.gained : tab === 'dropped' ? moved.dropped : moved.never)

function movedList(tab: MoveTab): string {
  const items = movedItems(tab)
  if (!items.length) return '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">Nothing here for the last scan.</p>'
  const chipHtml = tab === 'gained' ? dchip('good', 'Gained', { dot: true }) : tab === 'dropped' ? dchip('bad', 'Dropped', { dot: true }) : dchip('neutral', 'Never cited')
  const rank = (n: number | null | undefined, tone?: string) => `<span class="tabular-nums ${n == null ? 'text-text-tertiary' : tone ?? ''}">${n == null ? '–' : `#${n}`}</span>`
  return `<ul class="max-h-[300px] divide-y divide-separator-border overflow-y-auto border-t border-separator-border px-5">
    ${items.map((m) => `<li class="flex items-center gap-3 py-3">
      <span class="shrink-0">${chipHtml}</span>
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-body-2-regular font-medium leading-snug text-text-primary">${esc(m.prompt)}</p>
        <a href="#" ${clusterNav(m.cluster_slug)} class="inline-block truncate text-caption-2-regular text-text-secondary hover:text-accent-700">${esc(m.cluster)}</a>
      </div>
      <span class="flex shrink-0 items-center gap-1.5 text-caption-1-regular">
        ${m.answers != null
          ? `<span class="tabular-nums text-text-secondary">0 of ${m.answers} prompts</span>`
          : `<span class="rounded-md bg-background-secondary-default px-1.5 py-0.5 text-caption-2-regular">${rank(m.from, 'text-text-secondary')}</span>${ri('RiArrowRightLine', 'h-2.5 w-2.5 text-text-tertiary')}<span class="rounded-md px-1.5 py-0.5 text-caption-2-regular font-semibold ring-1 ring-inset ${tab === 'gained' ? 'bg-status-lime-background ring-status-lime-text/30' : 'bg-status-rose-background ring-status-rose-text/30'}">${rank(m.to, tab === 'gained' ? 'text-status-lime-text' : 'text-status-rose-text')}</span>`}
      </span>
    </li>`).join('')}
  </ul>`
}

export function movedCard(): string {
  return wrap('moved', panel(`
    ${panelHead({ title: 'What moved since last run', right: `<span class="tabular-nums">${moved.gained_total} gained &middot; ${moved.dropped_total} dropped &middot; ${moved.never_total} never cited</span>` })}
    <div class="px-5 pb-2">${toggle('mv-tab', 'gained', [{ value: 'gained', label: 'Gained' }, { value: 'dropped', label: 'Dropped' }, { value: 'never', label: 'Never cited' }], 'Movement')}</div>
    <div data-mv-list>${movedList('gained')}</div>`, 'flex flex-col'))
}

function mountMoved(el: HTMLElement) {
  const list = el.querySelector<HTMLElement>('[data-mv-list]')
  if (!list) return
  wireToggle(el, 'mv-tab', (v) => { list.innerHTML = movedList(v as MoveTab) })
}

/* ───────────────────────────── do these next / needs attention ───────────────────────────── */

export function actionsCard(): string {
  const shown = actions.slice(0, 3)
  return panel(`
    ${panelHead({ title: 'Do these next', right: actions.length > 3 ? `<button type="button" class="hover:text-text-primary">All ${actions.length} actions &rarr;</button>` : undefined })}
    ${!shown.length ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">Nothing to do right now.</p>' : `<ol class="divide-y divide-separator-border px-5 pb-1">
      ${shown.map((a, i) => `<li class="flex items-start gap-3 py-3 first:pt-1">
        <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-background-secondary-default text-caption-2-regular font-semibold text-text-secondary">${i + 1}</span>
        <div class="min-w-0 flex-1">
          <p class="text-body-2-regular font-semibold leading-snug text-text-primary">${esc(a.title)}</p>
          <p class="mt-0.5 text-caption-1-regular leading-[1.5] text-text-secondary">${esc(a.detail)}</p>
        </div>
        ${dashButton(a.cta, { variant: i === 0 ? 'solid' : 'outline', size: 'small', href: '#', cls: 'shrink-0' })}
      </li>`).join('')}
    </ol>`}`, 'flex flex-col')
}

export function attentionCard(): string {
  const scan = engineRows.filter((e) => e.answers < Math.max(30, kpis.answers * 0.03))
  const empty = !issues.length && !scan.length
  return panel(`
    ${panelHead({ title: 'Needs attention' })}
    ${empty ? `<p class="flex items-center gap-1.5 px-5 pb-4 text-caption-1-regular text-status-lime-text">${ri('RiCheckboxCircleFill', 'h-4 w-4')}Scans and data look healthy.</p>` : `<ul class="divide-y divide-separator-border px-5 pb-1">
      ${issues.map((i) => `<li class="flex items-start gap-2.5 py-3 pl-3 shadow-[inset_2px_0_0_#f79009] first:pt-1">
        ${dchip('warn', 'Fix', { dot: true, cls: 'mt-0.5' })}
        <div class="min-w-0">
          <p class="text-body-2-regular font-semibold leading-snug text-text-primary">${esc(i.title)}</p>
          <p class="mt-0.5 text-caption-1-regular leading-[1.5] text-text-secondary">${esc(i.detail)}</p>
        </div>
      </li>`).join('')}
      ${scan.map((e) => `<li class="flex items-start gap-2.5 py-3 pl-3 shadow-[inset_2px_0_0_#f04438] first:pt-1">
        ${dchip('bad', 'Scan', { dot: true, cls: 'mt-0.5' })}
        <div class="min-w-0">
          <p class="text-body-2-regular font-semibold leading-snug text-text-primary">${e.engine} returned ${fmt(e.answers)} prompts</p>
          <p class="mt-0.5 text-caption-1-regular leading-[1.5] text-text-secondary">${e.citation_rate ? 'Too few prompts to read this engine reliably.' : 'Every prompt shows as not cited there.'} Re-run the scan before reading it as a drop.</p>
        </div>
      </li>`).join('')}
    </ul>`}`, 'flex flex-col', 'needs-attention')
}

export const issuesBanner = attentionCard

/* ───────────────────────────── pages, owned vs third party ───────────────────────────── */

export function topPagesCard(): string {
  return panel(`
    ${panelHead({ title: 'Your most cited pages', right: '<span>owned URLs, merged across www and utm variants</span>' })}
    ${!topPages.length ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">None of your pages were cited in this range.</p>' : `<div class="relative w-full overflow-x-auto"><table class="w-full caption-bottom border-collapse text-caption-1-regular text-caption-1-regular">
      <thead><tr class="border-b border-separator-border hover:bg-transparent"><th class="${th} pl-5">Page</th><th class="${th} text-right">Citations</th><th class="${th} pr-5 text-right">Avg pos</th></tr></thead>
      <tbody>
        ${topPages.slice(0, 8).map((p) => {
          const host = p.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
          const shown = p.path && p.path !== '/' ? p.path : `${host}/`
          return `<tr class="border-b border-separator-border last:border-b-0 hover:bg-background-secondary-default">
            <td class="align-middle max-w-0 py-2 pl-5 pr-3 text-caption-1-regular"><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="block truncate text-text-primary hover:text-accent-700 hover:underline" title="${esc(p.url)}">${esc(shown)}</a></td>
            <td class="align-middle px-3 py-2 text-right text-body-2-regular tabular-nums text-text-primary">${fmt(p.citations)}</td>
            <td class="align-middle py-2 pl-3 pr-5 text-right text-body-2-regular tabular-nums text-text-secondary">${p.avg_position != null ? fmtPos(p.avg_position) : '–'}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table></div>`}`, 'flex flex-col overflow-hidden')
}

/** The app's `own_format_note`: your cited pages in the format engines cite most, against everyone else's. */
const OWN_FORMAT_NOTE = 'You have 142 cited docs against 330 from others.'

export function ownedVsThirdCard(): string {
  const o = ownedVsThird
  const total = o.own + o.others
  const max = Math.max(1, ...o.formats.map((f) => f.count))
  return panel(`
    ${panelHead({ title: 'Owned vs third party' })}
    ${!total ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No citations in this range yet.</p>' : `<div class="px-5 pb-3.5">
      <p class="text-title-1-medium font-semibold leading-none tracking-[-0.02em] tabular-nums text-text-primary">${fmtPct(o.own_pct, 1)}</p>
      <p class="mt-1 text-caption-1-regular text-text-secondary">${fmt(o.own)} owned vs ${fmt(o.others)} third party</p>
      ${meter(o.own_pct ?? 0, 'indigo', 'mt-2.5 h-2')}
      ${o.formats.length > 0 ? `<p class="mt-3 text-caption-2-regular font-medium text-text-secondary">Formats engines reward</p>
      <ul class="mt-2 space-y-2">
        ${o.formats.map((f) => `<li class="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-caption-1-regular">
          <span class="truncate text-text-secondary">${esc(f.format)}</span>
          ${meter((f.count / max) * 100, 'indigo', 'bg-background-secondary-default')}
          <span class="w-11 text-right tabular-nums text-text-secondary">${fmt(f.count)}</span>
        </li>`).join('')}
      </ul>` : ''}
      <p class="mt-3 rounded-lg bg-background-secondary-default px-3 py-2 text-caption-1-regular leading-[1.5] text-text-secondary ring-1 ring-inset ring-separator-border">${OWN_FORMAT_NOTE}</p>
    </div>`}`, 'flex flex-col')
}

/* ───────────────────────────── how each engine picks sources ───────────────────────────── */

export function engineTable(): string {
  const low = (answers: number) => answers < Math.max(30, kpis.answers * 0.03)
  return panel(`
    ${panelHead({ title: 'How each engine picks sources', right: '<a href="#" data-nav="engines" class="hover:text-text-primary">Engines &rarr;</a>' })}
    ${!engineRows.length ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No engine has answered in this range yet.</p>' : `<div class="grid grid-cols-1 gap-3 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-12">
      ${engineRows.map((e, i) => {
        const color = ENGINE_META[e.engine]?.color ?? '#737373'
        const isLow = low(e.answers)
        const series = engineTrend.find((t) => t.engine === e.engine)?.points.map((p) => p.rate) ?? []
        return `<article class="flex min-w-0 flex-col rounded-lg border border-separator-border p-4 transition-shadow duration-200 hover:shadow-[0_8px_20px_-10px_rgba(16,24,40,0.2)] ${engineCardSpan(i, engineRows.length)}" style="background:linear-gradient(180deg, ${ENGINE_META[e.engine]?.soft ?? '#f5f5f5'}99, var(--color-background-full) 55%)">
          <header class="flex items-center justify-between gap-2">
            <h3 class="flex items-center gap-2 text-body-2-regular font-semibold text-text-primary"><span class="grid h-6 w-6 place-items-center rounded-md bg-background-full ring-1 ring-inset ring-separator-border">${engineLogo(e.engine, 14)}</span>${e.engine}</h3>
            ${isLow ? dchip('warn', 'Low data', { dot: true }) : ''}
          </header>
          <p class="mt-2 text-title-1-medium font-semibold leading-none tracking-[-0.02em] tabular-nums text-text-primary">${isLow ? '–' : fmtPct(e.citation_rate, 1)}</p>
          <p class="mt-1 text-caption-2-regular tabular-nums text-text-secondary">${isLow ? `only ${fmt(e.answers)} prompts` : `${fmt(e.answers)} prompts`}</p>
          ${isLow ? '' : charts.spark({ values: series, color, cls: 'mt-1.5 h-7 w-full' })}
          <div class="mt-2 space-y-0.5 text-caption-2-regular text-text-secondary">
            <p>${e.top_source ? `Top source <strong class="font-semibold text-text-primary">${esc(e.top_source.domain)}</strong> ${Math.round(e.top_source.pct)}%` : 'No sources recorded'}</p>
            <p>Your top page type: ${e.top_own_page_type ?? '–'}</p>
          </div>
        </article>`
      }).join('')}
    </div>`}`)
}

/* ───────────────────────────── mount ───────────────────────────── */

/** Wire every overview panel found inside `root` (panels that are absent are skipped). */
export function mountOverview(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-ov]').forEach((el) => {
    switch (el.dataset.ov) {
      case 'filters':
        mountFilterBar(el, { value: defaultFilter(), clusters: clusterOptions(), engines: [...ENGINES], issues: issues.length + engineRows.filter((e) => e.answers < Math.max(30, kpis.answers * 0.03)).length, onChange: () => {} })
        break
      case 'timeline': mountTimeline(el); break
      case 'clusters': mountClusters(el); break
      case 'moved': mountMoved(el); break
    }
  })
  charts.mount(root)
}
