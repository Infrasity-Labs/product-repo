/*
 * Reddit threads page data (fictional, Tracewell). Shaped like content-repo `src/lib/geo-reddit-threads.ts`
 * (`RedditThreadRow`, subreddit roll-up, cumulative trend). Top rows match `data.redditThreads`.
 */
import { dates } from './data'

export interface RedditThreadRow {
  url: string; title: string; subreddit: string; cluster: string; citations: number; share_pct: number
  engines: Record<string, number>; mentioned: boolean | null
}

type E = [number, number, number, number] // ChatGPT, Claude, Gemini, Perplexity
const raw: Array<[string, string, string, number, E, boolean | null]> = [
  ['webdev', 'What are you using for LLM observability in 2026?', 'llm-observability', 14, [4, 2, 3, 5], false],
  ['LocalLLaMA', 'Self-hosted tracing for agent pipelines, what actually works?', 'llm-observability', 12, [3, 2, 2, 5], true],
  ['devops', 'Tracing SDK comparison, honest takes', 'tracing-sdks', 11, [3, 3, 1, 4], false],
  ['MachineLearning', '[D] How do you debug long-running LLM agents?', 'llm-observability', 10, [2, 3, 2, 3], null],
  ['programming', 'Open source tools for monitoring AI agents', 'llm-observability', 8, [2, 1, 2, 3], true],
  ['LangChain', 'Moving off LangSmith, what did you pick?', 'alternatives', 8, [2, 1, 1, 4], false],
  ['node', 'OpenTelemetry for LLM calls in Node: setup that survived production', 'tracing-sdks', 7, [2, 1, 1, 3], true],
  ['ExperiencedDevs', 'Evals for agents: what does your CI look like?', 'agent-evals', 7, [2, 2, 1, 2], false],
  ['SaaS', 'How do you get recommended by ChatGPT?', 'llm-observability', 6, [2, 0, 1, 3], false],
  ['mlops', 'Prompt versioning: git, a registry, or something else?', 'prompt-management', 6, [1, 2, 1, 2], false],
  ['OpenAI', 'Cost and latency tracing per prompt template', 'llm-observability', 6, [2, 1, 1, 2], true],
  ['LLMDevs', 'Spanlight vs Tracewell for tracing, anyone used both?', 'alternatives', 5, [1, 1, 1, 2], true],
  ['Python', 'Instrumenting FastAPI + LLM calls with OTel spans', 'tracing-sdks', 5, [1, 1, 1, 2], null],
  ['LLMDevs', 'Eval harness recommendations for tool-calling agents', 'agent-evals', 5, [1, 2, 0, 2], false],
  ['webdev', 'Is prompt drift a real problem or just vibes?', 'prompt-management', 4, [1, 1, 1, 1], false],
  ['devops', 'Alerting on LLM quality regressions', 'llm-observability', 4, [1, 1, 0, 2], null],
  ['MachineLearning', '[P] Lightweight prompt registry with diffing', 'prompt-management', 4, [1, 1, 1, 1], false],
  ['node', 'Best way to log token usage per request?', 'tracing-sdks', 3, [1, 0, 1, 1], true],
  ['ExperiencedDevs', 'What do you do when the model silently changes?', 'agent-evals', 3, [1, 1, 0, 1], false],
  ['mlops', 'Langfuse alternatives for a small team', 'alternatives', 3, [0, 1, 1, 1], false],
  ['programming', 'Show HN style: tracing agents without a vendor', 'tracing-sdks', 2, [0, 1, 0, 1], null],
  ['SaaS', 'Tools founders use to watch their AI features', 'llm-observability', 2, [1, 0, 0, 1], false],
]

const ENG = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity']
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
const total = raw.reduce((s, r) => s + r[3], 0)

export const redditThreadRows: RedditThreadRow[] = raw.map(([sub, title, cluster, citations, e, mentioned], i) => ({
  url: `https://reddit.com/r/${sub}/comments/${(1000 + i * 37).toString(36)}/${slugify(title)}/`,
  title, subreddit: sub, cluster, citations, share_pct: Math.round((citations / total) * 1000) / 10,
  engines: Object.fromEntries(ENG.map((n, k) => [n, e[k]]).filter(([, v]) => v)) as Record<string, number>, mentioned,
}))

const checked = redditThreadRows.filter((r) => r.mentioned != null)
const mentionedCount = checked.filter((r) => r.mentioned).length

const subMap = new Map<string, { subreddit: string; threads_in_top10: number; threads_tracked: number; total_citations: number; share_pct: number }>()
redditThreadRows.forEach((r, i) => {
  const s = subMap.get(r.subreddit) ?? { subreddit: r.subreddit, threads_in_top10: 0, threads_tracked: 0, total_citations: 0, share_pct: 0 }
  s.threads_tracked++
  s.total_citations += r.citations
  if (i < 10) s.threads_in_top10++
  subMap.set(r.subreddit, s)
})
export const subreddits = [...subMap.values()]
  .map((s) => ({ ...s, share_pct: Math.round((s.total_citations / total) * 1000) / 10 }))
  .sort((a, b) => b.total_citations - a.total_citations)

export const redditStats = {
  threads_cited: redditThreadRows.length,
  threads_cited_caption: '4 new vs previous 30 days',
  total_citations: total,
  total_citations_caption: 'across 52 tracked prompts',
  mention_rate_pct: Math.round((mentionedCount / checked.length) * 100),
  mention_rate_caption: `${mentionedCount} of ${checked.length} checked threads`,
  top_subreddit: subreddits[0],
  top_subreddit_caption: `${subreddits[0].threads_tracked} threads · ${subreddits[0].total_citations} citations`,
  not_mentioned_in_top10: redditThreadRows.slice(0, 10).filter((r) => r.mentioned !== true).length,
}

/** Cumulative threads-cited % and mention rate per day (30 points). */
export const redditTrend = dates.map((date, i) => ({
  date,
  threads_cited_pct: Math.min(100, Math.round(((i + 1) / dates.length) ** 0.7 * 1000) / 10),
  mention_rate_pct: i < 4 ? null : Math.round((24 + (i / (dates.length - 1)) * 14 + Math.sin(i * 1.3) * 2) * 10) / 10,
}))

export const sprintOptions = [
  { id: 's14', name: 'Sprint 14 · Nov 3 – Nov 16', status: 'current' as const },
  { id: 's15', name: 'Sprint 15 · Nov 17 – Nov 30', status: 'pending' as const },
  { id: 's13', name: 'Sprint 13 · Oct 20 – Nov 2', status: 'completed' as const },
]
