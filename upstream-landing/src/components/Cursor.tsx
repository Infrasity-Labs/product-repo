import { useEffect, useRef } from 'react'
import '../styles/cursor.css'

const INTERACTIVE = 'a, button, summary, [role="tab"], [role="switch"], input, textarea'

/**
 * A small black dot that trails the mouse. Only for fine pointers (no touch) and when motion is allowed. The animation
 * loop runs only while the dot is catching up with the pointer, so it costs nothing at rest.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dot.current
    if (!el || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = 0, ty = 0, x = 0, y = 0
    let raf = 0
    let seen = false

    const tick = () => {
      x += (tx - x) * 0.22
      y += (ty - y) * 0.22
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0
    }
    const move = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!seen) {
        seen = true
        x = tx
        y = ty
        el.dataset.on = 'true'
      }
      el.dataset.hover = String(!!(e.target as Element | null)?.closest?.(INTERACTIVE))
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const leave = () => { el.dataset.on = 'false'; seen = false }

    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  return <div ref={dot} className="cursor-dot" aria-hidden />
}
