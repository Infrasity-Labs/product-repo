/*
 * Port of the real app's `src/components/geo/overview/charts.tsx` (Nivo line / bar / pie / radial-bar) as SVG + HTML string
 * generators. Geometry follows Nivo/d3 (band scales, nice linear scales, natural / monotoneX curves, d3 ticks) so the charts
 * match the library's output. Everything is drawn at its final state. Hover crosshairs and `ChartTip` tooltips are wired by
 * `mount(root)` with event delegation; charts that fill their container (sparks, lines, bars) are re-drawn at the container's
 * pixel size, like Nivo's `Responsive*` wrappers.
 */
import { esc } from './ui'

/* ───────────────────────── theme (the real `nivoTheme`) ───────────────────────── */

const FONT = 12.5
const TICK = '#71717a'
const GRID = '#ececee'
const CROSS = '#d4d4d8'

/* ───────────────────────── shared tooltip markup ───────────────────────── */

/** The app's `ChartTip` card. `title` and `children` are trusted HTML. */
export function chartTip(title: string | undefined, children: string, wrap = false) {
  return `<div class="${wrap ? 'w-64 whitespace-normal' : 'w-[240px] whitespace-nowrap'} rounded-xl border border-separator-border bg-background-full px-4 py-3 text-body-regular shadow-lg">${title ? `<p class="text-body-semibold text-text-primary">${title}</p>` : ''}<div class="text-text-secondary">${children}</div></div>`
}

/* ───────────────────────── d3 helpers (scales, ticks, curves) ───────────────────────── */

type Pt = [number, number]
const f = (n: number) => String(Math.round(n * 100) / 100)

function tickIncrement(start: number, stop: number, count: number) {
  const step = (stop - start) / Math.max(0, count)
  const power = Math.floor(Math.log10(step))
  const error = step / 10 ** power
  const factor = error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1
  return power >= 0 ? factor * 10 ** power : -(10 ** -power) / factor
}

/** d3.ticks */
function ticks(a: number, b: number, count: number): number[] {
  const reverse = b < a
  const start = reverse ? b : a, stop = reverse ? a : b
  const step = tickIncrement(start, stop, count)
  if (step === 0 || !Number.isFinite(step)) return []
  const out: number[] = []
  if (step > 0) {
    let r0 = Math.round(start / step), r1 = Math.round(stop / step)
    if (r0 * step < start) ++r0
    if (r1 * step > stop) --r1
    for (let i = 0; i <= r1 - r0; i++) out.push((r0 + i) * step)
  } else {
    const s = -step
    let r0 = Math.round(start * s), r1 = Math.round(stop * s)
    if (r0 / s < start) ++r0
    if (r1 / s > stop) --r1
    for (let i = 0; i <= r1 - r0; i++) out.push((r0 + i) / s)
  }
  return reverse ? out.reverse() : out
}

/** d3 `scale.nice()` (count 10). */
function nice(start: number, stop: number): [number, number] {
  let prestep: number | undefined
  for (let guard = 0; guard < 10; guard++) {
    const step = tickIncrement(start, stop, 10)
    if (step === prestep || step === 0 || !Number.isFinite(step)) return [start, stop]
    if (step > 0) { start = Math.floor(start / step) * step; stop = Math.ceil(stop / step) * step }
    else { start = Math.ceil(start * step) / step; stop = Math.floor(stop * step) / step }
    prestep = step
  }
  return [start, stop]
}

/** d3 `scaleBand().rangeRound([0, size]).padding(p)`. */
function band(n: number, size: number, padding: number) {
  const step = Math.floor(size / Math.max(1, n - padding + padding * 2))
  const start = Math.round((size - step * (n - padding)) * 0.5)
  return { step, start, bw: Math.round(step * (1 - padding)) }
}

const M = (p: Pt) => `M${f(p[0])},${f(p[1])}`

/** d3.curveNatural */
function naturalPath(p: Pt[]): string {
  const n = p.length
  if (n < 2) return ''
  if (n === 2) return `${M(p[0])}L${f(p[1][0])},${f(p[1][1])}`
  const ctrl = (x: number[]): [number[], number[]] => {
    const k = x.length - 1
    const a = new Array<number>(k), b = new Array<number>(k), r = new Array<number>(k)
    a[0] = 0; b[0] = 2; r[0] = x[0] + 2 * x[1]
    for (let i = 1; i < k - 1; ++i) { a[i] = 1; b[i] = 4; r[i] = 4 * x[i] + 2 * x[i + 1] }
    a[k - 1] = 2; b[k - 1] = 7; r[k - 1] = 8 * x[k - 1] + x[k]
    for (let i = 1; i < k; ++i) { const m = a[i] / b[i - 1]; b[i] -= m; r[i] -= m * r[i - 1] }
    a[k - 1] = r[k - 1] / b[k - 1]
    for (let i = k - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i]
    b[k - 1] = (x[k] + a[k - 1]) / 2
    for (let i = 0; i < k - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1]
    return [a, b]
  }
  const px = ctrl(p.map((q) => q[0])), py = ctrl(p.map((q) => q[1]))
  let d = M(p[0])
  for (let i = 0; i < n - 1; i++) d += `C${f(px[0][i])},${f(py[0][i])},${f(px[1][i])},${f(py[1][i])},${f(p[i + 1][0])},${f(p[i + 1][1])}`
  return d
}

/** d3.curveMonotoneX */
function monotonePath(p: Pt[]): string {
  const n = p.length
  if (n < 2) return ''
  if (n === 2) return `${M(p[0])}L${f(p[1][0])},${f(p[1][1])}`
  const sign = (x: number) => (x < 0 ? -1 : 1)
  const slope3 = (a: Pt, b: Pt, c: Pt) => {
    const h0 = b[0] - a[0], h1 = c[0] - b[0]
    const s0 = (b[1] - a[1]) / (h0 || (h1 < 0 ? -0 : 0)), s1 = (c[1] - b[1]) / (h1 || (h0 < 0 ? -0 : 0))
    const q = (s0 * h1 + s1 * h0) / (h0 + h1)
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(q)) || 0
  }
  const slope2 = (a: Pt, b: Pt, t: number) => { const h = b[0] - a[0]; return h ? (3 * (b[1] - a[1]) / h - t) / 2 : t }
  const t = new Array<number>(n)
  for (let i = 1; i < n - 1; i++) t[i] = slope3(p[i - 1], p[i], p[i + 1])
  t[0] = slope2(p[0], p[1], t[1])
  t[n - 1] = slope2(p[n - 2], p[n - 1], t[n - 2])
  let d = M(p[0])
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1], dx = (x1 - x0) / 3
    d += `C${f(x0 + dx)},${f(y0 + dx * t[i])},${f(x1 - dx)},${f(y1 - dx * t[i + 1])},${f(x1)},${f(y1)}`
  }
  return d
}

/** Split into runs of defined points (Nivo breaks the line at nulls). */
function runs(pts: Array<Pt | null>): Pt[][] {
  const out: Pt[][] = []
  let cur: Pt[] = []
  for (const p of pts) {
    if (p) cur.push(p)
    else if (cur.length) { out.push(cur); cur = [] }
  }
  if (cur.length) out.push(cur)
  return out
}

/* ───────────────────────── registry (options per generated chart id) ───────────────────────── */

let seq = 0
const nextId = () => `ch${++seq}`

export interface BarDatum { id: string; label: string; value: number; color: string; href?: string; logo?: string; valueLabel?: string; hint?: string; dot?: string }
export interface TrendDatum { x: string; y: number; answers: number }
export type TipRow = { id: string; color: string; logo?: string; y: number | null }
export interface LineSeries { id: string; color: string; logo?: string; points: Array<{ x: string; y: number | null; answers: number }> }

interface SparkOpts { values: Array<number | null>; color?: string; lowerIsBetter?: boolean; cls?: string }
interface GaugeOpts { value: number | null; size?: number; color?: string; track?: string; thickness?: number; center?: string }
interface DonutOpts { slices: Array<{ id: string; value: number; color: string; label?: string }>; size?: number; inner?: number; center?: string; label?: (d: { id: string | number; value: number }) => string }
interface HBarOpts { rows: BarDatum[]; max?: number; rowHeight?: number; labelWidth?: number; showLogo?: boolean }
interface HBarInsideOpts { rows: BarDatum[]; rowHeight?: number; color?: string }
interface TrendOpts { points: TrendDatum[]; color?: string; fmt?: (n: number) => string; yMin?: number; yMax?: number; lowerIsBetter?: boolean; seriesLabel: string; pointSize?: number; breakdown?: Record<string, TipRow[]> }
interface MultiOpts { series: LineSeries[]; days: number | string[]; fmt?: (n: number) => string; yMin?: number; yMax?: number; lowerIsBetter?: boolean; fillMissing?: number; bottomLabel?: string }

/** Pixel geometry of a rendered line chart, used by the hover handlers. */
interface Geo { ml: number; mt: number; ih: number; xs: number[] }

type Entry =
  | { kind: 'spark'; o: SparkOpts }
  | { kind: 'trend'; o: TrendOpts; geo?: Geo }
  | { kind: 'multi'; o: MultiOpts; geo?: Geo; days: string[] }
  | { kind: 'hbar'; o: HBarOpts }
  | { kind: 'hbarInside'; o: HBarInsideOpts }
  | { kind: 'donut'; o: DonutOpts }

const registry = new Map<string, Entry>()
const register = (e: Entry) => { const id = nextId(); registry.set(id, e); return id }

const defaultFmt = (n: number) => String(Math.round(n * 100) / 100)
const svgOpen = (w: number, h: number, extra = '') => `<svg viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" style="position:absolute;left:0;top:0;width:100%;height:100%" ${extra}>`
/** Vertical Nivo `linearGradientDef` (x1=0,x2=0,y1=0,y2=1). */
const vGrad = (id: string, color: string, a0: number, a1: number) =>
  `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="${a0}"/><stop offset="100%" stop-color="${color}" stop-opacity="${a1}"/></linearGradient></defs>`

/** Fallback pixel sizes used before `mount` measures the container. */
const FALLBACK = { spark: [240, 56], line: [640, 320], hbar: 640, hbarInside: 480 } as const

/* ───────────────────────── Spark ───────────────────────── */

function renderSpark(id: string, o: SparkOpts, w: number, h: number) {
  const color = o.color ?? '#155dfc'
  const mt = 6, mr = 8, mb = 2, ml = 2
  const iw = Math.max(1, w - ml - mr), ih = Math.max(1, h - mt - mb)
  const pts = o.values.map((v, i) => (v == null ? null : { x: i, y: v })).filter((p): p is { x: number; y: number } => p != null)
  const lo = Math.min(...pts.map((p) => p.y)), hi = Math.max(...pts.map((p) => p.y)), span = Math.max(1e-6, hi - lo)
  const yMin = lo - span * 0.45, yMax = hi + span * 0.1
  const xMax = Math.max(1, o.values.length - 1)
  const X = (i: number) => (i / xMax) * iw
  const Y = (v: number) => { const t = (v - yMin) / (yMax - yMin); return o.lowerIsBetter ? t * ih : ih - t * ih }
  const xy: Pt[] = pts.map((p) => [X(p.x), Y(p.y)])
  const line = naturalPath(xy)
  const last = xy[xy.length - 1]
  const area = `${line}L${f(last[0])},${f(ih)}L${f(xy[0][0])},${f(ih)}Z`
  return `${svgOpen(w, h)}${vGrad(`${id}-g`, color, 0.16, 0.02)}<g transform="translate(${ml},${mt})"><path d="${area}" fill="url(#${id}-g)" stroke="none"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${f(last[0])}" cy="${f(last[1])}" r="6" fill="${color}" opacity="0.15"/><circle cx="${f(last[0])}" cy="${f(last[1])}" r="3.2" fill="#fff" stroke="${color}" stroke-width="2"/></g></svg>`
}

/** Tiny area line with no axes. `lowerIsBetter` flips the axis so "up" always means better. */
export function spark(o: SparkOpts): string {
  const cls = o.cls ?? 'h-14'
  const n = o.values.filter((v) => v != null).length
  if (n < 2) return `<div class="flex items-center ${cls}"><div class="h-px w-full border-t border-dashed border-separator-border"></div></div>`
  const id = register({ kind: 'spark', o })
  return `<div class="relative ${cls}" data-chart="${id}">${renderSpark(id, o, FALLBACK.spark[0], FALLBACK.spark[1])}</div>`
}

/* ───────────────────────── arcs (Gauge / Donut) ───────────────────────── */

const pol = (cx: number, cy: number, r: number, a: number): Pt => [cx + r * Math.sin(a), cy - r * Math.cos(a)]

/** SVG arc path from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise). */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = pol(cx, cy, r, a0), e = pol(cx, cy, r, a1)
  return `M${f(s[0])},${f(s[1])}A${f(r)},${f(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(e[0])},${f(e[1])}`
}

/** A ring segment with fully rounded ends (d3 arc with a huge corner radius): a round-capped stroke along the mid radius. */
function pillArc(cx: number, cy: number, mid: number, thick: number, a0: number, a1: number, stroke: string, extra = '') {
  if (a1 - a0 >= Math.PI * 2 - 1e-4) return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(mid)}" fill="none" stroke="${stroke}" stroke-width="${f(thick)}" ${extra}/>`
  const cap = thick / 2 / mid
  const s = a0 + cap, e = Math.max(s + 0.0005, a1 - cap)
  return `<path d="${arcPath(cx, cy, mid, s, e)}" fill="none" stroke="${stroke}" stroke-width="${f(thick)}" stroke-linecap="round" ${extra}/>`
}

/** Radial gauge: a slim gradient arc on a soft track, rounded caps, content in the middle. */
export function gauge(o: GaugeOpts): string {
  const size = o.size ?? 160, color = o.color ?? '#155dfc', track = o.track ?? '#eff4ff', thickness = o.thickness ?? 0.085
  const v = Math.max(0, Math.min(100, o.value ?? 0))
  const id = nextId()
  const m = 4, R = size / 2 - m, inner = R * (1 - thickness * 2.2), thick = R - inner, mid = (R + inner) / 2, c = size / 2
  const s = size - 2 * m
  // vertical gradient rotated 45° about the box centre (Nivo's `gradientTransform: rotate(45 0.5 0.5)`), mapped onto the ring's box
  const g1: Pt = [m + s * 0.5, m + s * -0.2071], g2: Pt = [m + s * -0.2071, m + s * 0.5]
  const grad = `<defs><linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="${f(g1[0])}" y1="${f(g1[1])}" x2="${f(g2[0])}" y2="${f(g2[1])}"><stop offset="0%" stop-color="${color}" stop-opacity="0.55"/><stop offset="100%" stop-color="${color}" stop-opacity="1"/></linearGradient></defs>`
  const arc = v > 0 ? pillArc(c, c, mid, thick, 0, (v / 100) * Math.PI * 2, `url(#${id}-g)`) : ''
  return `<div class="relative shrink-0" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" style="width:100%;height:100%" role="img" aria-label="Gauge">${grad}<circle cx="${f(c)}" cy="${f(c)}" r="${f(mid)}" fill="none" stroke="${track}" stroke-width="${f(thick)}"/>${arc}</svg><div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">${o.center ?? ''}</div></div>`
}

/** Donut. Centre content (a number, a logo) goes in `center`. A `label` callback turns on the hover tooltip. */
export function donut(o: DonutOpts): string {
  const size = o.size ?? 132, inner = o.inner ?? 0.78
  const total = o.slices.reduce((s, x) => s + x.value, 0)
  const data = total > 0 ? o.slices : [{ id: 'none', value: 1, color: '#e4e4e7', label: undefined }]
  const sum = data.reduce((s, x) => s + x.value, 0)
  const live = data.filter((s) => s.value > 0).length
  const pad = live > 1 ? (2 * Math.PI) / 180 : 0
  const m = 3, R = size / 2 - m, ri = R * inner, thick = R - ri, mid = (R + ri) / 2, c = size / 2
  let a = 0
  let paths = ''
  data.forEach((s, i) => {
    const span = (s.value / sum) * Math.PI * 2
    const a0 = a, a1 = a + span
    a = a1
    if (s.value <= 0) return
    paths += pillArc(c, c, mid, thick, a0 + pad / 2, a1 - pad / 2, s.color, `data-slice="${i}" ${o.label ? 'style="cursor:default"' : ''}`)
  })
  const id = o.label ? register({ kind: 'donut', o }) : ''
  return `<div class="relative shrink-0"${id ? ` data-chart="${id}"` : ''} style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" style="width:100%;height:100%" role="img" aria-label="Donut chart">${paths}</svg><div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">${o.center ?? ''}</div></div>`
}

/* ───────────────────────── HBar ───────────────────────── */

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const hrefAttr = (r: BarDatum) => (r.href ? ` data-href="${esc(r.href)}" style="cursor:pointer"` : '')

function renderHBar(o: HBarOpts, w: number) {
  const rows = o.rows, rowHeight = o.rowHeight ?? 46, labelWidth = o.labelWidth ?? 190, showLogo = o.showLogo ?? true
  const top = 4, bottom = 4, right = 64
  const H = rows.length * rowHeight + top + bottom
  const iw = Math.max(1, w - labelWidth - right)
  const chars = Math.floor((labelWidth - (showLogo ? 44 : 12)) / 6.6)
  const max = o.max ?? Math.max(1, ...rows.map((r) => r.value)) * 1.04
  const b = band(rows.length, rows.length * rowHeight, 0.74)
  let tracks = '', bars = '', axes = ''
  rows.forEach((r, i) => {
    const y = b.start + i * b.step, cy = y + b.bw / 2
    const bw = Math.max(0, Math.min(iw, (r.value / max) * iw))
    tracks += `<rect data-row="${esc(r.id)}" x="0" y="${y}" width="${f(iw)}" height="${b.bw}" rx="5" fill="#f4f4f5"/>`
    if (bw > 0) bars += `<rect data-row="${esc(r.id)}" x="0" y="${y}" width="${f(bw)}" height="${b.bw}" rx="5" fill="${esc(r.color)}"${r.href ? ' data-href="' + esc(r.href) + '" style="cursor:pointer"' : ''}/>`
    const logo = showLogo && r.logo
      ? `<rect x="${-labelWidth + 4}" y="-13" width="26" height="26" rx="7" fill="#fff" stroke="#e4e4e7"/><image href="${esc(r.logo)}" x="${-labelWidth + 9}" y="-8" width="16" height="16"/>`
      : ''
    axes += `<g transform="translate(0,${f(cy)})" data-row="${esc(r.id)}"${hrefAttr(r)}>${logo}<text x="${-labelWidth + (showLogo ? 34 : 4)}" y="0" dominant-baseline="central" font-size="13" fill="#3f3f46" font-weight="500">${esc(trunc(r.label, chars))}</text></g>`
    axes += `<text transform="translate(${f(iw + right - 6)},${f(cy)})" text-anchor="end" dominant-baseline="central" font-size="13.5" font-weight="600" fill="#18181b" style="font-variant-numeric:tabular-nums">${esc(r.valueLabel ?? '')}</text>`
  })
  return { H, svg: `${svgOpen(w, H, 'role="img" aria-label="Bar chart"')}<g transform="translate(${labelWidth},${top})">${tracks}${bars}${axes}</g></svg>` }
}

/** Horizontal bars: rounded bars on a soft track, label (+ logo) at the left, value at the right. */
export function hbar(o: HBarOpts): string {
  const id = register({ kind: 'hbar', o })
  const { H, svg } = renderHBar(o, FALLBACK.hbar)
  return `<div class="relative w-full" style="height:${H}px" data-chart="${id}">${svg}</div>`
}

/* ───────────────────────── HBarInside ───────────────────────── */

function renderHBarInside(o: HBarInsideOpts, w: number) {
  const rows = o.rows, rowHeight = o.rowHeight ?? 40, dflt = o.color ?? '#f4f4f5'
  const right = 44
  const H = rows.length * rowHeight + 4
  const iw = Math.max(1, w - right)
  const max = Math.max(1, ...rows.map((r) => r.value))
  const b = band(rows.length, rows.length * rowHeight, 0.14)
  let bars = '', labels = ''
  rows.forEach((r, i) => {
    const y = b.start + i * b.step, cy = y + b.bw / 2
    const bw = Math.max(0, Math.min(iw, (r.value / max) * iw))
    if (bw > 0) bars += `<rect data-row="${esc(r.id)}" x="0" y="${y}" width="${f(bw)}" height="${b.bw}" rx="8" fill="${esc(r.color || dflt)}"${hrefAttr(r)}/>`
    const lead = r.logo ? `<image href="${esc(r.logo)}" x="10" y="${f(cy - 8)}" width="16" height="16"/>` : r.dot ? `<circle cx="16" cy="${f(cy)}" r="4" fill="${esc(r.dot)}"/>` : ''
    labels += `<g data-row="${esc(r.id)}"${hrefAttr(r)}>${lead}<text x="${r.logo || r.dot ? 34 : 12}" y="${f(cy)}" dominant-baseline="central" font-size="13" font-weight="500" fill="#18181b">${esc(r.label)}</text></g>`
    labels += `<text transform="translate(${f(iw + right - 4)},${f(cy)})" text-anchor="end" dominant-baseline="central" font-size="12.5" fill="#52525b" style="font-variant-numeric:tabular-nums">${esc(r.valueLabel ?? '')}</text>`
  })
  return { H, svg: `${svgOpen(w, H, 'role="img" aria-label="Bar chart"')}<g transform="translate(0,2)">${bars}${labels}</g></svg>` }
}

/** Source-distribution bars: a soft bar per row with logo + name inside it, the count at the right. */
export function hbarInside(o: HBarInsideOpts): string {
  const id = register({ kind: 'hbarInside', o })
  const { H, svg } = renderHBarInside(o, FALLBACK.hbarInside)
  return `<div class="relative w-full" style="height:${H}px" data-chart="${id}">${svg}</div>`
}

/* ───────────────────────── line charts ───────────────────────── */

const crosshair = (h: number) => `<line data-cross x1="0" x2="0" y1="0" y2="${f(h)}" stroke="${CROSS}" stroke-width="1" stroke-dasharray="4 4" style="display:none" pointer-events="none"/>`
const xPoint = (i: number, n: number, iw: number) => (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
const tickText = (anchor: 'end' | 'middle', x: number, y: number, baseline: string, text: string) =>
  `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" dominant-baseline="${baseline}" font-size="${FONT}" fill="${TICK}">${esc(text)}</text>`

function renderTrend(id: string, e: Extract<Entry, { kind: 'trend' }>, w: number, h: number) {
  const o = e.o
  const color = o.color ?? '#10b981', fmt = o.fmt ?? defaultFmt
  const ml = 44, mt = 14, mr = 24, mb = 30
  const iw = Math.max(1, w - ml - mr), ih = Math.max(1, h - mt - mb)
  const n = o.points.length
  const ys = o.points.map((p) => p.y)
  const [lo, hi] = nice(o.yMin ?? (o.lowerIsBetter ? 1 : 0), o.yMax ?? Math.max(...ys, 0))
  const span = hi - lo || 1
  const Y = (v: number) => { const t = (v - lo) / span; return o.lowerIsBetter ? t * ih : ih - t * ih }
  const xs = o.points.map((_, i) => xPoint(i, n, iw))
  const xy: Pt[] = o.points.map((p, i) => [xs[i], Y(p.y)])
  const line = monotonePath(xy)
  const base = Y(0)
  const area = n > 1 ? `${line}L${f(xs[n - 1])},${f(base)}L${f(xs[0])},${f(base)}Z` : ''
  const yTicks = ticks(lo, hi, 5)
  const every = Math.max(1, Math.ceil(n / 8))
  let grid = '', left = '', bottom = ''
  for (const t of yTicks) {
    grid += `<line x1="0" x2="${f(iw)}" y1="${f(Y(t))}" y2="${f(Y(t))}" stroke="${GRID}" stroke-width="1"/>`
    left += tickText('end', -10, Y(t), 'central', fmt(t))
  }
  o.points.forEach((p, i) => { if (i % every === 0) bottom += tickText('middle', xs[i], ih + 12, 'text-before-edge', p.x) })
  e.geo = { ml, mt, ih, xs }
  const pts = o.pointSize ? xy.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${o.pointSize! / 2}" fill="${color}" stroke="#fff" stroke-width="2"/>`).join('') : ''
  return `${svgOpen(w, h)}${vGrad(`${id}-g`, color, 0.16, 0.02)}<g transform="translate(${ml},${mt})">${grid}${area ? `<path d="${area}" fill="url(#${id}-g)" stroke="none"/>` : ''}<path d="${line}" fill="none" stroke="${color}" stroke-width="2"/>${pts}${left}${bottom}${crosshair(ih)}</g></svg>`
}

/** Full trend line: gradient area, hover crosshair with tooltip, light grid. */
export function trendLine(o: TrendOpts): string {
  const e: Entry = { kind: 'trend', o }
  const id = register(e)
  return `<div class="relative h-full w-full" data-chart="${id}">${renderTrend(id, e, FALLBACK.line[0], FALLBACK.line[1])}</div>`
}

function multiDays(o: MultiOpts): string[] {
  if (Array.isArray(o.days)) return o.days
  const seen = new Set<string>(), all: string[] = []
  for (const s of o.series) for (const p of s.points) if (!seen.has(p.x)) { seen.add(p.x); all.push(p.x) }
  return all.slice(-Math.max(1, o.days))
}

/** Per-day values of a series (a day with no data is drawn at `fill`, flagged `filled`, so the line dips instead of breaking). */
function fillDays(points: LineSeries['points'], days: string[], fill?: number) {
  const m = new Map(points.map((p) => [p.x, p]))
  return days.map((x) => {
    const y = m.get(x)?.y ?? null
    return y == null && fill != null ? { x, y: fill, filled: true } : { x, y, filled: false }
  })
}

function renderMulti(e: Extract<Entry, { kind: 'multi' }>, w: number, h: number) {
  const o = e.o, days = e.days
  const fmt = o.fmt ?? defaultFmt
  const ml = 44, mt = 12, mr = 16, mb = 30
  const iw = Math.max(1, w - ml - mr), ih = Math.max(1, h - mt - mb)
  const n = days.length
  const data = o.series.map((s) => ({ s, d: fillDays(s.points, days, o.fillMissing) }))
  const integerTicks = o.bottomLabel && o.yMin != null && o.yMax != null && o.yMax - o.yMin <= 12
    ? Array.from({ length: Math.floor(o.yMax - o.yMin) + 1 }, (_, i) => (o.yMin as number) + i)
    : null
  const vals = data.flatMap((x) => x.d.map((p) => p.y).filter((y): y is number => y != null))
  let lo = o.yMin ?? (o.lowerIsBetter ? 1 : 0), hi = o.yMax ?? Math.max(...vals, 0)
  if (!integerTicks) [lo, hi] = nice(lo, hi)
  const span = hi - lo || 1
  const Y = (v: number) => { const t = (v - lo) / span; return o.lowerIsBetter ? t * ih : ih - t * ih }
  const xs = days.map((_, i) => xPoint(i, n, iw))
  const yTicks = integerTicks ?? ticks(lo, hi, 5)
  const every = Math.max(1, Math.ceil(n / 8))
  let grid = '', left = '', bottom = '', lines = ''
  for (const t of yTicks) {
    grid += `<line x1="0" x2="${f(iw)}" y1="${f(Y(t))}" y2="${f(Y(t))}" stroke="${GRID}" stroke-width="1"/>`
    left += tickText('end', -8, Y(t), 'central', o.bottomLabel && o.yMax != null && t === o.yMax ? o.bottomLabel : fmt(t))
  }
  days.forEach((d, i) => { if (i % every === 0) bottom += tickText('middle', xs[i], ih + 10, 'text-before-edge', d) })
  for (const { s, d } of data) {
    const pts = d.map((p, i): Pt | null => (p.y == null ? null : [xs[i], Y(p.y)]))
    for (const run of runs(pts)) if (run.length > 1) lines += `<path d="${monotonePath(run)}" fill="none" stroke="${s.color}" stroke-width="2"/>`
  }
  e.geo = { ml, mt, ih, xs }
  return `${svgOpen(w, h)}<g transform="translate(${ml},${mt})">${grid}${lines}${left}${bottom}${crosshair(ih)}</g></svg>`
}

/** Several lines on one axis (one per engine). Hovering a day lists every line's value, highest first. */
export function multiLine(o: MultiOpts): string {
  const e: Entry = { kind: 'multi', o, days: multiDays(o) }
  const id = register(e)
  return `<div class="relative h-full w-full" data-chart="${id}">${renderMulti(e, FALLBACK.line[0], FALLBACK.line[1])}</div>`
}

/* ───────────────────────── spark / hbar convenience: re-render at pixel size ───────────────────────── */

function renderEntry(id: string, e: Entry, w: number, h: number): string | null {
  switch (e.kind) {
    case 'spark': return renderSpark(id, e.o, w, h)
    case 'trend': return renderTrend(id, e, w, h)
    case 'multi': return renderMulti(e, w, h)
    case 'hbar': return renderHBar(e.o, w).svg
    case 'hbarInside': return renderHBarInside(e.o, w).svg
    default: return null
  }
}

/* ───────────────────────── tooltips ───────────────────────── */

const LOGO_BOX = 'h-4 w-4 shrink-0'

function trendTipHtml(o: TrendOpts, i: number) {
  const fmt = o.fmt ?? defaultFmt
  const p = o.points[i]
  const rows = (o.breakdown?.[p.x] ?? []).filter((r) => r.y != null).sort((a, b) => (o.lowerIsBetter ? -1 : 1) * ((b.y as number) - (a.y as number)))
  const list = rows.length
    ? `<ul class="mt-2 space-y-1.5 border-t border-separator-border pt-2">${rows.map((r) => `<li class="flex items-center gap-2">${
      r.logo ? `<img src="${esc(r.logo)}" alt="" width="16" height="16" class="rounded-[3px] ${LOGO_BOX}"/>` : `<span class="h-2 w-2 shrink-0 rounded-full" style="background:${esc(r.color)}"></span>`
    }<span class="min-w-0 truncate ${r.id === 'You' ? 'font-semibold text-text-primary' : 'text-text-secondary'}">${esc(r.id)}</span><span class="ml-auto shrink-0 pl-4 font-semibold tabular-nums text-text-primary">${esc(fmt(r.y as number))}</span></li>`).join('')}</ul>`
    : ''
  return chartTip(esc(p.x), `<div class="flex items-center justify-between gap-6"><span>${esc(o.seriesLabel)}</span><span class="font-semibold tabular-nums text-text-primary">${esc(fmt(p.y))}</span></div>${list}<p class="mt-2 text-caption-1-regular tabular-nums text-text-tertiary">${p.answers.toLocaleString('en-US')} answers checked</p>`)
}

function multiTipHtml(e: Extract<Entry, { kind: 'multi' }>, i: number) {
  const o = e.o, fmt = o.fmt ?? defaultFmt
  const day = e.days[i]
  const pts = o.series
    .map((s) => ({ s, p: fillDays(s.points, e.days, o.fillMissing)[i] }))
    .filter((x) => x.p.y != null)
    .sort((a, b) => (a.p.filled ? 1 : 0) - (b.p.filled ? 1 : 0) || (o.lowerIsBetter ? -1 : 1) * ((b.p.y as number) - (a.p.y as number)))
  return `<div class="min-w-[190px] whitespace-nowrap rounded-xl border border-separator-border bg-background-full p-3 text-caption-1-regular shadow-lg"><p class="mb-2 text-body-semibold text-text-primary">${esc(day)}</p><ul class="space-y-1.5">${pts.map(({ s, p }) => `<li class="flex items-center gap-2">${
    s.logo ? `<img src="${esc(s.logo)}" alt="" width="14" height="14" class="shrink-0"/>` : `<span class="h-2 w-2 shrink-0 rounded-full" style="background:${esc(s.color)}"></span>`
  }<span class="text-text-secondary">${esc(s.id)}</span>${p.filled ? '<span class="ml-auto pl-4 text-text-tertiary">No data</span>' : `<span class="ml-auto pl-4 font-semibold tabular-nums text-text-primary">${esc(fmt(p.y as number))}</span>`}</li>`).join('')}</ul></div>`
}

function showTip(c: HTMLElement, html: string, x: number, y: number, mode: 'line' | 'free') {
  let t = c.querySelector<HTMLElement>(':scope > [data-chart-tip]')
  if (!t) {
    t = document.createElement('div')
    t.setAttribute('data-chart-tip', '')
    t.className = 'pointer-events-none absolute left-0 top-0 z-50'
    c.appendChild(t)
  }
  t.innerHTML = html
  const cw = c.clientWidth, ch = c.clientHeight, tw = t.offsetWidth, th = t.offsetHeight
  let left = x + 14
  if (left + tw > cw) left = x - 14 - tw
  left = Math.max(0, left)
  const top = mode === 'line' ? Math.max(0, Math.min(y - th / 2, ch - th)) : y + 14
  t.style.transform = `translate(${f(left)}px,${f(top)}px)`
}
const hideTip = (c: Element) => { c.querySelector(':scope > [data-chart-tip]')?.remove() }
const hideCross = (c: Element) => { c.querySelector<SVGElement>('[data-cross]')?.style.setProperty('display', 'none') }

function nearest(xs: number[], px: number) {
  let best = 0, bd = Infinity
  for (let i = 0; i < xs.length; i++) { const d = Math.abs(xs[i] - px); if (d < bd) { bd = d; best = i } }
  return best
}

/* ───────────────────────── mount ───────────────────────── */

const sizes = new WeakMap<Element, string>()
const wiredRoots = new WeakSet<object>()
const handled = new WeakSet<Event>()

function paint(el: HTMLElement) {
  const id = el.dataset.chart as string
  const e = registry.get(id)
  if (!e) return
  const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight)
  if (w < 2 || h < 2) return
  const key = `${w}x${h}`
  if (sizes.get(el) === key) return
  const svg = renderEntry(id, e, w, h)
  if (svg == null) return
  sizes.set(el, key)
  el.innerHTML = svg
}

function onMove(ev: MouseEvent) {
  if (handled.has(ev)) return
  const target = ev.target as Element | null
  const c = target?.closest<HTMLElement>('[data-chart]')
  if (!c) return
  handled.add(ev)
  const e = registry.get(c.dataset.chart as string)
  if (!e) return
  const rect = c.getBoundingClientRect()
  const mx = ev.clientX - rect.left, my = ev.clientY - rect.top
  if (e.kind === 'trend' || e.kind === 'multi') {
    const g = e.geo
    if (!g || !g.xs.length) return
    const i = nearest(g.xs, mx - g.ml)
    const cross = c.querySelector<SVGElement>('[data-cross]')
    if (cross) {
      cross.setAttribute('x1', f(g.xs[i]))
      cross.setAttribute('x2', f(g.xs[i]))
      cross.style.display = ''
    }
    if (e.kind === 'trend') showTip(c, trendTipHtml(e.o, i), g.ml + g.xs[i], my, 'line')
    else showTip(c, multiTipHtml(e, i), g.ml + g.xs[i], my, 'line')
    return
  }
  if (e.kind === 'hbar' || e.kind === 'hbarInside') {
    const row = target?.closest<SVGElement>('[data-row]')
    const r = row ? e.o.rows.find((x) => x.id === row.getAttribute('data-row')) : undefined
    if (!r) return hideTip(c)
    showTip(c, chartTip(esc(r.label), r.hint ?? esc(r.valueLabel ?? '')), mx, my, 'free')
    return
  }
  if (e.kind === 'donut') {
    const sl = target?.closest<SVGElement>('[data-slice]')
    const s = sl ? e.o.slices[Number(sl.getAttribute('data-slice'))] : undefined
    if (!s || !e.o.label) return hideTip(c)
    showTip(c, chartTip(esc(s.label ?? s.id), e.o.label({ id: s.id, value: s.value })), mx, my, 'free')
  }
}

function onOut(ev: MouseEvent) {
  if (handled.has(ev)) return
  const c = (ev.target as Element | null)?.closest<HTMLElement>('[data-chart]')
  if (!c) return
  handled.add(ev)
  if (ev.relatedTarget instanceof Node && c.contains(ev.relatedTarget)) return
  hideTip(c)
  hideCross(c)
}

function onClick(ev: MouseEvent) {
  if (handled.has(ev)) return
  const a = (ev.target as Element | null)?.closest<SVGElement>('[data-href]')
  if (!a) return
  handled.add(ev)
  window.open(a.getAttribute('data-href') as string, '_blank', 'noopener,noreferrer')
}

/** Wire hover tooltips / crosshairs and size the responsive charts inside `root`. Safe to call again after re-rendering a sub-part. */
export function mount(root: ParentNode): void {
  if (!wiredRoots.has(root)) {
    wiredRoots.add(root)
    root.addEventListener('mousemove', onMove as EventListener)
    root.addEventListener('mouseout', onOut as EventListener)
    root.addEventListener('click', onClick as EventListener)
  }
  root.querySelectorAll<HTMLElement>('[data-chart]').forEach((el) => {
    if (el.dataset.wired) return
    el.dataset.wired = '1'
    const e = registry.get(el.dataset.chart as string)
    if (!e || e.kind === 'donut') return
    paint(el)
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => paint(el)).observe(el)
  })
}

/** `<Ring>`: gauge with the app's accent colours; `center` (trusted HTML) sits in the middle. */
export function ring(o: { value: number | null; size?: number; color?: string; track?: string; center?: string }): string {
  return gauge({ value: o.value, size: o.size ?? 132, color: o.color, track: o.track, center: o.center })
}

/** `<AreaSpark>`: area sparkline, h-10 by default. */
export function areaSpark(values: Array<number | null>, o: { color?: string; cls?: string; lowerIsBetter?: boolean } = {}): string {
  return spark({ values, color: o.color, lowerIsBetter: o.lowerIsBetter, cls: o.cls ?? 'h-10' })
}
