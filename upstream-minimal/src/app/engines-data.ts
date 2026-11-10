/*
 * Fictional per-engine page breakdown for the Engines page (shape of `EnginePage` in content-repo `lib/geo-engines.ts`).
 * Engine/cluster/prompt coverage is derived from `allPrompts` in engines.ts so it always agrees with the Prompts page.
 */
import { engineTrend } from './data'

export interface EnginePageDetail {
  engine: string
  citations_to_you: number
  your_pages_caption: string
  own_cites: number
  total_cites: number
  your_pages_cited: number
  top_third_party: string
  insight: string
  your_pages: Array<{ path: string; cluster: string; cites: number; pos: number | null }>
  third_party_pages: Array<{ domain: string; path: string; type: string; cites: number; action: string | null }>
  your_page_types: Array<{ type: string; count: number }>
}

export const ENGINE_PAGES: EnginePageDetail[] = [
  {
    engine: 'ChatGPT', citations_to_you: 214, your_pages_caption: 'blog 131, service page 59', own_cites: 214, total_cites: 1388, your_pages_cited: 19, top_third_party: 'github.com',
    insight: 'ChatGPT cites your blog and service page, never your homepage. Your homepage is your best-ranked page elsewhere (#1.8), so getting ChatGPT to pick it up is the biggest single win.',
    your_pages: [
      { path: '/blog/llm-observability-guide', cluster: 'LLM observability', cites: 48, pos: 1.4 },
      { path: '/docs/sdk/overview', cluster: 'Tracing SDKs', cites: 39, pos: 1.9 },
      { path: '/blog/tracing-ai-agents-in-production', cluster: 'LLM observability', cites: 31, pos: 2.2 },
      { path: '/compare/spanlight', cluster: 'Alternatives and comparisons', cites: 24, pos: 2.8 },
      { path: '/pricing', cluster: 'Alternatives and comparisons', cites: 18, pos: 2.5 },
      { path: '/blog/evaluating-agents-with-traces', cluster: 'AI agent evals', cites: 14, pos: 3.6 },
    ],
    third_party_pages: [
      { domain: 'github.com', path: '/tracewell/sdk-js', type: 'Other', cites: 61, action: null },
      { domain: 'spanlight.io', path: '/blog/llm-tracing-101', type: 'Competitor', cites: 44, action: null },
      { domain: 'dev.to', path: '/evalkit/agent-evals-101', type: 'Community', cites: 29, action: 'Cross-post' },
      { domain: 'g2.com', path: '/categories/llm-observability', type: 'Review site', cites: 22, action: 'Get listed' },
      { domain: 'medium.com', path: '/p/best-llm-observability-tools', type: 'Listicle', cites: 17, action: 'Pitch listing' },
    ],
    your_page_types: [{ type: 'Homepage', count: 0 }, { type: 'Blog', count: 131 }, { type: 'Service page', count: 59 }, { type: 'Other', count: 24 }],
  },
  {
    engine: 'Claude', citations_to_you: 171, your_pages_caption: 'blog 88, service page 61', own_cites: 171, total_cites: 1246, your_pages_cited: 16, top_third_party: 'github.com',
    insight: 'Claude cites your blog, service page and homepage, across 16 of your pages.',
    your_pages: [
      { path: '/docs/sdk/overview', cluster: 'Tracing SDKs', cites: 44, pos: 1.7 },
      { path: '/blog/llm-observability-guide', cluster: 'LLM observability', cites: 36, pos: 1.6 },
      { path: '/', cluster: 'LLM observability', cites: 22, pos: 2.1 },
      { path: '/compare/spanlight', cluster: 'Alternatives and comparisons', cites: 19, pos: 3.1 },
      { path: '/blog/otel-for-llm-apps', cluster: 'Tracing SDKs', cites: 16, pos: 2.4 },
    ],
    third_party_pages: [
      { domain: 'github.com', path: '/tracewell/sdk-js', type: 'Other', cites: 58, action: null },
      { domain: 'spanlight.io', path: '/docs/tracing', type: 'Competitor', cites: 37, action: null },
      { domain: 'evalkit.dev', path: '/blog/agent-evals', type: 'Competitor', cites: 26, action: null },
      { domain: 'reddit.com', path: '/r/LLMDevs/comments/tracing_tools', type: 'Community', cites: 19, action: 'Cross-post' },
    ],
    your_page_types: [{ type: 'Homepage', count: 22 }, { type: 'Blog', count: 88 }, { type: 'Service page', count: 61 }, { type: 'Other', count: 0 }],
  },
  {
    engine: 'Gemini', citations_to_you: 126, your_pages_caption: 'service page 71, blog 38', own_cites: 126, total_cites: 1102, your_pages_cited: 12, top_third_party: 'dev.to',
    insight: 'Gemini cites your service page and blog, never your homepage. Your homepage is your best-ranked page elsewhere (#1.8), so getting Gemini to pick it up is the biggest single win.',
    your_pages: [
      { path: '/compare/spanlight', cluster: 'Alternatives and comparisons', cites: 38, pos: 2.6 },
      { path: '/pricing', cluster: 'Alternatives and comparisons', cites: 33, pos: 2.9 },
      { path: '/blog/llm-observability-guide', cluster: 'LLM observability', cites: 27, pos: 2.0 },
      { path: '/docs/sdk/overview', cluster: 'Tracing SDKs', cites: 18, pos: 3.2 },
    ],
    third_party_pages: [
      { domain: 'dev.to', path: '/evalkit/agent-evals-101', type: 'Community', cites: 41, action: 'Cross-post' },
      { domain: 'medium.com', path: '/p/prompt-versioning-tools', type: 'Listicle', cites: 34, action: 'Pitch listing' },
      { domain: 'promptgrid.ai', path: '/blog/prompt-registry', type: 'Competitor', cites: 27, action: null },
      { domain: 'g2.com', path: '/categories/prompt-management', type: 'Review site', cites: 21, action: 'Get listed' },
    ],
    your_page_types: [{ type: 'Homepage', count: 0 }, { type: 'Blog', count: 38 }, { type: 'Service page', count: 71 }, { type: 'Other', count: 17 }],
  },
  {
    engine: 'Perplexity', citations_to_you: 243, your_pages_caption: 'blog 176, service page 52', own_cites: 243, total_cites: 1471, your_pages_cited: 21, top_third_party: 'reddit.com',
    insight: 'Perplexity cites your blog, service page and homepage, across 21 of your pages.',
    your_pages: [
      { path: '/blog/llm-observability-guide', cluster: 'LLM observability', cites: 62, pos: 1.5 },
      { path: '/blog/tracing-ai-agents-in-production', cluster: 'LLM observability', cites: 47, pos: 1.8 },
      { path: '/blog/otel-for-llm-apps', cluster: 'Tracing SDKs', cites: 36, pos: 2.1 },
      { path: '/docs/sdk/overview', cluster: 'Tracing SDKs', cites: 29, pos: 2.3 },
      { path: '/compare/spanlight', cluster: 'Alternatives and comparisons', cites: 21, pos: 2.7 },
      { path: '/', cluster: 'LLM observability', cites: 12, pos: 2.4 },
    ],
    third_party_pages: [
      { domain: 'reddit.com', path: '/r/LLMDevs/comments/tracing_tools', type: 'Community', cites: 72, action: 'Cross-post' },
      { domain: 'github.com', path: '/tracewell/sdk-js', type: 'Other', cites: 54, action: null },
      { domain: 'spanlight.io', path: '/blog/llm-tracing-101', type: 'Competitor', cites: 41, action: null },
      { domain: 'g2.com', path: '/categories/llm-observability', type: 'Review site', cites: 28, action: 'Get listed' },
      { domain: 'medium.com', path: '/p/best-llm-observability-tools', type: 'Listicle', cites: 23, action: 'Pitch listing' },
    ],
    your_page_types: [{ type: 'Homepage', count: 12 }, { type: 'Blog', count: 176 }, { type: 'Service page', count: 52 }, { type: 'Other', count: 3 }],
  },
]

/** Per-engine daily series for "Engines over time" (rate comes from `engineTrend`; share of voice and average position are derived from it). */
export interface EngineDay { date: string; answers: number; rate: number | null; sov: number | null; avg_position: number | null }
export const ENGINE_DAYS: Record<string, EngineDay[]> = Object.fromEntries(engineTrend.map((t, k) => [t.engine, t.points.map((p, i): EngineDay => ({
  date: p.date, answers: p.answers, rate: p.rate, sov: Math.round(p.rate * 0.42 * 10) / 10, avg_position: Math.round((6.2 - p.rate / 16 + Math.sin(i * 1.3 + k) * 0.25) * 10) / 10,
}))]))
