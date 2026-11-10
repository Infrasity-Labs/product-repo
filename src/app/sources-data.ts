/*
 * Domains page data (fictional, Tracewell). Shaped like content-repo `src/lib/geo-domains.ts`
 * (`DomainTableRow`, `UrlTableRow`, `DomainMoverItem`, `ListingGapRow`) and consistent with `data.domains`.
 */
import type { DomainType } from './data'
import { BRAND } from './data'

export interface DomainTableRow {
  domain: string; type: DomainType; is_you: boolean; citation_count: number; citation_change: number | null
  in_answers_pct: number; prompts: number; avg_position: number | null
}
export interface UrlTableRow extends DomainTableRow { url: string; path: string }
export interface DomainMoverItem { domain: string; type: DomainType; citation_count: number; change: number | null }
export interface ListingGapRow { url: string; type: DomainType; lists: string[]; missing_you_in: number }

const d = (domain: string, type: DomainType, citation_count: number, citation_change: number | null, in_answers_pct: number, prompts: number, avg_position: number | null): DomainTableRow =>
  ({ domain, type, is_you: domain === BRAND.domain, citation_count, citation_change, in_answers_pct, prompts, avg_position })

export const domainTable: DomainTableRow[] = [
  d('tracewell.dev', 'You', 722, 94, 46.8, 41, 2.6),
  d('spanlight.io', 'Competitor', 604, 38, 39.2, 37, 2.9),
  d('github.com', 'Platform', 425, 21, 31.4, 33, 3.1),
  d('reddit.com', 'Social', 331, 47, 24.7, 29, 3.8),
  d('lumenlace.com', 'Competitor', 283, -12, 22.1, 26, 3.4),
  d('dev.to', 'Publisher', 226, 18, 18.9, 24, 4.2),
  d('medium.com', 'Publisher', 172, -9, 15.3, 21, 4.6),
  d('g2.com', 'Review', 131, 11, 12.6, 14, 3.9),
  d('stackoverflow.com', 'Platform', 108, 4, 10.2, 17, 4.4),
  d('news.ycombinator.com', 'Social', 88, 26, 8.1, 12, 4.9),
  d('evalkit.dev', 'Competitor', 74, 6, 7.4, 10, 3.7),
  d('promptgrid.ai', 'Competitor', 69, -5, 6.9, 9, 3.5),
  d('towardsdatascience.com', 'Publisher', 52, 3, 5.2, 11, 5.1),
  d('youtube.com', 'Social', 47, 15, 4.6, 8, 5.4),
  d('opentelemetry.io', 'Platform', 41, 7, 4.1, 9, 3.2),
  d('capterra.com', 'Review', 38, null, 3.7, 6, 4.1),
  d('hackernoon.com', 'Publisher', 31, -3, 3.2, 7, 5.6),
  d('infoq.com', 'Publisher', 27, 2, 2.9, 5, 4.8),
  d('producthunt.com', 'Review', 22, 9, 2.3, 4, 4.3),
  d('arxiv.org', 'Education', 19, null, 1.9, 4, 5.2),
]

const u = (domain: string, path: string, type: DomainType, citation_count: number, citation_change: number | null, in_answers_pct: number, prompts: number, avg_position: number | null): UrlTableRow =>
  ({ ...d(domain, type, citation_count, citation_change, in_answers_pct, prompts, avg_position), url: `https://${domain}${path}`, path })

export const yourPages: UrlTableRow[] = [
  u('tracewell.dev', '/docs/sdk/overview', 'You', 168, 22, 14.2, 18, 1.6),
  u('tracewell.dev', '/blog/llm-observability-guide', 'You', 131, 19, 11.6, 14, 1.9),
  u('tracewell.dev', '/docs/quickstart', 'You', 104, 8, 9.4, 12, 2.2),
  u('tracewell.dev', '/compare/spanlight', 'You', 77, 15, 7.1, 8, 3.4),
  u('tracewell.dev', '/pricing', 'You', 49, -4, 4.8, 6, 4.1),
  u('tracewell.dev', '/docs/tracing/nodejs', 'You', 41, 12, 3.9, 5, 2.8),
  u('tracewell.dev', '/blog/evaluating-ai-agents', 'You', 33, 33, 3.1, 4, 3.6),
  u('tracewell.dev', '/changelog', 'You', 15, null, 1.4, 3, 5.0),
]

export const urlTable: UrlTableRow[] = [
  yourPages[0], yourPages[1],
  u('spanlight.io', '/blog/llm-observability-101', 'Competitor', 142, 11, 12.1, 16, 2.4),
  u('github.com', '/tracewell/sdk-js', 'Platform', 131, 14, 10.9, 14, 2.1),
  yourPages[2],
  u('reddit.com', '/r/webdev/comments/what_are_you_using_for_llm', 'Social', 96, 31, 8.3, 11, 3.2),
  u('spanlight.io', '/pricing', 'Competitor', 88, 5, 7.6, 9, 3.3),
  u('dev.to', '/evalkit/agent-evals-101', 'Publisher', 81, 7, 7.0, 8, 4.0),
  yourPages[3],
  u('lumenlace.com', '/blog/langsmith-alternatives', 'Competitor', 73, -8, 6.4, 7, 3.0),
  u('g2.com', '/categories/llm-observability', 'Review', 69, 6, 6.1, 7, 3.8),
  u('medium.com', '/p/prompt-versioning-tools', 'Publisher', 64, -6, 5.5, 6, 4.4),
  u('github.com', '/open-telemetry/opentelemetry-js', 'Platform', 58, 3, 5.0, 6, 3.4),
  u('stackoverflow.com', '/questions/trace-langchain-agent', 'Platform', 52, 9, 4.7, 5, 4.2),
  yourPages[4],
  u('news.ycombinator.com', '/item?id=41822103', 'Social', 47, 24, 4.2, 5, 4.6),
  u('opentelemetry.io', '/docs/specs/semconv/gen-ai', 'Platform', 41, 7, 3.8, 5, 3.0),
  u('promptgrid.ai', '/blog/prompt-registry-guide', 'Competitor', 36, -4, 3.3, 4, 3.6),
]

export const movers: Record<'top' | 'new' | 'trending' | 'losing', DomainMoverItem[]> = {
  top: [
    { domain: 'tracewell.dev', type: 'You', citation_count: 722, change: 94 },
    { domain: 'spanlight.io', type: 'Competitor', citation_count: 604, change: 38 },
    { domain: 'github.com', type: 'Platform', citation_count: 425, change: 21 },
    { domain: 'reddit.com', type: 'Social', citation_count: 331, change: 47 },
    { domain: 'lumenlace.com', type: 'Competitor', citation_count: 283, change: -12 },
    { domain: 'dev.to', type: 'Publisher', citation_count: 226, change: 18 },
  ],
  new: [
    { domain: 'capterra.com', type: 'Review', citation_count: 38, change: null },
    { domain: 'arxiv.org', type: 'Education', citation_count: 19, change: null },
    { domain: 'otelhub.dev', type: 'Platform', citation_count: 14, change: null },
    { domain: 'thenewstack.io', type: 'Publisher', citation_count: 11, change: null },
    { domain: 'lobste.rs', type: 'Social', citation_count: 8, change: null },
  ],
  trending: [
    { domain: 'news.ycombinator.com', type: 'Social', citation_count: 88, change: 26 },
    { domain: 'youtube.com', type: 'Social', citation_count: 47, change: 15 },
    { domain: 'producthunt.com', type: 'Review', citation_count: 22, change: 9 },
    { domain: 'opentelemetry.io', type: 'Platform', citation_count: 41, change: 7 },
    { domain: 'evalkit.dev', type: 'Competitor', citation_count: 74, change: 6 },
  ],
  losing: [
    { domain: 'lumenlace.com', type: 'Competitor', citation_count: 283, change: -12 },
    { domain: 'medium.com', type: 'Publisher', citation_count: 172, change: -9 },
    { domain: 'promptgrid.ai', type: 'Competitor', citation_count: 69, change: -5 },
    { domain: 'hackernoon.com', type: 'Publisher', citation_count: 31, change: -3 },
  ],
}

export const domainTypeDescriptions: Record<string, string> = {
  You: 'Your own site and docs',
  Competitor: 'Rival products and their blogs',
  Platform: 'Code hosts, Q&A and standards bodies',
  Publisher: 'Editorial sites and developer blogs',
  Social: 'Forums, communities and video',
  Review: 'Review and directory sites',
  Education: 'Universities and research',
  Other: 'Everything else',
}

export const listingGaps: ListingGapRow[] = [
  { url: 'https://dev.to/evalkit/agent-evals-101', type: 'Publisher', lists: ['Spanlight', 'EvalKit', 'PromptGrid'], missing_you_in: 8 },
  { url: 'https://g2.com/categories/llm-observability', type: 'Review', lists: ['Spanlight', 'Lumenlace', 'EvalKit'], missing_you_in: 7 },
  { url: 'https://medium.com/p/prompt-versioning-tools', type: 'Publisher', lists: ['PromptGrid', 'Lumenlace'], missing_you_in: 6 },
  { url: 'https://capterra.com/p/llm-observability-software', type: 'Review', lists: ['Spanlight', 'Lumenlace', 'PromptGrid'], missing_you_in: 5 },
  { url: 'https://github.com/awesome-llmops/awesome-llmops', type: 'Platform', lists: ['Spanlight', 'EvalKit'], missing_you_in: 4 },
  { url: 'https://thenewstack.io/the-llm-observability-landscape', type: 'Publisher', lists: ['Spanlight', 'Lumenlace'], missing_you_in: 3 },
]

export const domainStats = { domains_cited: 214, prompts_in_scope: 52, your_share_pct: 21.4, rival_share_pct: 30.6, listing_gaps: 38, your_domain: BRAND.domain }
