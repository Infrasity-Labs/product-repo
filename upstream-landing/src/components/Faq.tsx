import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { faqs } from '../content'
import { Reveal } from './Reveal'
import '../styles/faq.css'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const uid = useId().replace(/:/g, '')
  return (
    <section className="sec" id="faq">
      <div className="shell">
        <div className="faq-body">
          <Reveal className="sec-head__text">
            <h2 className="h2">Frequently asked questions</h2>
            <p className="lead">Everything about tracking, engines and the optional done-for-you plan.</p>
            <div className="btn-row">
              <a className="btn btn--secondary" href="#start">Get a free audit</a>
            </div>
          </Reveal>
          <Reveal>
            <div className="faq-list">
              {faqs.map((f, i) => {
                const isOpen = open === i
                return (
                  <div className="faq-item" key={f.q}>
                    <h3>
                      <button
                        className="faq-q"
                        id={`${uid}-q${i}`}
                        aria-expanded={isOpen}
                        aria-controls={`${uid}-a${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                      >
                        {f.q}
                        <span className="faq-ic" aria-hidden />
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="a"
                          id={`${uid}-a${i}`}
                          role="region"
                          aria-labelledby={`${uid}-q${i}`}
                          className="faq-a"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                          <p>{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
