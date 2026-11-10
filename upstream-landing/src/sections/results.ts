import '../styles/proof.css'
import * as charts from '../app/charts'

export const id = 'results'

type Report =
  | { kind: 'bars'; title: string; unit: string; rows: [string, number][] }
  | { kind: 'trend'; title: string; unit: string; points: number[]; labels: [string, string] }

type Art = 'rings' | 'grid' | 'bars' | 'wave' | 'dots' | 'steps'
type Card = { stat: string; desc: string; theme: 'a' | 'b' | 'c' | 'd' | 'e' | 'f'; art: Art; report: Report }

const cards: Card[] = [
  { stat: '45.9%', desc: 'Share of voice across 8 engines after shipping the comparison pages.', theme: 'a', art: 'rings',
    report: { kind: 'trend', title: 'Share of voice, last 12 weeks', unit: '%', points: [18, 20, 19, 23, 26, 25, 30, 33, 36, 39, 43, 45.9], labels: ['Wk 1', 'Wk 12'] } },
  { stat: '8 / 8', desc: 'Engines now mention Tracewell for "best SDK for X" prompts.', theme: 'b', art: 'grid',
    report: { kind: 'bars', title: 'Mention rate by engine', unit: '%', rows: [['ChatGPT', 71], ['Claude', 64], ['Gemini', 58], ['Perplexity', 77], ['AI Overviews', 49], ['AI Mode', 52], ['Copilot', 41], ['Grok', 38]] } },
  { stat: '48h', desc: 'From an engine citing a stale claim to a fix shipped and re-scanned.', theme: 'c', art: 'steps',
    report: { kind: 'bars', title: 'Hours to resolve, by issue type', unit: 'h', rows: [['Inaccurate claim', 48], ['Missing comparison', 72], ['Stale docs page', 36], ['Listicle gap', 96]] } },
  { stat: '+7.9 pts', desc: 'Citation share lift in the first month on Reddit-sourced prompts.', theme: 'd', art: 'wave',
    report: { kind: 'trend', title: 'Citation share, Reddit prompts', unit: '%', points: [12, 12.5, 13, 14.2, 15.1, 16.8, 17.5, 19.9], labels: ['Week 0', 'Week 4'] } },
  { stat: '12 repos', desc: 'GitHub repositories engines quote when answering about your category.', theme: 'e', art: 'dots',
    report: { kind: 'bars', title: 'Citations by GitHub repository', unit: '', rows: [['tracewell/sdk-js', 34], ['spanlight/otel-kit', 22], ['evalkit/evals', 19], ['promptgrid/core', 14], ['lumenlace/agent', 9]] } },
  { stat: '3.2×', desc: 'More AI referral visits after the listicle and docs fixes landed.', theme: 'f', art: 'bars',
    report: { kind: 'trend', title: 'AI referral visits (index, week 0 = 1.0)', unit: '×', points: [1, 1.1, 1.3, 1.2, 1.7, 2.1, 2.6, 3.2], labels: ['Week 0', 'Week 8'] } },
]

const artSvg = (inner: string) => `<svg class="pf-art" viewBox="0 0 640 480" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">${inner}</svg>`
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

function art(kind: Art): string {
  switch (kind) {
    case 'rings':
      return artSvg(`${[80, 140, 200, 260, 320].map((r) => `<circle cx="470" cy="150" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.3"/>`).join('')}<circle cx="470" cy="150" r="9" fill="currentColor"/>`)
    case 'grid':
      return artSvg(range(8).map((i) => `<rect x="${300 + (i % 4) * 78}" y="${50 + Math.floor(i / 4) * 78}" width="62" height="62" rx="14" fill="currentColor" fill-opacity="${0.1 + (i % 3) * 0.08}"/>`).join(''))
    case 'steps':
      return artSvg(range(5).map((i) => `<rect x="${300 + i * 62}" y="${260 - i * 48}" width="52" height="${100 + i * 48}" rx="12" fill="currentColor" fill-opacity="${0.08 + i * 0.05}"/>`).join(''))
    case 'wave':
      return artSvg(range(6).map((i) => `<path d="M240 ${120 + i * 26} C 330 ${60 + i * 26}, 400 ${190 + i * 26}, 500 ${110 + i * 26} S 600 ${90 + i * 26}, 660 ${70 + i * 26}" fill="none" stroke="currentColor" stroke-opacity="${0.12 + i * 0.03}" stroke-width="1.5"/>`).join(''))
    case 'dots':
      return artSvg(range(80).map((i) => {
        const on = (i * 7) % 5 === 0
        return `<circle cx="${280 + (i % 10) * 34}" cy="${40 + Math.floor(i / 10) * 34}" r="${on ? 7 : 3}" fill="currentColor" fill-opacity="${on ? 0.35 : 0.2}"/>`
      }).join(''))
    default:
      return artSvg(`${[40, 70, 55, 95, 120, 150, 190].map((h, i) => `<rect x="${290 + i * 46}" y="${250 - h}" width="30" height="${h}" rx="8" fill="currentColor" fill-opacity="${0.1 + i * 0.03}"/>`).join('')}<line x1="280" x2="620" y1="262" y2="262" stroke="currentColor" stroke-opacity="0.2"/>`)
  }
}

const num = (v: number) => String(Math.round(v * 100) / 100)

/** x labels: the first and last come from the report; points in between are numbered when the step is a whole number. */
function xLabels(n: number, [first, last]: [string, string]): string[] {
  const m = /^(.*?)(\d+)$/.exec(first), e = /(\d+)$/.exec(last)
  const a = m ? Number(m[2]) : 0, z = e ? Number(e[1]) : n - 1
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return first
    if (i === n - 1) return last
    const v = a + ((z - a) * i) / (n - 1)
    return Number.isInteger(v) ? `${m ? m[1] : ''}${v}` : ''
  })
}

function chart(r: Report): string {
  if (r.kind === 'trend') {
    const xs = xLabels(r.points.length, r.labels)
    return `<div class="h-[240px]">${charts.trendLine({
      points: r.points.map((y, i) => ({ x: xs[i], y, answers: 0 })),
      color: '#7c3aed', yMin: 0, seriesLabel: r.title, fmt: (n) => `${num(n)}${r.unit}`,
    })}</div>`
  }
  return charts.hbar({
    rows: r.rows.map(([label, value]) => ({ id: label, label, value, color: '#ddd6fe', valueLabel: `${num(value)}${r.unit}` })),
    rowHeight: 40, labelWidth: 130,
  })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function render(host: HTMLElement): void {
  host.classList.add('pf-sec')
  host.innerHTML = `<div class="wrap">
    <h2 class="h2" data-r><span class="ink">Engineered for developer marketers with higher standards.</span></h2>
    <p class="pf-lead" data-r>See what a tracked, closed-loop AEO workflow looks like, from first scan to a measurable lift.</p>
    <div class="pf-res">
      ${cards.map((c, i) => `<article class="pf-card pf-card--${c.theme}" data-r>
        ${art(c.art)}
        <div class="pf-stat">${c.stat}</div>
        <p class="pf-desc">${c.desc}</p>
        <div class="pf-foot">
          <span class="pf-note">Sample data from Tracewell</span>
          <button type="button" class="pill pill--line pill--sm" data-i="${i}" aria-haspopup="dialog" aria-label="View report: ${esc(c.report.title)}">View report</button>
        </div>
      </article>`).join('')}
    </div>
  </div>`

  const modal = document.createElement('div')
  modal.className = 'pf-modal'
  modal.hidden = true
  modal.setAttribute('data-lenis-prevent', '')
  modal.innerHTML = `<div class="pf-modal__box" role="dialog" aria-modal="true" aria-labelledby="pf-modal-title">
    <div class="pf-modal__head">
      <div><p class="label label--dim">Sample report · Tracewell</p><h3 class="pf-modal__title" id="pf-modal-title"></h3></div>
      <button type="button" class="pf-x" aria-label="Close report"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
    </div>
    <div class="pf-modal__stat"></div>
    <p class="pf-modal__desc"></p>
    <div class="pf-modal__viz app"></div>
    <p class="pf-modal__foot">Sample data from Tracewell. Illustrative, not a customer result.</p>
  </div>`
  document.body.appendChild(modal)

  const q = <T extends HTMLElement>(s: string) => modal.querySelector<T>(s)!
  const closeBtn = q<HTMLButtonElement>('.pf-x')
  let opener: HTMLElement | null = null

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus() }
  }
  function close() {
    modal.hidden = true
    window.removeEventListener('keydown', onKey)
    opener?.focus()
    opener = null
  }
  function open(i: number, from: HTMLElement) {
    const c = cards[i], r = c.report
    opener = from
    q('.pf-modal__title').textContent = r.title
    q('.pf-modal__stat').textContent = c.stat
    q('.pf-modal__desc').textContent = c.desc
    q('.pf-modal__viz').innerHTML = chart(r)
    charts.mount(q('.pf-modal__viz'))
    modal.hidden = false
    closeBtn.focus()
    window.addEventListener('keydown', onKey)
  }

  host.querySelectorAll<HTMLButtonElement>('button[data-i]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.i), b)))
  closeBtn.addEventListener('click', close)
  modal.addEventListener('mousedown', (e) => { if (e.target === modal) close() })
}
