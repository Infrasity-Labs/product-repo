import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { BookOpen, Bell, ChevronLeft, ChevronRight, FileSpreadsheet, GitBranch, ListOrdered, Mail, MessageSquare, Newspaper } from 'lucide-react'
import { runwayY, scrollToY, useRunway } from '../lib/scroll'
import { Reveal } from './Reveal'
import { EngineLogo } from './EngineLogo'
import { LogoMark } from './Logo'
import '../styles/command.css'

function Area({ data, color = 'var(--brand)', h = 64 }: { data: number[]; color?: string; h?: number }) {
  const id = useId()
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const w = 240
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 12)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className="cmd-area" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      <motion.path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.3 }} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.1, ease: 'easeOut' }} />
    </svg>
  )
}

const scans = [210, 240, 232, 280, 310, 298, 340, 372, 365, 410, 438, 470]
const prompts = [80, 82, 90, 96, 94, 110, 118, 126, 140, 138, 152, 168]
const cites: [string, number, string][] = [
  ['ChatGPT', 82, 'p<0.01'], ['Perplexity', 74, 'p<0.01'], ['Claude', 63, 'p=0.02'], ['Gemini', 55, 'p=0.03'],
  ['AI Overviews', 44, 'p=0.04'], ['Copilot', 31, 'p=0.09'],
]

function Dashboard() {
  return (
    <div className="cmd-dash">
      <div className="cmd-card cmd-card--l">
        <div className="cmd-card__t">Scans run</div>
        <div className="cmd-card__n">4,812<span className="tag tag--good">+18%</span></div>
        <Area data={scans} />
      </div>
      <div className="cmd-card cmd-card--c">
        <div className="cmd-card__t">Citations by engine</div>
        <ul className="cmd-hbars">
          {cites.map(([n, v, p], i) => (
            <li key={n}>
              <span><EngineLogo engine={n} size={13} />{n}</span>
              <div><motion.i initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }} /></div>
              <em className="mono">{p}</em>
            </li>
          ))}
        </ul>
      </div>
      <div className="cmd-card cmd-card--r">
        <div className="cmd-card__t">Active prompts</div>
        <div className="cmd-card__n">168<span className="tag tag--brand">+12 this week</span></div>
        <Area data={prompts} color="#12935f" />
      </div>
    </div>
  )
}

const rows: [string, number, number, number][] = [
  ['Best tracing SDK for Node', 24, 312, 28],
  ['Open source LLM observability', 19, 264, 27],
  ['Agent evaluation tools', 15, 201, 25],
  ['Prompt management comparison', 12, 188, 24],
  ['Tracewell vs Spanlight', 9, 142, 21],
  ['SDK for Python tracing', 7, 117, 19],
]
function PowerTable() {
  const max = rows[0][1]
  return (
    <div className="cmd-table">
      <div className="cmd-table__t">Top prompt clusters <span>Sample data</span></div>
      <div className="cmd-table__scroll">
        <table>
          <thead><tr><th>#</th><th>Prompt cluster</th><th>Prompts moved up</th><th>Runs</th><th>Active days</th></tr></thead>
          <tbody>
            {rows.map(([n, up, runs, days], i) => (
              <motion.tr key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <td className="mono">{i + 1}</td>
                <td>{n}</td>
                <td><div className="cmd-tb"><i style={{ width: `${(up / max) * 100}%` }} /><span>{up}</span></div></td>
                <td className="mono">{runs}</td>
                <td className="mono">{days}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AlertsViz() {
  const [slack, setSlack] = useState(true)
  const [csv, setCsv] = useState(true)
  return (
    <div className="cmd-alerts">
      <div className="cmd-toggles">
        {([['Slack alerts', Bell, slack, setSlack], ['CSV export', FileSpreadsheet, csv, setCsv]] as const).map(([l, Icon, on, set]) => (
          <button key={l} type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className="cmd-sw">
            <Icon size={14} /><span>{l}</span><i className="cmd-sw__knob" data-on={on}><b /></i>
          </button>
        ))}
      </div>
      <AnimatePresence mode="popLayout">
        {slack ? (
          <motion.div key="msg" className="cmd-msg" initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="cmd-msg__av"><LogoMark size={22} /></div>
            <div><b>Upstream</b> <span>just now</span>
              <p>Citation change: <strong>Tracewell</strong> moved from 3rd to 1st for "best tracing SDK" on Perplexity.</p></div>
          </motion.div>
        ) : <motion.p key="off" className="cmd-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Slack alerts are off</motion.p>}
      </AnimatePresence>
      {csv && (
        <motion.div className="cmd-file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <FileSpreadsheet size={14} /> citations-weekly.csv <span className="mono">Sample</span>
        </motion.div>
      )}
    </div>
  )
}

const sources = [
  { n: 'GitHub', I: GitBranch }, { n: 'Reddit', I: MessageSquare }, { n: 'Hacker News', I: Newspaper }, { n: 'Docs', I: BookOpen }, { n: 'Listicles', I: ListOrdered },
]
function ReportViz() {
  return (
    <div className="cmd-report">
      <div className="cmd-report__icons">
        {sources.map(({ n, I }) => <div key={n} title={n} className="cmd-report__ic"><I size={16} /></div>)}
      </div>
      <svg viewBox="0 0 500 90" preserveAspectRatio="none" className="cmd-report__lines" aria-hidden>
        {[50, 150, 250, 350, 450].map((x) => <path key={x} d={`M${x} 0 C ${x} 50, 250 40, 250 90`} fill="none" stroke="var(--fg-4)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" className="cmd-dash-flow" />)}
      </svg>
      <div className="cmd-report__hub"><LogoMark size={36} /><span className="cmd-report__mail"><Mail size={12} /> Weekly email report</span></div>
    </div>
  )
}

const VIEW_TRAVEL = 420

export function Command() {
  const [view, setView] = useState(0)
  const [stageH, setStageH] = useState(0)
  const views = 2
  const runway = useRef<HTMLDivElement>(null)
  const stick = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stick.current
    if (!el) return
    const ro = new ResizeObserver(() => setStageH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useRunway(runway, VIEW_TRAVEL, (p) => setView(p < 0.5 ? 0 : 1))

  const goTo = (v: number) => {
    if (runway.current) scrollToY(runwayY(runway.current, VIEW_TRAVEL, v === 0 ? 0 : 1))
  }

  return (
    <section className="sec sec--top sec--bottom cmd" id="command">
      <div className="shell">
        <div className="sec-head cmd-head">
          <Reveal className="sec-head__text">
            <h2 className="h2">Built for teams that act on the data every week</h2>
            <p className="lead">Track runs, share what changed and keep everyone on the same citation numbers.</p>
          </Reveal>
        </div>
        <div className="cmd-big">
          <div className="cmd-big__head">
            <div>
              <h3 className="cmd-big__title">Track every scan with the Command Center</h3>
              <p className="lead" style={{ marginTop: 8 }}>See how runs, engines and prompts are moving across your team.</p>
              <button type="button" className="btn btn--secondary" style={{ marginTop: 24 }} onClick={() => goTo(view === 0 ? 1 : 0)}>Explore Command Center</button>
            </div>
            <div className="sec-head__actions">
              <button type="button" className="iconbtn" aria-label="Previous view" disabled={view === 0} onClick={() => goTo(0)}><ChevronLeft size={16} /></button>
              <button type="button" className="iconbtn" aria-label="Next view" disabled={view === views - 1} onClick={() => goTo(1)}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div ref={runway} className="cmd-run" style={{ height: stageH ? stageH + VIEW_TRAVEL : undefined }}>
            <div ref={stick} className="cmd-stage" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={view} initial={{ opacity: 0, x: view ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: view ? -40 : 40 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
                  {view === 0 ? <Dashboard /> : <PowerTable />}
                </motion.div>
              </AnimatePresence>
              <div className="cmd-dots" role="tablist" aria-label="Command Center views">
                {['Overview', 'Prompt clusters'].map((l, i) => <button key={l} type="button" role="tab" aria-selected={view === i} aria-label={l} onClick={() => goTo(i)} />)}
              </div>
            </div>
          </div>
        </div>
        <div className="cg cg--2 cmd-cells">
          <div className="cmd-cell">
            <h3 className="cmd-cell__title">Slack alerts and CSV export</h3>
            <p className="lead">Send citation changes where your team already works.</p>
            <AlertsViz />
          </div>
          <div className="cmd-cell">
            <h3 className="cmd-cell__title">Reports your team can use</h3>
            <p className="lead">A weekly email report pulls every source into one summary.</p>
            <ReportViz />
          </div>
        </div>
      </div>
    </section>
  )
}
