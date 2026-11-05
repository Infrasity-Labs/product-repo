// All page copy and mock-product data lives here so it can be edited without touching components.

export type Engine = { id: string; name: string; color: string; isNew?: boolean }

export const engines: Engine[] = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f' },
  { id: 'claude', name: 'Claude', color: '#d97757' },
  { id: 'gemini', name: 'Gemini', color: '#4285f4' },
  { id: 'perplexity', name: 'Perplexity', color: '#1f9a9a' },
  { id: 'aio', name: 'Google AI Overviews', color: '#f59e0b' },
  { id: 'aimode', name: 'Google AI Mode', color: '#ea4335' },
  { id: 'copilot', name: 'Microsoft Copilot', color: '#0f6cbd', isNew: true },
  { id: 'grok', name: 'Grok', color: '#0a0a0a', isNew: true },
]

export const compareRows: { label: string; general: string; upstream: string }[] = [
  { label: 'Built for', general: 'Consumer and enterprise brands', upstream: 'DevTool, AI agent and B2B SaaS startups' },
  { label: 'Engines tracked', general: 'Varies by plan', upstream: 'All 8, incl. Copilot and Grok' },
  { label: 'GitHub, Hacker News, dev.to and Reddit as sources', general: 'Lumped into "other"', upstream: 'Tracked one by one' },
  { label: 'Full answer and brand order for every run', general: 'Sometimes', upstream: 'Yes' },
  { label: 'Listicle contacts and ready pitches', general: 'No', upstream: 'Yes' },
  { label: 'Reddit and distribution gaps', general: 'No', upstream: 'Yes' },
  { label: 'Scan health and confidence ranges', general: 'Rarely', upstream: 'Yes' },
  { label: 'A team that can do the work for you', general: 'No', upstream: 'Optional, engineers by Infrasity' },
]

export const plans = [
  {
    name: 'Starter',
    price: '[PRICE]',
    blurb: 'For seed-stage teams finding their first AI citations.',
    features: ['[N] prompts', '[Engines included]', 'Model results and Sources', 'Weekly email report'],
    cta: 'Start free audit',
    variant: 'plain' as const,
  },
  {
    name: 'Growth',
    price: '[PRICE]',
    badge: 'Most teams',
    blurb: 'For Series A+ teams acting on the data every week.',
    features: ['[N] prompts, unlimited clusters', 'All 8 engines, incl. Copilot and Grok', 'Listicles, Reddit, Distribution, Actions', 'Slack alerts and CSV export'],
    cta: 'Start free audit',
    variant: 'featured' as const,
  },
  {
    name: 'Done for you',
    price: 'Custom',
    blurb: "Upstream plus Infrasity's team doing the work.",
    features: ['Everything in Growth', 'Content written by engineers', 'Listicle outreach and placements', 'Monthly report and strategy call'],
    cta: 'Talk to us',
    variant: 'dark' as const,
  },
]

// NOTE: draft answers, derived from what the page already claims. Review before launch.
export const faqs = [
  {
    q: 'Who is Upstream built for?',
    a: 'DevTool, AI agent and B2B SaaS startups whose buyers are engineers. Prompt sets, source tracking and listicle outreach are tuned for how developers search: SDKs, alternatives and how-tos.',
  },
  {
    q: 'Which AI engines do you track?',
    a: 'Eight: ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews, Google AI Mode, Microsoft Copilot and Grok. Every tracked prompt runs on all of them.',
  },
  {
    q: 'Why track Copilot and Grok?',
    a: 'Copilot sits inside VS Code, GitHub, Edge and Microsoft 365, right where engineers work. Grok pulls from a different set of sites than ChatGPT does. Being cited in one does not mean being cited in the other.',
  },
  {
    q: 'How often do you check the answers?',
    a: 'Each scan runs your prompts across every engine and stores the full answer. Scan health shows which engines ran, when they last ran, and how complete each scan was, before you read any numbers.',
  },
  {
    q: 'How is this different from an SEO rank tracker?',
    a: 'AI engines do not return ten blue links. They write one answer and cite a few sources. Upstream tracks whether you are named, in what order, and which GitHub repos, Reddit threads and listicles the engine trusted to get there.',
  },
  {
    q: 'Can your team do the work for us?',
    a: "Yes, optionally. The Done for you plan adds Infrasity's engineers: content written by engineers, listicle outreach and placements, and a monthly report with a strategy call.",
  },
  {
    q: "What's in the free audit?",
    a: 'A first report in 48 hours with no install: where you are cited today across the 8 engines, who gets recommended instead, which sources engines trust in your category, and what to ship next.',
  },
]

/* ---------- Product tour ---------- */

export type Tone = 'good' | 'bad' | 'warn' | 'info' | 'muted' | 'brand'
export type Cell = string | { bar: number; tone?: Tone; label?: string } | { tag: string; tone: Tone } | { dot: string; text: string }

export type TourTab = {
  id: string
  label: string
  desc: string
  title: string
  sub: string
  stats: { label: string; value: string; delta?: string; tone?: Tone }[]
  cols: string[]
  rows: Cell[][]
  /** Hidden from the tour tab list; only reachable from inside the mock app. */
  appOnly?: boolean
  /** Clicking a row jumps to this view. */
  rowTo?: string
}

export const tourTabs: TourTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    desc: 'Citation rate, share of voice and position across every engine, with insight cards that tell you where to look first.',
    title: 'AI visibility overview',
    sub: 'Tracewell · last scan Oct 27 · 172 runs · 3,190 answers in 30 days',
    stats: [
      { label: 'Citation rate', value: '45.9%', delta: '↑ 7.9 pts', tone: 'good' },
      { label: 'Share of voice', value: '8.6%', delta: '#1 of 1,732' },
      { label: 'Avg position', value: '#2.8', delta: 'lower is better' },
      { label: 'Prompts moving up', value: '17', delta: '↓ 18 vs last scan', tone: 'bad' },
    ],
    cols: ['Cluster', 'Citation rate', 'Change'],
    rows: [
      ['LLM Observability', { bar: 59, tone: 'brand', label: '59.3%' }, { tag: '↑ 10.4', tone: 'good' }],
      ['Agent Tracing', { bar: 41, tone: 'brand', label: '41.0%' }, { tag: '↑ 2.1', tone: 'good' }],
      ['Evals', { bar: 33, tone: 'brand', label: '33.6%' }, { tag: '→ 0.0', tone: 'muted' }],
      ['Prompt Management', { bar: 11, tone: 'bad', label: '11.2%' }, { tag: '↓ 0.4', tone: 'bad' }],
    ],
  },
  {
    id: 'prompts',
    label: 'Prompts',
    desc: 'Every question your buyers ask, grouped by cluster, with how often you are cited and where you rank.',
    title: 'Prompts',
    rowTo: 'results',
    sub: '85 tracked prompts across 4 clusters',
    stats: [
      { label: 'Tracked', value: '85' },
      { label: 'Cited in', value: '39', delta: 'of 85', tone: 'good' },
      { label: 'Not cited', value: '46', tone: 'bad' },
      { label: 'Avg position', value: '#2.8' },
    ],
    cols: ['Prompt', 'Cluster', 'Cited by', 'Position'],
    rows: [
      ['best LLM observability tool for startups', 'LLM Observability', { bar: 88, tone: 'good', label: '7 / 8' }, { tag: '#1', tone: 'good' }],
      ['how to trace AI agents in production', 'Agent Tracing', { bar: 63, tone: 'brand', label: '5 / 8' }, { tag: '#3', tone: 'info' }],
      ['langsmith alternatives', 'LLM Observability', { bar: 50, tone: 'brand', label: '4 / 8' }, { tag: '#2', tone: 'info' }],
      ['best prompt management tool', 'Prompt Management', { bar: 13, tone: 'bad', label: '1 / 8' }, { tag: '#6', tone: 'warn' }],
      ['open source LLM eval framework', 'Evals', { bar: 38, tone: 'brand', label: '3 / 8' }, { tag: '#4', tone: 'info' }],
    ],
  },
  {
    id: 'results',
    label: 'Model results',
    desc: 'The full answer every engine gave, the brand order it used, and every URL it cited.',
    title: 'Model results',
    sub: 'best LLM observability tool for startups · Oct 27',
    stats: [
      { label: 'Engines run', value: '8 / 8' },
      { label: 'You named by', value: '7', tone: 'good' },
      { label: 'Avg order', value: '#1.6' },
      { label: 'URLs cited', value: '34' },
    ],
    cols: ['Engine', 'Brand order', 'Cited URL', 'You'],
    rows: [
      [{ dot: '#10a37f', text: 'ChatGPT' }, 'Tracewell › Spanlight › Lumenlace', 'github.com/tracewell', { tag: '#1', tone: 'good' }],
      [{ dot: '#d97757', text: 'Claude' }, 'Tracewell › Evalkit › Spanlight', 'tracewell.dev/docs', { tag: '#1', tone: 'good' }],
      [{ dot: '#4285f4', text: 'Gemini' }, 'Spanlight › Tracewell › Lumenlace', 'news.ycombinator.com', { tag: '#2', tone: 'info' }],
      [{ dot: '#1f9a9a', text: 'Perplexity' }, 'Tracewell › Lumenlace › Spanlight', 'github.com/tracewell', { tag: '#1', tone: 'good' }],
      [{ dot: '#f59e0b', text: 'Google AI Overviews' }, 'Spanlight › Tracewell › Evalkit', 'tracewell.dev/docs', { tag: '#2', tone: 'info' }],
      [{ dot: '#ea4335', text: 'Google AI Mode' }, 'Tracewell › Spanlight › PromptGrid', 'dev.to/tracewell', { tag: '#1', tone: 'good' }],
      [{ dot: '#0f6cbd', text: 'Microsoft Copilot' }, 'Spanlight › Evalkit › Tracewell', 'reddit.com/r/LLMDevs', { tag: '#3', tone: 'warn' }],
      [{ dot: '#0a0a0a', text: 'Grok' }, 'Spanlight › Lumenlace', 'dev.to/spanlight', { tag: 'Not named', tone: 'bad' }],
    ],
  },
  {
    id: 'engines',
    label: 'Engines',
    desc: 'Compare how each of the 8 engines treats you, so you can see where one engine cites you and another does not.',
    title: 'Engines',
    rowTo: 'results',
    sub: '8 engines · last 30 days',
    stats: [
      { label: 'Best engine', value: 'ChatGPT', tone: 'good' },
      { label: 'Weakest', value: 'Grok', tone: 'bad' },
      { label: 'Spread', value: '38 pts' },
      { label: 'Engines live', value: '8 / 8' },
    ],
    cols: ['Engine', 'Citation rate', 'Share of voice', 'Avg position'],
    rows: [
      [{ dot: '#10a37f', text: 'ChatGPT' }, { bar: 71, tone: 'brand', label: '71%' }, '12.4%', '#1.9'],
      [{ dot: '#d97757', text: 'Claude' }, { bar: 64, tone: 'brand', label: '64%' }, '10.8%', '#2.2'],
      [{ dot: '#4285f4', text: 'Gemini' }, { bar: 58, tone: 'brand', label: '58%' }, '9.7%', '#2.4'],
      [{ dot: '#1f9a9a', text: 'Perplexity' }, { bar: 52, tone: 'brand', label: '52%' }, '9.1%', '#2.7'],
      [{ dot: '#f59e0b', text: 'Google AI Overviews' }, { bar: 47, tone: 'brand', label: '47%' }, '8.2%', '#3.0'],
      [{ dot: '#ea4335', text: 'Google AI Mode' }, { bar: 44, tone: 'brand', label: '44%' }, '7.4%', '#3.1'],
      [{ dot: '#0f6cbd', text: 'Microsoft Copilot' }, { bar: 36, tone: 'brand', label: '36%' }, '6.3%', '#3.4'],
      [{ dot: '#0a0a0a', text: 'Grok' }, { bar: 33, tone: 'bad', label: '33%' }, '4.9%', '#3.9'],
    ],
  },
  {
    id: 'clusters',
    label: 'Clusters',
    desc: 'Group prompts by buyer intent and see which topics you own and which ones competitors take.',
    title: 'Clusters',
    rowTo: 'prompts',
    sub: '4 active clusters · 85 prompts',
    stats: [
      { label: 'Strongest', value: 'LLM Observability', tone: 'good' },
      { label: 'Needs work', value: 'Prompt Mgmt', tone: 'bad' },
      { label: 'Clusters', value: '4' },
      { label: 'Prompts', value: '85' },
    ],
    cols: ['Cluster', 'Prompts', 'Citation rate', 'Top competitor'],
    rows: [
      ['LLM Observability', '31', { bar: 59, tone: 'brand', label: '59.3%' }, 'Spanlight'],
      ['Agent Tracing', '24', { bar: 41, tone: 'brand', label: '41.0%' }, 'Lumenlace'],
      ['Evals', '18', { bar: 34, tone: 'brand', label: '33.6%' }, 'Evalkit'],
      ['Prompt Management', '12', { bar: 11, tone: 'bad', label: '11.2%' }, 'PromptGrid'],
    ],
  },
  {
    id: 'sources',
    label: 'Sources',
    desc: 'Which sites AI trusts in your category, typed as competitor, reference, community or publisher, with your own tags on top.',
    title: 'Sources',
    sub: 'Domains engines cite in your category',
    stats: [
      { label: 'Domains cited', value: '1,732' },
      { label: 'Competitor', value: '214' },
      { label: 'Community', value: '388' },
      { label: 'Publisher', value: '602' },
    ],
    cols: ['Domain', 'Type', 'Cited', 'Share'],
    rows: [
      ['github.com', { tag: 'Reference', tone: 'info' }, '812', { bar: 82, tone: 'brand', label: '18%' }],
      ['reddit.com', { tag: 'Community', tone: 'brand' }, '640', { bar: 64, tone: 'brand', label: '14%' }],
      ['spanlight.io', { tag: 'Competitor', tone: 'bad' }, '412', { bar: 41, tone: 'brand', label: '9%' }],
      ['news.ycombinator.com', { tag: 'Community', tone: 'brand' }, '298', { bar: 30, tone: 'brand', label: '6%' }],
      ['dev.to', { tag: 'Publisher', tone: 'warn' }, '251', { bar: 25, tone: 'brand', label: '5%' }],
    ],
  },
  {
    id: 'listicles',
    label: 'Listicles',
    desc: 'The roundup posts engines pull from, who wrote them, and a ready pitch to earn your place.',
    title: 'Listicles',
    sub: '829 roundup pages cite your category',
    stats: [
      { label: 'Roundups', value: '829' },
      { label: 'You are in', value: '212', tone: 'good' },
      { label: 'You are missing', value: '617', tone: 'bad' },
      { label: 'Pitches ready', value: '48' },
    ],
    cols: ['Roundup', 'Domain', 'You', 'Next step'],
    rows: [
      ['Best LLM observability tools (2026)', 'dev.to', { tag: 'Listed', tone: 'good' }, 'Refresh listing'],
      ['Top prompt management tools', 'hashnode.com', { tag: 'Missing', tone: 'bad' }, { tag: 'Pitch ready', tone: 'brand' }],
      ['10 LangSmith alternatives', 'medium.com', { tag: 'Missing', tone: 'bad' }, { tag: 'Pitch ready', tone: 'brand' }],
      ['AI agent tooling roundup', 'daily.dev', { tag: 'Listed', tone: 'good' }, 'None needed'],
    ],
  },
  {
    id: 'reddit',
    label: 'Reddit',
    desc: 'The threads engines quote, which subreddits matter, and where a real answer from you would be cited.',
    title: 'Reddit',
    sub: '42 threads quoted by engines',
    stats: [
      { label: 'Threads quoted', value: '42' },
      { label: 'Subreddits', value: '17' },
      { label: 'You mentioned', value: '11', tone: 'good' },
      { label: 'Open gaps', value: '31', tone: 'bad' },
    ],
    cols: ['Thread', 'Subreddit', 'Quoted by', 'You'],
    rows: [
      ['What are you using for LLM tracing?', 'r/LLMDevs', { bar: 75, tone: 'brand', label: '6 engines' }, { tag: 'Mentioned', tone: 'good' }],
      ['Langsmith vs alternatives?', 'r/MachineLearning', { bar: 50, tone: 'brand', label: '4 engines' }, { tag: 'Gap', tone: 'bad' }],
      ['Best way to eval agents', 'r/LocalLLaMA', { bar: 38, tone: 'brand', label: '3 engines' }, { tag: 'Gap', tone: 'bad' }],
      ['Prompt versioning in prod', 'r/ExperiencedDevs', { bar: 25, tone: 'brand', label: '2 engines' }, { tag: 'Gap', tone: 'bad' }],
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution',
    desc: 'Where to publish next, ranked by how much engines already trust each channel in your category.',
    title: 'Distribution',
    sub: '7 channels with open gaps',
    stats: [
      { label: 'Channels', value: '7' },
      { label: 'Top channel', value: 'dev.to' },
      { label: 'Gap size', value: '63 pts', tone: 'bad' },
      { label: 'Quick wins', value: '3', tone: 'good' },
    ],
    cols: ['Channel', 'Engine trust', 'Your presence', 'Priority'],
    rows: [
      ['dev.to', { bar: 82, tone: 'brand', label: 'High' }, { bar: 20, tone: 'bad', label: 'Low' }, { tag: 'P1', tone: 'bad' }],
      ['Hashnode', { bar: 66, tone: 'brand', label: 'Medium' }, { bar: 10, tone: 'bad', label: 'Low' }, { tag: 'P1', tone: 'bad' }],
      ['Hacker News', { bar: 74, tone: 'brand', label: 'High' }, { bar: 48, tone: 'brand', label: 'Medium' }, { tag: 'P2', tone: 'warn' }],
      ['daily.dev', { bar: 52, tone: 'brand', label: 'Medium' }, { bar: 40, tone: 'brand', label: 'Medium' }, { tag: 'P3', tone: 'info' }],
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    desc: 'A short list of what to ship this week, each one tied to the gap it closes.',
    title: 'Actions',
    sub: '5 recommended actions this week',
    stats: [
      { label: 'Open', value: '5' },
      { label: 'High impact', value: '2', tone: 'bad' },
      { label: 'In sprint', value: '3', tone: 'good' },
      { label: 'Done', value: '12' },
    ],
    cols: ['Action', 'Closes gap in', 'Impact', 'Effort'],
    rows: [
      ['Publish "best prompt management tool" comparison', 'Prompt Management', { tag: 'High', tone: 'bad' }, 'M'],
      ['Pitch Hashnode roundup', 'Listicles', { tag: 'High', tone: 'bad' }, 'S'],
      ['Answer r/MachineLearning Langsmith thread', 'Reddit', { tag: 'Medium', tone: 'warn' }, 'S'],
      ['Add Copilot-focused integration page', 'Microsoft Copilot', { tag: 'Medium', tone: 'warn' }, 'M'],
    ],
  },
  {
    id: 'health',
    label: 'Scan health',
    desc: 'See whether every engine ran before you read the numbers. Small swings are marked as noise.',
    title: 'Scan health',
    sub: 'Last 30 days · 8 engines',
    stats: [
      { label: 'Answers collected', value: '3,190' },
      { label: 'Healthy engines', value: '7 of 8', tone: 'good' },
      { label: 'Prompts w/o data', value: '0' },
      { label: 'Last full run', value: 'Oct 27' },
    ],
    cols: ['Engine', 'Completion', 'Last run', 'Status'],
    rows: [
      [{ dot: '#10a37f', text: 'ChatGPT' }, { bar: 100, tone: 'good', label: '100%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#d97757', text: 'Claude' }, { bar: 100, tone: 'good', label: '100%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#4285f4', text: 'Gemini' }, { bar: 97, tone: 'good', label: '97%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#1f9a9a', text: 'Perplexity' }, { bar: 92, tone: 'warn', label: '92%' }, 'Oct 26', { tag: 'Partial', tone: 'warn' }],
      [{ dot: '#f59e0b', text: 'Google AI Overviews' }, { bar: 100, tone: 'good', label: '100%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#ea4335', text: 'Google AI Mode' }, { bar: 99, tone: 'good', label: '99%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#0f6cbd', text: 'Microsoft Copilot' }, { bar: 100, tone: 'good', label: '100%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
      [{ dot: '#0a0a0a', text: 'Grok' }, { bar: 100, tone: 'good', label: '100%' }, 'Oct 27', { tag: 'Healthy', tone: 'good' }],
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    appOnly: true,
    desc: 'Workspace, tracked brand and competitors.',
    title: 'Setup',
    sub: 'Tracewell · tracewell.dev',
    stats: [
      { label: 'Brand', value: 'Tracewell' },
      { label: 'Competitors', value: '5' },
      { label: 'Prompts', value: '85' },
      { label: 'Engines on', value: '8 / 8', tone: 'good' },
    ],
    cols: ['Competitor', 'Domain', 'Type', 'Cited'],
    rows: [
      ['Spanlight', 'spanlight.io', { tag: 'Competitor', tone: 'bad' }, '412'],
      ['Lumenlace', 'lumenlace.ai', { tag: 'Competitor', tone: 'bad' }, '287'],
      ['Evalkit', 'evalkit.dev', { tag: 'Competitor', tone: 'bad' }, '203'],
      ['PromptGrid', 'promptgrid.app', { tag: 'Competitor', tone: 'bad' }, '166'],
    ],
  },
  {
    id: 'sprints',
    label: 'Sprints',
    appOnly: true,
    desc: 'Weekly sprints that turn actions into shipped work.',
    title: 'Sprints',
    sub: '3 sprints this quarter',
    stats: [
      { label: 'Active', value: '1', tone: 'good' },
      { label: 'Actions in sprint', value: '3' },
      { label: 'Shipped', value: '12' },
      { label: 'Citation lift', value: '+4.8 pts', tone: 'good' },
    ],
    cols: ['Sprint', 'Dates', 'Actions', 'Status'],
    rows: [
      ['Close the prompt management gap', 'Oct 27 – Nov 2', '3 of 5', { tag: 'Active', tone: 'brand' }],
      ['Win Hashnode and dev.to roundups', 'Oct 13 – Oct 19', '4 of 4', { tag: 'Done', tone: 'good' }],
      ['Reddit answers for Langsmith threads', 'Oct 6 – Oct 12', '5 of 5', { tag: 'Done', tone: 'good' }],
    ],
  },
]
