import { useEffect, useRef, type RefObject } from 'react'
import type Lenis from 'lenis'

/** Default distance from the viewport top where pinned stages stick (fixed header + announcement bar + breathing room). */
export const STICKY_TOP = 128

/*
 * Scroll bus. Lenis moves the page inside its own requestAnimationFrame tick; the browser's native `scroll` event only
 * fires a frame later, so anything driven from it (pinned tracks, scrubbed text) lags the sticky layout by one frame and
 * looks jittery. App forwards Lenis' synchronous scroll event here instead, so subscribers update in the same tick that
 * moved the page. The state lives on globalThis so a hot-reload of this module cannot split subscribers from the emitter.
 */
type Bus = { listeners: Set<() => void>; lenis: Lenis | null }
const host = globalThis as typeof globalThis & { __upstreamScrollBus?: Bus }
const bus: Bus = (host.__upstreamScrollBus ??= { listeners: new Set(), lenis: null })

export function setLenis(l: Lenis | null) {
  bus.lenis = l
}

export function scrollToY(y: number) {
  if (bus.lenis) bus.lenis.scrollTo(y, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

export function onScroll(cb: () => void) {
  bus.listeners.add(cb)
  return () => {
    bus.listeners.delete(cb)
  }
}

export function emitScroll() {
  bus.listeners.forEach((cb) => cb())
}

/** Page Y at which a pinned runway reaches progress `p` (0..1). */
export function runwayY(runway: HTMLElement, travel: number, p: number, top = STICKY_TOP) {
  return window.scrollY + runway.getBoundingClientRect().top - top + p * travel
}

/**
 * Reports scroll progress (0..1) through a runway: a tall element whose child is `position: sticky` at `top`.
 * Progress is 0 when the runway reaches `top` and 1 after `travel` more pixels of scrolling.
 */
export function useRunway(runway: RefObject<HTMLElement | null>, travel: number, onProgress: (p: number) => void, top = STICKY_TOP) {
  const cb = useRef(onProgress)
  cb.current = onProgress

  useEffect(() => {
    const el = runway.current
    if (!el) return
    const tick = () => {
      const p = travel > 0 ? (top - el.getBoundingClientRect().top) / travel : 0
      cb.current(Math.min(1, Math.max(0, p)))
    }
    tick()
    const off = onScroll(tick)
    window.addEventListener('resize', tick)
    return () => {
      off()
      window.removeEventListener('resize', tick)
    }
  }, [runway, travel, top])
}
