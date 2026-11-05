import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, type MotionValue } from 'motion/react'
import { brands } from '../lib/brands'
import { onScroll } from '../lib/scroll'
import '../styles/problem.css'

const TITLE = 'The rise of AI Search created an impossible amount of work for developer marketers'
const WORDS = TITLE.split(' ')

function Word({ word, i, n, p, still }: { word: string; i: number; n: number; p: MotionValue<number>; still: boolean }) {
  const a = 0.08 + (i / n) * 0.5
  const b = a + 0.1
  const opacity = useTransform(p, [a, b], [0.12, 1])
  const blur = useTransform(p, [a, b], [10, 0])
  const filter = useTransform(blur, (v) => (v < 0.2 ? 'none' : `blur(${v.toFixed(1)}px)`))
  const y = useTransform(p, [a, b], [10, 0])
  return (
    <>
      <motion.span className="prb__word" style={still ? undefined : { opacity, filter, y }}>
        {word}
      </motion.span>
      {i < n - 1 ? ' ' : null}
    </>
  )
}

// Pure-black brand marks read too heavy on a light tile; soften them to ink.
const colorOf = (hex: string) => (hex === '000000' || hex === '181717' || hex === '0A0A0A' ? '#1b1b1f' : `#${hex}`)

type Node = { ox: number; oy: number; ax: number; ay: number; sp: number; ph: number; icon: number; depth: number }
type Pulse = { a: number; b: number; t: number; v: number }

function makeNodes(): Node[] {
  const nodes: Node[] = []
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 110; i++) {
    nodes.push({
      ox: rnd(), oy: rnd(), ax: 0.008 + rnd() * 0.022, ay: 0.008 + rnd() * 0.022,
      sp: 0.15 + rnd() * 0.35, ph: rnd() * 6.28, icon: i < 22 ? i % brands.length : -1, depth: 0.4 + rnd() * 0.6,
    })
  }
  return nodes
}

/** Pre-renders one brand tile (white rounded square, soft shadow, brand glyph) so each frame is a plain drawImage. */
type Sprite = { canvas: HTMLCanvasElement; size: number }

function makeSprite(i: number, dpr: number): Sprite {
  const tile = 38
  const pad = 20
  const c = document.createElement('canvas')
  c.width = Math.ceil((tile + pad * 2) * dpr)
  c.height = c.width
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  const x = pad
  const y = pad
  g.save()
  g.shadowColor = 'rgba(15, 15, 18, 0.16)'
  g.shadowBlur = 14
  g.shadowOffsetY = 5
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(x, y, tile, tile, tile * 0.3)
  g.fill()
  g.restore()
  g.strokeStyle = 'rgba(15, 15, 18, 0.09)'
  g.beginPath()
  g.roundRect(x + 0.5, y + 0.5, tile - 1, tile - 1, tile * 0.3)
  g.stroke()
  const s = (tile * 0.5) / 24
  g.translate(x + tile / 2 - 12 * s, y + tile / 2 - 12 * s)
  g.scale(s, s)
  g.fillStyle = colorOf(brands[i].hex)
  g.fill(new Path2D(brands[i].path))
  return { canvas: c, size: tile + pad * 2 }
}

const BUCKETS = 5

function NetworkCanvas({ opacity, progress, still }: { opacity: MotionValue<number>; progress: MotionValue<number>; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const nodes = makeNodes()
    const pulses: Pulse[] = []
    const pointer = { x: -1e4, y: -1e4 }
    let sprites: Sprite[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let visible = true
    let last = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sprites = brands.map((_, i) => makeSprite(i, dpr))
      if (still) draw(0)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const scroll = progress.get()
      const pts = nodes.map((n) => {
        const k = t * n.sp
        let px = (n.ox + Math.sin(k + n.ph) * n.ax) * w
        let py = (n.oy + Math.cos(k * 0.9 + n.ph) * n.ay) * h - (scroll - 0.5) * 140 * n.depth
        const dx = px - pointer.x
        const dy = py - pointer.y
        const d = Math.hypot(dx, dy)
        if (d < 150 && d > 0) {
          const push = (1 - d / 150) * 26
          px += (dx / d) * push
          py += (dy / d) * push
        }
        return { px, py, icon: n.icon, depth: n.depth }
      })

      // Edges are batched into a few alpha buckets: one stroke() per bucket instead of one per edge.
      const maxD = Math.min(250, Math.max(140, w * 0.17))
      const buckets: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D())
      const strong: [number, number][] = []
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py)
          if (d < maxD) {
            const a = 1 - d / maxD
            const b = Math.min(BUCKETS - 1, Math.floor(a * BUCKETS))
            buckets[b].moveTo(pts[i].px, pts[i].py)
            buckets[b].lineTo(pts[j].px, pts[j].py)
            if (a > 0.45) strong.push([i, j])
          }
        }
      }
      ctx.lineWidth = 1
      for (let b = 0; b < BUCKETS; b++) {
        ctx.strokeStyle = `rgba(95, 80, 200, ${(((b + 0.5) / BUCKETS) * 0.36).toFixed(3)})`
        ctx.stroke(buckets[b])
      }

      if (!still && strong.length && pulses.length < 22 && Math.random() < 0.16) {
        const [a, b] = strong[(Math.random() * strong.length) | 0]
        pulses.push({ a, b, t: 0, v: 0.008 + Math.random() * 0.012 })
      }
      ctx.fillStyle = 'rgba(75, 44, 240, 0.35)'
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]
        p.t += p.v
        if (p.t >= 1 || !pts[p.a] || !pts[p.b]) {
          pulses.splice(i, 1)
          continue
        }
        const x = pts[p.a].px + (pts[p.b].px - pts[p.a].px) * p.t
        const y = pts[p.a].py + (pts[p.b].py - pts[p.a].py) * p.t
        ctx.beginPath()
        ctx.arc(x, y, 3.2, 0, 6.283)
        ctx.fill()
      }

      for (const p of pts) {
        if (p.icon < 0) {
          ctx.fillStyle = `rgba(95, 80, 200, ${(0.28 + p.depth * 0.3).toFixed(2)})`
          ctx.beginPath()
          ctx.arc(p.px, p.py, 1.6 + p.depth, 0, 6.283)
          ctx.fill()
          continue
        }
        const sp = sprites[p.icon]
        const k = (30 + p.depth * 8) / 38
        const sz = sp.size * k
        ctx.drawImage(sp.canvas, p.px - sz / 2, p.py - sz / 2, sz, sz)
      }
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || now - last < 33) return
      last = now
      draw(now / 1000)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    if (!still) {
      raf = requestAnimationFrame(loop)
      window.addEventListener('pointermove', onMove, { passive: true })
    }
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [still, progress])

  return <motion.canvas ref={ref} className="prb__canvas" style={{ opacity }} aria-hidden />
}

export function Problem() {
  const root = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const progress = useMotionValue(0)

  // Progress comes from the shared scroll bus (frame-synced with Lenis) rather than a lagging native scroll listener.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const tick = () => {
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      progress.set(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0)
    }
    tick()
    const off = onScroll(tick)
    window.addEventListener('resize', tick)
    return () => {
      off()
      window.removeEventListener('resize', tick)
    }
  }, [progress])

  const net = useTransform(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0.5])
  const subOpacity = useTransform(progress, [0.58, 0.72], [0, 1])
  const subY = useTransform(progress, [0.58, 0.72], [16, 0])

  return (
    <section className="prb" id="problem" ref={root}>
      <div className="prb__stage">
        <NetworkCanvas opacity={net} progress={progress} still={reduce} />
        <div className="shell prb__guides" />
        <div className="prb__shell">
          <div className="prb__veil" />
          <div className="prb__copy">
            <h2 className="prb__title">
              {WORDS.map((w, i) => (
                <Word key={i} word={w} i={i} n={WORDS.length} p={progress} still={reduce} />
              ))}
            </h2>
            <motion.p className="prb__sub" style={reduce ? undefined : { opacity: subOpacity, y: subY }}>
              Eight engines, hundreds of sources, and a new answer every scan. Upstream does the watching so you can do the shipping.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
