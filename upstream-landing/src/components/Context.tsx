import { useState } from 'react'
import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import '../styles/context.css'

const ROOT = { text: 'llm observability', vol: '74.2k', delta: '+1.2k', up: true }
const CHILDREN = [
  { text: 'best llm observability tool', vol: '8.1k', delta: '+420', up: true },
  { text: 'langsmith alternatives', vol: '5.4k', delta: '+310', up: true },
  { text: 'trace ai agents', vol: '3.2k', delta: '-90', up: false },
  { text: 'open source llm evals', vol: '2.7k', delta: '+180', up: true },
]
const TREE_ROOT_Y = 170
const TREE_YS = [52, 120, 220, 288]

const METRICS = {
  insights: { label: 'Answer Engine Insights', title: 'Visibility score by engine', values: [24, 9, 10, 28, 17, 13, 6, 4] },
  citations: { label: 'Citation Analytics', title: 'Citation share by engine', values: [18, 12, 7, 22, 25, 11, 9, 5] },
} as const
type MetricKey = keyof typeof METRICS

function PromptTree() {
  return (
    <div className="cx__vis" aria-label="Prompt tree for the query llm observability" role="img">
      <div className="cx__tree">
        <svg aria-hidden>
          {TREE_YS.map((y) => {
            const dy = y > TREE_ROOT_Y ? 1 : -1
            const d = `M200 ${TREE_ROOT_Y} H214 V${y - dy * 8} Q214 ${y} 222 ${y} H240`
            return <path key={y} d={d} />
          })}
        </svg>
        <div className="cx__chip cx__chip--root" style={{ left: 0, top: TREE_ROOT_Y, width: 200 }}>
          {ROOT.text} <b>{ROOT.vol}</b> <span className="cx__up">{ROOT.delta}</span>
        </div>
        {CHILDREN.map((c, i) => (
          <div key={c.text} className="cx__chip" style={{ left: 240, top: TREE_YS[i] }}>
            {c.text} <b>{c.vol}</b> <span className={c.up ? 'cx__up' : 'cx__down'}>{c.delta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisibilityCard() {
  const [key, setKey] = useState<MetricKey>('insights')
  const [hover, setHover] = useState<number | null>(null)
  const m = METRICS[key]
  return (
    <div className="cx__vis">
      <div className="cx__card">
        <div className="cx__card-top">
          <span className="cx__card-title">Reclaim rank #2 on AI Brand Visibility</span>
        </div>
        <div className="cx__card-top" style={{ marginTop: 10 }}>
          <div className="cx__mini" role="tablist" aria-label="Metric view">
            {(Object.keys(METRICS) as MetricKey[]).map((k) => (
              <button key={k} role="tab" aria-selected={k === key} onClick={() => setKey(k)}>
                {METRICS[k].label}
              </button>
            ))}
          </div>
          <span className="tag">Sample data</span>
        </div>
        <div className="cx__chart-title">{m.title}</div>
        <div className="cx__chart">
          <div className="cx__axis" aria-hidden>
            <span>30%</span>
            <span>20%</span>
            <span>10%</span>
            <span>0%</span>
          </div>
          <div className="cx__plot" data-hover={hover !== null ? '' : undefined} onMouseLeave={() => setHover(null)}>
            <div className="cx__grid" aria-hidden>
              <i /><i /><i /><i />
            </div>
            {engines.map((e, i) => (
              <div
                key={e.id}
                className="cx__col"
                data-on={hover === i}
                tabIndex={0}
                aria-label={`${e.name}: ${m.values[i]}%`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                {hover === i && (
                  <span className="cx__tip">
                    {e.name}
                    <small>{m.values[i]}%</small>
                  </span>
                )}
                <div className="cx__barwrap">
                  <div className="cx__bar" style={{ height: `${(m.values[i] / 30) * 100}%`, background: e.color }} />
                </div>
                <EngineLogo engine={e.id} size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Context() {
  return (
    <section className="sec" id="context">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__text">
            <h2 className="h2">Underpinned by the context devtool marketers need</h2>
            <p className="lead">Every AI Search signal and a living synthesis of your brand's data.</p>
          </div>
        </div>
        <div className="cx__grid2">
          <div className="cx__cell">
            <PromptTree />
            <div className="cx__text">
              <h3 className="cx__title">Know what people are asking AI</h3>
              <p className="cx__sub">Every prompt in your category, with volume and movement, so you chase the questions that matter.</p>
              <a className="btn btn--secondary" href="#product">See Prompts</a>
            </div>
          </div>
          <div className="cx__cell">
            <VisibilityCard />
            <div className="cx__text">
              <h3 className="cx__title">Understand what AI says back</h3>
              <p className="cx__sub">See how each engine describes you, who it recommends instead, and why.</p>
              <a className="btn btn--secondary" href="#engines">See Model results</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
