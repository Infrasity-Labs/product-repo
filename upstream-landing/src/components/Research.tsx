import { useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import '../styles/research.css'

type Paper = { title: string; kicker: string; href: string }

const tabs: { id: string; label: string; papers: Paper[] }[] = [
  {
    id: 'popular',
    label: 'Popular',
    papers: [
      { title: 'Why track Copilot and Grok', kicker: 'Engines', href: '#engines' },
      { title: 'Engine vs engine: who cites you where', kicker: 'Insight', href: '#product' },
      { title: 'Where developers get their answers', kicker: 'Sources', href: '#product' },
    ],
  },
  {
    id: 'engines',
    label: 'Engines',
    papers: [
      { title: 'Same prompts, 8 engines', kicker: 'Coverage', href: '#engines' },
      { title: 'Full answer stored, every run', kicker: 'Model results', href: '#product' },
      { title: 'Sources per engine', kicker: 'Sources', href: '#product' },
    ],
  },
  {
    id: 'sources',
    label: 'Dev sources',
    papers: [
      { title: 'GitHub repos engines trust', kicker: 'GitHub', href: '#product' },
      { title: 'Reddit threads in AI answers', kicker: 'Reddit', href: '#product' },
      { title: 'Listicles and who to pitch', kicker: 'Listicles', href: '#product' },
    ],
  },
]

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
          <div className="sec-head__text">
            <h2 className="h2">Built around how developers actually search</h2>
            <p className="lead">How AI engines answer developer questions, and what it means for your category.</p>
          </div>
          <div className="sec-head__actions">
            <a className="btn btn--secondary" href="#product">See all</a>
          </div>
        </div>
        <div className="rsr-tabs" role="tablist" aria-label="Research topics" onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { refs.current[i] = el }}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={active === i}
              aria-controls={`${uid}-panel`}
              tabIndex={active === i ? 0 : -1}
              className="pilltab"
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="rsr-panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tabs[active].id}`}>
          <div key={active} className="rsr-grid fx-fade">
            {tabs[active].papers.map((p) => (
              <a key={p.title} className="rsr-card" href={p.href}>
                <span className="rsr-card__tag">{p.kicker}</span>
                <span className="rsr-card__title">{p.title}</span>
                <ArrowUpRight size={16} className="rsr-card__arrow" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
