/*
 * Fictional per-engine results and answer transcripts for the Model results table, the answer modal and the
 * cluster page. Shaped like the real app's `PromptResult` (content-repo model-results.tsx) and `ChatRow`
 * (geo-chats). Everything derives from `data.prompts` (ranks per engine) so the numbers stay consistent.
 */
import { BRAND, clusters, dates, ENGINES, prompts, type PromptRow } from './data'

export type DayStatus = 'cited' | 'not_cited' | 'no_data'

export interface PromptResult {
  prompt: string
  model: string
  provider: string
  cited: boolean
  cited_urls: string[]
  ranks: number[]
  other_urls: string[]
  daily_citations: Array<{ date: string; status: DayStatus }>
  run_timestamp: string
  prev_rank: number | null
}

export interface ChatMention { name: string; domain: string | null; is_you: boolean; role?: 'mentioned' }
export interface ChatSource { url: string; domain: string; title: string }
/** A result card of a Claude/Gemini list answer (the app's `StructuredEntity`). */
export interface StructuredEntity {
  name: string; url?: string; domain: string; sourceUrl?: string; sourceDomain?: string
  description?: string; rank?: number; isYou: boolean; tags?: string[]
}
export interface Chat {
  engine: string
  prompt: string
  ts: string
  rank: number | null
  cited: boolean
  text: string
  mentions: ChatMention[]
  sources: ChatSource[]
  /** Claude and Gemini answer as a ranked list of cards instead of prose. */
  intro?: string
  entities?: StructuredEntity[]
}

const PROVIDER: Record<string, string> = { ChatGPT: 'OpenAI', Claude: 'Anthropic', Gemini: 'Google', Perplexity: 'Perplexity' }

/* ------------------------------------------------------------------ answer content per prompt */
interface Brand { name: string; domain: string }
const SPAN: Brand = { name: 'Spanlight', domain: 'spanlight.io' }
const LUMEN: Brand = { name: 'Lumenlace', domain: 'lumenlace.com' }
const EVAL: Brand = { name: 'EvalKit', domain: 'evalkit.dev' }
const PGRID: Brand = { name: 'PromptGrid', domain: 'promptgrid.ai' }
const YOU: Brand = { name: BRAND.name, domain: BRAND.domain }

/** [brand, one-sentence take, page path, page title] */
type Entry = [Brand, string, string, string]
interface Content {
  intro: string
  you: [string, string, string]
  rivals: Entry[]
  third: Array<[string, string, string]>
  outro: string
  extra?: ChatMention[]
}

const C: Record<string, Content> = {
  'best llm observability tool for startups': {
    intro: 'For a small team the short list is usually a hosted tracing platform with a generous free tier. These are the ones that come up most:',
    you: ['Traces, token costs and eval scores in one timeline, with a free tier that covers most early-stage workloads and a drop-in SDK for Node and Python.', '/blog/llm-observability-guide', 'The complete guide to LLM observability'],
    rivals: [
      [SPAN, 'The most established option, strong on distributed tracing, though pricing climbs quickly once you pass a few million spans.', '/pricing', 'Spanlight pricing'],
      [LUMEN, 'A lightweight dashboard that is quick to set up but thinner on evaluation features.', '/docs/overview', 'Lumenlace overview'],
      [EVAL, 'Built around evals first, with tracing as a secondary feature.', '/docs/tracing', 'Tracing in EvalKit'],
      [PGRID, 'Primarily a prompt registry; observability is limited to request logs.', '/features/observability', 'PromptGrid observability'],
    ],
    third: [['g2.com', '/categories/llm-observability', 'Best LLM observability tools, G2'], ['reddit.com', '/r/webdev/comments/llm_observability_2026', 'What are you using for LLM observability in 2026?'], ['dev.to', '/ml-notes/observability-stack-for-small-teams', 'An observability stack for small teams']],
    outro: 'If you are pre-revenue, start with whichever tool has the fastest SDK install and a free tier, then revisit once you have real traffic.',
  },
  'how to trace ai agents in production': {
    intro: 'Tracing an agent comes down to capturing every model call, tool call and retry as nested spans, then sampling sensibly. These tools handle that well:',
    you: ['Auto-instruments agent frameworks and records each tool call and retry as a child span, with cost attached to every step.', '/docs/sdk/overview', 'Tracewell SDK overview'],
    rivals: [
      [SPAN, 'Mature span explorer with good support for long-running, multi-step agent runs.', '/docs/agents', 'Tracing agents with Spanlight'],
      [LUMEN, 'Simple agent timelines; works best for single-agent flows.', '/docs/agent-traces', 'Lumenlace agent traces'],
      [EVAL, 'Lets you attach eval scores to each step of a trace.', '/docs/agent-evals', 'Agent evals in EvalKit'],
    ],
    third: [['github.com', '/open-telemetry/semantic-conventions-genai', 'GenAI semantic conventions'], ['dev.to', '/agentops/tracing-multi-step-agents', 'Tracing multi-step agents'], ['news.ycombinator.com', '/item?id=41872310', 'Ask HN: How do you debug agents in prod?']],
    outro: 'Whatever you pick, propagate a single trace ID through every tool call so retries and fallbacks stay attached to the original request.',
  },
  'open source tracing sdk for node': {
    intro: 'For Node.js the open source options are mostly OpenTelemetry-compatible. The ones worth looking at:',
    you: ['Apache-2.0 SDK with auto-instrumentation for the major LLM clients and an OTLP exporter, about five lines to set up.', '/docs/quickstart', 'Tracewell quickstart for Node'],
    rivals: [
      [SPAN, 'Open core; the Node SDK is open source but the backend is hosted.', '/docs/node', 'Spanlight Node SDK'],
      [EVAL, 'A small MIT-licensed SDK focused on capturing evals alongside traces.', '/docs/node-sdk', 'EvalKit Node SDK'],
      [LUMEN, 'Source-available rather than open source; check the licence before adopting.', '/docs/sdk-licence', 'Lumenlace SDK licence'],
    ],
    third: [['github.com', '/tracewell/sdk-js', 'tracewell/sdk-js'], ['stackoverflow.com', '/questions/78012345/trace-openai-calls-in-node', 'How to trace OpenAI calls in Node?'], ['medium.com', '/p/tracing-llm-apps-in-node', 'Tracing LLM apps in Node']],
    outro: 'Check each repo for recent commits and an OTLP exporter, since those two signals predict whether the SDK will stay maintained.',
  },
  'tracewell vs spanlight': {
    intro: 'The two overlap heavily on tracing, and the difference comes down to pricing model and evaluation depth:',
    you: ['Flat per-seat pricing, built-in evals and a self-host option, which tends to suit teams that want predictable costs.', '/compare/spanlight', 'Tracewell vs Spanlight'],
    rivals: [
      [SPAN, 'Usage-based pricing and a larger integrations catalogue, which suits teams already tracing across many services.', '/vs/tracewell', 'Spanlight vs Tracewell'],
      [LUMEN, 'Sometimes shortlisted as a third option because of its simple setup.', '/blog/lumenlace-vs-spanlight', 'Lumenlace vs Spanlight'],
    ],
    third: [['g2.com', '/compare/spanlight-vs-tracewell', 'Spanlight vs Tracewell, G2'], ['reddit.com', '/r/devops/comments/tracing_sdk_comparison', 'Tracing SDK comparison, honest takes'], ['news.ycombinator.com', '/item?id=41990021', 'Show HN: Tracewell']],
    outro: 'If you already pay for Spanlight and are happy with the bill, switching rarely pays off; for new projects, run both on a staging service for a week.',
  },
  'how to evaluate ai agents in production': {
    intro: 'Evaluating an agent in production means scoring real traces rather than a fixed test set. Teams typically combine three things: sampled human review, LLM-as-judge scoring and outcome metrics. Tools that support this:',
    you: ['Scores sampled production traces with your own rubrics and links every score back to the exact trace.', '/blog/evaluating-agents-in-production', 'Evaluating agents in production'],
    rivals: [
      [EVAL, 'The most focused option: datasets, judges and regression runs in one place.', '/docs/agent-evals-101', 'Agent evals 101'],
      [SPAN, 'Adds eval scores on top of its tracing, though judges are configured in code.', '/docs/evals', 'Evals in Spanlight'],
      [PGRID, 'Ties evaluation results to prompt versions.', '/docs/evals', 'PromptGrid evals'],
    ],
    third: [['dev.to', '/evalkit/agent-evals-101', 'Agent evals 101'], ['github.com', '/evalkit/evalkit', 'evalkit/evalkit'], ['medium.com', '/p/llm-as-judge-pitfalls', 'LLM-as-judge pitfalls']],
    outro: 'Start with a small rubric you trust, sample 1-5% of traffic, and track the score alongside cost and latency.',
  },
  'prompt versioning tools compared': {
    intro: 'Prompt versioning tools differ mainly in how they tie a prompt version to what actually ran. A quick comparison:',
    you: ['Stores prompts next to traces, so every run records which version produced it, with diffs and rollbacks.', '/docs/prompts', 'Prompt versions in Tracewell'],
    rivals: [
      [PGRID, 'A dedicated registry with environments, approvals and a review workflow.', '/features/versioning', 'PromptGrid versioning'],
      [LUMEN, 'Basic version history without approvals.', '/docs/prompts', 'Lumenlace prompts'],
      [SPAN, 'Versioning exists but sits behind the enterprise plan.', '/pricing', 'Spanlight pricing'],
      [EVAL, 'No registry; versions are tracked through eval datasets.', '/docs/versions', 'EvalKit versions'],
    ],
    third: [['medium.com', '/p/prompt-versioning-tools', 'Prompt versioning tools compared'], ['reddit.com', '/r/LocalLLaMA/comments/prompt_versioning', 'How do you version prompts?'], ['g2.com', '/categories/prompt-management', 'Best prompt management software, G2']],
    outro: 'If prompts change weekly, favour the tool that links versions to production traces; otherwise a git-based workflow may be enough.',
  },
  'best prompt registry for teams': {
    intro: 'Teams usually want approvals, environments and an audit trail. The registries that offer those:',
    you: ['Versioned prompts with environments and traces attached, though it has no formal approval workflow yet.', '/docs/prompts', 'Prompt versions in Tracewell'],
    rivals: [
      [PGRID, 'The most complete registry, with roles, approvals and environments.', '/features/registry', 'PromptGrid registry'],
      [LUMEN, 'Shared prompt library with comments.', '/docs/library', 'Lumenlace prompt library'],
      [SPAN, 'Registry included on higher plans.', '/pricing', 'Spanlight pricing'],
    ],
    third: [['g2.com', '/categories/prompt-management', 'Best prompt management software, G2'], ['medium.com', '/p/building-a-prompt-registry', 'Building a prompt registry'], ['reddit.com', '/r/MachineLearning/comments/prompt_registry', 'Prompt registry recommendations']],
    outro: 'Pick based on who edits prompts: if non-engineers do, approvals matter more than anything else.',
  },
  'langsmith alternatives': {
    intro: 'LangSmith is a sensible default if you are already on LangChain, but teams look elsewhere for framework-neutral tracing or lower cost. The usual alternatives:',
    you: ['Framework-neutral tracing with an OpenTelemetry-native SDK and a free tier.', '/compare/langsmith', 'Tracewell vs LangSmith'],
    rivals: [
      [LUMEN, 'The closest like-for-like replacement, with a similar trace explorer and simpler pricing.', '/alternatives/langsmith', 'LangSmith alternatives, Lumenlace'],
      [SPAN, 'Stronger distributed tracing and many integrations.', '/vs/langsmith', 'Spanlight vs LangSmith'],
      [EVAL, 'A better fit when evaluation matters more than tracing.', '/blog/langsmith-alternatives', 'LangSmith alternatives, EvalKit'],
    ],
    third: [['reddit.com', '/r/LangChain/comments/langsmith_alternatives', 'LangSmith alternatives?'], ['github.com', '/open-telemetry/opentelemetry-python-contrib', 'opentelemetry-python-contrib'], ['dev.to', '/lumenlace/why-we-left-langsmith', 'Why we left LangSmith']],
    outro: 'Before switching, check whether the new tool ingests OpenTelemetry, since that makes the next migration far cheaper.',
    extra: [{ name: 'LangSmith', domain: 'smith.langchain.com', is_you: false, role: 'mentioned' }],
  },
  'monitor prompt drift': {
    intro: 'Prompt drift shows up as a gradual change in outputs for the same inputs, usually after a model update. To catch it, replay a fixed set of inputs on a schedule and compare the results:',
    you: ['Replays saved inputs nightly and alerts when output similarity or eval scores move beyond a threshold.', '/docs/drift-alerts', 'Drift alerts'],
    rivals: [
      [PGRID, 'Offers scheduled regression runs per prompt version.', '/features/drift', 'PromptGrid drift monitoring'],
      [EVAL, 'Regression suites you can run in CI or on a cron.', '/docs/regressions', 'Regression runs'],
      [SPAN, 'Anomaly detection on output length and latency, not content.', '/docs/anomaly', 'Spanlight anomaly detection'],
    ],
    third: [['dev.to', '/promptgrid/prompt-drift', 'Detecting prompt drift'], ['medium.com', '/p/prompt-drift-in-production', 'Prompt drift in production'], ['stackoverflow.com', '/questions/78100200/llm-output-changed-after-model-update', 'LLM output changed after model update']],
    outro: 'Pin model versions where the provider allows it, and treat a provider-side update like any other deploy.',
  },
  'otel sdk for llm apps': {
    intro: 'If you already use OpenTelemetry, you want an SDK that emits standard GenAI spans rather than a proprietary format. Options:',
    you: ['Emits OpenTelemetry GenAI semantic-convention spans from the major LLM clients, and ships to any OTLP backend.', '/docs/sdk/overview', 'Tracewell SDK overview'],
    rivals: [
      [SPAN, 'OTLP ingest is supported, with some attributes mapped to its own schema.', '/docs/otlp', 'OTLP ingest'],
      [EVAL, 'Exports eval results as span events.', '/docs/otel', 'EvalKit and OpenTelemetry'],
    ],
    third: [['github.com', '/open-telemetry/semantic-conventions-genai', 'GenAI semantic conventions'], ['github.com', '/tracewell/sdk-js', 'tracewell/sdk-js'], ['stackoverflow.com', '/questions/78200100/opentelemetry-for-llm-calls', 'OpenTelemetry for LLM calls']],
    outro: 'Keep prompt and completion capture behind a flag so you can redact content in regulated environments.',
  },
}

const LEAD: Record<string, string> = {
  ChatGPT: '',
  Claude: 'Here is a quick, honest rundown. ',
  Gemini: 'Here are the options teams most often shortlist. ',
  Perplexity: 'Based on current docs, comparison posts and community threads: ',
}

const url = (domain: string, path: string) => `https://${domain}${path}`
const hash = (s: string) => { let h = 7; for (const ch of s) h = (h * 33 + ch.charCodeAt(0)) >>> 0; return h }

/** The tracewell page each prompt's answers cite. */
const youUrl = (p: PromptRow) => url(BRAND.domain, C[p.prompt].you[1])

function rotate<T>(list: T[], by: number): T[] {
  if (!list.length) return list
  const k = by % list.length
  return [...list.slice(k), ...list.slice(0, k)]
}

function buildChat(p: PromptRow, engine: string, engineIndex: number): Chat {
  const c = C[p.prompt]
  const rank = p.by_engine.find((e) => e.engine === engine)?.rank ?? null
  const lead = p.most_cited_domain && !p.most_cited_domain.is_you ? p.most_cited_domain.domain : null
  // Whoever the prompt's leading domain is stays near the top; the rest rotate per engine so each answer reads differently.
  let order = c.rivals.slice()
  const leadIdx = lead ? order.findIndex((e) => e[0].domain === lead) : -1
  const first = leadIdx >= 0 ? order.splice(leadIdx, 1)[0] : null
  order = rotate(order, engineIndex)
  if (first) order.unshift(first)
  type Row = { brand: Brand; take: string; link: string; title: string; you: boolean }
  const rows: Row[] = order.map(([b, t, path, title]) => ({ brand: b, take: t, link: url(b.domain, path), title, you: false }))
  if (rank != null) rows.splice(Math.min(rank - 1, rows.length), 0, { brand: YOU, take: c.you[0], link: youUrl(p), title: c.you[2], you: true })

  const md: string[] = [`${LEAD[engine]}${c.intro}`, '']
  rows.forEach((r, i) => md.push(`### ${i + 1}. ${r.brand.name}`, '', `${r.take} [${r.brand.domain}](${r.link})`, ''))
  md.push(c.outro)

  const sources: ChatSource[] = rows.map((r) => ({ url: r.link, domain: r.brand.domain, title: r.title }))
  const thirds = engine === 'Perplexity' ? c.third : c.third.slice(0, engine === 'Claude' ? 1 : 2)
  thirds.forEach(([d, path, title]) => sources.push({ url: url(d, path), domain: d, title }))

  const mentions: ChatMention[] = rows.map((r) => ({ name: r.brand.name, domain: r.brand.domain, is_you: r.you }))
  c.extra?.forEach((m) => { if (md[0].includes(m.name)) mentions.push(m) })

  const day = clusters.find((cl) => cl.slug === p.cluster_slug)?.last_run ?? '2026-11-06 09:12'
  const [d, t] = day.split(' ')
  const structured = engine === 'Claude' || engine === 'Gemini'
  const entities: StructuredEntity[] | undefined = structured
    ? rows.map((r, i) => ({ name: r.brand.name, domain: r.brand.domain, url: r.link, sourceUrl: r.link, sourceDomain: r.brand.domain, description: r.take, rank: i + 1, isYou: r.you }))
    : undefined
  return { engine, prompt: p.prompt, ts: `${d}T${t}:00Z`, rank, cited: rank != null, text: md.join('\n'), mentions, sources, ...(entities ? { intro: c.intro, entities } : {}) }
}

const CHATS = new Map<string, Chat>()
for (const p of prompts) ENGINES.forEach((engine, i) => CHATS.set(`${p.prompt}::${engine}`, buildChat(p, engine, i)))

/** One engine's answer to a prompt. */
export const chatFor = (prompt: string, engine: string): Chat | undefined => CHATS.get(`${prompt}::${engine}`)

/* ------------------------------------------------------------------ per-cluster results by engine */
const last7 = dates.slice(-7)

function dailyFor(prompt: string, engine: string, rank: number | null): PromptResult['daily_citations'] {
  const h = hash(`${prompt}|${engine}`)
  return last7.map((date, i) => {
    if (rank == null) return { date, status: i === 0 && h % 3 === 0 ? 'no_data' : 'not_cited' }
    // Mostly cited, with one or two misses; the latest day always matches the current state.
    const miss = i < 6 && (h + i * 3) % 5 === 0
    return { date, status: miss ? 'not_cited' : 'cited' }
  })
}

function resultFor(p: PromptRow, engine: string): PromptResult {
  const chat = chatFor(p.prompt, engine)!
  const rank = chat.rank
  const prevOverall = p.prev_rank
  const curOverall = p.current_rank
  let prev: number | null = null
  if (rank != null && prevOverall != null && curOverall != null) prev = Math.max(1, rank + (prevOverall - curOverall))
  const others = chat.sources.filter((s) => s.domain !== BRAND.domain)
  return {
    prompt: p.prompt,
    model: engine,
    provider: PROVIDER[engine],
    cited: rank != null,
    cited_urls: rank != null ? [youUrl(p)] : [],
    ranks: rank != null ? [rank] : [],
    other_urls: others.map((s, i) => `${s.url}\nRank: ${i + 1 + (rank != null && i + 1 >= rank ? 1 : 0)}`),
    daily_citations: dailyFor(p.prompt, engine, rank),
    run_timestamp: chat.ts,
    prev_rank: prev,
  }
}

/** Latest results for a cluster, grouped by engine (the real `latest_results_by_model`). */
export function resultsByModel(clusterSlug: string): Record<string, PromptResult[]> {
  const rows = prompts.filter((p) => p.cluster_slug === clusterSlug)
  const out: Record<string, PromptResult[]> = {}
  for (const engine of ENGINES) out[engine] = rows.map((p) => resultFor(p, engine))
  return out
}

export const trackedClusters = clusters.filter((c) => c.tracked && c.enabled)
