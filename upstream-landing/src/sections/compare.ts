import '../styles/compare.css'

export const id = 'why'

const rows: { label: string; general: string; upstream: string }[] = [
  { label: 'Built for', general: 'Consumer and enterprise brands', upstream: 'DevTool, AI agent and B2B SaaS startups' },
  { label: 'Engines tracked', general: 'Varies by plan', upstream: 'All 8, incl. Copilot and Grok' },
  { label: 'GitHub, Hacker News, dev.to and Reddit as sources', general: 'Lumped into "other"', upstream: 'Tracked one by one' },
  { label: 'Full answer and brand order for every run', general: 'Sometimes', upstream: 'Yes' },
  { label: 'Listicle contacts and ready pitches', general: 'No', upstream: 'Yes' },
  { label: 'Reddit and distribution gaps', general: 'No', upstream: 'Yes' },
  { label: 'Scan health and confidence ranges', general: 'Rarely', upstream: 'Yes' },
  { label: 'A team that can do the work for you', general: 'No', upstream: 'Optional, engineers by Infrasity' },
]
const isNo = (s: string) => /^(No|Rarely)$/.test(s)

const X = '<svg class="cp-ic cp-ic--no" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
const DASH = '<svg class="cp-ic cp-ic--mid" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
const CHECK = '<svg class="cp-ic cp-ic--ok" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#4b2cf0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const MARK = '<svg class="cp-mark" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M16 7v13M10 13l6-6 6 6M10 24c0-3 2.5-4 6-4s6 1 6 4" fill="none" stroke="#4b2cf0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

const strip: [string, string][] = [
  ['Built for', 'DevTool, AI agent and B2B SaaS startups'],
  ['Engines tracked', 'All 8, incl. Copilot and Grok'],
  ['Sources', 'GitHub, Hacker News, dev.to and Reddit tracked one by one'],
]

export function render(host: HTMLElement): void {
  host.innerHTML = `<div class="wrap">
<h2 class="h2" data-r><span class="ink">Why not a general AI-visibility tool?</span></h2>
<p class="cp-lead" data-r>General tools are built for consumer brands. Upstream is built for how engineers choose software.</p>
<div class="cp-table" role="table" aria-label="Upstream compared with general AI-visibility tools" data-r>
<div class="cp-row cp-row--head" role="row">
<div class="cp-c" role="columnheader">Criterion</div>
<div class="cp-c cp-c--gen" role="columnheader">General tools</div>
<div class="cp-c cp-c--up" role="columnheader">${MARK} Upstream</div></div>
${rows.map((r) => `<div class="cp-row" role="row">
<div class="cp-c cp-c--label" role="rowheader">${r.label}</div>
<div class="cp-c cp-c--gen" role="cell"><span class="cp-m">General tools</span>${isNo(r.general) ? X : DASH}<span>${r.general}</span></div>
<div class="cp-c cp-c--up" role="cell"><span class="cp-m">Upstream</span>${CHECK}<span>${r.upstream}</span></div></div>`).join('')}
</div>
<div class="cp-strip">${strip.map(([k, v]) => `<div class="cp-card" data-r><p class="label label--dim">${k}</p><p class="cp-card__v">${v}</p></div>`).join('')}</div>
</div>`
}
