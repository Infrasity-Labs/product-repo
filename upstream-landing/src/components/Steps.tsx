import { Check, GitBranch, MessageSquare, Newspaper } from 'lucide-react'
import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import '../styles/steps.css'

const prompts = ['best llm observability tool', 'langsmith alternatives', 'open source llm eval framework']

function PromptsViz() {
  return (
    <ul className="st-prompts">
      {prompts.map((p, i) => (
        <li key={p} style={{ opacity: 1 - i * 0.22 }}>
          <span className="st-dot" /> {p}
        </li>
      ))}
    </ul>
  )
}

function EnginesViz() {
  return (
    <div className="st-engines">
      {engines.map((e) => (
        <span key={e.id} className="st-engine"><EngineLogo engine={e.id} size={18} /></span>
      ))}
    </div>
  )
}

function SourcesViz() {
  return (
    <div className="st-sources">
      <span className="st-src"><GitBranch size={13} /> GitHub README</span>
      <span className="st-src"><MessageSquare size={13} /> r/LocalLLaMA thread</span>
      <span className="st-src"><Newspaper size={13} /> “Top 10” listicle</span>
    </div>
  )
}

function ShipViz() {
  return (
    <div className="st-ship">
      <div className="st-ship__row"><b>3 drafts staged</b><span>Nothing live</span></div>
      <button type="button" className="st-ship__btn" tabIndex={-1}><Check size={13} /> Approve and publish</button>
    </div>
  )
}

const steps = [
  { n: '01', title: 'Set up your prompts', desc: 'Start from the questions developers actually ask: SDKs, alternatives and how-tos.', viz: <PromptsViz /> },
  { n: '02', title: 'Pick the engines', desc: 'Track all 8 AI engines, including Microsoft Copilot and Grok, on every scan.', viz: <EnginesViz /> },
  { n: '03', title: 'Find the sources', desc: 'See which GitHub repos, Reddit threads and listicles each engine trusts.', viz: <SourcesViz /> },
  { n: '04', title: 'Ship the fix', desc: 'Upstream drafts the page, post or pitch. You approve before anything goes live.', viz: <ShipViz /> },
]

export function Steps() {
  return (
    <section className="sec" id="how">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__text">
            <p className="eyebrow">How it works</p>
            <h2 className="h2">From prompt to cited in four steps</h2>
            <p className="lead">Turn AI search insights into new developers, without adding headcount.</p>
          </div>
        </div>
        <div className="st-grid">
          {steps.map((s) => (
            <div key={s.n} className="st-cell">
              <div className="st-vis">{s.viz}</div>
              <div className="st-text">
                <span className="st-n mono">{s.n}</span>
                <h3 className="st-title">{s.title}</h3>
                <p className="st-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
