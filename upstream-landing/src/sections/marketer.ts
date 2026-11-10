import '../styles/showcase.css'
import { appFrame, fitFrames } from '../app/frame'
import { promptsTableCard, mountPromptsTable } from '../app/pages/prompts'
import { domainsCard, mountDomainsTable } from '../app/pages/sources'
import { redditThreadsCard } from '../app/pages/reddit'
import { listiclesCard } from '../app/pages/listicles'
import { actionsCard, headlineCard, statStrip, mountOverview } from '../app/overview-cards'
import * as charts from '../app/charts'

export const id = 'makes'

type IconKey = 'search' | 'link' | 'msg' | 'list' | 'send' | 'chart'
type Tab = { id: string; label: string; icon: IconKey; title: string; desc: string; card: () => string; mount: (el: HTMLElement) => void }

const ICONS: Record<IconKey, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z"/>',
  list: '<path d="m3 6 1.5 1.5L7.5 4.5M3 13l1.5 1.5L7.5 11.5M3 20l1.5 1.5 3-3M11 6h10M11 13h10M11 20h10"/>',
  send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
}

const icon = (k: IconKey) =>
  `<svg class="sc-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`

const TABS: Tab[] = [
  {
    id: 'prompts', label: 'Prompts', icon: 'search',
    title: 'Find the questions you are missing from',
    desc: 'Surfaces buyer prompts where Copilot or Grok skip Tracewell while rivals get named, ranked by volume.',
    card: promptsTableCard, mount: (el) => mountPromptsTable(el),
  },
  {
    id: 'sources', label: 'Sources', icon: 'link',
    title: 'See what engines actually trust',
    desc: 'Maps the GitHub repos, docs and posts each engine cites, and which ones your brand is absent from.',
    card: () => `<div data-domains>${domainsCard()}</div>`, mount: (el) => mountDomainsTable(el.querySelector<HTMLElement>('[data-domains]')!),
  },
  {
    id: 'reddit', label: 'Reddit', icon: 'msg',
    title: 'Answer the threads engines read',
    desc: 'Finds live Reddit threads that AI engines pull from and drafts helpful, non-promotional replies for you to post.',
    card: redditThreadsCard, mount: (el) => charts.mount(el),
  },
  {
    id: 'listicles', label: 'Listicles', icon: 'list',
    title: 'Get into the lists engines quote',
    desc: 'Finds the "best of" roundups that rank above you, the contact to reach, and a ready pitch for each.',
    card: listiclesCard, mount: (el) => charts.mount(el),
  },
  {
    id: 'distribution', label: 'Distribution', icon: 'send',
    title: 'Ship it where engines will see it',
    desc: 'Turns each new page into a post for dev.to, Hashnode and Hacker News, scheduled and ready to approve.',
    card: actionsCard, mount: (el) => mountOverview(el),
  },
  {
    id: 'reports', label: 'Reports', icon: 'chart',
    title: 'Know if the work moved the needle',
    desc: 'Weekly reports tie every shipped page and post to changes in visibility, citations and share of voice.',
    card: () => `<div class="space-y-3">${headlineCard()}${statStrip()}</div>`, mount: (el) => mountOverview(el),
  },
]

export function render(host: HTMLElement): void {
  host.innerHTML = `
  <div class="wrap">
    <h2 class="h2" data-r><span class="ink">Upstream makes it possible.</span></h2>
    <p class="sc-lead" data-r>It finds the work worth doing, drafts it, and pings you for approval.</p>
    <div class="sc-mk" data-r>
      <div class="sc-mk__left">
        <div class="sc-mk__tabs" role="tablist" aria-label="What Upstream does">
          ${TABS.map(
            (t, i) => `<button class="sc-mk__tab" role="tab" type="button" id="sc-mk-tab-${t.id}" aria-selected="${i === 0}" aria-controls="sc-mk-panel" tabindex="${i === 0 ? 0 : -1}">${icon(t.icon)}<span>${t.label}</span><i class="sc-mk__n mono">0${i + 1}</i></button>`,
          ).join('')}
        </div>
        <div class="sc-mk__copy" data-copy></div>
      </div>
      <div class="sc-mk__panel" role="tabpanel" id="sc-mk-panel" tabindex="0" data-panel></div>
    </div>
  </div>`

  const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('.sc-mk__tab'))
  const copy = host.querySelector<HTMLElement>('[data-copy]')!
  const panel = host.querySelector<HTMLElement>('[data-panel]')!
  let active = 0

  const paint = (): void => {
    const t = TABS[active]
    tabs.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === active))
      b.tabIndex = i === active ? 0 : -1
    })
    panel.setAttribute('aria-labelledby', `sc-mk-tab-${t.id}`)
    copy.innerHTML = `<h3 class="sc-mk__title">${t.title}</h3><p class="sc-mk__desc">${t.desc}</p>`
    panel.innerHTML = appFrame(t.card(), { height: 520, fit: 780 })
    fitFrames(panel)
    t.mount(panel)
  }

  const select = (i: number, focus = false): void => {
    active = i
    paint()
    if (focus) tabs[i].focus()
  }

  tabs.forEach((b, i) => b.addEventListener('click', () => select(i)))
  host.querySelector('.sc-mk__tabs')!.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent
    const n = TABS.length
    let i = -1
    if (e.key === 'Home') i = 0
    else if (e.key === 'End') i = n - 1
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (active + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (active + n - 1) % n
    if (i < 0) return
    e.preventDefault()
    select(i, true)
  })

  paint()
}
