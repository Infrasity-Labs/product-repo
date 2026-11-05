import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import { LogoMark } from './Logo'
import '../styles/footer.css'

const cols: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: ['Prompts', 'Model results', 'Sources', 'Scan health', 'Reddit', 'Distribution', 'Actions'].map((l) => [l, '#product'] as [string, string]) },
  { title: 'Company', links: [['Infrasity', 'https://infrasity.com'], ['Pricing', '#pricing'], ['Contact', 'https://infrasity.com'], ['Careers', 'https://infrasity.com']] },
  { title: 'Resources', links: [['FAQ', '#faq'], ['Why Upstream', '#why'], ['Free audit', '#start']] },
]

export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr__inner">
        <div className="ftr__grid">
          <div className="ftr__brand">
            <a className="ftr__logo" href="#top" aria-label="Upstream home"><LogoMark size={28} />Upstream</a>
            <span className="ftr__status"><span className="ftr__dot" />All services are online</span>
          </div>
          <nav aria-label="Product">
            <h3 className="ftr__h">{cols[0].title}</h3>
            <ul className="ftr__list">{cols[0].links.map(([l, h]) => <li key={l}><a href={h}>{l}</a></li>)}</ul>
          </nav>
          <nav aria-label="Engines">
            <h3 className="ftr__h">Engines</h3>
            <ul className="ftr__list">{engines.map((e) => <li key={e.id}><a href="#engines"><EngineLogo engine={e.id} size={16} />{e.name}</a></li>)}</ul>
          </nav>
          {cols.slice(1).map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="ftr__h">{c.title}</h3>
              <ul className="ftr__list">{c.links.map(([l, h]) => <li key={l}><a href={h}>{l}</a></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="ftr__bar"><span>© 2026 Infrasity</span><span>All rights reserved.</span></div>
      </div>
    </footer>
  )
}
