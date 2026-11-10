import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Footer } from './components/Footer'
import { Cursor } from './components/Cursor'
import Sections from './components/Sections'
import { initReveal } from './lib/reveal'
import { initSmoothScroll } from './lib/smooth'

export default function App() {
  useEffect(() => initSmoothScroll(), [])
  useEffect(() => initReveal(), [])

  return (
    <>
      <div className="scroll-progress" aria-hidden />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Sections />
      </main>
      <Footer />
    </>
  )
}
