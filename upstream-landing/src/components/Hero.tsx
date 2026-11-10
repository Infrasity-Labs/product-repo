import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowRight, Check, MessageSquare } from 'lucide-react'
import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import { AppDemo } from './AppDemo'
import '../styles/hero.css'

// Decorative drifting dots: [left %, top px, size px, drift x px, drift y px, duration s, delay s]
const dots: [number, number, number, number, number, number, number][] = [
  [5, 150, 3, 10, -20, 9, 0],
  [11, 300, 2, -8, 16, 7, -2],
  [17, 90, 3, 10, 14, 10, -4],
  [8, 440, 4, 12, -12, 11, -1],
  [23, 520, 2, -10, -16, 8, -5],
  [28, 200, 2, 6, 18, 6, -3],
  [33, 120, 3, -8, 14, 9, -7],
  [14, 220, 2, 8, -10, 7, -1],
  [20, 400, 3, -10, 12, 10, -6],
  [95, 130, 3, -12, 18, 10, -2],
  [89, 280, 2, 10, -14, 8, -6],
  [83, 80, 2, -8, 12, 7, -1],
  [92, 430, 4, -14, -18, 12, -3],
  [77, 520, 2, 8, -12, 9, -4],
  [72, 210, 2, -6, 16, 6, -5],
  [67, 110, 3, 8, 14, 9, -2],
  [86, 360, 3, -10, -12, 11, -8],
  [4, 560, 3, 10, -10, 10, -2],
  [97, 560, 3, -10, -10, 9, -6],
  [60, 560, 2, 8, -12, 8, -3],
  [40, 570, 2, -8, -10, 9, -5],
  [78, 330, 2, 6, 12, 7, -9],
]

/** Cycles through the engines under the headline. Its own state, so the rest of the hero never re-renders. */
function RotatingEngine() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % engines.length)
    }, 2200)
    return () => window.clearInterval(t)
  }, [])

  const e = engines[i]
  return (
    <>
      <span className="sr-only">{engines.map((x) => x.name).join(', ')}</span>
      <span className="hero__rot" aria-hidden>
        <span key={e.id} className="hero__rot-in">
          <EngineLogo engine={e.id} size={44} />
          <span className="glass">{e.name}</span>
        </span>
      </span>
    </>
  )
}

const SOV = [18, 20, 19, 23, 26, 25, 30, 33, 36, 39, 43, 45.9]
const sovPath = (() => {
  const w = 120, h = 36, min = Math.min(...SOV), max = Math.max(...SOV)
  return SOV.map((v, i) => `${i ? 'L' : 'M'}${((i / (SOV.length - 1)) * w).toFixed(1)} ${(h - 3 - ((v - min) / (max - min)) * (h - 6)).toFixed(1)}`).join(' ')
})()

const cited: [string, string][] = [['chatgpt', '#1'], ['perplexity', '#1'], ['claude', '#2']]

/** Product cards that overlap the demo window's edges. Sample data, same figures as the Results section. */
function FloatingCards() {
  return (
    <div className="hero__cards" aria-hidden>
      <div className="hc hc--sov">
        <span className="hc__label">Share of voice</span>
        <div className="hc__row"><b className="hc__big">45.9%</b><span className="tag tag--good">+7.9 pts</span></div>
        <svg viewBox="0 0 120 36" width="120" height="36" fill="none"><path d={sovPath} stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>

      <div className="hc hc--cited">
        <span className="hc__label">Now cited by</span>
        <ul>
          {cited.map(([id, rank]) => (
            <li key={id}>
              <EngineLogo engine={id} size={16} />
              <span>{engines.find((e) => e.id === id)?.name}</span>
              <em>{rank}</em>
            </li>
          ))}
        </ul>
      </div>

      <div className="hc hc--reddit">
        <MessageSquare size={14} />
        <div>
          <b>What are you using for LLM observability?</b>
          <span>r/webdev · quoted in 14 answers</span>
        </div>
      </div>

      <div className="hc hc--fix">
        <span className="hc__check"><Check size={12} /></span>
        <div>
          <b>3 fixes staged</b>
          <span>Waiting for your approval</span>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid" aria-hidden />
      <div className="hero__dots" aria-hidden>
        {dots.map(([x, y, s, dx, dy, dur, delay], i) => (
          <span
            key={i}
            className="hero__dot"
            style={{ left: `${x}%`, top: y, width: s, height: s, '--dx': `${dx}px`, '--dy': `${dy}px`, '--dur': `${dur}s`, '--delay': `${delay}s` } as CSSProperties}
          />
        ))}
      </div>

      <div className="hero__copy">
        <span className="hero__badge"><i /> AEO for developer tools</span>

        <h1 className="h1 hero__title">
          <span className="glass">The AI visibility platform to win in</span>
          <RotatingEngine />
        </h1>

        <p className="lead hero__lead">
          Upstream tracks the questions your buyers ask across 8 AI engines, shows which GitHub repos, Reddit threads and
          listicles they trust, and tells you what to ship next to get cited.
        </p>

        <div className="btn-row hero__cta">
          <a className="btn btn--primary btn--lg" href="#start">
            Get a free audit <ArrowRight size={15} />
          </a>
          <a className="btn btn--outline btn--lg" href="#product">Take the tour</a>
        </div>
        <p className="hero__note">No install. First report in 48 hours.</p>
      </div>

      <div className="hero__stage" id="engines">
        <FloatingCards />
        <AppDemo />
      </div>
    </section>
  )
}
