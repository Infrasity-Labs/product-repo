import Lenis from 'lenis'

/**
 * Inertial wheel scrolling. Nothing on the page listens to scroll position any more (reveals use IntersectionObserver,
 * the progress bar uses a native scroll timeline), so smoothing is the only per-frame work. Off for reduced motion;
 * Lenis leaves touch scrolling native.
 */
export function initSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 1, smoothWheel: true, autoRaf: true, anchors: { offset: -112 } })
  return () => lenis.destroy()
}
