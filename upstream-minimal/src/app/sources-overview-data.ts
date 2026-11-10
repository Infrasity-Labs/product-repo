/*
 * Competitors-tab data of the Sources page (fictional, Tracewell). Shaped like content-repo `GeoOverviewData`
 * (`domains`, `new_domains`, `clusters[].top_rival/competitors`, `issues`) and consistent with `data.ts`.
 */
import { clusters, domains, prompts } from './data'
import type { DomainType, PromptRow } from './data'

/** Domains that entered the answers this window but barely the one before. */
export const newDomains: Array<{ domain: string; type: DomainType; citations: number; prompts: number }> = [
  { domain: 'tracebook.io', type: 'Other', citations: 64, prompts: 6 },
  { domain: 'hackernoon.com', type: 'Publisher', citations: 41, prompts: 4 },
  { domain: 'observability.guide', type: 'Education', citations: 33, prompts: 3 },
  { domain: 'trustradius.com', type: 'Review', citations: 27, prompts: 3 },
]

export const activeClusters = clusters.filter((c) => c.tracked && c.enabled)

/** Competitor domains tagged per cluster (what "Tracked" / "Tag as competitor" edits). Mutable on purpose. */
export const competitorLists: Record<string, string[]> = Object.fromEntries(
  activeClusters.map((c) => [c.slug, Array.from(new Set(['spanlight.io', 'lumenlace.com', ...(c.top_rival ? [c.top_rival.domain] : [])]))]),
)

export const isTagged = (domain: string, scope: string) =>
  scope === 'all' ? Object.values(competitorLists).some((l) => l.includes(domain)) : (competitorLists[scope] ?? []).includes(domain)

export interface LeaderRow { domain: string; type: DomainType; pct: number; citations: number; promptsTopped: number }

export function leaderboard(scope: string, scoped: PromptRow[]): LeaderRow[] {
  const topped = new Map<string, number>()
  for (const p of scoped) if (p.most_cited_domain) topped.set(p.most_cited_domain.domain, (topped.get(p.most_cited_domain.domain) ?? 0) + 1)
  return domains.map((d) => {
    const type: DomainType = d.type === 'You' ? 'You' : isTagged(d.domain, scope) ? 'Competitor' : d.type === 'Competitor' ? 'Other' : d.type
    return { ...d, type, promptsTopped: topped.get(d.domain) ?? 0 }
  })
}

export const scopedPrompts = (scope: string) => (scope === 'all' ? prompts : prompts.filter((p) => p.cluster_slug === scope))

/** The "url_variants" scan issue shown under the Your pages tab. */
export const urlVariantsNote = '3 of your pages were cited under more than one URL (www and utm variants). Their citations are merged on this page.'
