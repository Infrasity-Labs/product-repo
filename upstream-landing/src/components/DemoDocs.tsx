import { useState } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { tourTabs, type Cell } from '../content'
import { EngineLogo } from './EngineLogo'

/* Preview documents shown in the right pane of the hero demo. All data is sample data for the fictional brand "Tracewell". */

const GAP_ROWS: { prompt: string; chatgpt: boolean; copilot: boolean; grok: boolean; fix: string }[] = [
  { prompt: 'best LLM observability tool for startups', chatgpt: true, copilot: false, grok: false, fix: 'Reddit answer' },
  { prompt: 'how to trace AI agents in production', chatgpt: true, copilot: true, grok: false, fix: 'dev.to post' },
  { prompt: 'langsmith alternatives', chatgpt: true, copilot: false, grok: false, fix: 'Listicle pitch' },
  { prompt: 'open source LLM eval framework', chatgpt: true, copilot: false, grok: true, fix: 'GitHub README' },
]

/** 16px status dot. The tick path's bounding box is centred on (8, 8.15) so it sits dead-centre in the circle. */
function Dot({ on }: { on: boolean }) {
  return (
    <span className={`dd-dot ${on ? 'dd-dot--on' : ''}`} role="img" aria-label={on ? 'Cited' : 'Not cited'}>
      {on && (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path d="M4.6 8.3 6.9 10.6 11.4 5.7" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export function GapDoc() {
  return (
    <div className="dd-paper">
      <div className="dd-paper__nav">
        <span className="dd-paper__brand">tracewell.</span>
        <span className="dd-paper__link">Gap report <ExternalLink size={10} /></span>
      </div>
      <div className="dd-paper__body">
        <div className="dd-paper__eyebrow"><i /> The Copilot gap</div>
        <h4 className="dd-paper__h">Cited by ChatGPT.<br />Skipped by Copilot.</h4>
        <p className="dd-paper__p">
          11 prompts where one engine names Tracewell and another recommends a competitor. Each row has a staged fix.
        </p>
        <div className="dd-grid">
          <div className="dd-grid__head">
            <span>Prompt</span>
            <span><EngineLogo engine="chatgpt" size={13} /></span>
            <span><EngineLogo engine="copilot" size={13} /></span>
            <span><EngineLogo engine="grok" size={13} /></span>
            <span>Staged fix</span>
          </div>
          {GAP_ROWS.map((r) => (
            <div className="dd-grid__row" key={r.prompt}>
              <span className="dd-grid__prompt">{r.prompt}</span>
              <span><Dot on={r.chatgpt} /></span>
              <span><Dot on={r.copilot} /></span>
              <span><Dot on={r.grok} /></span>
              <span><em data-k={r.fix.split(' ')[0].toLowerCase()}>{r.fix}</em></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const THREADS = [
  { sub: 'r/LLMDevs', title: 'Best way to trace agents in prod?', quotes: 14 },
  { sub: 'r/LocalLLaMA', title: 'LangSmith alternatives that self-host', quotes: 11 },
  { sub: 'r/MachineLearning', title: 'Evaluating RAG pipelines without a giant eval set', quotes: 8 },
  { sub: 'r/devops', title: 'Observability for LLM apps, what are you using?', quotes: 6 },
]

export function RedditDoc() {
  const [sent, setSent] = useState<Record<number, boolean>>({})
  return (
    <div className="dd-paper">
      <div className="dd-paper__nav">
        <span className="dd-paper__brand">tracewell.</span>
        <span className="dd-paper__link">Reddit <ExternalLink size={10} /></span>
      </div>
      <div className="dd-paper__body">
        <div className="dd-paper__eyebrow"><i /> Threads engines quote</div>
        <h4 className="dd-paper__h">Five replies,<br />staged as drafts.</h4>
        <p className="dd-paper__p">42 threads are quoted by engines this month. Tracewell is missing from most of them.</p>
        <div className="dd-list">
          {THREADS.map((t, i) => (
            <div className="dd-list__row" key={t.title}>
              <div>
                <span className="dd-list__title">{t.title}</span>
                <span className="dd-list__meta">{t.sub} · quoted in {t.quotes} answers</span>
              </div>
              <button type="button" className={`dd-chipbtn ${sent[i] ? 'dd-chipbtn--on' : ''}`} onClick={() => setSent((s) => ({ ...s, [i]: !s[i] }))}>
                {sent[i] ? <><Check size={11} /> Approved</> : 'Approve draft'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const LISTICLES = [
  { site: 'dev.to', title: 'Top 10 LLM observability tools in 2026', contact: 'Editor found' },
  { site: 'hashnode.dev', title: 'Tracing AI agents: the tools worth using', contact: 'Author found' },
  { site: 'medium.com', title: 'LangSmith alternatives, compared', contact: 'Author found' },
  { site: 'daily.dev', title: 'The LLM eval stack, explained', contact: 'Editor found' },
]

export function ListicleDoc() {
  const [sent, setSent] = useState<Record<number, boolean>>({})
  return (
    <div className="dd-paper">
      <div className="dd-paper__nav">
        <span className="dd-paper__brand">tracewell.</span>
        <span className="dd-paper__link">Listicles <ExternalLink size={10} /></span>
      </div>
      <div className="dd-paper__body">
        <div className="dd-paper__eyebrow"><i /> Roundups to win</div>
        <h4 className="dd-paper__h">Four pitches,<br />ready to send.</h4>
        <p className="dd-paper__p">829 roundup pages cite your category. These rank for prompts where Tracewell is not named.</p>
        <div className="dd-list">
          {LISTICLES.map((t, i) => (
            <div className="dd-list__row" key={t.title}>
              <div>
                <span className="dd-list__title">{t.title}</span>
                <span className="dd-list__meta">{t.site} · {t.contact}</span>
              </div>
              <button type="button" className={`dd-chipbtn ${sent[i] ? 'dd-chipbtn--on' : ''}`} onClick={() => setSent((s) => ({ ...s, [i]: !s[i] }))}>
                {sent[i] ? <><Check size={11} /> Queued</> : 'Send pitch'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TONE_CLASS: Record<string, string> = { good: 'tag--good', bad: 'tag--bad', warn: 'tag--warn', info: 'tag--info', brand: 'tag--brand', muted: '' }

function CellView({ cell }: { cell: Cell }) {
  if (typeof cell === 'string') return <>{cell}</>
  if ('bar' in cell) {
    return (
      <span className="dd-bar">
        <span className="dd-bar__track"><i className={`dd-bar__fill dd-bar__fill--${cell.tone ?? 'brand'}`} style={{ width: `${cell.bar}%` }} /></span>
        {cell.label && <span className="dd-bar__label">{cell.label}</span>}
      </span>
    )
  }
  if ('tag' in cell) return <span className={`tag ${TONE_CLASS[cell.tone]}`}>{cell.tag}</span>
  return (
    <span className="dd-engine">
      <EngineLogo engine={cell.text} size={14} />
      {cell.text}
    </span>
  )
}

/** Table view driven by the product tour data in content.ts. */
export function DataView({ tabId }: { tabId: string }) {
  const tab = tourTabs.find((t) => t.id === tabId) ?? tourTabs[0]
  return (
    <div className="dd-data" key={tab.id} data-lenis-prevent>
      <div className="dd-data__head">
        <h4>{tab.title}</h4>
        <p>{tab.sub}</p>
      </div>
      <div className="dd-stats">
        {tab.stats.map((s) => (
          <div className="dd-stat" key={s.label}>
            <span className="dd-stat__label">{s.label}</span>
            <span className="dd-stat__value">{s.value}</span>
            {s.delta && <span className={`dd-stat__delta dd-stat__delta--${s.tone ?? 'muted'}`}>{s.delta}</span>}
          </div>
        ))}
      </div>
      <div className="dd-table" style={{ ['--cols' as string]: tab.cols.length }}>
        <div className="dd-table__row dd-table__row--head">
          {tab.cols.map((c) => <span key={c}>{c}</span>)}
        </div>
        {tab.rows.map((row, i) => (
          <div className="dd-table__row" key={i}>
            {row.map((cell, j) => <span key={j}><CellView cell={cell} /></span>)}
          </div>
        ))}
      </div>
    </div>
  )
}
