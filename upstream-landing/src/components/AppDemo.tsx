import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowUp, ChevronDown, ChevronsUpDown, Download, FileText, Gauge, Inbox, Link2, ListChecks, MessageCircle,
  MessagesSquare, Mic, PanelRight, Plus, Sparkles, X, Layers, HeartPulse, Check,
} from 'lucide-react'
import { GapDoc, RedditDoc, ListicleDoc, DataView } from './DemoDocs'
import '../styles/demo.css'

type Conv = {
  id: string
  title: string
  user: string
  reply: [string, string]
  agent: string
  docTitle: string
  doc: ReactNode
}

const convs: Conv[] = [
  {
    id: 'gap',
    title: 'Copilot and Grok gaps',
    user: 'Find the prompts where Copilot and Grok skip us and draft the fixes.',
    reply: [
      'ChatGPT cites Tracewell on most of these prompts, but Copilot and Grok keep recommending Spanlight and Lumenlace. Both lean on Reddit and dev.to, where we have almost no presence.',
      'I found 11 prompts with the gap and staged a fix for each: two dev.to posts, three Reddit answers and one listicle pitch. Nothing goes live until you approve it.',
    ],
    agent: 'Gap finder',
    docTitle: 'Copilot gap report',
    doc: <GapDoc />,
  },
  {
    id: 'reddit',
    title: 'Reddit answers',
    user: 'Which Reddit threads do engines quote when people ask about LangSmith alternatives?',
    reply: [
      'Engines quoted 42 threads this month. Nine of them sit in r/LLMDevs and r/LocalLLaMA, and Tracewell is not mentioned in any of them.',
      'I drafted replies for the four highest-impact threads, written as a real answer first and a mention second. Approve the ones you like.',
    ],
    agent: 'Reddit agent',
    docTitle: 'Thread replies',
    doc: <RedditDoc />,
  },
  {
    id: 'listicle',
    title: 'Listicle pitches',
    user: 'Pitch the roundups where we are missing.',
    reply: [
      '829 roundup pages cite your category. Fourteen of them rank for prompts where engines do not name Tracewell, and I found a contact for each.',
      'Here are the four with the biggest upside, each with a ready pitch. Send the ones you want and I will track whether engines pick them up.',
    ],
    agent: 'Listicle agent',
    docTitle: 'Listicle pitches',
    doc: <ListicleDoc />,
  },
]

const dataNav: { id: string; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Gauge /> },
  { id: 'prompts', label: 'Prompts', icon: <MessagesSquare /> },
  { id: 'results', label: 'Model results', icon: <Layers /> },
  { id: 'sources', label: 'Sources', icon: <Link2 /> },
  { id: 'reddit', label: 'Reddit', icon: <MessageCircle /> },
  { id: 'listicles', label: 'Listicles', icon: <ListChecks /> },
  { id: 'health', label: 'Scan health', icon: <HeartPulse /> },
]

type Msg = { role: 'user' | 'bot'; text: string }

export function AppDemo() {
  const [mode, setMode] = useState<'assistant' | 'analytics'>('assistant')
  const [view, setView] = useState('overview')
  const [convId, setConvId] = useState('gap')
  const [extra, setExtra] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [preview, setPreview] = useState(true)
  const [exported, setExported] = useState(false)
  const body = useRef<HTMLDivElement>(null)

  const conv = convs.find((c) => c.id === convId) ?? convs[0]

  useEffect(() => {
    const el = body.current
    if (el) el.scrollTop = el.scrollHeight
  }, [extra])

  const openConv = (id: string) => {
    setMode('assistant')
    setConvId(id)
    setExtra([])
    setExported(false)
    setPreview(true)
  }
  const openView = (id: string) => {
    setMode('analytics')
    setView(id)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (!q) return
    setDraft('')
    setExtra((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'bot', text: `Looking into "${q}" across all 8 engines now. I will stage anything I change as a draft, and nothing goes live until you approve it.` },
    ])
  }

  return (
    <div className="ad" role="group" aria-label="Interactive product demo">
      <div className="ad__frame">
        {/* sidebar */}
        <aside className="ad__side">
          <div className="ad__ws">
            <span className="ad__ws-badge">T.</span>
            <span className="ad__ws-name">Tracewell</span>
            <ChevronsUpDown size={13} className="ad__muted" />
            <Inbox size={15} className="ad__ws-inbox" />
          </div>

          <div className="ad__seg" role="tablist" aria-label="Mode">
            <button type="button" role="tab" aria-selected={mode === 'assistant'} onClick={() => setMode('assistant')}>Assistant</button>
            <button type="button" role="tab" aria-selected={mode === 'analytics'} onClick={() => setMode('analytics')}>Analytics</button>
          </div>

          <nav className="ad__nav" aria-label="Workspace">
            <button type="button" className={mode === 'assistant' ? 'is-on' : ''} onClick={() => setMode('assistant')}>
              <Sparkles /> Assistant
            </button>
            {dataNav.map((n) => (
              <button type="button" key={n.id} className={mode === 'analytics' && view === n.id ? 'is-on' : ''} onClick={() => openView(n.id)}>
                {n.icon} {n.label}
              </button>
            ))}
          </nav>

          <div className="ad__recents">
            <span className="ad__recents-label">Recents <ChevronDown size={12} /></span>
            {convs.map((c) => (
              <button type="button" key={c.id} className={mode === 'assistant' && convId === c.id ? 'is-on' : ''} onClick={() => openConv(c.id)}>
                {c.title}
              </button>
            ))}
          </div>
          <div className="ad__sample">Sample data</div>
        </aside>

        {mode === 'analytics' ? (
          <div className="ad__main">
            <div className="ad__head">
              <span className="ad__title">Analytics</span>
              <span className="ad__live"><i /> Live</span>
            </div>
            <DataView tabId={view} />
          </div>
        ) : (
          <div className="ad__split">
            {/* chat */}
            <section className="ad__chat">
              <div className="ad__head">
                <span className="ad__title">{conv.title} <ChevronDown size={12} /></span>
                <button type="button" className="ad__icon" aria-label={preview ? 'Hide preview' : 'Show preview'} onClick={() => setPreview((v) => !v)}>
                  <PanelRight size={15} />
                </button>
              </div>

              <div className="ad__scroll" ref={body} data-lenis-prevent>
                <div className="ad__bubble">{conv.user}</div>

                {conv.reply.map((p, i) => <p className="ad-bot" key={i}>{p}</p>)}

                <div className="ad__worked"><Check size={12} /> Worked for <b>10s</b></div>

                <button type="button" className="ad__exec" onClick={() => setPreview(true)}>
                  <span>Executed</span>
                  <b><Sparkles size={12} /> {conv.agent}</b>
                  <em>{conv.docTitle}</em>
                </button>

                {extra.map((m, i) =>
                  m.role === 'user' ? (
                    <div className="ad__bubble" key={i}>{m.text}</div>
                  ) : (
                    <p className="ad-bot" key={i}>{m.text}</p>
                  ),
                )}
              </div>

              <form className="ad__input" onSubmit={submit}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask a question or make a change"
                  aria-label="Ask the assistant"
                />
                <div className="ad__input-row">
                  <button type="button" className="ad__icon" aria-label="Attach"><Plus size={15} /></button>
                  <span className="ad__spacer" />
                  <button type="button" className="ad__icon" aria-label="Dictate"><Mic size={14} /></button>
                  <button type="submit" className="ad__send" aria-label="Send" disabled={!draft.trim()}><ArrowUp size={14} /></button>
                </div>
              </form>
            </section>

            {/* preview */}
            {preview && (
              <section className="ad__preview">
                <div className="ad__tabs">
                  <span className="ad__tab"><FileText size={12} /> {conv.docTitle}
                    <button type="button" aria-label="Close preview" onClick={() => setPreview(false)}><X size={12} /></button>
                  </span>
                  <button type="button" className="ad__icon" aria-label="New tab"><Plus size={14} /></button>
                </div>
                <div className="ad__phead">
                  <span>{conv.docTitle}</span>
                  <button type="button" className="ad__export" onClick={() => setExported((v) => !v)}>
                    {exported ? <><Check size={12} /> Exported</> : <><Download size={12} /> Export</>}
                  </button>
                </div>
                <div className="ad__doc" key={conv.id}>{conv.doc}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
