/*
 * The full fictional "Tracewell" prompt list (52 prompts, matching the per-cluster prompt counts in data.ts).
 * The first 10 rows are data.ts's own `prompts`; the rest are generated here in the same shape so the Prompts and
 * Engines pages show a realistic, internally consistent table (52 = kpis.prompts_tracked).
 */
import { BRAND, ENGINES, clusters, prompts as seed, type Intent, type PromptRow, type PromptStatus } from './data'

type Spec = [prompt: string, slug: string, intent: Intent, rate: number, cur: number | null, prev: number | null]

const SPECS: Spec[] = [
  // LLM observability (12 more -> 14)
  ['what is llm observability', 'llm-observability', 'other', 68, 1, 1],
  ['langfuse vs tracewell', 'llm-observability', 'comparison', 54, 2, 3],
  ['best way to monitor llm latency and cost', 'llm-observability', 'howto', 66, 1, 2],
  ['llm observability tools with self hosting', 'llm-observability', 'list', 61, 2, 2],
  ['how to debug a failing llm chain', 'llm-observability', 'howto', 59, 2, 4],
  ['llm tracing vs logging', 'llm-observability', 'comparison', 72, 1, 1],
  ['open source llm monitoring platforms', 'llm-observability', 'list', 63, 1, 3],
  ['how much does llm observability cost', 'llm-observability', 'pricing', 52, 3, 3],
  ['track token usage per customer', 'llm-observability', 'howto', 69, 1, 1],
  ['llm observability for rag pipelines', 'llm-observability', 'howto', 57, 2, 2],
  ['alerting on llm hallucination rate', 'llm-observability', 'howto', 48, 3, 5],
  ['is llm observability worth it for small teams', 'llm-observability', 'roi', 55, 2, 2],
  // Tracing SDKs (10 more -> 12)
  ['best tracing sdk for python llm apps', 'tracing-sdks', 'list', 58, 2, 2],
  ['opentelemetry for llm applications', 'tracing-sdks', 'howto', 63, 1, 2],
  ['how to add tracing to a langchain app', 'tracing-sdks', 'howto', 51, 3, 4],
  ['lightweight tracing sdk for serverless', 'tracing-sdks', 'list', 47, 3, 3],
  ['tracing sdk overhead benchmark', 'tracing-sdks', 'comparison', 38, 4, 6],
  ['typescript sdk for ai agent tracing', 'tracing-sdks', 'howto', 60, 2, 2],
  ['sampling strategies for llm traces', 'tracing-sdks', 'howto', 44, 3, 3],
  ['go sdk for llm tracing', 'tracing-sdks', 'howto', 0, null, null],
  ['tracewell sdk vs opentelemetry collector', 'tracing-sdks', 'comparison', 49, 3, 3],
  ['redact pii in llm traces', 'tracing-sdks', 'howto', 33, 5, 4],
  // AI agent evals (9 more -> 10)
  ['best tools to evaluate llm agents', 'agent-evals', 'list', 45, 3, 4],
  ['how to build an eval dataset from production traces', 'agent-evals', 'howto', 52, 2, 3],
  ['llm as a judge pitfalls', 'agent-evals', 'other', 31, 5, 5],
  ['regression testing for ai agents', 'agent-evals', 'howto', 40, 4, 4],
  ['offline vs online evals for agents', 'agent-evals', 'comparison', 36, 4, 6],
  ['agent eval frameworks compared', 'agent-evals', 'comparison', 29, 5, null],
  ['how to score agent tool calls', 'agent-evals', 'howto', 0, null, 4],
  ['evalkit alternatives', 'agent-evals', 'comparison', 0, null, null],
  ['continuous evaluation for llm apps', 'agent-evals', 'howto', 42, 3, 3],
  // Prompt management (6 more -> 9)
  ['how to version prompts in production', 'prompt-management', 'howto', 33, 4, 3],
  ['prompt management tool with ab testing', 'prompt-management', 'list', 27, 5, 4],
  ['git vs prompt registry for prompts', 'prompt-management', 'comparison', 0, null, 5],
  ['collaborative prompt editor for teams', 'prompt-management', 'list', 0, null, null],
  ['roll back a bad prompt release', 'prompt-management', 'howto', 22, 6, 5],
  ['prompt management pricing comparison', 'prompt-management', 'pricing', 0, null, null],
  // Alternatives and comparisons (5 more -> 7)
  ['best langfuse alternatives', 'alternatives', 'list', 44, 3, 3],
  ['helicone vs tracewell', 'alternatives', 'comparison', 41, 3, 4],
  ['tracewell vs lumenlace', 'alternatives', 'comparison', 38, 4, 4],
  ['arize phoenix alternatives for startups', 'alternatives', 'list', 0, null, 6],
  ['tracewell pricing vs spanlight pricing', 'alternatives', 'pricing', 47, 2, 3],
]

const SRC_POOL: Array<[string, string]> = [['github.com', '/tracewell/sdk-js'], ['dev.to', '/spanlight/llm-tracing-101'], ['medium.com', '/p/llm-observability-compared'], ['reddit.com', '/r/LLMDevs/comments/tracing_tools'], ['g2.com', '/categories/llm-observability']]

const slugify = (s: string) => s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function build(spec: Spec, i: number): PromptRow {
  const [prompt, slug, intent, rate, cur, prev] = spec
  const cluster = clusters.find((c) => c.slug === slug)!
  const answers = 28
  const cited = Math.round((rate / 100) * answers)
  const status: PromptStatus = cur == null ? (prev != null ? 'dropped' : 'missing') : cur === 1 ? 'owned' : 'weak'
  const ranks = ENGINES.map((_, k) => {
    if (cur == null) return null
    const h = (i * 7 + k * 3) % 5
    if (h === 4 && cur > 2) return null
    return cur + [0, 1, 0, 2, 1][h]
  })
  const lead: [string, number, boolean] = cur === 1 ? [BRAND.domain, 30 + (i % 9), true] : [cluster.top_rival!.domain, 24 + (i % 14), false]
  const src: [string, string] = cur != null && cur <= 2 ? [BRAND.domain, `/blog/${slugify(prompt)}`] : SRC_POOL[i % SRC_POOL.length]
  return {
    prompt, cluster: cluster.name, cluster_slug: slug, intent, answers, cited_answers: cited, citation_rate: rate, your_share: Math.round(rate * 45) / 100, own_cites: cited,
    total_cites: Math.round(cited / 0.45), current_rank: cur, prev_rank: prev, rank_delta: cur != null && prev != null ? prev - cur : null, last_known_rank: cur ?? prev,
    most_cited_domain: { domain: lead[0], pct: lead[1], is_you: lead[2] }, top_source: { url: `https://${src[0]}${src[1]}`, domain: src[0] },
    by_engine: ENGINES.map((engine, k) => ({ engine, answers: 7, cited_answers: ranks[k] == null ? 0 : Math.max(1, Math.round((rate / 100) * 7)), citation_rate: ranks[k] == null ? 0 : rate, rank: ranks[k] })),
    domain_shares: [{ domain: BRAND.domain, pct: rate * 0.45, is_you: true }, { domain: cluster.top_rival!.domain, pct: 24, is_you: false }],
    status,
  }
}

export const allPrompts: PromptRow[] = [...seed, ...SPECS.map((s, i) => build(s, i))].map((p) => ({ ...p, your_share: p.your_share == null ? null : Math.round(p.your_share * 10) / 10 }))
