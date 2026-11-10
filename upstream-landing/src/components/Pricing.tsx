import { Check } from 'lucide-react'
import { plans } from '../content'
import '../styles/pricing.css'

export function Pricing() {
  return (
    <section className="sec" id="pricing">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__text">
            <h2 className="h2">Pick how much of the work you want to hand off</h2>
            <p className="lead">Start with the data, or let Infrasity engineers ship the fixes for you.</p>
          </div>
        </div>
        <div className="prc-wrap">
          <div className="prc-grid">
            {plans.map((p) => {
              const feat = p.variant === 'featured'
              return (
                <article key={p.name} className={`prc-cell${feat ? ' prc-cell--feat' : ''}`}>
                  <div className="prc-head">
                    <h3 className="prc-name">{p.name}</h3>
                    {feat && 'badge' in p && <span className="tag tag--brand">{p.badge}</span>}
                  </div>
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
        </div>
      </div>
    </section>
  )
}
