import { useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Reveal } from './Reveal'
import '../styles/research.css'

type Paper = { title: string; kicker: string; seed: number; hues: [string, string, string]; href: string }

const tabs: { id: string; label: string; papers: Paper[] }[] = [
  {
    id: 'popular',
    label: 'Popular',
    papers: [
      { title: 'Why track Copilot and Grok', kicker: 'Engines', seed: 3, hues: ['#c0603a', '#3a2a6b', '#7c8aa8'], href: '#engines' },
      { title: 'Engine vs engine: who cites you where', kicker: 'Insight', seed: 11, hues: ['#2f5f57', '#8a8a5a', '#3c4f6e'], href: '#product' },
      { title: 'Where developers get their answers', kicker: 'Sources', seed: 27, hues: ['#203868', '#d1b44a', '#8a3a3a'], href: '#product' },
    ],
  },
  {
    id: 'engines',
    label: 'Engines',
    papers: [
      { title: 'Same prompts, 8 engines', kicker: 'Coverage', seed: 5, hues: ['#2a7a6a', '#7a5cff', '#c98a4a'], href: '#engines' },
      { title: 'Full answer stored, every run', kicker: 'Model results', seed: 17, hues: ['#9a4a6a', '#2a3a6a', '#aab08a'], href: '#product' },
      { title: 'Sources per engine', kicker: 'Sources', seed: 31, hues: ['#4a6a9a', '#c06a3a', '#2a2a3a'], href: '#product' },
    ],
  },
  {
    id: 'sources',
    label: 'Dev sources',
    papers: [
      { title: 'GitHub repos engines trust', kicker: 'GitHub', seed: 8, hues: ['#2a2a3a', '#6a8a5a', '#a0a0b0'], href: '#product' },
      { title: 'Reddit threads in AI answers', kicker: 'Reddit', seed: 21, hues: ['#c05a2a', '#4a3a6a', '#d8c090'], href: '#product' },
      { title: 'Listicles and who to pitch', kicker: 'Listicles', seed: 40, hues: ['#3a6a8a', '#8a3a5a', '#c8b84a'], href: '#product' },
    ],
  },
]

const rots = [-1.6, 0.8, 1.8]

function Art({ seed, hues, id }: { seed: number; hues: Paper['hues']; id: string }) {
  const f = (n: string) => `${id}-${n}`
  const layout = seed % 3
  const rects = [
    [[34, 18, 36, 42], [58, 12, 22, 14], [70, 52, 10, 9]],
    [[28, 24, 34, 44], [56, 10, 24, 18], [14, 54, 12, 12]],
    [[46, 20, 36, 40], [30, 34, 22, 22], [72, 62, 14, 10]],
  ][layout]
  return (
    <svg className="res-paper__art" viewBox="0 0 100 120" preserveAspectRatio="xMidYMin slice" aria-hidden>
      <defs>
        {hues.map((c, i) => (
          <linearGradient key={i} id={f('g' + i)} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c} />
            <stop offset="1" stopColor={hues[(i + 1) % 3]} />
          </linearGradient>
        ))}
        <filter id={f('n')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9 + (seed % 5) * 0.05} numOctaves="2" seed={seed} result="t" />
          <feColorMatrix in="t" type="saturate" values="0" result="m" />
          <feBlend in="SourceGraphic" in2="m" mode="overlay" />
        </filter>
      </defs>
      {rects.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={`url(#${f('g' + i)})`} filter={`url(#${f('n')})`} />
      ))}
    </svg>
  )
}

export function Research() {
  const [active, setActive] = useState(0)
  const uid = useId().replace(/:/g, '')
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const n = (active + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
    setActive(n)
    refs.current[n]?.focus()
  }

  return (
    <section className="sec" id="research">
      <div className="shell">
        <div className="sec-head">
          <Reveal className="sec-head__text">
            <h2 className="h2">Built around how developers actually search</h2>
            <p className="lead">How AI engines answer developer questions, and what it means for your category.</p>
          </Reveal>
          <div className="sec-head__actions">
            <a className="btn btn--secondary" href="#product">See all</a>
          </div>
        </div>
        <div className="res-tabs" role="tablist" aria-label="Research topics" onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { refs.current[i] = el }}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={active === i}
              aria-controls={`${uid}-panel`}
              tabIndex={active === i ? 0 : -1}
              className="res-tab"
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="res-panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tabs[active].id}`}>
          <AnimatePresence mode="wait">
            <motion.div key={tabs[active].id} className="res-grid" initial="h" animate="s" exit="x" transition={{ staggerChildren: 0.08 }}>
              {tabs[active].papers.map((p, i) => (
                <motion.div
                  key={p.title}
                  variants={{ h: { opacity: 0, y: 40 }, s: { opacity: 1, y: 0 }, x: { opacity: 0, y: 12, transition: { duration: 0.12 } } }}
                  transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <a className="res-paper" href={p.href} style={{ ['--rot' as string]: `${rots[i]}deg` }}>
                    <Art seed={p.seed} hues={p.hues} id={`${uid}${active}${i}`} />
                    <span className="res-paper__tag">{p.kicker}</span>
                    <span className="res-hole res-hole--a" />
                    <span className="res-hole res-hole--b" />
                    <span className="res-paper__title">{p.title}</span>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
