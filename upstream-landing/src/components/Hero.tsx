import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import { AppDemo } from './AppDemo'
import '../styles/hero.css'

// Engines floating in the hero margins: [engine id, left|right, horizontal %, top px, tile size, float delay s]
const floaters: [string, 'l' | 'r', number, number, number, number][] = [
  ['chatgpt', 'l', 7, 190, 60, 0],
  ['claude', 'l', 14, 340, 48, 1.2],
  ['gemini', 'l', 4, 410, 44, 2.1],
  ['perplexity', 'r', 8, 210, 54, 0.6],
  ['copilot', 'r', 15, 350, 48, 1.8],
  ['grok', 'r', 4, 420, 44, 2.6],
]

const ease = [0.2, 0.8, 0.2, 1] as const
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
})

/** Owns the rotation timer so the rest of the hero (including the demo) does not re-render every 2.4s. */
function RotatingEngine() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % engines.length)
    }, 2400)
    return () => window.clearInterval(t)
  }, [])

  const e = engines[i]
  return (
    <span className="hero__rot" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={e.id}
          className="hero__rot-in"
          initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -28, filter: 'blur(8px)' }}
          transition={{ duration: 0.34, ease }}
        >
          <span className="hero__rot-logo">
            <EngineLogo engine={e.id} size={38} />
          </span>
          <span className="hero__rot-name">{e.name}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const Floaters = memo(function Floaters() {
  return (
    <div className="hero__floaters" aria-hidden>
      {floaters.map(([id, side, x, y, size, delay]) => (
        <span
          key={id}
          className="hero__tile"
          style={{ [side === 'l' ? 'left' : 'right']: `${x}%`, top: y, width: size, height: size, animationDelay: `${delay}s` }}
        >
          <EngineLogo engine={id} size={Math.round(size * 0.52)} />
        </span>
      ))}
    </div>
  )
})

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden />
      <div className="hero__dots" aria-hidden />
      <Floaters />

      <div className="hero__copy">
        <motion.h1 className="h1 hero__title" {...rise(0.08)}>
          <span>The AI visibility platform to win in</span>
          <RotatingEngine />
        </motion.h1>

        <motion.p className="lead hero__lead" {...rise(0.18)}>
          Upstream tracks the questions your buyers ask across 8 AI engines, shows which GitHub repos, Reddit threads and
          listicles they trust, and tells you what to ship next to get cited.
        </motion.p>

        <motion.div className="btn-row hero__cta" {...rise(0.26)}>
          <a className="btn btn--primary btn--lg" href="#start">
            Get a free audit <ArrowRight size={15} />
          </a>
          <a className="btn btn--outline btn--lg" href="#product">Take the tour</a>
        </motion.div>
        <motion.p className="hero__note" {...rise(0.32)}>No install. First report in 48 hours.</motion.p>
      </div>

      <motion.div
        className="hero__demo"
        initial={{ opacity: 0, y: 70, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.4, ease }}
      >
        <AppDemo />
      </motion.div>
    </section>
  )
}
