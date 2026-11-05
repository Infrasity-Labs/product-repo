import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'motion/react'
import { ArrowUp, ChevronDown, CircleAlert, Info, MessageSquare } from 'lucide-react'
import { CarouselControls, CarouselItem, CarouselProvider, CarouselTrack } from './Carousel'
import { Reveal } from './Reveal'
import { EngineLogo } from './EngineLogo'
import '../styles/reinforced.css'

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']
type Metric = 'bot' | 'ref'
const series: { id: string; name: string; color: string; data: Record<Metric, number[]> }[] = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#4b2cf0', data: { bot: [2800, 2600, 2900, 3100, 3000, 3300, 3400], ref: [420, 480, 560, 640, 700, 820, 910] } },
  { id: 'perplexity', name: 'Perplexity', color: '#e0543c', data: { bot: [1500, 2100, 2000, 2300, 1900, 1700, 1400], ref: [210, 260, 330, 300, 380, 420, 470] } },
  { id: 'claude', name: 'Claude', color: '#12935f', data: { bot: [1000, 1100, 1500, 1700, 2000, 2400, 2700], ref: [90, 120, 150, 210, 260, 340, 410] } },
  { id: 'gemini', name: 'Gemini', color: '#2563eb', data: { bot: [400, 900, 800, 1100, 1300, 1200, 1500], ref: [60, 90, 120, 150, 170, 210, 250] } },
]

function LineViz() {
  const [metric, setMetric] = useState<Metric>('bot')
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const W = 340, H = 190, L = 34, R = 8, T = 10, B = 20
  const visible = series.filter((s) => !hidden.has(s.id))
  const rawMax = Math.max(...visible.flatMap((s) => s.data[metric]), 1)
  const step = rawMax > 1500 ? 1000 : 200
  const max = Math.ceil(rawMax / step) * step
  const x = (i: number) => L + (i / (weeks.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const ticks = Array.from({ length: Math.min(4, max / step + 1) }, (_, i) => i * (max / Math.min(3, max / step)))
  const fmt = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${v}`)
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.max(0, Math.min(weeks.length - 1, Math.round(((px - L) / (W - L - R)) * (weeks.length - 1)))))
  }
  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else if (n.size < series.length - 1) n.add(id); return n })
  return (
    <div className="rf-line">
      <div className="rf-seg" role="tablist" aria-label="Metric">
        {([['bot', 'Bot visits'], ['ref', 'AI referral visits']] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={metric === k} onClick={() => setMetric(k)}>{l}</button>
        ))}
      </div>
      <div className="rf-line__chart">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${metric === 'bot' ? 'Bot visits' : 'AI referral visits'} by engine, weekly`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 4" />
              <text x={L - 8} y={y(t) + 3.5} textAnchor="end" className="rf-tick">{fmt(t)}</text>
            </g>
          ))}
          {weeks.map((w, i) => <text key={w} x={x(i)} y={H - 4} textAnchor="middle" className="rf-tick">{w}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--fg-4)" />}
          {visible.map((s) => {
            const d = s.data[metric].map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
            return (
              <motion.path key={s.id} d={d} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1, d } : { pathLength: 0 }} transition={{ duration: 1, ease: 'easeOut', d: { duration: 0.4 } }} />
            )
          })}
          {hover !== null && visible.map((s) => <circle key={s.id} cx={x(hover)} cy={y(s.data[metric][hover])} r="3.5" fill="var(--surface)" stroke={s.color} strokeWidth="2" />)}
        </svg>
        {hover !== null && (
          <div className="rf-tip" style={{ left: `${(x(hover) / W) * 100}%` }} data-flip={hover > 3}>
            <b>{weeks[hover]}</b>
            {visible.map((s) => <div key={s.id}><i style={{ background: s.color }} />{s.name}<span className="mono">{s.data[metric][hover].toLocaleString()}</span></div>)}
          </div>
        )}
      </div>
      <div className="rf-legend">
        {series.map((s) => (
          <button key={s.id} type="button" aria-pressed={!hidden.has(s.id)} onClick={() => toggle(s.id)} className={hidden.has(s.id) ? 'is-off' : ''}>
            <i style={{ background: s.color }} />{s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function GaugeViz() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const cx = 150, cy = 150, r = 110
  const [angle, setAngle] = useState(-90)
  useEffect(() => {
    if (!inView) return
    const c = animate(-90, -90 + (82 / 100) * 180, { type: 'spring', stiffness: 50, damping: 11, delay: 0.5, onUpdate: setAngle })
    return () => c.stop()
  }, [inView])
  const pt = (pct: number, rad = r) => { const a = Math.PI * (1 - pct / 100); return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)] }
  const arc = (a: number, b: number) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}` }
  const bands: [number, number, string][] = [[0, 25, '#e5e5e8'], [26, 50, '#d6d6db'], [51, 75, '#b9b0fa'], [76, 100, 'var(--brand)']]
  return (
    <div ref={ref} className="rf-gauge">
      <svg viewBox="0 0 300 162" role="img" aria-label="Percentile 82, target 90 to 100">
        {bands.map(([a, b, c], i) => <motion.path key={i} d={arc(a + 0.8, b - 0.8)} fill="none" stroke={c} strokeWidth="16" strokeLinecap="round" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: i * 0.12 }} />)}
        {[0, 25, 50, 75, 100].map((t) => { const [tx, ty] = pt(t, 134); return <text key={t} x={tx} y={ty + 3} textAnchor="middle" className="rf-tick">{t}</text> })}
        <g transform={`rotate(${angle} ${cx} ${cy})`}>
          <path d={`M${cx - 6} ${cy} L${cx} ${cy - 96} L${cx + 6} ${cy} Z`} fill="var(--fg)" />
        </g>
        <circle cx={cx} cy={cy} r="9" fill="var(--fg)" /><circle cx={cx} cy={cy} r="3.5" fill="var(--surface)" />
      </svg>
      <div className="rf-gauge__read">
        <span className="rf-gauge__label">Percentile</span>
        <b>82</b>
        <span className="rf-chip">Target <strong>90-100</strong></span>
      </div>
    </div>
  )
}

function AlertViz() {
  const [open, setOpen] = useState(true)
  return (
    <div className="rf-alert">
      <div className="rf-alert__head"><CircleAlert size={16} /> Inaccurate claim</div>
      <div className="rf-alert__body">
        <div className="rf-alert__claim">Tracewell supports 4 SDKs</div>
        <div className="rf-alert__meta"><EngineLogo engine="chatgpt" size={14} /> 6.7% of responses · Sample data</div>
        <button type="button" className="rf-alert__why" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Info size={14} /> Why it's inaccurate <ChevronDown size={14} className="rf-alert__chev" data-open={open} />
        </button>
        <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} style={{ overflow: 'hidden' }} transition={{ duration: 0.25 }}>
          <p className="rf-alert__why-body">The claim says 4 SDKs, but the knowledge base says Tracewell ships 12 (JS, Python, Go, Java, Ruby, PHP, Rust, Swift, Kotlin, .NET, Elixir, Dart).</p>
        </motion.div>
      </div>
    </div>
  )
}

const sentiment = [
  { k: 'Positive', v: 64, c: 'var(--good)' },
  { k: 'Neutral', v: 27, c: 'var(--fg-4)' },
  { k: 'Negative', v: 9, c: 'var(--bad)' },
]
const narratives = [
  { t: 'Easy to instrument', tone: 'good' as const, d: '+6' },
  { t: 'Strong docs and examples', tone: 'good' as const, d: '+3' },
  { t: 'Pricing unclear at scale', tone: 'bad' as const, d: '+2' },
]
function SentimentViz() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [hl, setHl] = useState<string | null>(null)
  return (
    <div ref={ref} className="rf-sent">
      <div className="rf-sent__top"><span>Sentiment</span><b>{hl ? sentiment.find((s) => s.k === hl)!.v : 64}%<small> {hl ?? 'Positive'}</small></b></div>
      <div className="rf-sent__bar">
        {sentiment.map((s, i) => (
          <motion.button key={s.k} type="button" aria-label={`${s.k} ${s.v}%`} style={{ background: s.c, opacity: hl && hl !== s.k ? 0.35 : 1 }} initial={{ width: 0 }} animate={inView ? { width: `${s.v}%` } : {}} transition={{ duration: 0.8, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            onMouseEnter={() => setHl(s.k)} onMouseLeave={() => setHl(null)} onFocus={() => setHl(s.k)} onBlur={() => setHl(null)} />
        ))}
      </div>
      <div className="rf-sent__legend">{sentiment.map((s) => <span key={s.k}><i style={{ background: s.c }} />{s.k} {s.v}%</span>)}</div>
      <div className="rf-sent__list">
        <div className="eyebrow">Top narratives</div>
        {narratives.map((n) => (
          <div key={n.t} className="rf-sent__row"><span>{n.t}</span><span className={`tag tag--${n.tone}`}><ArrowUp size={10} style={{ transform: n.tone === 'bad' ? 'none' : undefined }} />{n.d}</span></div>
        ))}
      </div>
    </div>
  )
}

const threads = [
  { sub: 'r/webdev', t: 'What are you using for LLM observability in 2026?', n: 14 },
  { sub: 'r/devops', t: 'Tracing SDK comparison, honest takes', n: 11 },
  { sub: 'r/programming', t: 'Open source tools for monitoring AI agents', n: 8 },
  { sub: 'r/SaaS', t: 'How do you get recommended by ChatGPT?', n: 6 },
]
function RedditViz() {
  return (
    <ul className="rf-threads">
      {threads.map((t, i) => (
        <motion.li key={t.t} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
          <MessageSquare size={14} />
          <div><b>{t.t}</b><span>{t.sub} · Sample thread</span></div>
          <span className="tag">{t.n} cites</span>
        </motion.li>
      ))}
    </ul>
  )
}

const items = [
  { viz: <LineViz />, title: 'Bot visits and AI referrals', body: 'See which engines crawl and send traffic to your site, week by week.', cta: 'See Analytics' },
  { viz: <GaugeViz />, title: 'Benchmark your site against peers', body: 'Know where your AI visibility sits among similar developer tools.', cta: 'See Benchmarking' },
  { viz: <AlertViz />, title: 'Catch inaccurate claims', body: 'Find answers that get your product wrong and compare them to your source of truth.', cta: 'See Fact check' },
  { viz: <SentimentViz />, title: 'Track how engines talk about you', body: 'Sentiment and the narratives that repeat across engines and prompts.', cta: 'See Sentiment' },
  { viz: <RedditViz />, title: 'Reddit threads engines quote', body: 'The conversations behind your citations, ranked by how often engines use them.', cta: 'See Sources' },
]

export function Reinforced() {
  return (
    <section className="sec sec--top rf" id="reinforced">
      <div className="shell">
        <CarouselProvider>
          <div className="sec-head">
            <Reveal className="sec-head__text">
              <h2 className="h2">Reinforced by every new data point</h2>
              <p className="lead">Upstream learns what worked and closes the loop between action and result.</p>
            </Reveal>
            <CarouselControls />
          </div>
          <CarouselTrack label="Data points" className="rf-track">
            {items.map((it) => (
              <CarouselItem key={it.title} className="rf-cell">
                <div className="rf-cell__viz">{it.viz}</div>
                <div className="rf-cell__text">
                  <h3 className="h3">{it.title}</h3>
                  <p className="body">{it.body}</p>
                  <button type="button" className="btn btn--secondary">{it.cta}</button>
                </div>
              </CarouselItem>
            ))}
          </CarouselTrack>
        </CarouselProvider>
      </div>
    </section>
  )
}
