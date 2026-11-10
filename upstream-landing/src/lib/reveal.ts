/*
 * Scroll triggers, in every browser. One IntersectionObserver drives everything; the page only ever animates opacity and
 * transform (see styles/motion.css), so it stays cheap.
 *
 *  - blocks / grid items rise and fade in, staggered per row
 *  - the problem headline lights up word by word
 *  - chart bars grow
 *  - headline stats count up
 *  - a reading-progress bar (native scroll timeline where supported, a passive listener elsewhere)
 *
 * Anything already on screen at load is left alone. Reduced-motion users get none of it.
 */
const BLOCKS = [
  '.sec-head', '.faq-body', '.faq-item', '.cmp-wrap', '.mk__grid', '.fcta__inner', '.prb__sub', '.prb__tile',
  '.st-grid > *', '.res-grid > *', '.rf-grid > *', '.rsr-grid > *', '.prc-grid > *', '.cmd-cells > *', '.cmd-panels > *', '.cx__grid2 > *',
].join(',')
const CHARTS = '.cmd-hbars, .cmd-table, .cx__plot'
const BARS = '.cmd-hbars li i, .cmd-tb i, .cx__bar'
const WORDS = '.prb__title'
const COUNTS = '.res-card__stat, .cmd-card__n'

const below = (el: Element) => el.getBoundingClientRect().top >= window.innerHeight
const SETTLE_MS = 1800

function countUp(el: HTMLElement) {
  const node = el.firstChild
  if (!node || node.nodeType !== Node.TEXT_NODE) return
  const text = node.nodeValue ?? ''
  const m = text.match(/\d[\d,]*\.?\d*/)
  if (!m) return
  const raw = m[0]
  const target = parseFloat(raw.replace(/,/g, ''))
  const decimals = raw.includes('.') ? raw.length - raw.indexOf('.') - 1 : 0
  const commas = raw.includes(',')
  const fmt = (v: number) => (commas ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v.toFixed(decimals))
  const pre = text.slice(0, m.index)
  const post = text.slice((m.index ?? 0) + raw.length)
  const t0 = performance.now()
  const dur = 900
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    node.nodeValue = pre + fmt(target * eased) + post
    if (p < 1) requestAnimationFrame(step)
    else node.nodeValue = text
  }
  requestAnimationFrame(step)
}

function setupProgress(): () => void {
  const bar = document.querySelector<HTMLElement>('.scroll-progress')
  if (!bar || CSS.supports('animation-timeline: scroll()')) return () => {}
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
  }
  update()
  window.addEventListener('scroll', update, { passive: true })
  return () => window.removeEventListener('scroll', update)
}

export function initReveal(): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const timers: number[] = []
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        io.unobserve(el)
        if (el.classList.contains('rv')) {
          el.classList.add('rv--in')
          // Once settled, hand the element back to its normal styles so hover transitions are unaffected.
          later(() => el.classList.remove('rv', 'rv--in'), SETTLE_MS)
        } else if (el.matches(WORDS)) {
          el.classList.add('rv-words--in')
        } else if (el.matches(CHARTS)) {
          el.classList.add('rv-chart--in')
          later(() => el.classList.remove('rv-chart', 'rv-chart--in'), SETTLE_MS)
        } else if (el.matches(COUNTS)) {
          countUp(el)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )

  // Blocks: stagger within a visual row (same top edge), max five steps.
  const blocks = Array.from(document.querySelectorAll<HTMLElement>(BLOCKS)).filter(below)
  // Rows are told apart by their parent plus their top edge.
  const rowSeen = new Map<Element | null, Map<number, number>>()
  for (const el of blocks) {
    const rows = rowSeen.get(el.parentElement) ?? new Map<number, number>()
    rowSeen.set(el.parentElement, rows)
    const top = Math.round(el.getBoundingClientRect().top)
    const i = rows.get(top) ?? 0
    rows.set(top, i + 1)
    el.style.setProperty('--rv-delay', `${Math.min(i, 5) * 70}ms`)
    el.classList.add('rv')
    io.observe(el)
  }

  document.querySelectorAll<HTMLElement>(WORDS).forEach((el) => {
    if (!below(el)) return
    el.classList.add('rv-words')
    io.observe(el)
  })

  // Reduced-motion users keep the fades but not the growing bars, count-ups or progress bar.
  if (reduce) {
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }

  document.querySelectorAll<HTMLElement>(CHARTS).forEach((el) => {
    if (!below(el)) return
    el.querySelectorAll<HTMLElement>(BARS).forEach((b, i) => b.style.setProperty('--k', String(i)))
    el.classList.add('rv-chart')
    io.observe(el)
  })

  document.querySelectorAll<HTMLElement>(COUNTS).forEach((el) => {
    if (below(el)) io.observe(el)
  })

  const stopProgress = setupProgress()
  return () => {
    io.disconnect()
    timers.forEach(clearTimeout)
    stopProgress()
  }
}
