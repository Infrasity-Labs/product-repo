import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { runwayY, scrollToY, STICKY_TOP, useRunway } from '../lib/scroll'
import '../styles/carousel.css'

/*
 * Scroll-driven horizontal carousel. The track pins below the header and slides sideways as the page scrolls
 * vertically; there is no horizontal scrolling or dragging. Prev/next scroll the page to the neighbouring card.
 */

type Api = { go: (dir: 1 | -1) => void }
type Ctx = {
  canPrev: boolean
  canNext: boolean
  prev: () => void
  next: () => void
  api: React.RefObject<Api | null>
  report: (s: { canPrev: boolean; canNext: boolean }) => void
}

const CarouselCtx = createContext<Ctx | null>(null)

export function useCarousel() {
  const c = useContext(CarouselCtx)
  if (!c) throw new Error('useCarousel must be used inside <CarouselProvider>')
  return c
}

/** Owns progress state so controls can live in the section header while the track sits below. */
export function CarouselProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ canPrev: false, canNext: true })
  const api = useRef<Api | null>(null)
  const value: Ctx = {
    ...state,
    api,
    report: setState,
    prev: () => api.current?.go(-1),
    next: () => api.current?.go(1),
  }
  return <CarouselCtx.Provider value={value}>{children}</CarouselCtx.Provider>
}

export function CarouselControls() {
  const { canPrev, canNext, prev, next } = useCarousel()
  return (
    <div className="sec-head__actions">
      <button type="button" className="iconbtn" aria-label="Previous" disabled={!canPrev} onClick={prev}>
        <ChevronLeft size={16} />
      </button>
      <button type="button" className="iconbtn" aria-label="Next" disabled={!canNext} onClick={next}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export function CarouselTrack({ children, className = '', label }: { children: ReactNode; className?: string; label: string }) {
  const ctx = useCarousel()
  const runway = useRef<HTMLDivElement>(null)
  const clip = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const stick = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ travel: 0, stage: 0, top: STICKY_TOP })
  const last = useRef({ canPrev: false, canNext: true })

  const measure = useCallback(() => {
    if (!clip.current || !strip.current || !stick.current) return
    const travel = Math.max(0, strip.current.scrollWidth - clip.current.clientWidth)
    const stage = stick.current.offsetHeight
    // Centre the pinned track in the space below the fixed header (104px), never closer than STICKY_TOP.
    const top = Math.max(STICKY_TOP, Math.round((window.innerHeight + 104 - stage) / 2))
    setDims((d) => (d.travel === travel && d.stage === stage && d.top === top ? d : { travel, stage, top }))
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (strip.current) ro.observe(strip.current)
    if (clip.current) ro.observe(clip.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  useRunway(runway, dims.travel, (p) => {
    if (strip.current) strip.current.style.transform = `translate3d(${(-p * dims.travel).toFixed(2)}px,0,0)`
    const next = { canPrev: p > 0.005, canNext: p < 0.995 }
    if (next.canPrev !== last.current.canPrev || next.canNext !== last.current.canNext) {
      last.current = next
      ctx.report(next)
    }
  }, dims.top)

  useEffect(() => {
    ctx.api.current = {
      go: (dir) => {
        const el = runway.current
        const s = strip.current
        if (!el || !s || dims.travel <= 0) return
        const cur = dims.top - el.getBoundingClientRect().top
        const lefts = Array.from(s.querySelectorAll<HTMLElement>('[data-car-item]')).map((n) => n.offsetLeft)
        const target = dir === 1 ? (lefts.find((l) => l > cur + 4) ?? dims.travel) : ([...lefts].reverse().find((l) => l < cur - 4) ?? 0)
        scrollToY(runwayY(el, dims.travel, Math.min(1, Math.max(0, target / dims.travel)), dims.top))
      },
    }
    return () => {
      ctx.api.current = null
    }
  }, [ctx.api, dims.travel, dims.top])

  return (
    <div ref={runway} className="car-run" style={{ height: dims.stage ? dims.stage + dims.travel : undefined }}>
      <div ref={stick} className="car-stick" style={{ top: dims.top }}>
        <div ref={clip} className="car-clip" role="region" aria-roledescription="carousel" aria-label={label}>
          <div ref={strip} className={`car ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CarouselItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`car__item ${className}`} data-car-item role="group" aria-roledescription="slide">
      {children}
    </div>
  )
}
