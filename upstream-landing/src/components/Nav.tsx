import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import {
  ArrowRight, BookOpen, Building2, ChevronDown, Code2, Gauge, HeartPulse, Layers, Link2, ListChecks, Mail,
  Menu, MessageCircle, MessagesSquare, Rocket, Route, Sparkles, Users, X,
} from 'lucide-react'
import { Logo } from './Logo'
import { EngineLogo } from './EngineLogo'
import '../styles/nav.css'

type Item = { icon: ReactNode; title: string; desc: string; href: string }
type Group = { label: string; items: Item[] }
type MenuDef = { id: string; label: string; groups: Group[]; featured: ReactNode; wide?: boolean }

const menus: MenuDef[] = [
  {
    id: 'platform',
    label: 'Platform',
    groups: [
      {
        label: 'Monitor',
        items: [
          { icon: <MessagesSquare />, title: 'Prompts', desc: 'Every buyer question, grouped by cluster', href: '#product' },
          { icon: <Layers />, title: 'Model results', desc: 'The full answer from all 8 engines', href: '#product' },
          { icon: <Link2 />, title: 'Sources', desc: 'Which sites AI trusts in your category', href: '#context' },
          { icon: <HeartPulse />, title: 'Scan health', desc: 'A ± range on every rate', href: '#reinforced' },
        ],
      },
      {
        label: 'Act',
        items: [
          { icon: <MessageCircle />, title: 'Reddit', desc: 'The threads engines quote', href: '#product' },
          { icon: <ListChecks />, title: 'Listicles', desc: 'Contacts and ready pitches', href: '#product' },
          { icon: <Route />, title: 'Distribution', desc: 'Where to publish next', href: '#product' },
          { icon: <Sparkles />, title: 'Actions', desc: 'What to do this week', href: '#product' },
        ],
      },
    ],
    featured: (
      <a className="nv-feat" href="#command">
        <div>
          <span className="nv-feat__title"><Gauge size={14} /> Command Center</span>
          <span className="nv-feat__desc">Every scan, engine and prompt in one view</span>
        </div>
        <div className="nv-feat__thumb" aria-hidden>
          <i style={{ width: '70%' }} /><i style={{ width: '45%' }} /><i style={{ width: '86%' }} /><i style={{ width: '58%' }} />
        </div>
      </a>
    ),
  },
  {
    id: 'resources',
    label: 'Resources',
    wide: true,
    groups: [
      {
        label: 'Discover',
        items: [
          { icon: <Rocket />, title: 'Free AI visibility audit', desc: 'First report in 48 hours, no install', href: '#start' },
          { icon: <BookOpen />, title: 'Engine guide', desc: 'How each of the 8 engines picks sources', href: '#engines' },
          { icon: <Gauge />, title: 'Why Upstream', desc: 'Built for devtool and B2B SaaS teams', href: '#why' },
        ],
      },
      {
        label: 'Get started',
        items: [
          { icon: <Mail />, title: 'Pricing', desc: 'Plans from first citations to done-for-you', href: '#pricing' },
          { icon: <Users />, title: 'Talk to Infrasity', desc: 'Engineers who can ship the work for you', href: '#start' },
          { icon: <BookOpen />, title: 'FAQ', desc: 'Answers on engines, scans and the audit', href: '#faq' },
        ],
      },
    ],
    featured: (
      <a className="nv-feat nv-feat--wide" href="#engines">
        <div>
          <span className="nv-feat__title">Now tracking Microsoft Copilot and Grok</span>
          <span className="nv-feat__desc">Same prompts, 8 engines. No new setup.</span>
        </div>
        <div className="nv-feat__logos" aria-hidden>
          <EngineLogo engine="copilot" size={22} />
          <EngineLogo engine="grok" size={22} />
        </div>
      </a>
    ),
  },
  {
    id: 'solutions',
    label: 'Solutions',
    groups: [
      {
        label: 'Built for',
        items: [
          { icon: <Code2 />, title: 'DevTool startups', desc: 'SDKs, alternatives and how-to prompts', href: '#why' },
          { icon: <Sparkles />, title: 'AI agent companies', desc: 'Win "which framework" questions', href: '#why' },
          { icon: <Building2 />, title: 'B2B SaaS', desc: 'Own the shortlist engineers build', href: '#why' },
          { icon: <Users />, title: 'Done for you', desc: 'Upstream plus Infrasity engineers', href: '#pricing' },
        ],
      },
    ],
    featured: null,
  },
]

const plain = [
  { label: 'Engines', href: '#engines' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Nav() {
  const [open, setOpen] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null)
        setMobile(false)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobile])

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null)
  }

  const go = () => {
    setOpen(null)
    setMobile(false)
  }

  const active = menus.find((m) => m.id === open)

  return (
    <div className="nv">
      <header className="nv__bar">
        <div className="nv__inner" ref={navRef}>
          <a href="#top" className="nv__logo" aria-label="Upstream home">
            <Logo />
          </a>

          <nav className="nv__links" aria-label="Primary" onMouseLeave={() => setOpen(null)} onBlur={onBlur}>
            {menus.map((m) => (
              <button
                key={m.id}
                type="button"
                className="nv__link"
                aria-expanded={open === m.id}
                aria-haspopup="true"
                onMouseEnter={() => setOpen(m.id)}
                onFocus={() => setOpen(m.id)}
                onClick={() => setOpen(m.id)}
              >
                {m.label}
                <ChevronDown size={14} className="nv__chev" />
              </button>
            ))}
            {plain.map((p) => (
              <a key={p.href} href={p.href} className="nv__link" onMouseEnter={() => setOpen(null)}>
                {p.label}
              </a>
            ))}

            {active && (
              <div className={`nv__panel ${active.wide ? 'nv__panel--wide' : ''} nv__panel--${active.id}`}>
                <div className="nv__cols" style={{ gridTemplateColumns: `repeat(${active.groups.length}, 1fr)` }}>
                  {active.groups.map((g) => (
                    <div key={g.label} className="nv__col">
                      <div className="nv__label">{g.label}</div>
                      {g.items.map((it) => (
                        <a key={it.title} href={it.href} className="nv__item" onClick={go}>
                          <span className="nv__icon">{it.icon}</span>
                          <span>
                            <span className="nv__title">{it.title}</span>
                            <span className="nv__desc">{it.desc}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
                {active.featured && (
                  <div className="nv__featured" onClick={go}>
                    {active.featured}
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="nv__cta">
            <a href="#start" className="btn btn--ghost nv__login">Log in</a>
            <a href="#start" className="btn btn--primary">Get a demo</a>
            <button
              type="button"
              className="nv__burger"
              aria-label={mobile ? 'Close menu' : 'Open menu'}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
            >
              {mobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="nv__announce">
        <a href="#engines" className="nv__announce-in">
          <span className="nv__badge">New</span>
          <span>Now tracking Microsoft Copilot and Grok</span>
          <ArrowRight size={14} />
        </a>
      </div>

      {mobile && (
        <nav className="nv__mobile" aria-label="Mobile" data-lenis-prevent>
          {menus.map((m) => (
            <details key={m.id} className="nv__m-group">
              <summary>{m.label}<ChevronDown size={16} /></summary>
              {m.groups.flatMap((g) => g.items).map((it) => (
                <a key={it.title} href={it.href} onClick={go}>{it.title}</a>
              ))}
            </details>
          ))}
          {plain.map((p) => (
            <a key={p.href} href={p.href} className="nv__m-link" onClick={go}>{p.label}</a>
          ))}
          <a href="#start" className="btn btn--primary btn--lg btn--block" onClick={go}>Get a demo</a>

        </nav>
      )}
    </div>
  )
}
