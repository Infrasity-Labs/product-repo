import { lazy, Suspense, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { EngineStrip } from './components/EngineStrip'
import { Footer } from './components/Footer'
import { emitScroll, setLenis } from './lib/scroll'

const Sections = lazy(() => import('./components/Sections'))

export default function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // Without smoothing (reduced motion) the native scroll event is already frame-accurate.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.addEventListener('scroll', emitScroll, { passive: true })
      return () => window.removeEventListener('scroll', emitScroll)
    }
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -112, duration: 1.2 } })
    setLenis(lenis)
    lenis.on('scroll', emitScroll)
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(raf)
      setLenis(null)
      lenis.destroy()
    }
  }, [])

  // Infinite CSS animations (floating tiles, dash flows, spinners) stop running while their section is offscreen.
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)), {
      rootMargin: '200px 0px',
    })
    const watch = () => main.querySelectorAll(':scope > section').forEach((s) => io.observe(s))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(main, { childList: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])

  // Hero paints first; the rest of the page loads right after, then deep links (#pricing) are honoured.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120))
    idle(() => setReady(true))
  }, [])
  useEffect(() => {
    if (ready && location.hash) document.querySelector(location.hash)?.scrollIntoView()
  }, [ready])

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <EngineStrip />
        {ready ? (
          <Suspense fallback={<div className="sections-fallback" aria-hidden />}>
            <Sections />
          </Suspense>
        ) : (
          <div className="sections-fallback" aria-hidden />
        )}
      </main>
      <Footer />
    </>
  )
}
