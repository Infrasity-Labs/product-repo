/*
 * The app's frame (main branch `components/layout/{layout,collapsible-sidebar,topbar,company-switcher,user-menu}.tsx`):
 * collapsible sidebar (company switcher in its header, GEO navigation only), 48px top bar, scrolling <main> with the
 * `lovable-page-container` padding. Pages are the modules in ./pages; `data-nav="<id>"` on any element inside the window
 * swaps pages (extra data-* attributes become the page's params).
 */
import { ri } from '../lib/icons'
import { BRAND, clusters, kpis } from './data'
import { listicleStats } from './listicles-data'
import { redditStats } from './reddit-data'
import { esc } from './ui'

export interface PageMeta { id: string; label: string; icon: string; order: number; hidden?: boolean }
type Params = Record<string, string>
interface PageModule { meta: PageMeta; html: (params?: Params) => string; mount: (root: HTMLElement, params?: Params) => void }

const modules = Object.values(import.meta.glob<PageModule>('./pages/*.ts', { eager: true }))
const pages = new Map(modules.map((m) => [m.meta.id, m]))


/* ── navigation: the app's GEO group, in its order, limited to the pages that exist here ── */
interface NavEntry { id: string; label: string; icon: string; also?: string[]; badge?: () => number | null; params?: () => Params }
const topCluster = [...clusters.filter((c) => c.tracked && c.answers > 0)].sort((a, b) => b.citation_rate - a.citation_rate || b.answers - a.answers)[0]
const NAV: Array<{ label: string; items: NavEntry[] }> = [
  {
    label: 'Monitor',
    items: [
      { id: 'overview', label: 'Overview', icon: 'RiEyeLine' },
      { id: 'cluster', label: 'Clusters', icon: 'RiStackLine', badge: () => clusters.filter((c) => c.enabled).length, params: () => (topCluster ? { cluster: topCluster.slug } : ({} as Params)) },
      { id: 'prompts', label: 'Prompts', icon: 'RiMessage2Line', also: ['model-results'], badge: () => kpis.prompts_tracked },
      { id: 'engines', label: 'Engines', icon: 'RiCpuLine', badge: () => kpis.engines },
    ],
  },
  {
    label: 'Market',
    items: [
      { id: 'sources', label: 'Sources', icon: 'RiGlobalLine', also: ['competitors'] },
      { id: 'listicles', label: 'Listicles', icon: 'RiListOrdered', badge: () => listicleStats.listicles_tracked },
      { id: 'reddit', label: 'Reddit', icon: 'RiChat1Line', badge: () => redditStats.threads_cited },
    ],
  },
  { label: 'Grow', items: [{ id: 'distribution', label: 'Distribution', icon: 'RiShareLine' }] },
]
const navGroups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => pages.has(i.id)) })).filter((g) => g.items.length)
const firstPage = navGroups[0]?.items[0]?.id ?? ''
const isOn = (e: NavEntry, id: string) => e.id === id || !!e.also?.includes(id)
const dataAttrs = (e: NavEntry) => Object.entries(e.params?.() ?? {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')

const ITEM = 'group flex h-8 items-center gap-2.5 rounded-md px-2.5 transition-colors duration-150'
const initial = (BRAND.name.trim()[0] ?? '?').toUpperCase()
const orgBadge = (px: 20 | 28) => `<span class="grid shrink-0 place-items-center rounded-md bg-accent-50 font-semibold text-accent-700" style="width:${px}px;height:${px}px;font-size:${px === 28 ? 12 : 11}px">${initial}</span>`

export function renderApp(host: HTMLElement): void {
  let current: { id: string; params?: Params } = { id: pages.has('overview') ? 'overview' : firstPage }
  const history: Array<typeof current> = []
  const ui = { collapsed: false, showGeo: true, switcher: false }

  host.innerHTML = `
    <div data-r data-app-window class="app relative flex h-[680px] overflow-hidden rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-left shadow-[0_40px_90px_-40px_rgba(20,20,40,0.45),0_2px_6px_rgba(20,20,40,0.06)]" style="font-size:15px;line-height:1.55;letter-spacing:-0.01em">
      <aside data-sb aria-label="Sidebar" class="flex h-full shrink-0 flex-col border-r border-[#e4e4e1] bg-[#f4f4f2] max-lg:hidden"></aside>
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div data-tb></div>
        <nav data-mnav aria-label="Pages" class="flex gap-1 overflow-x-auto border-b border-[#e5e5e5] bg-[#f4f4f2] px-3 py-1.5 lg:hidden"></nav>
        <main data-main data-lenis-prevent class="flex-1 overflow-y-auto">
          <div class="mx-auto space-y-6 px-6 py-6">
            <div data-page class="min-h-full antialiased"></div>
          </div>
        </main>
      </div>
    </div>`
  const win = host.querySelector<HTMLElement>('[data-app-window]') as HTMLElement
  const sb = win.querySelector<HTMLElement>('[data-sb]') as HTMLElement
  const tb = win.querySelector<HTMLElement>('[data-tb]') as HTMLElement
  const mnav = win.querySelector<HTMLElement>('[data-mnav]') as HTMLElement
  const main = win.querySelector<HTMLElement>('[data-main]') as HTMLElement
  const pageEl = win.querySelector<HTMLElement>('[data-page]') as HTMLElement

  /* GeoNavItem */
  const geoItem = (e: NavEntry) => {
    const on = isOn(e, current.id)
    const n = e.badge?.() ?? null
    return `<a href="#" data-nav="${e.id}"${dataAttrs(e)} ${on ? 'aria-current="page"' : ''} class="group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150 ${on ? 'bg-[#e6e6e3] font-medium text-[#18181b]' : 'text-[#6b6b66] hover:bg-[#ededea] hover:text-[#18181b]'}">
      ${ri(e.icon, `h-4 w-4 shrink-0 ${on ? 'text-[#18181b]' : 'text-[#6b6b66]'}`)}
      <span class="min-w-0 flex-1 truncate">${esc(e.label)}</span>
      ${n != null && n > 0 ? `<span class="ml-auto shrink-0 rounded-[10px] px-[7px] py-[1px] text-[11px] font-semibold tabular-nums ${on ? 'bg-white text-[#18181b]' : 'bg-[#e6e6e3] text-[#6b6b66]'}">${n}</span>` : ''}
    </a>`
  }

  const switcher = () => `
    <div class="relative flex min-w-0 flex-1">
      <button type="button" data-switcher aria-label="Switch dashboard" aria-expanded="${ui.switcher}" class="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 text-left outline-none transition-colors hover:bg-[#e9e9e6] focus-visible:ring-2 focus-visible:ring-border-focus-ring">
        ${orgBadge(20)}
        <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#171717]">${esc(BRAND.name)}</span>
        ${ri('RiExpandUpDownLine', 'size-4 shrink-0 text-[#6b6b66]')}
      </button>
      ${ui.switcher ? `<div data-switcher-pop role="dialog" aria-label="Switch dashboard" class="absolute left-0 top-full z-50 mt-1 w-72 rounded-[20px] border border-border-button-default bg-background-primary-default p-0 shadow-dropdown">
        <ul class="max-h-[min(360px,60vh)] overflow-y-auto p-1.5">
          <li><button type="button" data-switcher-pick class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-background-secondary-hover focus-visible:bg-background-secondary-hover">
            ${orgBadge(28)}
            <span class="min-w-0 flex-1"><span class="block truncate text-body-medium text-text-primary">${esc(BRAND.name)}</span><span class="block truncate text-caption-1-regular text-text-secondary">${esc(BRAND.domain)}</span></span>
            ${ri('RiCheckLine', 'size-4 shrink-0 text-accent-600')}
          </button></li>
        </ul>
      </div>` : ''}
    </div>`

  const renderSidebar = () => {
    sb.className = `flex h-full shrink-0 flex-col border-r border-[#e4e4e1] bg-[#f4f4f2] max-lg:hidden ${ui.collapsed ? 'w-[60px]' : 'w-[232px]'}`
    const geoOn = pages.has(current.id)
    sb.innerHTML = `
      <div class="flex items-center justify-between border-b border-[#e4e4e1] px-3 py-3">
        ${ui.collapsed ? '' : `<div class="flex min-w-0 flex-1 items-center gap-2.5"><span class="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#0a0a0a] text-white" title="Upstream"><svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 7v13M10 13l6-6 6 6M10 24c0-3 2.5-4 6-4s6 1 6 4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${switcher()}</div>`}
        <button type="button" data-collapse aria-label="${ui.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}" class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md p-0 text-[#6b7280] transition-colors hover:bg-[#f5f5f5] hover:text-[#6b7280] ${ui.collapsed ? 'mx-auto' : ''}">${ri(ui.collapsed ? 'RiArrowRightSLine' : 'RiArrowLeftSLine', 'h-4 w-4')}</button>
      </div>
      <nav class="flex-1 overflow-y-auto px-2 pb-3" data-lenis-prevent>
        ${ui.collapsed
          ? `<div class="mt-1 pt-2"><a href="#" data-nav="${firstPage}" title="Geo Dashboard" class="${ITEM} ${geoOn ? 'bg-[#e6e6e3]' : 'hover:bg-[#ededea]'}">${ri('RiLayoutGridLine', `h-4 w-4 shrink-0 transition-colors ${geoOn ? 'text-[#18181b]' : 'text-[#6b6b66] group-hover:text-[#18181b]'}`)}</a></div>`
          : `<div class="mt-1">
              <button type="button" data-toggle="geo" aria-expanded="${ui.showGeo}" class="flex w-full items-center px-3 pb-1.5 pt-5 text-left text-[12.5px] text-[#a09f9a] hover:text-[#6b6b66]"><span class="flex-1">Geo Dashboard</span>${ri('RiArrowDownSLine', `h-3.5 w-3.5 transition-transform duration-200 ${ui.showGeo ? 'rotate-0' : '-rotate-90'}`)}</button>
              ${ui.showGeo ? navGroups.map((g) => `<p class="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#3f3f3a]">${g.label}</p><div class="space-y-0.5">${g.items.map(geoItem).join('')}</div>`).join('') : ''}
            </div>`}
      </nav>`
  }

  /* TopBar + UserMenu trigger (docs link and notifications omitted in this window) */
  const renderTopbar = () => {
    tb.innerHTML = `
      <div class="flex h-12 items-center justify-between gap-2 border-b border-[#e5e5e5] bg-white px-3 sm:px-6">
        ${ui.collapsed ? '' : '<div class="hidden items-center space-x-4 lg:flex"><h1 class="text-[14px] font-semibold text-[#0a0a0a]">Upstream</h1></div>'}
        <div class="flex-1"></div>
        <div class="flex items-center space-x-2">
          <button type="button" aria-label="Account" class="relative inline-flex h-9 w-9 items-center justify-center rounded-full"><div class="flex items-center justify-center rounded-full bg-[#10b981] p-2"><span class="text-sm font-semibold text-white">TW</span></div></button>
        </div>
      </div>`
  }

  const renderMobileNav = () => {
    mnav.innerHTML = navGroups.flatMap((g) => g.items).map((e) => {
      const on = isOn(e, current.id)
      return `<a href="#" data-nav="${e.id}"${dataAttrs(e)} class="flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px] ${on ? 'bg-[#e6e6e3] font-medium text-[#18181b]' : 'text-[#6b6b66]'}">${ri(e.icon, 'h-4 w-4 shrink-0')}${esc(e.label)}</a>`
    }).join('')
  }

  const show = () => {
    const page = pages.get(current.id)
    ui.switcher = false
    pageEl.innerHTML = page ? page.html(current.params) : ''
    main.scrollTop = 0
    if (page) page.mount(pageEl, current.params)
    renderSidebar()
    renderMobileNav()
  }

  const go = (id: string, params?: Params) => {
    if (!pages.has(id)) return
    history.push(current)
    if (history.length > 20) history.shift()
    current = { id, params }
    show()
  }

  win.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (ui.switcher && !t.closest('[data-switcher-pop]') && !t.closest('[data-switcher]')) { ui.switcher = false; renderSidebar() }
    const nav = t.closest<HTMLElement>('[data-nav]')
    if (nav) {
      e.preventDefault(); e.stopPropagation()
      const id = nav.dataset.nav as string
      if (id === 'back') {
        const prev = history.pop()
        if (prev) { current = prev; show() } else if (current.id !== firstPage) { current = { id: firstPage }; show() }
        return
      }
      const { nav: _n, ...params } = nav.dataset
      void _n
      go(id, Object.keys(params).length ? (params as Params) : undefined)
      return
    }
    if (t.closest('[data-switcher-pick]')) { ui.switcher = false; renderSidebar(); return }
    if (t.closest('[data-switcher]')) { ui.switcher = !ui.switcher; renderSidebar(); return }
    const a = t.closest<HTMLAnchorElement>('a[href="#"]')
    if (a) { e.preventDefault(); e.stopPropagation(); return }
    if (t.closest('[data-collapse]')) { ui.collapsed = !ui.collapsed; ui.switcher = false; renderSidebar(); renderTopbar(); return }
    const tog = t.closest<HTMLElement>('[data-toggle]')
    if (tog) { ui.showGeo = !ui.showGeo; renderSidebar() }
  }, true)

  renderTopbar()
  show()
}
