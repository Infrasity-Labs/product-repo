import { engines } from '../content'
import { EngineLogo } from './EngineLogo'
import '../styles/hero.css'

export function EngineStrip() {
  return (
    <section className="es" id="engines" aria-label="Engines tracked">
      <div className="shell">
        <div className="es__bar">
          <span>Tracking the 8 engines your buyers ask</span>
          <a href="#product">See every engine →</a>
        </div>
        <div className="es__grid">
          {engines.map((e) => (
            <div className="es__cell" key={e.id}>
              <EngineLogo engine={e.id} size={22} />
              {e.name}
              {e.isNew && <span className="es__new">New</span>}
            </div>
          ))}
        </div>
        <div className="es__pad" />
      </div>
    </section>
  )
}
