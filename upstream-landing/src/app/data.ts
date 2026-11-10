/*
 * Sample data for the fictional brand "Tracewell" (a developer-tools company), shaped like the real app's
 * `GeoOverviewData` / `PromptRow` types (content-repo `src/lib/geo-overview.ts`) so page replicas can be ported 1:1.
 * Every number is illustrative. All product-UI replicas read from here so the whole page tells one consistent story.
 */
export type DomainType = 'You' | 'Competitor' | 'Publisher' | 'Social' | 'Review' | 'Platform' | 'Education' | 'Other'
export type ClusterStatus = 'leading' | 'growing' | 'low' | 'check_target' | 'no_data'
export type PromptStatus = 'missing' | 'dropped' | 'weak' | 'owned'
export type Intent = 'pricing' | 'comparison' | 'roi' | 'howto' | 'list' | 'other'

export const BRAND = { name: 'Tracewell', domain: 'tracewell.dev', company: 'tracewell' }
export const RIVALS = ['spanlight.io', 'lumenlace.com', 'evalkit.dev', 'promptgrid.ai']
export const ENGINES = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'] as const
/** Every engine the app can track (main's `GEO_ENGINES`); this sample workspace only has the first four. */
export const GEO_ENGINES = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Google AI Overview', 'Copilot', 'Grok'] as const

/** 30 daily points ending "today"; deterministic so renders are stable. */
export const DAYS = 30
const wobble = (i: number, k: number) => Math.sin(i * 1.7 + k) * 0.9 + Math.cos(i * 0.6 + k * 2) * 0.6
export const dates = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 8 + i))
  return d.toISOString().slice(0, 10)
})
const series = (from: number, to: number, k: number, amp = 1.6) =>
  Array.from({ length: DAYS }, (_, i) => Math.round((from + ((to - from) * i) / (DAYS - 1) + wobble(i, k) * amp) * 10) / 10)

export interface TrendPoint { date: string; answers: number; rate: number | null; sov: number | null; avg_position: number | null; sov_brands: Array<{ domain: string; own: boolean; pct: number }> }
const rate = series(31, 46.8, 1)
const sov = series(14, 21.4, 2, 0.8)
const pos = series(3.9, 2.6, 3, 0.25)
export const trend: TrendPoint[] = dates.map((date, i) => ({
  date, answers: 118 + Math.round(wobble(i, 4) * 8), rate: rate[i], sov: sov[i], avg_position: pos[i],
  sov_brands: [
    { domain: BRAND.domain, own: true, pct: sov[i] },
    { domain: 'spanlight.io', own: false, pct: 17.9 }, { domain: 'lumenlace.com', own: false, pct: 12.4 },
    { domain: 'evalkit.dev', own: false, pct: 8.8 }, { domain: 'promptgrid.ai', own: false, pct: 6.1 },
  ],
}))

export const kpis = {
  citation_rate: 46.8, citation_rate_delta: 5.2, cited_answers: 1684, answers: 3598, prev_answers: 3412, prev_cited_answers: 1420,
  share_of_voice: 21.4, sov_rank: 2, sov_domains: 143,
  avg_position: 2.6, avg_position_best: 1,
  prompts_up: 14, prompts_down: 3, prompts_tracked: 52, active_clusters: 5, total_clusters: 6, engines: 4,
}

export interface Cluster {
  id: string; slug: string; name: string; tracked: boolean; enabled: boolean; prompts: number; engines: number; runs: number
  last_run: string; answers: number; cited_answers: number; citation_rate: number; citation_rate_delta: number
  share_of_voice: number; sov_rank: number; avg_position: number; top_rival: { domain: string; pct: number } | null
  trend: number[]; status: ClusterStatus; note: string | null
  /** Answers / cited answers in the period before this one (lets the UI tell a real change from noise). */
  prev_answers: number; prev_cited_answers: number
}
const clustersRaw: Array<Omit<Cluster, 'prev_answers' | 'prev_cited_answers'>> = [
  { id: 'c1', slug: 'llm-observability', name: 'LLM observability', tracked: true, enabled: true, prompts: 14, engines: 4, runs: 56, last_run: '2026-11-06 09:12', answers: 986, cited_answers: 611, citation_rate: 62, citation_rate_delta: 6.4, share_of_voice: 29.8, sov_rank: 1, avg_position: 1.8, top_rival: { domain: 'spanlight.io', pct: 18.2 }, trend: series(51, 62, 5), status: 'leading', note: null },
  { id: 'c2', slug: 'tracing-sdks', name: 'Tracing SDKs', tracked: true, enabled: true, prompts: 12, engines: 4, runs: 48, last_run: '2026-11-06 09:12', answers: 842, cited_answers: 412, citation_rate: 49, citation_rate_delta: 4.1, share_of_voice: 22.6, sov_rank: 2, avg_position: 2.4, top_rival: { domain: 'spanlight.io', pct: 24.1 }, trend: series(41, 49, 6), status: 'growing', note: null },
  { id: 'c3', slug: 'agent-evals', name: 'AI agent evals', tracked: true, enabled: true, prompts: 10, engines: 4, runs: 40, last_run: '2026-11-06 09:12', answers: 702, cited_answers: 288, citation_rate: 41, citation_rate_delta: 2.8, share_of_voice: 17.3, sov_rank: 3, avg_position: 3.1, top_rival: { domain: 'evalkit.dev', pct: 21.7 }, trend: series(36, 41, 7), status: 'growing', note: null },
  { id: 'c4', slug: 'prompt-management', name: 'Prompt management', tracked: true, enabled: true, prompts: 9, engines: 4, runs: 36, last_run: '2026-11-05 22:40', answers: 630, cited_answers: 189, citation_rate: 30, citation_rate_delta: -1.9, share_of_voice: 11.2, sov_rank: 4, avg_position: 3.8, top_rival: { domain: 'promptgrid.ai', pct: 26.3 }, trend: series(33, 30, 8), status: 'low', note: null },
  { id: 'c5', slug: 'alternatives', name: 'Alternatives and comparisons', tracked: true, enabled: true, prompts: 7, engines: 4, runs: 28, last_run: '2026-11-06 09:12', answers: 438, cited_answers: 184, citation_rate: 42, citation_rate_delta: 3.3, share_of_voice: 18.9, sov_rank: 2, avg_position: 2.9, top_rival: { domain: 'lumenlace.com', pct: 19.4 }, trend: series(37, 42, 9), status: 'growing', note: null },
  { id: 'c6', slug: 'rag-monitoring', name: 'RAG monitoring', tracked: false, enabled: false, prompts: 0, engines: 0, runs: 0, last_run: '', answers: 0, cited_answers: 0, citation_rate: 0, citation_rate_delta: 0, share_of_voice: 0, sov_rank: 0, avg_position: 0, top_rival: null, trend: [], status: 'no_data', note: 'Switch on to start scanning' },
]
export const clusters: Cluster[] = clustersRaw.map((c) => {
  const prevRate = c.citation_rate - c.citation_rate_delta
  const prev_answers = Math.round(c.answers * 0.95)
  return { ...c, prev_answers, prev_cited_answers: Math.round((prev_answers * prevRate) / 100) }
})

export const headline =
  'Tracewell is cited in 46.8% of AI answers, up 5.2 pts on the previous 30 days, and holds #2 share of voice at 21.4%. LLM observability is your strongest cluster; Prompt management needs the most work.'

export const domains: Array<{ domain: string; type: DomainType; pct: number; citations: number }> = [
  { domain: 'tracewell.dev', type: 'You', pct: 21.4, citations: 722 },
  { domain: 'spanlight.io', type: 'Competitor', pct: 17.9, citations: 604 },
  { domain: 'github.com', type: 'Platform', pct: 12.6, citations: 425 },
  { domain: 'reddit.com', type: 'Social', pct: 9.8, citations: 331 },
  { domain: 'lumenlace.com', type: 'Competitor', pct: 8.4, citations: 283 },
  { domain: 'dev.to', type: 'Publisher', pct: 6.7, citations: 226 },
  { domain: 'medium.com', type: 'Publisher', pct: 5.1, citations: 172 },
  { domain: 'g2.com', type: 'Review', pct: 3.9, citations: 131 },
  { domain: 'stackoverflow.com', type: 'Platform', pct: 3.2, citations: 108 },
  { domain: 'news.ycombinator.com', type: 'Social', pct: 2.6, citations: 88 },
]

export const domainTypes: Array<{ type: DomainType; citations: number; pct: number }> = [
  { type: 'You', citations: 722, pct: 21.4 }, { type: 'Competitor', citations: 1031, pct: 30.6 }, { type: 'Platform', citations: 612, pct: 18.2 },
  { type: 'Publisher', citations: 498, pct: 14.8 }, { type: 'Social', citations: 419, pct: 12.4 }, { type: 'Review', citations: 131, pct: 3.9 }, { type: 'Other', citations: 57, pct: 1.7 },
]

export const moved = {
  gained: [
    { cluster: 'LLM observability', cluster_slug: 'llm-observability', prompt: 'best llm observability tool for startups', from: 3, to: 1 },
    { cluster: 'Tracing SDKs', cluster_slug: 'tracing-sdks', prompt: 'open source tracing sdk for node', from: 5, to: 2 },
    { cluster: 'AI agent evals', cluster_slug: 'agent-evals', prompt: 'how to evaluate ai agents in production', from: null, to: 4 },
  ],
  dropped: [
    { cluster: 'Prompt management', cluster_slug: 'prompt-management', prompt: 'prompt versioning tools compared', from: 2, to: 5 },
    { cluster: 'Prompt management', cluster_slug: 'prompt-management', prompt: 'best prompt registry for teams', from: 3, to: null },
  ],
  never: [
    { cluster: 'Alternatives and comparisons', cluster_slug: 'alternatives', prompt: 'langsmith alternatives', answers: 36 },
    { cluster: 'Prompt management', cluster_slug: 'prompt-management', prompt: 'monitor prompt drift', answers: 28 },
  ],
  gained_total: 14, dropped_total: 3, never_total: 6,
}

export const actions = [
  { id: 'a1', type: 'content_brief', title: 'Publish a Tracewell vs Spanlight comparison page', detail: 'Spanlight is cited instead of you on 9 comparison prompts. Engines quote comparison pages 3× more often than docs.', prompts: 9, cta: 'Open brief', href: '#', tags: ['Alternatives and comparisons'] },
  { id: 'a2', type: 'data_fix', title: 'Fix the stale “4 SDKs” claim on your SDK overview', detail: 'Two engines say Tracewell ships 4 SDKs. The knowledge base lists 12.', prompts: 5, cta: 'Review fix', href: '#', tags: ['Tracing SDKs'] },
  { id: 'a3', type: 'distribution', title: 'Answer the r/webdev thread on LLM observability', detail: 'The thread is quoted in 14 answers and has no Tracewell reply.', prompts: 14, cta: 'Draft reply', href: '#', tags: ['LLM observability'] },
]

export const topPages = [
  { path: '/docs/sdk/overview', url: 'https://tracewell.dev/docs/sdk/overview', citations: 168, avg_position: 1.6 },
  { path: '/blog/llm-observability-guide', url: 'https://tracewell.dev/blog/llm-observability-guide', citations: 131, avg_position: 1.9 },
  { path: '/docs/quickstart', url: 'https://tracewell.dev/docs/quickstart', citations: 104, avg_position: 2.2 },
  { path: '/compare/spanlight', url: 'https://tracewell.dev/compare/spanlight', citations: 77, avg_position: 3.4 },
  { path: '/pricing', url: 'https://tracewell.dev/pricing', citations: 49, avg_position: 4.1 },
]

export const ownedVsThird = { own: 722, others: 2650, own_pct: 21.4, formats: [{ format: 'Docs', count: 330 }, { format: 'Blog posts', count: 241 }, { format: 'Comparison pages', count: 96 }, { format: 'Pricing', count: 55 }] }

export const engineRows = [
  { engine: 'ChatGPT', answers: 1004, citation_rate: 52.1, top_source: { domain: 'github.com', pct: 14.2 }, top_own_page_type: 'Docs' },
  { engine: 'Perplexity', answers: 921, citation_rate: 49.6, top_source: { domain: 'reddit.com', pct: 13.1 }, top_own_page_type: 'Blog posts' },
  { engine: 'Claude', answers: 868, citation_rate: 44.3, top_source: { domain: 'github.com', pct: 15.4 }, top_own_page_type: 'Docs' },
  { engine: 'Gemini', answers: 805, citation_rate: 39.7, top_source: { domain: 'dev.to', pct: 9.6 }, top_own_page_type: 'Comparison pages' },
]

/** Citation rate per day per engine (for the multi-line chart). */
export const engineTrend = [
  { engine: 'ChatGPT', points: series(44, 52.1, 11).map((y, i) => ({ date: dates[i], answers: 34, rate: y })) },
  { engine: 'Perplexity', points: series(40, 49.6, 12).map((y, i) => ({ date: dates[i], answers: 31, rate: y })) },
  { engine: 'Claude', points: series(36, 44.3, 13).map((y, i) => ({ date: dates[i], answers: 29, rate: y })) },
  { engine: 'Gemini', points: series(31, 39.7, 14).map((y, i) => ({ date: dates[i], answers: 27, rate: y })) },
]

export interface PromptRow {
  prompt: string; cluster: string; cluster_slug: string; intent: Intent; answers: number; cited_answers: number; citation_rate: number | null
  your_share: number | null; own_cites: number; total_cites: number; current_rank: number | null; prev_rank: number | null; rank_delta: number | null
  last_known_rank: number | null; most_cited_domain: { domain: string; pct: number; is_you: boolean } | null; top_source: { url: string; domain: string } | null
  by_engine: Array<{ engine: string; answers: number; cited_answers: number; citation_rate: number | null; rank: number | null }>
  domain_shares: Array<{ domain: string; pct: number; is_you: boolean }>; status: PromptStatus
}
function row(prompt: string, cluster: string, slug: string, intent: Intent, rate: number, cur: number | null, prev: number | null, ranks: Array<number | null>, lead: [string, number, boolean], src: [string, string]): PromptRow {
  const answers = 28
  const cited = Math.round((rate / 100) * answers)
  const status: PromptStatus = cur == null ? (prev != null ? 'dropped' : 'missing') : cur === 1 ? 'owned' : 'weak'
  return {
    prompt, cluster, cluster_slug: slug, intent, answers, cited_answers: cited, citation_rate: rate, your_share: rate * 0.45, own_cites: cited, total_cites: Math.round(cited / 0.45),
    current_rank: cur, prev_rank: prev, rank_delta: cur != null && prev != null ? prev - cur : null, last_known_rank: cur ?? prev,
    most_cited_domain: { domain: lead[0], pct: lead[1], is_you: lead[2] }, top_source: { url: `https://${src[0]}${src[1]}`, domain: src[0] },
    by_engine: ENGINES.map((engine, i) => ({ engine, answers: 7, cited_answers: ranks[i] == null ? 0 : Math.max(1, Math.round(rate / 100 * 7)), citation_rate: ranks[i] == null ? 0 : rate, rank: ranks[i] })),
    domain_shares: [{ domain: BRAND.domain, pct: rate * 0.45, is_you: true }, { domain: 'spanlight.io', pct: 24, is_you: false }, { domain: 'lumenlace.com', pct: 14, is_you: false }, { domain: 'evalkit.dev', pct: 9, is_you: false }],
    status,
  }
}
export const prompts: PromptRow[] = [
  row('best llm observability tool for startups', 'LLM observability', 'llm-observability', 'list', 71, 1, 3, [1, 1, 2, 1], ['tracewell.dev', 31, true], ['tracewell.dev', '/blog/llm-observability-guide']),
  row('how to trace ai agents in production', 'LLM observability', 'llm-observability', 'howto', 64, 2, 2, [2, 1, 3, 2], ['spanlight.io', 28, false], ['github.com', '/tracewell/sdk-js']),
  row('open source tracing sdk for node', 'Tracing SDKs', 'tracing-sdks', 'list', 57, 2, 5, [1, 3, 2, 4], ['github.com', 33, false], ['github.com', '/tracewell/sdk-js']),
  row('tracewell vs spanlight', 'Alternatives and comparisons', 'alternatives', 'comparison', 46, 3, 3, [3, 2, 4, 3], ['spanlight.io', 36, false], ['tracewell.dev', '/compare/spanlight']),
  row('how to evaluate ai agents in production', 'AI agent evals', 'agent-evals', 'howto', 43, 4, null, [null, 4, 3, 5], ['evalkit.dev', 30, false], ['dev.to', '/evalkit/agent-evals-101']),
  row('prompt versioning tools compared', 'Prompt management', 'prompt-management', 'comparison', 29, 5, 2, [4, null, 5, 6], ['promptgrid.ai', 34, false], ['medium.com', '/p/prompt-versioning-tools']),
  row('best prompt registry for teams', 'Prompt management', 'prompt-management', 'list', 14, null, 3, [null, null, null, null], ['promptgrid.ai', 39, false], ['g2.com', '/categories/prompt-management']),
  row('langsmith alternatives', 'Alternatives and comparisons', 'alternatives', 'comparison', 0, null, null, [null, null, null, null], ['lumenlace.com', 33, false], ['reddit.com', '/r/LangChain/comments/langsmith_alternatives']),
  row('monitor prompt drift', 'Prompt management', 'prompt-management', 'howto', 0, null, null, [null, null, null, null], ['promptgrid.ai', 41, false], ['dev.to', '/promptgrid/prompt-drift']),
  row('otel sdk for llm apps', 'Tracing SDKs', 'tracing-sdks', 'howto', 62, 1, 1, [1, 1, 1, 2], ['tracewell.dev', 38, true], ['tracewell.dev', '/docs/sdk/overview']),
]

export const redditThreads = [
  { sub: 'r/webdev', title: 'What are you using for LLM observability in 2026?', cites: 14, you_replied: false },
  { sub: 'r/devops', title: 'Tracing SDK comparison, honest takes', cites: 11, you_replied: false },
  { sub: 'r/programming', title: 'Open source tools for monitoring AI agents', cites: 8, you_replied: true },
  { sub: 'r/SaaS', title: 'How do you get recommended by ChatGPT?', cites: 6, you_replied: false },
]

/** A prompt configured on a cluster that is not being scanned (tracking off), so it has no results yet. */
export interface UnscannedPrompt { prompt: string; cluster: string; cluster_slug: string; intent: Intent; reason: 'tracking_off' }
export const unscannedPrompts: UnscannedPrompt[] = [
  { prompt: 'how to monitor rag pipelines', cluster: 'RAG monitoring', cluster_slug: 'rag-monitoring', intent: 'howto', reason: 'tracking_off' },
  { prompt: 'best rag observability tools', cluster: 'RAG monitoring', cluster_slug: 'rag-monitoring', intent: 'list', reason: 'tracking_off' },
  { prompt: 'tracewell rag monitoring pricing', cluster: 'RAG monitoring', cluster_slug: 'rag-monitoring', intent: 'pricing', reason: 'tracking_off' },
]
