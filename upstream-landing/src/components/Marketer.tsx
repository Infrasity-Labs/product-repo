import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ChevronRight, FileText, Link2, ListChecks, MessageSquare, Search, Send, BarChart3, Sparkles, Mail, type LucideIcon } from 'lucide-react'
import { Reveal } from './Reveal'
import '../styles/marketer.css'

type Row = { icon: LucideIcon; name: string; meta: string }
type Tab = {
  id: string
  label: string
  icon: LucideIcon
  title: string
  desc: string
  user: string
  bot: string
  listTitle: string
  action: string
  done: string
  rows: Row[]
}

const AUTO_MS = 6000

const TABS: Tab[] = [
  {
    id: 'prompts', label: 'Prompts', icon: Search,
    title: 'Find the questions you are missing from',
    desc: 'Surfaces buyer prompts where Copilot or Grok skip Tracewell while rivals get named, ranked by volume.',
    user: 'Which prompts do Copilot and Grok answer without mentioning us? Draft fixes for the biggest ones.',
    bot: 'Found 12 prompts where Tracewell is missing. Drafted answer pages for the top five and staged them for review.',
    listTitle: 'Prompts', action: 'Approve all', done: 'Approved',
    rows: [
      { icon: Search, name: 'best llm observability tool for startups', meta: '8.1k / mo' },
      { icon: Search, name: 'langsmith alternatives', meta: '5.4k / mo' },
      { icon: Search, name: 'how to trace ai agents in production', meta: '3.2k / mo' },
      { icon: Search, name: 'open source llm evals framework', meta: '2.7k / mo' },
      { icon: Search, name: 'monitor rag pipeline latency', meta: '1.6k / mo' },
      { icon: Search, name: 'prompt versioning tools compared', meta: '980 / mo' },
    ],
  },
  {
    id: 'sources', label: 'Sources', icon: Link2,
    title: 'See what engines actually trust',
    desc: 'Maps the GitHub repos, docs and posts each engine cites, and which ones your brand is absent from.',
    user: 'What do engines cite when they recommend Spanlight and Lumenlace but not us?',
    bot: 'Most citations come from six pages. I added Tracewell to the three you control and drafted outreach for the rest.',
    listTitle: 'Cited sources', action: 'Approve all', done: 'Approved',
    rows: [
      { icon: Link2, name: 'github.com/spanlight/awesome-llm-ops', meta: '41 citations' },
      { icon: Link2, name: 'docs.lumenlace.dev/tracing', meta: '29 citations' },
      { icon: Link2, name: 'dev.to/t/llmobservability', meta: '18 citations' },
      { icon: Link2, name: 'stackoverflow.com/q/ai-agent-tracing', meta: '14 citations' },
      { icon: Link2, name: 'medium.com/evalkit-vs-promptgrid', meta: '9 citations' },
      { icon: Link2, name: 'news.ycombinator.com/item?id=sample', meta: '6 citations' },
    ],
  },
  {
    id: 'reddit', label: 'Reddit', icon: MessageSquare,
    title: 'Answer the threads engines read',
    desc: 'Finds live Reddit threads that AI engines pull from and drafts helpful, non-promotional replies for you to post.',
    user: 'Any Reddit threads where people are asking about tracing agents? Draft replies I can post.',
    bot: 'Four threads are being cited by Perplexity and ChatGPT right now. Replies are drafted, each leads with the answer.',
    listTitle: 'Threads to answer', action: 'Approve all', done: 'Approved',
    rows: [
      { icon: MessageSquare, name: 'r/LocalLLaMA: how do you debug agent loops?', meta: '312 upvotes' },
      { icon: MessageSquare, name: 'r/MachineLearning: langsmith vs open source', meta: '188 upvotes' },
      { icon: MessageSquare, name: 'r/devops: monitoring LLM apps in prod', meta: '97 upvotes' },
      { icon: MessageSquare, name: 'r/ExperiencedDevs: evals that catch regressions', meta: '64 upvotes' },
      { icon: MessageSquare, name: 'r/startups: cheapest LLM observability', meta: '41 upvotes' },
      { icon: MessageSquare, name: 'r/AI_Agents: tracing tool calls', meta: '33 upvotes' },
    ],
  },
  {
    id: 'listicles', label: 'Listicles', icon: ListChecks,
    title: 'Get into the lists engines quote',
    desc: 'Finds the "best of" roundups that rank above you, the contact to reach, and a ready pitch for each.',
    user: 'Which listicles should we pitch to get named for LLM observability?',
    bot: 'Five roundups are cited more than any other page type. I found a contact for each and wrote a pitch.',
    listTitle: 'Listicles to pitch', action: 'Send pitches', done: 'Queued',
    rows: [
      { icon: Mail, name: 'Best LLM observability tools (2026)', meta: 'Pitch ready' },
      { icon: Mail, name: '12 LangSmith alternatives for teams', meta: 'Pitch ready' },
      { icon: Mail, name: 'Top AI agent debugging platforms', meta: 'Contact found' },
      { icon: Mail, name: 'Open source tools for LLM evals', meta: 'Pitch ready' },
      { icon: Mail, name: 'The AI engineer toolbox, compared', meta: 'Contact found' },
      { icon: Mail, name: 'RAG monitoring tools worth trying', meta: 'Pitch ready' },
    ],
  },
  {
    id: 'distribution', label: 'Distribution', icon: Send,
    title: 'Ship it where engines will see it',
    desc: 'Turns each new page into a post for dev.to, Hashnode and Hacker News, scheduled and ready to approve.',
    user: 'Distribute the new tracing guide so engines can pick it up.',
    bot: 'Scheduled the tracing guide across four channels with tailored titles. Nothing goes out until you approve.',
    listTitle: 'Distribution queue', action: 'Publish', done: 'Scheduled',
    rows: [
      { icon: FileText, name: 'dev.to: Tracing AI agents without the guesswork', meta: 'Tue 9:00' },
      { icon: FileText, name: 'Hashnode: A field guide to LLM evals', meta: 'Tue 11:30' },
      { icon: FileText, name: 'Hacker News: Show HN, Tracewell traces', meta: 'Wed 8:00' },
      { icon: FileText, name: 'GitHub: add to awesome-llm-ops', meta: 'Draft PR' },
      { icon: FileText, name: 'LinkedIn: launch recap post', meta: 'Thu 10:00' },
      { icon: FileText, name: 'Newsletter: monthly changelog', meta: 'Fri 9:00' },
    ],
  },
  {
    id: 'reports', label: 'Reports', icon: BarChart3,
    title: 'Know if the work moved the needle',
    desc: 'Weekly reports tie every shipped page and post to changes in visibility, citations and share of voice.',
    user: 'Summarise what moved our visibility this month.',
    bot: 'Visibility is up 6.4 points. Most of the lift came from the two listicles and the Reddit answers shipped in week two.',
    listTitle: 'Reports', action: 'Share', done: 'Shared',
    rows: [
      { icon: FileText, name: 'Weekly visibility summary', meta: '+2.1 pts' },
      { icon: FileText, name: 'Citation gains by engine', meta: '+38 cites' },
      { icon: FileText, name: 'Share of voice vs Spanlight', meta: '+4.7%' },
      { icon: FileText, name: 'Copilot and Grok coverage', meta: '+12 prompts' },
      { icon: FileText, name: 'Top converting sources', meta: '9 pages' },
      { icon: FileText, name: 'Next best actions', meta: '7 items' },
    ],
  },
]

function Glyph() {
  return (
    <svg className="mk__glyph" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0a0a12" />
      <path d="M16 7v13M10 13l6-6 6 6M10 24c0-3 2.5-4 6-4s6 1 6 4" fill="none" stroke="#8b7bff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Marketer() {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const gridRef = useRef<HTMLDivElement>(null)
  const inView = useInView(gridRef, { margin: '-20% 0px -20% 0px' })
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const auto = inView && !touched
  const tab = TABS[active]

  useEffect(() => {
    if (!auto) return
    const t = setTimeout(() => setActive((a) => (a + 1) % TABS.length), AUTO_MS)
    return () => clearTimeout(t)
  }, [auto, active])

  const select = (i: number) => {
    setTouched(true)
    setActive(i)
  }

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const i = e.key === 'Home' ? 0 : TABS.length - 1
      select(i)
      refs.current[i]?.focus()
    } else if (dir) {
      e.preventDefault()
      const i = (active + dir + TABS.length) % TABS.length
      select(i)
      refs.current[i]?.focus()
    }
  }

  return (
    <section className="sec" id="product">
      <div className="shell">
        <div className="sec-head">
          <Reveal>
            <div className="sec-head__text">
              <h2 className="h2"><Glyph />Upstream makes it possible</h2>
              <p className="lead">It finds the work worth doing, drafts it, and pings you for approval.</p>
            </div>
          </Reveal>
        </div>
        <div className="cg cg--2 mk__grid" ref={gridRef}>
          <div className="mk__left">
            <div className="mk__tabs" role="tablist" aria-label="What Upstream does" onKeyDown={onKey}>
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => { refs.current[i] = el }}
                  role="tab"
                  id={`mk-tab-${t.id}`}
                  aria-selected={i === active}
                  aria-controls="mk-panel"
                  tabIndex={i === active ? 0 : -1}
                  className="pilltab"
                  onClick={() => select(i)}
                >
                  <t.icon aria-hidden />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mk__copy">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={tab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h3 className="mk__title">{tab.title}</h3>
                  <p className="mk__desc">{tab.desc}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mk__bar" data-paused={!auto} aria-hidden>
                {TABS.map((t, i) => (
                  <span key={t.id} data-active={i === active && auto} data-done={i < active || (i === active && !auto)}>
                    <i key={`${active}-${auto}`} style={{ ['--mk-dur' as string]: `${AUTO_MS}ms` }} />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mk__right" role="tabpanel" id="mk-panel" aria-labelledby={`mk-tab-${tab.id}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab.id} className="mk__chat" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <motion.div className="mk__user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
                  {tab.user}
                </motion.div>
                <motion.div className="mk__bot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
                  <span className="mk__bot-ic"><Sparkles color="#8b7bff" aria-hidden /></span>
                  <span>{tab.bot}</span>
                </motion.div>
                <motion.div className="mk__list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
                  <div className="mk__list-head">
                    <span>{tab.listTitle}</span>
                    <button className="mk__pub" data-done={!!done[tab.id]} onClick={() => setDone((d) => ({ ...d, [tab.id]: !d[tab.id] }))}>
                      {done[tab.id] ? tab.done : tab.action}
                    </button>
                  </div>
                  {tab.rows.map((r, i) => (
                    <motion.div key={r.name} className="mk__row" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.65 + i * 0.07 }}>
                      <r.icon aria-hidden />
                      <span className="mk__row-name">{r.name}</span>
                      <span className="mk__row-meta">{r.meta}</span>
                      <ChevronRight className="mk__row-chev" aria-hidden />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
