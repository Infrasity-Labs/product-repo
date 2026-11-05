import { Check } from 'lucide-react'
import { plans } from '../content'
import { Reveal } from './Reveal'
import '../styles/pricing.css'

export function Pricing() {
  return (
    <section className="sec" id="pricing">
      <div className="shell">
        <div className="sec-head">
          <Reveal className="sec-head__text">
            <h2 className="h2">Pick how much of the work you want to hand off</h2>
            <p className="lead">Start with the data, or let Infrasity engineers ship the fixes for you.</p>
          </Reveal>
        </div>
        <Reveal>
          <div className="cg cg--3 prc-grid">
            {plans.map((p) => {
              const feat = p.variant === 'featured'
              return (
                <article key={p.name} className={`prc-cell${feat ? ' prc-cell--feat' : ''}`}>
                  <div className="prc-band">
                    {feat && <span className="tag tag--brand">{'badge' in p ? p.badge : ''}</span>}
                  </div>
                  <h3 className="prc-name">{p.name}</h3>
                  <div className="prc-price">{p.price}{p.price.startsWith('[') && <small>/ month</small>}</div>
                  <p className="body prc-blurb">{p.blurb}</p>
                  <a className={`btn btn--block btn--lg prc-cta ${feat ? 'btn--primary' : 'btn--secondary'}`} href="#start">{p.cta}</a>
                  <ul className="prc-list">
                    {p.features.map((f) => (
                      <li key={f}><Check aria-hidden />{f}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
