import { Check, Minus, X } from 'lucide-react'
import { compareRows } from '../content'
import { Reveal } from './Reveal'
import { LogoMark } from './Logo'
import '../styles/compare.css'

const isNo = (s: string) => /^(No|Rarely)$/.test(s)

export function Compare() {
  return (
    <section className="sec" id="why">
      <div className="shell">
        <div className="sec-head">
          <Reveal className="sec-head__text">
            <h2 className="h2">Why not a general AI-visibility tool?</h2>
            <p className="lead">General tools are built for consumer brands. Upstream is built for how engineers choose software.</p>
          </Reveal>
        </div>
        <Reveal className="cmp-wrap">
          <div className="cmp-table" role="table" aria-label="Upstream compared with general AI-visibility tools">
            <div className="cmp-row cmp-row--head" role="row">
              <div className="cmp-c" role="columnheader">Criterion</div>
              <div className="cmp-c cmp-c--gen" role="columnheader">General tools</div>
              <div className="cmp-c cmp-c--up" role="columnheader"><LogoMark size={16} /> Upstream</div>
            </div>
            {compareRows.map((r) => (
              <div className="cmp-row" role="row" key={r.label}>
                <div className="cmp-c cmp-c--label" role="rowheader">{r.label}</div>
                <div className="cmp-c cmp-c--gen" role="cell">
                  <span className="cmp-m">General</span>
                  {isNo(r.general) ? <X className="cmp-ic cmp-ic--no" aria-hidden /> : <Minus className="cmp-ic cmp-ic--mid" aria-hidden />}
                  <span>{r.general}</span>
                </div>
                <div className="cmp-c cmp-c--up" role="cell">
                  <span className="cmp-m">Upstream</span>
                  <Check className="cmp-ic cmp-ic--ok" aria-hidden />
                  <span>{r.upstream}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
