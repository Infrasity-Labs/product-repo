import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import '../styles/results.css'

type Report =
  | { kind: 'bars'; title: string; unit: string; rows: [string, number][] }
  | { kind: 'trend'; title: string; unit: string; points: number[]; labels: [string, string] }

type Card = { stat: string; desc: string; theme: 'a' | 'b' | 'c' | 'd' | 'e' | 'f'; art: 'rings' | 'grid' | 'bars' | 'wave' | 'dots' | 'steps'; report: Report }

const cards: Card[] = [
  { stat: '45.9%', desc: 'Share of voice across 8 engines after shipping the comparison pages.', theme: 'a', art: 'rings',
    report: { kind: 'trend', title: 'Share of voice, last 12 weeks', unit: '%', points: [18, 20, 19, 23, 26, 25, 30, 33, 36, 39, 43, 45.9], labels: ['Wk 1', 'Wk 12'] } },
  { stat: '8 / 8', desc: 'Engines now mention Tracewell for "best SDK for X" prompts.', theme: 'b', art: 'grid',
    report: { kind: 'bars', title: 'Mention rate by engine', unit: '%', rows: [['ChatGPT', 71], ['Claude', 64], ['Gemini', 58], ['Perplexity', 77], ['AI Overviews', 49], ['AI Mode', 52], ['Copilot', 41], ['Grok', 38]] } },
  { stat: '48h', desc: 'From an engine citing a stale claim to a fix shipped and re-scanned.', theme: 'c', art: 'steps',
    report: { kind: 'bars', title: 'Hours to resolve, by issue type', unit: 'h', rows: [['Inaccurate claim', 48], ['Missing comparison', 72], ['Stale docs page', 36], ['Listicle gap', 96]] } },
  { stat: '+7.9 pts', desc: 'Citation share lift in the first month on Reddit-sourced prompts.', theme: 'd', art: 'wave',
    report: { kind: 'trend', title: 'Citation share, Reddit prompts', unit: '%', points: [12, 12.5, 13, 14.2, 15.1, 16.8, 17.5, 19.9], labels: ['Week 0', 'Week 4'] } },
  { stat: '12 repos', desc: 'GitHub repositories engines quote when answering about your category.', theme: 'e', art: 'dots',
    report: { kind: 'bars', title: 'Citations by GitHub repository', unit: '', rows: [['tracewell/sdk-js', 34], ['spanlight/otel-kit', 22], ['evalkit/evals', 19], ['promptgrid/core', 14], ['lumenlace/agent', 9]] } },
  { stat: '3.2×', desc: 'More AI referral visits after the listicle and docs fixes landed.', theme: 'f', art: 'bars',
    report: { kind: 'trend', title: 'AI referral visits (index, week 0 = 1.0)', unit: '×', points: [1, 1.1, 1.3, 1.2, 1.7, 2.1, 2.6, 3.2], labels: ['Week 0', 'Week 8'] } },
]

function Art({ kind }: { kind: Card['art'] }) {
  switch (kind) {
    case 'rings':
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {[80, 140, 200, 260, 320].map((r) => <circle key={r} cx="470" cy="150" r={r} fill="none" stroke="currentColor" strokeOpacity={0.3} />)}
          <circle cx="470" cy="150" r="9" fill="currentColor" />
        </svg>
      )
    case 'grid':
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={300 + (i % 4) * 78} y={50 + Math.floor(i / 4) * 78} width="62" height="62" rx="14" fill="currentColor" fillOpacity={0.1 + (i % 3) * 0.08} />
          ))}
        </svg>
      )
    case 'steps':
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={300 + i * 62} y={260 - i * 48} width="52" height={100 + i * 48} rx="12" fill="currentColor" fillOpacity={0.08 + i * 0.05} />)}
        </svg>
      )
    case 'wave':
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M240 ${120 + i * 26} C 330 ${60 + i * 26}, 400 ${190 + i * 26}, 500 ${110 + i * 26} S 600 ${90 + i * 26}, 660 ${70 + i * 26}`} fill="none" stroke="currentColor" strokeOpacity={0.12 + i * 0.03} strokeWidth="1.5" />
          ))}
        </svg>
      )
    case 'dots':
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {Array.from({ length: 80 }).map((_, i) => {
            const x = 280 + (i % 10) * 34
            const y = 40 + Math.floor(i / 10) * 34
            const on = (i * 7) % 5 === 0
            return <circle key={i} cx={x} cy={y} r={on ? 7 : 3} fill="currentColor" fillOpacity={on ? 0.35 : 0.2} />
          })}
        </svg>
      )
    default:
      return (
        <svg className="res-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden>
          {[40, 70, 55, 95, 120, 150, 190].map((h, i) => <rect key={i} x={290 + i * 46} y={250 - h} width="30" height={h} rx="8" fill="currentColor" fillOpacity={0.1 + i * 0.03} />)}
          <line x1="280" x2="620" y1="262" y2="262" stroke="currentColor" strokeOpacity={0.2} />
        </svg>
      )
  }
}

function Trend({ points, unit, labels }: { points: number[]; unit: string; labels: [string, string] }) {
  const w = 440, h = 160, p = 8
  const min = Math.min(...points), max = Math.max(...points)
  const pts = points.map((v, i) => [p + (i / (points.length - 1)) * (w - 2 * p), h - p - ((v - min) / (max - min || 1)) * (h - 2 * p)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="res-trend" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="res-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--brand)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="var(--border)" strokeDasharray="3 4" />)}
        <path d={`${d} L${w - p} ${h} L${p} ${h} Z`} fill="url(#res-area)" />
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="4" fill="var(--brand)" />
      </svg>
      <div className="res-trend__axis"><span>{labels[0]}</span><b>{points[points.length - 1]}{unit}</b><span>{labels[1]}</span></div>
    </div>
  )
}

function Bars({ rows, unit }: { rows: [string, number][]; unit: string }) {
  const max = Math.max(...rows.map((r) => r[1]))
  return (
    <ul className="res-bars">
      {rows.map(([label, v]) => (
        <li key={label}>
          <span>{label}</span>
          <div className="res-bars__track">
            <i style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <b className="mono">{v}{unit}</b>
        </li>
      ))}
    </ul>
  )
}

function ReportModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); prev?.focus?.() }
  }, [onClose])
  const r = card.report
  return (
    <div className="res-modal" data-lenis-prevent onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="res-modal__box" role="dialog" aria-modal="true" aria-label={r.title}>
        <div className="res-modal__head">
          <div>
            <div className="eyebrow">Sample report · Tracewell</div>
            <h3 className="h3" style={{ marginTop: 4 }}>{r.title}</h3>
          </div>
          <button ref={closeRef} type="button" className="iconbtn" aria-label="Close report" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="res-modal__stat">{card.stat}</div>
        <p className="body">{card.desc}</p>
        <div className="res-modal__viz">{r.kind === 'trend' ? <Trend points={r.points} unit={r.unit} labels={r.labels} /> : <Bars rows={r.rows} unit={r.unit} />}</div>
        <p className="res-modal__foot">Sample data from Tracewell. Illustrative, not a customer result.</p>
      </div>
    </div>
  )
}

export function Results() {
  const [open, setOpen] = useState<Card | null>(null)
  return (
    <section className="sec sec--top res" id="results">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__text">
            <div className="eyebrow">Results</div>
            <h2 className="h2">Engineered for developer marketers with higher standards</h2>
            <p className="lead">See what a tracked, closed-loop AEO workflow looks like, from first scan to a measurable lift.</p>
          </div>
        </div>
        <div className="res-grid">
          {cards.map((c) => (
            <article key={c.stat} className={`res-card res-card--${c.theme}`}>
              <Art kind={c.art} />
              <div className="res-card__stat">{c.stat}</div>
              <p className="res-card__desc">{c.desc}</p>
              <div className="res-card__foot">
                <span className="res-card__label">Sample data from Tracewell</span>
                <button type="button" className="btn btn--secondary" onClick={() => setOpen(c)}>View report</button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {open && <ReportModal card={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
