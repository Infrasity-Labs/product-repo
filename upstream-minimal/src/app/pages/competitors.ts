/*
 * Competitors. On main the /competitors route renders `SourcesPage initialTab="competitors"` (the old standalone
 * `competitors-page.tsx` is no longer mounted), so this page is the Sources page opened on its Competitors tab (stat strip,
 * share-of-voice trend, head to head, rivals by cluster, alerts, "Who owns the answers" leaderboard, new domains).
 * Reusable: `competitorsCard()` is the leaderboard on its own, wired by `mountCompetitorsCard`.
 */
import { wirePager } from '../dash-parts'
import { openManageCompetitors } from '../sources-manage'
import { activeClusters, competitorLists, leaderboard, scopedPrompts } from '../sources-overview-data'
import { leaderboardTable } from '../sources-sections'
import * as sources from './sources'

export const meta = { id: 'competitors', label: 'Competitors', icon: 'RiGroupLine', order: 25, hidden: true }

export const html = (params?: Record<string, string>): string => sources.html({ ...params, tab: 'competitors' })
export const mount = (root: HTMLElement, params?: Record<string, string>): void => sources.mount(root, { ...params, tab: 'competitors' })

/* ------------------------------------------------------------------ the leaderboard card (default scope: all clusters) */
interface CardState { page: number; rival: string | null }

const draw = (s: CardState) => leaderboardTable({ rows: leaderboard('all', scopedPrompts('all')), page: s.page, tagBusy: null, rival: s.rival })

/** The "Who owns the answers" leaderboard on its own. Wire with `mountCompetitorsCard`. */
export function competitorsCard(): string {
  return `<div data-comp-card>${draw({ page: 1, rival: null })}</div>`
}

/** Wire the standalone `competitorsCard()` (tag / compare toggles re-render the card). */
export function mountCompetitorsCard(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-comp-card]').forEach((host) => {
    const s: CardState = { page: 1, rival: null }
    const redraw = () => { host.innerHTML = draw(s) }
    wirePager(host, 'lb', (p) => { s.page = p; redraw() })
    host.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      const tag = t.closest<HTMLElement>('[data-lb-tag]')
      if (tag) {
        const domain = tag.dataset.lbTag as string
        const on = tag.dataset.on === 'true'
        for (const c of activeClusters) competitorLists[c.slug] = on ? Array.from(new Set([...competitorLists[c.slug], domain])) : competitorLists[c.slug].filter((x) => x !== domain)
        redraw()
        return
      }
      const cmp = t.closest<HTMLElement>('[data-lb-compare]')
      if (cmp) { s.rival = cmp.dataset.lbCompare as string; redraw(); return }
      if (t.closest('[data-manage]')) openManageCompetitors('all', redraw)
    })
  })
}
