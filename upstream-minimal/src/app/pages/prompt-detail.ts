/*
 * "Prompt detail" (port of main's `geo/overview/prompt-detail-page.tsx`, route `geo/prompts/detail?cluster=&prompt=`): the full page for one
 * prompt — hero card, four key stats, citation timeline, why you are losing + suggested fix, who gets cited, position history,
 * related prompts, by-engine breakdown, trend over time and the prompt's model results. Opened from the prompt popup / "Open full page".
 */
import { mount as mountCharts, trendLine } from '../charts'
import { citationTimelineCard, wireCitationTimeline, type DayPoint } from '../citation-timeline'
import { defaultFilter, mountFilterBar, resolveRange, type FilterValue } from '../dash-header'
import { dashButton } from '../dash-ui'
import { clusters, ENGINES } from '../data'
import { ri } from '../../lib/icons'
import { mountModelResults, modelResultsCard } from './model-results'
import { promptDetail, type PromptDetailResponse } from '../prompt-detail-data'
import { allPrompts } from '../prompts-data'
import { bar, card, cardHeader, delta, domainLogo, emptyNote, engineLogo, esc, fmtNum, fmtPct, rankChip, segmented, siteHref, tag, TYPE_LABEL, TYPE_TONE, wireTabs, cx, buttonCls, type Tone } from '../ui'

export const meta = { id: 'prompt-detail', label: 'Prompt', icon: 'RiMessage2Line', order: 11, hidden: true }

const STATUS_TONE: Record<string, Tone> = { owned: 'green', weak: 'amber', missing: 'slate', dropped: 'rose' }
const STATUS_LABEL: Record<string, string> = { owned: 'Owned (#1)', weak: 'Weak (Cited)', missing: 'Missing', dropped: 'Dropped' }
const INTENT_TONE: Record<string, Tone> = { informational: 'blue', commercial: 'amber', transactional: 'green', navigational: 'violet' }
const SPRINTS = [{ id: 'sp-1', name: 'Sprint 14 · Nov 3 – Nov 14' }, { id: 'sp-2', name: 'Sprint 15 · Nov 17 – Nov 28' }]

function statCell(o: { icon: string; label: string; value: string; foot?: string; extra?: string; highlight?: boolean }): string {
  return `<div class="${cx('flex min-w-0 flex-col p-4 transition-colors', o.highlight && 'bg-accent-50/30')}">
    <div class="flex items-center gap-1.5 text-text-secondary">${ri(o.icon, 'h-3.5 w-3.5 text-text-tertiary')}<p class="text-caption-1-medium">${o.label}</p></div>
    <div class="mt-1.5 flex items-baseline gap-1.5"><span class="text-title-1-bold leading-none tracking-tight text-text-primary tabular-nums">${o.value}</span>${o.extra ?? ''}</div>
    ${o.foot ? `<p class="mt-2 truncate text-caption-1-regular text-text-tertiary tabular-nums">${o.foot}</p>` : ''}
  </div>`
}

function domainRankTable(rows: PromptDetailResponse['domain_breakdown'], countBy: 'domain' | 'url'): string {
  const values = rows.map((d) => (countBy === 'domain' ? d.citations : d.urls))
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  return `<div class="divide-y divide-separator-border">${rows.map((d, i) => {
    const value = countBy === 'domain' ? d.citations : d.urls
    const pct = total ? Math.round((value / total) * 100) : 0
    const barColor = d.is_you ? '#155dfc' : d.is_competitor ? '#c01048' : '#a1a1aa'
    return `<div class="flex items-center gap-3 px-4 py-3">
      <span class="w-5 shrink-0 text-right text-caption-1-regular tabular-nums text-text-tertiary">${i + 1}</span>
      ${domainLogo(d.domain, 24, d.is_you)}
      <div class="w-40 min-w-0 shrink-0">
        <a href="${siteHref(d.domain)}" target="_blank" rel="noopener noreferrer" class="${cx('block truncate text-body-2-regular hover:text-accent-700', d.is_you ? 'font-semibold text-text-primary' : 'font-medium text-text-primary')}">${esc(d.domain)}</a>
        ${tag(TYPE_LABEL[d.type], TYPE_TONE[d.type])}
      </div>
      <div class="min-w-0 flex-1">${bar((value / max) * 100, barColor, 'h-1')}</div>
      <span class="w-10 shrink-0 text-right text-caption-1-regular tabular-nums text-text-secondary">${fmtNum(value)}</span>
      <span class="w-11 shrink-0 text-right text-caption-1-semibold tabular-nums text-text-primary">${pct}%</span>
    </div>`
  }).join('')}</div>`
}

function domainsCard(data: PromptDetailResponse, countBy: 'domain' | 'url'): string {
  return card(`${cardHeader({ icon: 'RiListCheck2', title: 'Who gets cited in this answer', subtitle: 'Top domains cited for this prompt, this window', right: segmented('pd-countby', countBy, [{ value: 'domain', label: 'Domain' }, { value: 'url', label: 'URLs' }]) })}
    ${data.domain_breakdown.length === 0 ? emptyNote('No citations recorded for this prompt in this range.') : domainRankTable(data.domain_breakdown, countBy)}`, 'overflow-hidden')
}

function engineBreakdown(rows: PromptDetailResponse['model_results']): string {
  const sorted = [...rows].sort((a, b) => ENGINES.indexOf(a.engine as (typeof ENGINES)[number]) - ENGINES.indexOf(b.engine as (typeof ENGINES)[number]))
  return card(`${cardHeader({ icon: 'RiRobot2Line', title: 'By engine', subtitle: 'How each AI answers this prompt' })}
    ${!sorted.length ? emptyNote('No engine has answered this prompt in this range.') : `<ul class="divide-y divide-separator-border">${sorted.map((r) => `<li class="flex items-center gap-3 px-4 py-3">
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-separator-border bg-background-full">${engineLogo(r.engine, 20)}</span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-body-2-semibold text-text-primary">${esc(r.engine)}</span>
          <span class="text-caption-1-regular tabular-nums text-text-secondary">${r.in_range === false
            ? `no scan in these dates · cited in ${r.runs.filter((x) => x.cited).length} of ${r.runs.length} earlier runs`
            : `<span class="font-semibold text-text-primary">${fmtPct(r.citation_rate, 0)}</span> · ${fmtNum(r.cited_answers)}/${fmtNum(r.answers)} cite you`}</span>
        </div>
        <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-tertiary-default"><div class="h-full rounded-full bg-accent-600" style="width:${Math.max(0, Math.min(100, r.citation_rate ?? 0))}%"></div></div>
        ${r.top_source ? `<p class="mt-1.5 flex items-center gap-1.5 text-caption-1-regular text-text-tertiary">leans on ${domainLogo(r.top_source.domain, 14)} <span class="truncate text-text-secondary">${esc(r.top_source.domain)}</span> · ${r.top_source.pct}%</p>` : ''}
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">${rankChip(r.latest_rank, r.latest_rank === 1 ? 'good' : 'neutral')}${tag(STATUS_LABEL[r.status], STATUS_TONE[r.status])}</div>
    </li>`).join('')}</ul>`}`, 'overflow-hidden')
}

function trendsCard(rows: PromptDetailResponse['model_results'], metric: 'citation' | 'position'): string {
  const byDay = new Map<string, { t: number; total: number; cited: number; ranks: number[] }>()
  for (const r of rows) for (const run of r.runs) {
    const d = new Date(run.ts)
    const key = d.toISOString().slice(0, 10)
    const e = byDay.get(key) ?? { t: d.getTime(), total: 0, cited: 0, ranks: [] }
    e.total += 1
    if (run.cited) e.cited += 1
    if (run.rank != null) e.ranks.push(run.rank)
    byDay.set(key, e)
  }
  const points = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, e]) => ({
    x: new Date(e.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), cited: Math.round((e.cited / e.total) * 100),
    position: e.ranks.length ? Math.round((e.ranks.reduce((a, b) => a + b, 0) / e.ranks.length) * 10) / 10 : null, answers: e.total,
  }))
  const series = metric === 'citation' ? points.map((p) => ({ x: p.x, y: p.cited, answers: p.answers })) : points.filter((p) => p.position != null).map((p) => ({ x: p.x, y: p.position as number, answers: p.answers }))
  return card(`${cardHeader({ icon: 'RiArrowRightUpLine', title: 'Trend over time', subtitle: 'Across every engine that answered this prompt', right: segmented('pd-trend-metric', metric, [{ value: 'citation', label: 'Citation rate' }, { value: 'position', label: 'Position' }]) })}
    ${series.length < 2 ? emptyNote('Not enough scans yet to draw a trend.') : `<div class="h-[230px] px-2 pb-2 pt-1">${trendLine({ points: series, color: metric === 'citation' ? '#155dfc' : '#039855', fmt: (n) => (metric === 'citation' ? `${Math.round(n)}%` : `#${Math.round(n * 10) / 10}`), yMin: metric === 'citation' ? 0 : 1, yMax: metric === 'citation' ? 100 : undefined, lowerIsBetter: metric === 'position', seriesLabel: metric === 'citation' ? 'Citation rate' : 'Avg position' })}</div>`}`, 'overflow-hidden')
}

interface State { cluster: string; prompt: string; range: FilterValue; countBy: 'domain' | 'url'; metric: 'citation' | 'position'; sprint: boolean; added: boolean; copied: boolean }

function heroHtml(st: State, data: PromptDetailResponse): string {
  return `<div class="relative overflow-hidden rounded-2xl border border-separator-border bg-background-full p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="text-caption-1-medium text-text-tertiary">GEO Prompts</span>${ri('RiArrowRightSLine', 'h-3 w-3 text-text-tertiary')}
          <span class="rounded-md bg-background-tertiary-default px-2 py-0.5 text-caption-1-semibold text-text-secondary">${esc(data.cluster.name)}</span>
          ${tag(STATUS_LABEL[data.status], STATUS_TONE[data.status])}
          ${data.intent ? tag(`<span class="capitalize">${esc(data.intent)}</span>`, INTENT_TONE[data.intent.toLowerCase()] ?? 'slate') : ''}
        </div>
        <div class="flex items-start gap-2.5">
          <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-100 text-accent-700">${ri('RiDoubleQuotesL', 'h-3.5 w-3.5')}</div>
          <h1 class="text-title-3-bold leading-snug tracking-tight text-text-primary">${esc(st.prompt)}</h1>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        ${dashButton(st.copied ? 'Copied' : 'Copy prompt', { variant: 'outline', size: 'small', leadingIcon: st.copied ? 'RiCheckLine' : 'RiFileCopyLine', attrs: 'data-pd-copy' })}
        ${!st.added ? dashButton('Add to sprint', { variant: 'outline', size: 'small', attrs: 'data-pd-sprint' }) : tag('Added to sprint', 'green')}
        ${dashButton('Create brief', { variant: 'solid', size: 'small', href: '#', trailingIcon: 'RiArrowRightLine', attrs: `data-nav="cluster" data-cluster="${esc(data.cluster.slug)}"` })}
      </div>
    </div>
  </div>`
}

function sprintPanel(st: State): string {
  if (!st.sprint || st.added) return ''
  return `<div class="space-y-2 rounded-xl border border-accent-200 bg-accent-50 p-4">
    <input data-sp-title value="${esc(st.prompt)}" placeholder="Topic title" class="h-8 w-full rounded-md border border-separator-border bg-background-full px-2.5 text-caption-1-regular outline-none focus:border-accent-200"/>
    <select class="h-8 w-full rounded-md border border-separator-border bg-background-full px-2 text-caption-1-regular">${SPRINTS.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
    <div class="flex gap-2 pt-1">${dashButton('Add to sprint', { variant: 'solid', size: 'xs', attrs: 'data-sp-add' })}${dashButton('Cancel', { variant: 'outline', size: 'xs', attrs: 'data-sp-cancel' })}</div>
  </div>`
}

/** Everything under the hero that depends on the picked date range. */
function contentHtml(st: State, data: PromptDetailResponse): string {
  const bounds = resolveRange(st.range)
  const inRange = data.model_results.map((r) => ({ ...r, runs: r.runs.filter((x) => { const d = x.ts.slice(0, 10); return d >= bounds.from && d <= bounds.to }) }))
  const byDay = new Map<string, { total: number; cited: number; ranks: number[] }>()
  for (const r of inRange) for (const run of r.runs) {
    const day = run.ts.slice(0, 10)
    const e = byDay.get(day) ?? { total: 0, cited: 0, ranks: [] }
    e.total += 1
    if (run.cited) e.cited += 1
    if (run.rank != null) e.ranks.push(run.rank)
    byDay.set(day, e)
  }
  const points: DayPoint[] = [...byDay.entries()].map(([date, e]) => ({ date, answers: e.total, rate: (e.cited / e.total) * 100, position: e.ranks.length ? e.ranks.reduce((a, b) => a + b, 0) / e.ranks.length : null }))
  const ownDomain = data.domain_breakdown.find((d) => d.is_you)?.domain ?? (data.stats.owns_answer?.is_you ? data.stats.owns_answer.domain : null)
  const s = data.stats
  const doms = data.domain_breakdown
  const at = doms.findIndex((d) => d.is_you)
  const stats = [
    statCell({ icon: 'RiDoubleQuotesL', label: 'Citation rate', value: fmtPct(s.cited_pct, 0), foot: ownDomain ? `${fmtNum(s.cited_answers)} of ${fmtNum(s.answers)} prompts cite ${esc(ownDomain)}` : `${fmtNum(s.cited_answers)} of ${fmtNum(s.answers)} prompts`, highlight: s.cited_pct != null && s.cited_pct > 50 }),
    statCell({ icon: 'RiTrophyLine', label: 'Average AI position', value: s.position != null ? `#${s.position}` : '–', extra: s.position_delta != null && s.position_delta !== 0 ? delta(s.position_delta, '', 'up', 'vs last scan') : undefined, foot: s.position == null && s.last_known_position != null ? `was #${s.last_known_position}` : 'Across tracked engines' }),
    statCell({ icon: 'RiPieChartLine', label: 'Share of voice', value: s.your_share != null ? `${s.your_share}%` : 'not in top citations', foot: at >= 0 ? `#${at + 1} of ${fmtNum(doms.length)} domains cited` : 'Share of all prompt citations' }),
    statCell({ icon: 'RiVipCrownLine', label: 'Answer leader', value: s.owns_answer ? `<span class="flex items-center gap-1.5 text-headline-regular">${domainLogo(s.owns_answer.domain, 18, s.owns_answer.is_you)}${esc(s.owns_answer.domain)}</span>` : '–', foot: s.owns_answer ? `${s.owns_answer.pct}% of citations (${s.owns_answer.is_you ? 'You' : 'Competitor'})` : undefined }),
  ]
  const fix = data.suggested_fix
  const why = data.why_losing.length === 0 ? '<p class="text-caption-1-regular text-text-secondary">No issues flagged.</p>' : data.why_losing.map((line) => `<li class="flex items-start gap-2 text-body-2-regular text-text-secondary"><span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-status-yellow-text"></span>${esc(line)}</li>`).join('')
  return `<div class="space-y-4">
    ${card(stats.join(''), 'grid grid-cols-1 divide-y divide-separator-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x')}
    ${citationTimelineCard({ points, subtitle: "Every engine's answer to this prompt, day by day" })}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      ${card(`${cardHeader({ icon: 'RiErrorWarningLine', title: 'Why you are losing this prompt' })}<ul class="space-y-1.5 p-4">${why}</ul>`, 'overflow-hidden')}
      ${card(`${cardHeader({ icon: 'RiFocus2Line', title: 'Suggested fix' })}${fix ? `<div class="space-y-1.5 p-4">
        <p class="text-body-2-medium text-text-primary">${esc(fix.headline)}</p>
        <p class="text-caption-1-regular text-text-secondary">${esc(fix.detail)}</p>
        ${fix.target_domains.length > 0 ? `<div class="flex flex-wrap gap-1.5 pt-0.5">${fix.target_domains.map((d) => `<a href="${siteHref(d)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-md border border-separator-border bg-background-full px-2 py-1 text-caption-1-regular text-text-secondary hover:text-accent-700">${domainLogo(d, 14)}${esc(d)}</a>`).join('')}</div>` : ''}
        <div class="flex gap-2 pt-1.5">
          <a href="#" data-nav="cluster" data-cluster="${esc(data.cluster.slug)}" class="${buttonCls}">Create brief ${ri('RiArrowRightLine', 'h-3 w-3')}</a>
          ${!st.added ? dashButton('Add to sprint', { variant: 'solid', size: 'xs', attrs: 'data-pd-sprint' }) : ''}
        </div>
      </div>` : emptyNote('You already own this answer — nothing to fix here.')}`, 'overflow-hidden')}
    </div>
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div data-slot="domains">${domainsCard(data, st.countBy)}</div>
      <div class="space-y-3.5">
        ${card(`${cardHeader({ icon: 'RiArrowRightUpLine', title: 'Position, last two runs' })}
          <div class="flex items-center justify-center gap-4 p-5">${rankChip(data.position_history.from, 'neutral')}${ri('RiArrowRightLine', 'h-4 w-4 text-text-tertiary')}${rankChip(data.position_history.to, data.position_history.to === 1 ? 'good' : data.position_history.to == null ? 'bad' : 'neutral')}</div>`, 'overflow-hidden')}
        ${card(`${cardHeader({ icon: 'RiListCheck2', title: 'Same topic, same problem', subtitle: 'Other prompts in this cluster' })}
          ${data.related_prompts.length === 0 ? emptyNote('No other prompts in this cluster yet.') : `<div>
            <div class="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-separator-border px-4 py-2 text-caption-2-medium uppercase tracking-wide text-text-tertiary"><span>Prompt</span><span>Cited</span><span>Pos</span><span>Change</span></div>
            <ul class="divide-y divide-separator-border">${data.related_prompts.map((p) => `<li><a href="#" data-nav="prompt-detail" data-cluster="${esc(data.cluster.slug)}" data-prompt="${esc(p.prompt)}" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-4 py-3 transition-colors hover:bg-background-secondary-hover">
              <span class="min-w-0 truncate text-caption-1-regular text-text-secondary" title="${esc(p.prompt)}">${esc(p.prompt)}${p.prompt === data.prompt ? tag('This prompt', 'violet') : ''}</span>
              <span class="shrink-0 text-caption-1-regular tabular-nums text-text-secondary">${p.citation_rate}%</span>
              ${rankChip(p.current_rank, p.current_rank === 1 ? 'good' : 'neutral')}
              <span class="shrink-0">${delta(p.rank_change, '', 'up', 'Rank change vs the previous scan')}</span>
            </a></li>`).join('')}</ul>
          </div>`}`, 'overflow-hidden')}
      </div>
    </div>
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      ${engineBreakdown(data.model_results)}
      <div data-slot="trend">${trendsCard(inRange, st.metric)}</div>
    </div>
    ${modelResultsCard(data.cluster.slug, data.prompt)}
  </div>`
}

function initialState(params?: Record<string, string>): State {
  const cluster = params?.cluster && clusters.some((c) => c.slug === params.cluster) ? params.cluster : allPrompts[0].cluster_slug
  const first = allPrompts.find((p) => p.cluster_slug === cluster) ?? allPrompts[0]
  const prompt = params?.prompt && allPrompts.some((p) => p.prompt === params.prompt) ? params.prompt : first.prompt
  return { cluster, prompt, range: defaultFilter({ range: 7 }), countBy: 'domain', metric: 'citation', sprint: false, added: false, copied: false }
}

export function html(params?: Record<string, string>): string {
  const st = initialState(params)
  const { cluster } = st
  const data = promptDetail(st.cluster, st.prompt)
  return `<div class="mx-auto max-w-[1760px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <a href="#" data-nav="prompts" data-cluster="${esc(cluster)}" class="inline-flex items-center gap-1.5 text-caption-1-regular text-text-secondary hover:text-accent-700">${ri('RiArrowLeftLine', 'h-3.5 w-3.5')}Back to prompts</a>
      <div data-slot="range"></div>
    </div>
    <div data-slot="head">${heroHtml(st, data)}</div>
    <div data-slot="sprint"></div>
    <div data-slot="content">${contentHtml(st, data)}</div>
  </div>`
}

export function mount(root: HTMLElement, params?: Record<string, string>): void {
  const slot = (n: string) => root.querySelector<HTMLElement>(`[data-slot="${n}"]`)!
  const st = initialState(params)
  const data = promptDetail(st.cluster, st.prompt)

  const wireDomains = () => wireTabs(root, 'pd-countby', (v) => { st.countBy = v as State['countBy']; slot('domains').innerHTML = domainsCard(data, st.countBy); wireDomains() })
  const wireTrend = () => wireTabs(root, 'pd-trend-metric', (v) => {
    st.metric = v as State['metric']
    const b = resolveRange(st.range)
    slot('trend').innerHTML = trendsCard(data.model_results.map((r) => ({ ...r, runs: r.runs.filter((x) => x.ts.slice(0, 10) >= b.from && x.ts.slice(0, 10) <= b.to) })), st.metric)
    wireTrend(); mountCharts(slot('trend'))
  })
  const wireContent = () => { wireDomains(); wireTrend(); wireCitationTimeline(root); mountModelResults(root); mountCharts(root) }
  const drawHead = () => { slot('head').innerHTML = heroHtml(st, data); slot('sprint').innerHTML = sprintPanel(st) }

  mountFilterBar(slot('range'), {
    only: 'range', value: st.range, clusters: [], engines: [], issues: 0,
    onChange: (v) => { st.range = v; slot('content').innerHTML = contentHtml(st, data); wireContent() },
  })
  wireContent()

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-pd-copy]')) {
      void navigator.clipboard?.writeText(st.prompt)
      st.copied = true; drawHead()
      setTimeout(() => { st.copied = false; if (root.isConnected) drawHead() }, 2000)
    } else if (t.closest('[data-pd-sprint]')) { st.sprint = !st.sprint; drawHead() }
    else if (t.closest('[data-sp-cancel]')) { st.sprint = false; drawHead() }
    else if (t.closest('[data-sp-add]')) { st.added = true; st.sprint = false; drawHead(); slot('content').innerHTML = contentHtml(st, data); wireContent() }
  })
}
