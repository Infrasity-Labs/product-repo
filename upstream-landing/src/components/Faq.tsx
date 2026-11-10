import { useState } from 'react'
import { faqs } from '../content'
import '../styles/faq.css'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="sec" id="faq">
      <div className="shell">
        <div className="faq-body">
          <div className="sec-head__text">
            <h2 className="h2">Frequently asked questions</h2>
            <p className="lead">Everything about tracking, engines and the optional done-for-you plan.</p>
            <div className="btn-row">
              <a className="btn btn--secondary" href="#start">Get a free audit</a>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => {
              const isOpen = open === i
              return (
                <details
                  className="faq-item"
                  key={f.q}
                  open={isOpen}
                  onToggle={(e) => {
                    const nowOpen = e.currentTarget.open
                    if (nowOpen !== isOpen) setOpen(nowOpen ? i : null)
                  }}
                >
                  <summary className="faq-q">
                    {f.q}
                    <span className="faq-ic" aria-hidden />
                  </summary>
                  <div className="faq-a">
                    <p>{f.a}</p>
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
