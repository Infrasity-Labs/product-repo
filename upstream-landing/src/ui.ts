/* Small, dependency-free page behaviours: nav, cursor dot, scroll reveals and count-ups. */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Hide the nav while scrolling down, bring it back on the way up. */
export function initNav() {
  const nav = document.getElementById('nav')
  if (!nav) return
  let last = window.scrollY
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY
      nav.dataset.scrolled = String(y > 24)
      nav.dataset.hidden = String(y > last && y > 240)
      last = y
    },
    { passive: true },
  )
}

const INTERACTIVE = 'a, button, summary, input'

/** A small ink dot that trails the pointer. Runs its loop only while catching up. */
export function initCursor() {
  const dot = document.querySelector<HTMLElement>('.cursor')
  if (!dot || reduce || !window.matchMedia('(pointer: fine)').matches) return
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, seen = false
  const tick = () => {
    x += (tx - x) * 0.22
    y += (ty - y) * 0.22
    dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX
      ty = e.clientY
      if (!seen) { seen = true; x = tx; y = ty; dot.dataset.on = 'true' }
      dot.dataset.hover = String(!!(e.target as Element | null)?.closest?.(INTERACTIVE))
      if (!raf) raf = requestAnimationFrame(tick)
    },
    { passive: true },
  )
  document.documentElement.addEventListener('mouseleave', () => { dot.dataset.on = 'false'; seen = false })
}

function countUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.count ?? '0')
  const dec = parseInt(el.dataset.dec ?? '0', 10)
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / 1100)
    el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** One IntersectionObserver for every reveal, the statement words and the count-ups. */
export function initReveal() {
  const statement = document.getElementById('statement')
  if (statement) {
    const words = (statement.textContent ?? '').trim().split(/\s+/)
    statement.textContent = ''
    words.forEach((w, i) => {
      const s = document.createElement('span')
      s.className = 'w'
      s.style.setProperty('--i', String(i))
      s.textContent = w
      statement.append(s, ' ')
    })
  }

  const seen = new Map<Element, number>()
  document.querySelectorAll<HTMLElement>('[data-r]').forEach((el) => {
    const p = el.parentElement as Element
    const n = seen.get(p) ?? 0
    seen.set(p, n + 1)
    el.style.setProperty('--d', `${Math.min(n, 6) * 70}ms`)
  })

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        el.classList.add('in')
        if (!reduce) el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp)
        io.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  document.querySelectorAll('[data-r], #statement').forEach((el) => io.observe(el))
}
