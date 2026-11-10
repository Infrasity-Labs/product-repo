import '@fontsource-variable/inter/opsz.css'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/dm-sans'
import './style.css'
import './styles/app.css'
import Lenis from 'lenis'
import { fitFrames } from './app/frame'
import { initCursor, initNav, initReveal, initRotator } from './ui'

/*
 * Section modules: every file in ./sections exports `id` (the host element's id in index.html) and `render(host)`.
 * They must render BEFORE initReveal() so the reveal observer sees their [data-r] blocks.
 */
type Section = { id: string; render: (host: HTMLElement) => void }
const sections = import.meta.glob<Section>('./sections/*.ts', { eager: true })
for (const m of Object.values(sections)) {
  const host = document.getElementById(m.id)
  if (host) m.render(host)
}

fitFrames()
initReveal()
initNav()
initCursor()
initRotator()

// Inertial wheel scrolling (touch stays native; off for reduced motion).
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  new Lenis({ lerp: 0.075, autoRaf: true, anchors: { offset: -72 }, allowNestedScroll: true })
}

// three.js is its own chunk, loaded after the page has painted.
const canvas = document.getElementById('gl') as HTMLCanvasElement | null
if (canvas) {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 80))
  idle(() => import('./hero3d').then((m) => m.initHero(canvas)))
}
