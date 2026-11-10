/*
 * Listicles page data (fictional, Tracewell). Shaped like content-repo `src/lib/geo-listicles.ts`
 * (`ListiclePromptGroup`, `ListicleRow`, cluster tabs, stats).
 */
import { clusters } from './data'

export interface ListicleRow {
  url: string; domain: string; title: string; tags: string[]; citations: number; engines: string[]
  co_cited_with_you: boolean; next_step: string | null
}
export interface ListiclePromptGroup { cluster_slug: string; cluster_name: string; prompt: string; listicles: ListicleRow[]; missing_count: number }

const ALL = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity']
type L = [string, string, string, string[], number, string[], boolean, string | null]
const l = (domain: string, path: string, title: string, tags: string[], citations: number, engines: string[], co: boolean, next: string | null = null): L => [domain, path, title, tags, citations, engines, co, next]

const raw: Array<[string, string, L[]]> = [
  ['llm-observability', 'best llm observability tool for startups', [
    l('g2.com', '/categories/llm-observability', 'Best LLM Observability Software in 2026', ['Review roundup', 'Top 10'], 42, ALL, true),
    l('dev.to', '/lenskit/best-llm-observability-tools-2026', 'The 9 best LLM observability tools in 2026', ['Listicle', 'Top 9'], 31, ['ChatGPT', 'Perplexity', 'Gemini'], false, 'Ask to be added'),
    l('thenewstack.io', '/the-llm-observability-landscape', 'The LLM observability landscape', ['Roundup'], 24, ['Claude', 'Perplexity'], false, 'Ask to be added'),
    l('medium.com', '/p/llm-observability-tools-compared', 'LLM observability tools compared', ['Listicle', 'Top 7'], 19, ['ChatGPT', 'Gemini'], true),
    l('capterra.com', '/p/llm-observability-software', 'Top LLM Observability Software', ['Review roundup'], 14, ['Perplexity'], false, 'Claim your profile'),
  ]],
  ['llm-observability', 'how to trace ai agents in production', [
    l('hackernoon.com', '/tracing-ai-agents-6-tools', '6 tools for tracing AI agents', ['Listicle', 'Top 6'], 22, ['ChatGPT', 'Claude'], false, 'Pitch an update'),
    l('towardsdatascience.com', '/agent-tracing-tools-roundup', 'Agent tracing tools: a roundup', ['Roundup'], 17, ['Gemini', 'Perplexity'], true),
    l('github.com', '/awesome-llmops/awesome-llmops', 'awesome-llmops', ['Awesome list'], 29, ALL, false, 'Open a pull request'),
  ]],
  ['tracing-sdks', 'open source tracing sdk for node', [
    l('github.com', '/awesome-opentelemetry/awesome-opentelemetry', 'awesome-opentelemetry', ['Awesome list'], 36, ALL, true),
    l('dev.to', '/nodefolks/tracing-sdks-for-node-2026', 'Tracing SDKs for Node.js in 2026', ['Listicle', 'Top 8'], 26, ['ChatGPT', 'Gemini', 'Perplexity'], false, 'Ask to be added'),
    l('infoq.com', '/articles/node-llm-tracing-options', 'Node LLM tracing options', ['Roundup'], 12, ['Claude'], false, 'Pitch an update'),
    l('medium.com', '/p/otel-sdks-for-llm-apps', 'OTel SDKs for LLM apps, ranked', ['Listicle', 'Top 5'], 11, ['Perplexity'], true),
  ]],
  ['tracing-sdks', 'otel sdk for llm apps', [
    l('opentelemetry.io', '/ecosystem/vendors', 'OpenTelemetry vendors', ['Directory'], 33, ALL, true),
    l('dev.to', '/otelhub/otel-for-llm-apps', 'OTel for LLM apps: 7 libraries to know', ['Listicle', 'Top 7'], 15, ['ChatGPT', 'Claude'], false, 'Ask to be added'),
  ]],
  ['agent-evals', 'how to evaluate ai agents in production', [
    l('dev.to', '/evalkit/agent-evals-101', 'Agent evals 101: 8 frameworks compared', ['Listicle', 'Top 8'], 28, ['ChatGPT', 'Perplexity', 'Gemini'], false, 'Ask to be added'),
    l('towardsdatascience.com', '/agent-eval-frameworks', 'Agent evaluation frameworks compared', ['Roundup'], 18, ['Claude', 'Gemini'], false, 'Pitch an update'),
    l('arxiv.org', '/abs/2411.01234', 'A survey of agent evaluation methods', ['Survey'], 9, ['Claude'], false, null),
    l('g2.com', '/categories/ai-evaluation', 'Best AI Evaluation Tools', ['Review roundup', 'Top 10'], 13, ['ChatGPT'], true),
  ]],
  ['prompt-management', 'prompt versioning tools compared', [
    l('medium.com', '/p/prompt-versioning-tools', '7 prompt versioning tools compared', ['Listicle', 'Top 7'], 21, ['ChatGPT', 'Gemini'], false, 'Ask to be added'),
    l('dev.to', '/promptgrid/prompt-versioning-roundup', 'Prompt versioning: the tools worth trying', ['Listicle'], 16, ['Perplexity'], false, 'Ask to be added'),
    l('github.com', '/awesome-prompt-engineering/awesome-prompt-engineering', 'awesome-prompt-engineering', ['Awesome list'], 12, ['Claude', 'Gemini'], false, 'Open a pull request'),
  ]],
  ['prompt-management', 'best prompt registry for teams', [
    l('g2.com', '/categories/prompt-management', 'Best Prompt Management Software', ['Review roundup', 'Top 10'], 25, ALL, false, 'Claim your profile'),
    l('capterra.com', '/p/prompt-management-software', 'Top Prompt Management Software', ['Review roundup'], 11, ['ChatGPT', 'Perplexity'], false, 'Claim your profile'),
    l('producthunt.com', '/categories/prompt-management', 'Best prompt management products', ['Directory'], 8, ['Gemini'], false, 'Add a launch'),
  ]],
  ['alternatives', 'langsmith alternatives', [
    l('lumenlace.com', '/blog/langsmith-alternatives', '10 LangSmith alternatives', ['Listicle', 'Top 10'], 34, ['ChatGPT', 'Claude', 'Perplexity'], false, 'Pitch an update'),
    l('reddit.com', '/r/LangChain/comments/langsmith_alternatives', 'LangSmith alternatives?', ['Thread'], 14, ['Perplexity', 'ChatGPT'], false, null),
    l('medium.com', '/p/langsmith-alternatives-2026', 'LangSmith alternatives in 2026', ['Listicle', 'Top 6'], 18, ['Gemini'], true),
    l('g2.com', '/products/langsmith/competitors-and-alternatives', 'LangSmith competitors and alternatives', ['Review roundup'], 22, ALL, true),
  ]],
  ['alternatives', 'tracewell vs spanlight', [
    l('g2.com', '/compare/spanlight-vs-tracewell', 'Spanlight vs Tracewell', ['Comparison'], 19, ['ChatGPT', 'Claude'], true),
    l('dev.to', '/lenskit/spanlight-vs-tracewell-vs-evalkit', 'Spanlight vs Tracewell vs EvalKit', ['Comparison', 'Top 3'], 12, ['Perplexity'], true),
  ]],
]

export const listicleGroups: ListiclePromptGroup[] = raw.map(([slug, prompt, rows]) => {
  const listicles: ListicleRow[] = rows
    .map(([domain, path, title, tags, citations, engines, co, next]) => ({ url: `https://${domain}${path}`, domain, title, tags, citations, engines, co_cited_with_you: co, next_step: next }))
    .sort((a, b) => b.citations - a.citations)
  return { cluster_slug: slug, cluster_name: clusters.find((c) => c.slug === slug)?.name ?? slug, prompt, listicles, missing_count: listicles.filter((r) => !r.co_cited_with_you).length }
})

const all = listicleGroups.flatMap((g) => g.listicles)
const unique = new Map(all.map((r) => [r.url, r]))
export const listicleStats = {
  listicle_citations: all.reduce((s, r) => s + r.citations, 0),
  listicle_citations_caption: `across ${all.length} cited pages`,
  your_listicle_citations: all.filter((r) => r.co_cited_with_you).reduce((s, r) => s + r.citations, 0),
  your_listicle_citations_caption: 'cited alongside you',
  listicles_tracked: unique.size,
  listicles_tracked_clusters: new Set(listicleGroups.map((g) => g.cluster_slug)).size,
  not_listing_you: [...unique.values()].filter((r) => !r.co_cited_with_you).length,
  not_listing_you_total: unique.size,
}

export const clusterTabs = [
  { slug: 'all', name: 'All', listicle_count: unique.size, missing_count: listicleStats.not_listing_you },
  ...clusters.filter((c) => c.tracked && c.enabled).map((c) => {
    const rows = [...new Map(listicleGroups.filter((g) => g.cluster_slug === c.slug).flatMap((g) => g.listicles).map((r) => [r.url, r])).values()]
    return { slug: c.slug, name: c.name, listicle_count: rows.length, missing_count: rows.filter((r) => !r.co_cited_with_you).length }
  }),
]
