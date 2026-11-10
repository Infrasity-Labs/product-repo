/* Pure helpers ported from the app: lib/geo-citation-summary.ts and lib/geo-stats.ts. */
export interface DayPoint { date: string; answers: number; rate: number | null; position?: number | null }
export interface Segment { state: 'cited' | 'not_cited'; from: string; to: string; days: number }
export type Verdict = 'improving' | 'declining' | 'steady' | 'never_cited' | 'always_cited' | 'no_data'
const round1 = (n: number) => Math.round(n * 10) / 10
function weighted(points: DayPoint[], pick: (p: DayPoint) => number | null | undefined): number | null {
  let sum = 0, w = 0
  for (const p of points) {
    const v = pick(p)
    if (v == null) continue
    const weight = Math.max(1, p.answers)
    sum += v * weight; w += weight
  }
  return w ? sum / w : null
}
/** Port of `summarizeCitations` (src/lib/geo-citation-summary.ts). */
export function summarize(input: DayPoint[]) {
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
    trackedDays: pts.length, citedDays: cited.length, firstCited: cited[0]?.date ?? null, lastCited: cited[cited.length - 1]?.date ?? null,
    segments, longestGap, startRate: startRate == null ? null : round1(startRate), endRate: endRate == null ? null : round1(endRate), change, positionChange, verdict,
  }
}

/** Half-width of the 95% interval around a rate measured on `n` answers, in percentage points. */
export function marginOfError(cited: number, n: number): number | null {
  if (!(n > 0)) return null
  const p = Math.min(1, Math.max(0, cited / n))
  return Math.round(1.96 * Math.sqrt((p * (1 - p)) / n) * 1000) / 10
}

/** Two-proportion z-test against the previous period: true = real change, false = within noise, null = too few answers. */
export function isRealChange(curCited: number, curN: number, prevCited: number, prevN: number, minN = 10): boolean | null {
  if (curN < minN || prevN < minN) return null
  const p1 = curCited / curN
  const p2 = prevCited / prevN
  const pooled = (curCited + prevCited) / (curN + prevN)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / curN + 1 / prevN))
  if (se === 0) return p1 !== p2
  return Math.abs((p1 - p2) / se) >= 1.96
}
