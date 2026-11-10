/*
 * Fictional `/api/geo/prompt-detail` response (shape of `PromptDetailResponse` in the real app's prompt-detail-page.tsx),
 * derived from `allPrompts` so the popup, the full page and the Prompts / Engines tables always agree.
 */
import { BRAND, dates, ENGINES, RIVALS, type DomainType, type PromptStatus } from './data'
import { allPrompts } from './prompts-data'

export interface PromptDetailRun { run_id: number; ts: string; cited: boolean; rank: number | null }
export interface PromptDetailResponse {
  own?: { label: string; name: string; roots: string[] }
  cluster: { slug: string; name: string }
  prompt: string
  intent: string
  status: PromptStatus
  stats: {
    cited_pct: number | null; cited_answers: number; answers: number; position: number | null; prev_position: number | null; position_delta: number | null
    last_known_position: number | null; your_share: number | null; owns_answer: { domain: string; pct: number; is_you: boolean } | null
  }
  engines_in_range: string[]
  why_losing: string[]
  suggested_fix: { headline: string; detail: string; target_domains: string[] } | null
  domain_breakdown: Array<{ domain: string; citations: number; urls: number; pct: number; is_you: boolean; is_competitor: boolean; type: DomainType }>
  position_history: { from: number | null; to: number | null }
  related_prompts: Array<{ prompt: string; citation_rate: number; current_rank: number | null; rank_change: number | null; rank_trend: string }>
  model_results: Array<{
    engine: string; in_range?: boolean; answers: number; cited_answers: number; citation_rate: number | null; latest_rank: number | null
    top_source: { domain: string; pct: number } | null; status: PromptStatus; runs: PromptDetailRun[]
  }>
}

const THIRD: Array<[string, DomainType]> = [['github.com', 'Platform'], ['dev.to', 'Publisher'], ['medium.com', 'Publisher'], ['reddit.com', 'Social'], ['g2.com', 'Review']]
const hash = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }
const statusOf = (rank: number | null, prev: number | null): PromptStatus => (rank == null ? (prev != null ? 'dropped' : 'missing') : rank === 1 ? 'owned' : 'weak')

export function promptDetail(clusterSlug: string, prompt: string): PromptDetailResponse {
  const p = allPrompts.find((x) => x.cluster_slug === clusterSlug && x.prompt === prompt) ?? allPrompts[0]
  const seed = hash(p.prompt)
  const total = Math.max(24, p.total_cites || 0)

  const weights: Array<{ domain: string; w: number; type: DomainType; you: boolean; comp: boolean }> = []
  if (p.own_cites > 0) weights.push({ domain: BRAND.domain, w: p.your_share ?? 20, type: 'You', you: true, comp: false })
  for (const d of p.domain_shares) if (!d.is_you) weights.push({ domain: d.domain, w: d.pct, type: 'Competitor', you: false, comp: true })
  if (p.most_cited_domain && !weights.some((x) => x.domain === p.most_cited_domain!.domain)) weights.push({ domain: p.most_cited_domain.domain, w: p.most_cited_domain.pct, type: p.most_cited_domain.is_you ? 'You' : RIVALS.includes(p.most_cited_domain.domain) ? 'Competitor' : 'Platform', you: p.most_cited_domain.is_you, comp: RIVALS.includes(p.most_cited_domain.domain) })
  THIRD.forEach(([domain, type], i) => { if (!weights.some((x) => x.domain === domain)) weights.push({ domain, w: 12 - i * 2 + (seed % 3), type, you: false, comp: false }) })
  const wsum = weights.reduce((a, b) => a + b.w, 0)
  const domain_breakdown = weights.map((x) => {
    const citations = Math.max(1, Math.round((x.w / wsum) * total))
    return { domain: x.domain, citations, urls: Math.max(1, Math.round(citations / (x.you ? 2.2 : 3.4))), pct: Math.round((x.w / wsum) * 100), is_you: x.you, is_competitor: x.comp, type: x.type }
  }).sort((a, b) => b.citations - a.citations).slice(0, 8)

  const last = dates.length - 1
  let runId = 4100 + (seed % 800)
  const model_results = ENGINES.map((engine, k) => {
    const be = p.by_engine.find((b) => b.engine === engine)!
    const runs: PromptDetailRun[] = Array.from({ length: 10 }, (_, i) => {
      const cited = i === 0 ? be.rank != null : be.rank != null && (seed + i * 5 + k * 3) % 7 !== 0
      const rank = cited ? Math.max(1, (be.rank ?? 1) + (((seed >> 3) + i + k) % 3) - 1) : null
      return { run_id: runId++, ts: `${dates[last - i]}T09:12:00Z`, cited, rank: i === 0 ? be.rank : rank }
    })
    const lead = p.most_cited_domain ?? { domain: 'github.com', pct: 30 }
    return {
      engine, in_range: true, answers: be.answers, cited_answers: be.cited_answers, citation_rate: be.citation_rate, latest_rank: be.rank,
      top_source: { domain: lead.domain, pct: Math.max(8, Math.round(lead.pct - k * 2)) }, status: statusOf(be.rank, p.prev_rank), runs,
    }
  })

  const rival = p.domain_shares.find((d) => !d.is_you)?.domain ?? 'spanlight.io'
  const why_losing = p.status === 'owned' ? [] : p.status === 'weak'
    ? [`${p.most_cited_domain?.domain ?? rival} gets ${p.most_cited_domain?.pct ?? 30}% of the citations for this prompt; you get ${p.your_share ?? 0}%.`, 'The engines quote a comparison table and pricing detail that your page for this topic does not have.', `You are cited, but behind ${p.current_rank != null ? p.current_rank - 1 : 1} other brand${p.current_rank === 2 ? '' : 's'} in the answer.`]
    : p.status === 'dropped'
      ? [`You were cited at #${p.prev_rank} in an earlier scan and are not in the latest answer.`, `${rival} now fills the slot you held.`, 'No page of yours was updated in this window.']
      : [`No page of yours is cited for this prompt in the selected dates.`, `${p.most_cited_domain?.domain ?? rival} is cited most often (${p.most_cited_domain?.pct ?? 30}%).`, 'You have no page that answers this question directly.']
  const suggested_fix = p.status === 'owned' ? null : {
    headline: p.status === 'weak' ? 'Add the comparison and pricing detail the answers quote' : 'Publish a page that answers this prompt directly',
    detail: p.status === 'weak' ? `Update your page for “${p.prompt}” with a side-by-side table and a pricing section, then re-run the scan.` : `Write a focused page for “${p.prompt}”, link it from your docs, and get it listed where the engines already look.`,
    target_domains: [p.most_cited_domain?.domain ?? rival, 'g2.com'].filter((d, i, a) => a.indexOf(d) === i && d !== BRAND.domain),
  }

  return {
    own: { label: BRAND.domain, name: BRAND.name, roots: [BRAND.domain] },
    cluster: { slug: p.cluster_slug, name: p.cluster }, prompt: p.prompt, intent: p.intent, status: p.status,
    stats: {
      cited_pct: p.citation_rate, cited_answers: p.cited_answers, answers: p.answers, position: p.current_rank, prev_position: p.prev_rank, position_delta: p.rank_delta,
      last_known_position: p.last_known_rank, your_share: p.your_share && p.your_share > 0 ? p.your_share : null, owns_answer: p.most_cited_domain,
    },
    engines_in_range: [...ENGINES], why_losing, suggested_fix, domain_breakdown,
    position_history: { from: p.prev_rank, to: p.current_rank },
    related_prompts: allPrompts.filter((x) => x.cluster_slug === p.cluster_slug).map((x) => ({ prompt: x.prompt, citation_rate: x.citation_rate ?? 0, current_rank: x.current_rank, rank_change: x.rank_delta, rank_trend: x.rank_delta == null ? 'flat' : x.rank_delta > 0 ? 'up' : x.rank_delta < 0 ? 'down' : 'flat' })),
    model_results,
  }
}
