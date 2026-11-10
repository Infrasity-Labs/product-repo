/**
 * Port of main's `src/lib/geo-stats.ts`: how much a citation rate could move by chance, and whether a change between two
 * periods is bigger than that. Rates are percentages (0-100); counts are answers checked.
 */

/** Half-width of the 95% interval around a rate measured on `n` answers, in percentage points. null when n is 0. */
export function marginOfError(cited: number, n: number): number | null {
  if (!(n > 0)) return null
  const p = Math.min(1, Math.max(0, cited / n))
  return Math.round(1.96 * Math.sqrt((p * (1 - p)) / n) * 1000) / 10
}

/**
 * Two-proportion z-test between this period and the one before it. true = the change is larger than sampling noise
 * (|z| >= 1.96, i.e. 95%); false = within noise; null = not enough answers in either period to say.
 */
export function isRealChange(curCited: number, curN: number, prevCited: number, prevN: number, minN = 10): boolean | null {
  if (curN < minN || prevN < minN) return null
  const p1 = curCited / curN
  const p2 = prevCited / prevN
  const pooled = (curCited + prevCited) / (curN + prevN)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / curN + 1 / prevN))
  if (se === 0) return p1 !== p2
  return Math.abs((p1 - p2) / se) >= 1.96
}
