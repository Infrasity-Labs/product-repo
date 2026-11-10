import type { CSSProperties } from 'react'
import { brands } from '../lib/brands'
import '../styles/problem.css'

const TITLE = 'The rise of AI Search created an impossible amount of work for developer marketers'
const SOURCES = ['GitHub', 'Reddit', 'Y Combinator', 'dev.to', 'Hashnode', 'Stack Overflow', 'YouTube', 'Medium']
  .map((t) => brands.find((b) => b.title === t))
  .filter((b): b is (typeof brands)[number] => !!b)

// Pure-black brand marks read too heavy on a light tile; soften them to ink.
const colorOf = (hex: string) => (hex === '000000' || hex === '181717' || hex === '0A0A0A' ? '#1b1b1f' : `#${hex}`)

export function Problem() {
  return (
    <section className="sec prb" id="problem">
      <div className="shell">
        <div className="prb__inner">
          <span className="eyebrow">The problem</span>
          <h2 className="h2 prb__title" aria-label={TITLE}>
            {TITLE.split(' ').map((w, i) => (
              <span key={i} className="prb__w" style={{ '--i': i } as CSSProperties} aria-hidden>{w} </span>
            ))}
          </h2>
          <p className="lead prb__sub">
            Eight engines, hundreds of sources, and a new answer every scan. Upstream does the watching so you can do the shipping.
          </p>
          <ul className="prb__sources" aria-label="Sources engines cite">
            {SOURCES.map((b) => (
              <li className="prb__tile" key={b.title} title={b.title} style={{ '--c': colorOf(b.hex) } as CSSProperties}>
                <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={b.title}>
                  <path d={b.path} fill="currentColor" />
                </svg>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
