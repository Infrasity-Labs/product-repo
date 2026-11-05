import { Reveal } from './Reveal'
import '../styles/finalcta.css'

export function FinalCta() {
  return (
    <section className="sec sec--top sec--bottom fcta" id="start">
      <div className="shell">
        <div className="fcta__inner">
          <div className="fcta__glow" aria-hidden />
          <Reveal>
            <h2 className="h2">The visibility platform to win AI Search for developers</h2>
            <p className="lead">Reach the developers who ask AI which tool to use.</p>
            <div className="btn-row">
              <a className="btn btn--primary btn--lg" href="https://infrasity.com">Get a free audit</a>
              <a className="btn btn--secondary btn--lg" href="https://infrasity.com">Book a demo</a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
