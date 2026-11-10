/*
 * Port of main's `geo/overview/citation-timeline.tsx` (+ `lib/geo-citation-summary.ts`): one summary of a per-day series — days cited,
 * longest uncited stretch, first cited, change in rate — a day-by-day chart and the most recent cited / not-cited stretches.
 * Used by the prompt page. `citationTimelineCard(...)` returns the card; `wireCitationTimeline(root)` makes its metric toggle live.
 */
import { ri } from '../lib/icons'
import { mount as mountCharts, trendLine } from './charts'
import { card, cardHeader, cx, segmented, tag, wireTabs, type Tone } from './ui'

export interface DayPoint { date: string; answers: number; rate: number | null; position?: number | null }
interface Segment { state: 'cited' | 'not_cited'; from: string; to: string; days: number }
type Verdict = 'improving' | 'declining' | 'steady' | 'never_cited' | 'always_cited' | 'no_data'

const round1 = (n: number) => Math.round(n * 10) / 10
function weighted(points: DayPoint[], pick: (p: DayPoint) => number | null | undefined): number | null {
  let sum = 0
  let w = 0
  for (const p of points) { const v = pick(p); if (v == null) continue; const weight = Math.max(1, p.answers); sum += v * weight; w += weight }
  return w ? sum / w : null
}

function summarize(input: DayPoint[]) {
  const pts = input.filter((p) => p.answers > 0 && p.rate != null).sort((a, b) => a.date.localeCompare(b.date))
  const segments: Segment[] = []
  for (const p of pts) {
    const state: Segment['state'] = (p.rate as number) > 0 ? 'cited' : 'not_cited'
    const last = segments[segments.length - 1]
    if (last && last.state === state) { last.to = p.date; last.days += 1 } else segments.push({ state, from: p.date, to: p.date, days: 1 })
  }
  const cited = pts.filter((p) => (p.rate as number) > 0)
  const longestGap = segments.filter((s) => s.state === 'not_cited').reduce<Segment | null>((best, s) => (!best || s.days > best.days ? s : best), null)
  const mid = Math.floor(pts.length / 2)
  const startRate = weighted(pts.length > 1 ? pts.slice(0, mid || 1) : pts, (p) => p.rate)
  const endRate = weighted(pts.length > 1 ? pts.slice(mid || 1) : pts, (p) => p.rate)
  const change = pts.length > 1 && startRate != null && endRate != null ? round1(endRate - startRate) : null
  const posPts = pts.filter((p) => p.position != null)
  const pMid = Math.floor(posPts.length / 2)
  const pStart = weighted(posPts.length > 1 ? posPts.slice(0, pMid) : posPts, (p) => p.position)
  const pEnd = weighted(posPts.length > 1 ? posPts.slice(pMid) : posPts, (p) => p.position)
  const positionChange = posPts.length > 1 && pStart != null && pEnd != null ? round1(pStart - pEnd) : null
  let verdict: Verdict
  if (!pts.length) verdict = 'no_data'
  else if (!cited.length) verdict = 'never_cited'
  else if (cited.length === pts.length && (change == null || Math.abs(change) < 3)) verdict = 'always_cited'
  else if (change == null || Math.abs(change) < 3) verdict = 'steady'
  else verdict = change > 0 ? 'improving' : 'declining'
  return {
    trackedDays: pts.length, citedDays: cited.length, firstCited: cited[0]?.date ?? null, lastCited: cited[cited.length - 1]?.date ?? null, segments, longestGap,
    startRate: startRate == null ? null : round1(startRate), endRate: endRate == null ? null : round1(endRate), change, positionChange, verdict,
  }
}

const fmtDay = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const span = (s: Segment) => (s.from === s.to ? fmtDay(s.from) : `${fmtDay(s.from)} – ${fmtDay(s.to)}`)
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
const VERDICT: Record<Verdict, { label: string; tone: Tone }> = {
  improving: { label: 'Improving', tone: 'green' }, declining: { label: 'Declining', tone: 'rose' }, steady: { label: 'Steady', tone: 'slate' },
  always_cited: { label: 'Cited throughout', tone: 'green' }, never_cited: { label: 'Not cited', tone: 'rose' }, no_data: { label: 'No scans', tone: 'slate' },
}

interface State { points: DayPoint[]; subtitle: string; metric: 'rate' | 'position' }
const states = new Map<string, State>()
let seq = 0

function inner(id: string, st: State): string {
  const s = summarize(st.points)
  const v = VERDICT[s.verdict]
  const scanned = st.points.filter((p) => p.answers > 0 && p.rate != null).sort((x, y) => x.date.localeCompare(y.date))
  const pts = scanned.filter((p) => st.metric === 'rate' || p.position != null).map((p) => ({ x: fmtDay(p.date), y: st.metric === 'rate' ? Math.round(p.rate as number) : Math.round((p.position as number) * 10) / 10, answers: p.answers }))
  const uncited = scanned.filter((p) => (p.rate as number) === 0).map((p) => fmtDay(p.date))
  const recent = [...s.segments].reverse().slice(0, 5)
  const citedPct = s.trackedDays ? Math.round((s.citedDays / s.trackedDays) * 100) : 0
  const changeTone = s.change == null ? 'text-text-secondary' : s.change > 0 ? 'text-status-lime-text' : s.change < 0 ? 'text-status-rose-text' : 'text-text-secondary'
  const arrow = s.change == null || s.change === 0 ? 'RiSubtractLine' : s.change > 0 ? 'RiArrowRightUpLine' : 'RiArrowRightDownLine'
  const tiles = [
    { label: 'Days cited', value: `${s.citedDays}<span class="text-body-medium text-text-tertiary"> / ${s.trackedDays}</span>`, foot: `<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-status-rose-background"><div class="h-full rounded-full bg-[#039855]" style="width:${citedPct}%"></div></div>` },
    { label: 'Longest uncited stretch', value: s.longestGap ? `${s.longestGap.days}<span class="text-body-medium text-text-tertiary"> ${s.longestGap.days === 1 ? 'day' : 'days'}</span>` : '<span class="text-status-lime-text">None</span>', foot: `<span>${s.longestGap ? span(s.longestGap) : 'Cited on every scanned day'}</span>` },
    { label: 'First cited', value: s.firstCited ? fmtDay(s.firstCited) : '–', foot: `<span>${s.lastCited ? `last cited ${fmtDay(s.lastCited)}` : 'not cited in this range'}</span>` },
    { label: 'Change in citation rate', value: `<span class="${cx('inline-flex items-center gap-1', changeTone)}">${ri(arrow, 'h-4 w-4')}${s.change == null ? '–' : `${s.change > 0 ? '+' : ''}${s.change} pts`}</span>`, foot: `<span>${s.startRate != null && s.endRate != null ? `${s.startRate}% → ${s.endRate}%${s.positionChange ? ` · position ${s.positionChange > 0 ? 'up' : 'down'} ${Math.abs(s.positionChange)}` : ''}` : 'needs two or more scanned days'}</span>` },
  ]
  const header = cardHeader({ icon: 'RiCalendarCheckLine', title: 'Citation timeline', subtitle: st.subtitle, right: tag(v.label, v.tone) })
  if (s.verdict === 'no_data') return `${header}<p class="px-5 py-8 text-center text-body-2-regular text-text-secondary">No scans fall inside these dates. Pick a range that has scans (days with scans are marked in the calendar).</p>`
  return `${header}
    <div class="space-y-5 p-5">
      <div class="grid grid-cols-2 divide-separator-border rounded-xl border border-separator-border lg:grid-cols-4 lg:divide-x">
        ${tiles.map((t, i) => `<div class="${cx('min-w-0 px-4 py-3', i >= 2 && 'border-t border-separator-border lg:border-t-0', i % 2 === 1 && 'border-l border-separator-border lg:border-l-0')}">
          <p class="text-caption-1-medium text-text-secondary">${t.label}</p>
          <p class="mt-1 text-title-1-semibold leading-none tracking-tight tabular-nums text-text-primary">${t.value}</p>
          <div class="mt-1.5 truncate text-caption-1-regular text-text-tertiary">${t.foot}</div>
        </div>`).join('')}
      </div>
      <div>
        <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p class="text-caption-1-medium text-text-secondary">${st.metric === 'rate' ? 'Share of prompts that cite you, per scanned day' : 'Average position when cited, per scanned day (higher is better)'}</p>
          ${segmented(`${id}-metric`, st.metric, [{ value: 'rate', label: 'Citation rate' }, { value: 'position', label: 'Position' }])}
        </div>
        ${pts.length < 2
          ? `<p class="py-10 text-center text-caption-1-regular text-text-tertiary">${st.metric === 'position' ? 'Not enough cited days to chart position.' : 'Need two or more scanned days to draw a chart.'}</p>`
          : `<div class="h-[240px]">${trendLine({ points: pts, color: st.metric === 'rate' ? '#039855' : '#155dfc', fmt: (n) => (st.metric === 'rate' ? `${Math.round(n)}%` : `#${Math.round(n * 10) / 10}`), yMin: st.metric === 'rate' ? 0 : 1, yMax: st.metric === 'rate' ? 100 : undefined, lowerIsBetter: st.metric === 'position', seriesLabel: st.metric === 'rate' ? 'Citation rate' : 'Avg position' })}</div>`}
        <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption-1-regular text-text-secondary">
          <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-[#039855]"></span>Each dot is one scanned day</span>
          ${st.metric === 'rate' ? `<span>${uncited.length ? `${uncited.length} day${uncited.length === 1 ? '' : 's'} at 0% (not cited): ${uncited.slice(0, 4).join(', ')}${uncited.length > 4 ? '…' : ''}` : 'No day at 0% — cited on every scanned day'}</span>` : ''}
        </div>
      </div>
      <div>
        <p class="mb-2 text-caption-1-semibold uppercase tracking-wider text-text-tertiary">Recent stretches</p>
        <ul class="grid gap-1.5 md:grid-cols-2">
          ${recent.map((seg) => `<li class="relative overflow-hidden rounded-lg border border-separator-border px-4 py-3 text-caption-1-regular">
            <span class="${cx('absolute inset-y-0 left-0 opacity-[0.12]', seg.state === 'cited' ? 'bg-[#039855]' : 'bg-[#c01048]')}" style="width:${Math.max(4, (seg.days / Math.max(1, s.trackedDays)) * 100)}%"></span>
            <span class="relative flex items-center justify-between gap-3">
              <span class="flex items-center gap-2"><span class="${cx('h-2 w-2 rounded-full', seg.state === 'cited' ? 'bg-[#039855]' : 'bg-[#c01048]')}"></span><span class="font-medium text-text-primary">${seg.state === 'cited' ? 'Cited' : 'Not cited'}</span></span>
              <span class="tabular-nums text-text-secondary">${span(seg)} · ${plural(seg.days, 'day')}</span>
            </span>
          </li>`).join('')}
        </ul>
      </div>
    </div>`
}

/** The card; `points` is one entry per scanned day (rate 0–100, optional average position). */
export function citationTimelineCard(o: { points: DayPoint[]; subtitle?: string }): string {
  const id = `ctl${++seq}`
  const st: State = { points: o.points, subtitle: o.subtitle ?? 'Across every scan in the selected dates', metric: 'rate' }
  states.set(id, st)
  return card(`<div data-ctl-body>${inner(id, st)}</div>`, 'overflow-hidden').replace('<section ', `<section data-ctl="${id}" `)
}

/** Wire every timeline card under `root` (the Citation rate / Position toggle). */
export function wireCitationTimeline(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-ctl]').forEach((el) => {
    const id = el.dataset.ctl as string
    const st = states.get(id)
    if (!st || el.dataset.wired) return
    el.dataset.wired = '1'
    const wire = () => wireTabs(el, `${id}-metric`, (v) => {
      st.metric = v as State['metric']
      el.querySelector('[data-ctl-body]')!.innerHTML = inner(id, st)
      wire()
      mountCharts(el)
    })
    wire()
    mountCharts(el)
  })
}
