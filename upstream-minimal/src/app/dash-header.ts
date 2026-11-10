/*
 * Port of `dash/dash-header.tsx` (PageBar + FilterBar) with `date-range-picker.tsx`: the breadcrumb bar (help, export, ask agent),
 * the sticky filter bar (cluster select, date-range picker with calendar, engines pill, all-filters popover) and the scan-health link.
 *
 *   pageBar(current)                       the 56px breadcrumb bar (export button carries `data-export`)
 *   mountFilterBar(host, opts) → { set }   renders the bar into `host`, owns its popovers, calls `onChange(value)` on every pick
 *
 * The real app's NotificationsBell renders only for Infrasity staff accounts, so it is not part of a customer's bar.
 */
import { ri } from '../lib/icons'
import { button, cx, esc } from './base'
import { dashButton } from './dash-ui'
import { BRAND, clusters, dates } from './data'
import { engineLogo } from './ui'

export interface FilterValue { range: 7 | 30 | 90; from?: string; to?: string; cluster: string; engines: string[] }
export interface ClusterOpt { slug: string; name: string; active: boolean }

export const defaultFilter = (over: Partial<FilterValue> = {}): FilterValue => ({ range: 30, cluster: 'all', engines: [], ...over })
export const clusterOptions = (): ClusterOpt[] => clusters.map((c) => ({ slug: c.slug, name: c.name, active: c.tracked }))

/* ------------------------------------------------------------------ PageBar */
export function pageBar(current: string): string {
  return `<div class="flex h-14 items-center justify-between gap-3 border-b border-separator-border bg-background-full px-4 sm:px-6">
    <nav aria-label="Breadcrumb" class="flex min-w-0 items-center gap-1.5 text-caption-1-regular text-text-secondary">
      <a href="#" data-nav="overview" class="truncate capitalize hover:text-text-primary">${BRAND.company}</a><span aria-hidden="true" class="text-text-tertiary">&rsaquo;</span>
      <a href="#" data-nav="overview" class="hover:text-text-primary">GEO</a><span aria-hidden="true" class="text-text-tertiary">&rsaquo;</span>
      <span class="font-semibold text-text-primary" aria-current="page">${esc(current)}</span>
    </nav>
    <div class="flex items-center gap-1.5">
      ${dashButton('', { variant: 'outline', size: 'small', iconOnly: true, leadingIcon: 'RiQuestionLine', href: '#', ariaLabel: 'Help and docs' })}
      ${dashButton('Export', { variant: 'outline', size: 'small', leadingIcon: 'RiDownload2Line', attrs: 'data-export' })}
      ${dashButton('Ask agent', { variant: 'outline', size: 'small', leadingIcon: 'RiChat3Line', href: '#' })}
    </div>
  </div>`
}

/* ------------------------------------------------------------------ date helpers (UTC days) */
const DAY_MS = 86_400_000
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`)
const toDay = (d: Date) => d.toISOString().slice(0, 10)
const shortDay = (s: string) => parseDay(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const longDay = (s: string) => parseDay(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const TODAY = dates[dates.length - 1]
const FIRST = dates[0]
/** Scan runs per day for the fictional workspace: one scan batch every day of the 30-day window. */
const RUNS: Record<string, number> = Object.fromEntries(dates.map((d, i) => [d, 10 + ((i * 7) % 6)]))

const trailing = (n: number) => ({ from: toDay(new Date(parseDay(TODAY).getTime() - (n - 1) * DAY_MS)), to: TODAY })
export const resolveRange = (v: Pick<FilterValue, 'range' | 'from' | 'to'>) => (v.from && v.to ? { from: v.from, to: v.to } : trailing(v.range))
export const rangeLabel = (v: Pick<FilterValue, 'range' | 'from' | 'to'>) => (v.from && v.to ? (v.from === v.to ? longDay(v.from) : `${shortDay(v.from)} – ${longDay(v.to)}`) : `Last ${v.range} days`)

function monthCells(year: number, month: number): Array<{ day: string; inMonth: boolean }> {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const start = first.getTime() - lead * DAY_MS
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start + i * DAY_MS); return { day: toDay(d), inMonth: d.getUTCMonth() === month } })
}

/* ------------------------------------------------------------------ pieces */
const optionRow = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-2-regular text-text-primary outline-none transition-colors hover:bg-background-secondary-default focus-visible:ring-2 focus-visible:ring-border-focus-ring'
const groupLabel = 'px-3 pb-1 pt-3 text-caption-1-semibold text-text-tertiary'
const POP = 'absolute z-110 mt-2 max-w-[calc(100vw-32px)] rounded-[20px] border border-border-button-default bg-background-primary-default p-1.5 shadow-dropdown'
const DIALOG = 'flex flex-col gap-3 p-2.5 outline-none'

function engineList(all: string[], value: string[]): string {
  const selected = value.length ? value : all
  return `<ul role="listbox" aria-multiselectable="true" class="space-y-0.5">${all.map((e) => {
    const on = selected.includes(e)
    return `<li><button type="button" role="option" aria-selected="${on}" data-f-engine="${esc(e)}" class="${optionRow}">${engineLogo(e, 16)}<span class="flex-1">${esc(e)}</span>${on ? ri('RiCheckLine', 'size-4 text-accent-600') : ''}</button></li>`
  }).join('')}</ul>`
}

function clusterList(value: string, opts: ClusterOpt[], showInactive: boolean): string {
  const active = opts.filter((c) => c.active)
  const inactive = opts.filter((c) => !c.active)
  const row = (slug: string, name: string, muted = false) =>
    `<li><button type="button" role="option" aria-selected="${value === slug}" data-f-cluster="${esc(slug)}" class="${cx(optionRow, muted && 'pl-6 text-text-secondary')}"><span class="min-w-0 flex-1 truncate">${esc(name)}</span>${value === slug ? ri('RiCheckLine', 'size-4 shrink-0 text-accent-600') : ''}</button></li>`
  return `<ul role="listbox" class="space-y-0.5">
    ${row('all', 'All clusters')}
    ${active.length > 0 ? `<li aria-hidden="true" class="${groupLabel}">Active clusters · ${active.length}</li>` : ''}
    ${active.map((c) => row(c.slug, c.name)).join('')}
    ${inactive.length > 0 ? `<li class="mt-1 border-t border-separator-border pt-1"><button type="button" aria-expanded="${showInactive}" data-f-inactive class="${cx(optionRow, 'text-body-2-medium text-text-secondary')}"><span class="flex-1">Inactive clusters · ${inactive.length}</span>${ri('RiArrowDownSLine', cx('size-4 text-text-tertiary transition-transform', showInactive ? 'rotate-0' : '-rotate-90'))}</button></li>${showInactive ? inactive.map((c) => row(c.slug, c.name, true)).join('') : ''}` : ''}
  </ul>`
}

interface Draft { from: string; to: string | null }
interface Cal { draft: Draft; hover: string | null; view: { y: number; m: number } }

function calendarHtml(v: FilterValue, cal: Cal): string {
  const lo = cal.draft.to ? (cal.draft.from <= cal.draft.to ? cal.draft.from : cal.draft.to) : (cal.hover && cal.hover < cal.draft.from ? cal.hover : cal.draft.from)
  const hi = cal.draft.to ? (cal.draft.from <= cal.draft.to ? cal.draft.to : cal.draft.from) : (cal.hover && cal.hover > cal.draft.from ? cal.hover : cal.draft.from)
  const selectedDays = Math.round((parseDay(hi).getTime() - parseDay(lo).getTime()) / DAY_MS) + 1
  const scanDays = Object.keys(RUNS).filter((d) => d >= lo && d <= hi).length
  const t = parseDay(TODAY)
  const presets: Array<{ label: string; active: boolean; data: string }> = [
    ...([7, 30, 90] as const).map((n) => ({ label: `Last ${n} days`, active: !v.from && v.range === n, data: `last:${n}` })),
    { label: 'This month', active: false, data: `abs:${toDay(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)))}:${TODAY}` },
    { label: 'Last month', active: false, data: `abs:${toDay(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1)))}:${toDay(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0)))}` },
    { label: 'All time', active: false, data: `abs:${FIRST}:${TODAY}` },
  ]
  const months = [0, 1].map((offset) => {
    const mv = new Date(Date.UTC(cal.view.y, cal.view.m + offset, 1))
    const y = mv.getUTCFullYear()
    const m = mv.getUTCMonth()
    return `<div class="${cx('min-w-0', offset === 1 && 'hidden md:block')}">
      <p class="mb-1.5 text-center text-body-2-regular font-semibold text-text-primary">${MONTHS[m]} ${y}</p>
      <div class="grid grid-cols-7 text-center text-caption-2-regular font-medium uppercase tracking-wide text-text-tertiary">${WEEKDAYS.map((w) => `<span class="py-1">${w}</span>`).join('')}</div>
      <div class="grid grid-cols-7">${monthCells(y, m).map(({ day, inMonth }) => {
        if (!inMonth) return '<span class="h-9" aria-hidden="true"></span>'
        const disabled = day > TODAY || day < FIRST
        const isLo = day === lo
        const isHi = day === hi
        const isEdge = isLo || isHi
        const inBand = day >= lo && day <= hi
        const runs = RUNS[day] ?? 0
        return `<div class="${cx('relative flex h-9 items-center justify-center', inBand && 'bg-accent-50', isLo && lo !== hi && 'rounded-l-full', isHi && lo !== hi && 'rounded-r-full')}">
          <button type="button" ${disabled ? 'disabled' : ''} data-cal-day="${day}" aria-label="${longDay(day)}${runs ? `, ${runs} scans` : ''}" aria-pressed="${isEdge}" ${disabled ? '' : `title="${runs ? `${runs} scan${runs === 1 ? '' : 's'}` : 'No scans this day'}"`}
            class="${cx('relative flex h-8 w-8 items-center justify-center rounded-full text-body-2-regular tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-400', isEdge ? 'bg-accent-600 font-semibold text-text-white shadow-sm' : disabled ? 'cursor-not-allowed text-text-tertiary/50' : runs ? 'font-medium text-text-primary hover:bg-accent-100' : 'text-text-tertiary hover:bg-background-secondary-hover', day === TODAY && !isEdge && 'ring-1 ring-separator-border')}">${Number(day.slice(8))}${runs > 0 && !isEdge ? `<span class="${cx('absolute bottom-[3px] rounded-full bg-accent-600', runs >= 8 ? 'h-1.5 w-1.5' : 'h-1 w-1')}"></span>` : ''}</button>
        </div>`
      }).join('')}</div>
    </div>`
  }).join('')
  return `<div class="overflow-hidden rounded-[20px]">
    <div class="flex flex-col sm:flex-row">
      <div class="flex shrink-0 flex-row flex-wrap gap-1 border-b border-separator-border bg-background-secondary-default p-2.5 sm:w-[158px] sm:flex-col sm:border-b-0 sm:border-r">
        <p class="hidden px-2.5 pb-1 pt-0.5 text-caption-2-regular font-semibold uppercase tracking-wider text-text-tertiary sm:block">Quick ranges</p>
        ${presets.map((p) => `<button type="button" data-cal-preset="${p.data}" class="${cx('rounded-lg px-2.5 py-1.5 text-left text-body-2-regular transition-colors', p.active ? 'bg-accent-50 font-medium text-accent-700' : 'text-text-secondary hover:bg-background-secondary-hover')}">${p.label}</button>`).join('')}
      </div>
      <div class="min-w-0 flex-1 p-5">
        <div class="mb-1 flex items-center justify-between">
          <button type="button" aria-label="Previous month" data-cal-month="-1" class="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background-secondary-hover hover:text-text-primary">${ri('RiArrowLeftSLine', 'h-4 w-4')}</button>
          <button type="button" data-cal-today class="rounded-md px-2 py-0.5 text-caption-2-regular font-medium text-text-tertiary transition-colors hover:bg-background-secondary-hover hover:text-text-secondary">Jump to today</button>
          <button type="button" aria-label="Next month" data-cal-month="1" class="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background-secondary-hover hover:text-text-primary">${ri('RiArrowRightSLine', 'h-4 w-4')}</button>
        </div>
        <div data-cal-grid class="grid gap-x-6 md:grid-cols-2">${months}</div>
        <p class="mt-2 flex items-center gap-1.5 text-caption-2-regular text-text-tertiary"><span class="h-1.5 w-1.5 rounded-full bg-accent-600"></span>Days with scans · grey days have none</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-separator-border bg-background-secondary-default px-5 py-3">
      <div class="flex flex-wrap items-center gap-2 text-caption-1-regular text-text-secondary">
        <span class="rounded-md border border-separator-border bg-background-full px-2 py-1 font-medium tabular-nums text-text-primary">${longDay(lo)}</span>
        <span class="text-text-tertiary">→</span>
        <span class="rounded-md border border-separator-border bg-background-full px-2 py-1 font-medium tabular-nums text-text-primary">${longDay(hi)}</span>
        <span class="tabular-nums">${selectedDays} day${selectedDays === 1 ? '' : 's'} · ${scanDays} with scans</span>
        ${!cal.draft.to ? '<span class="text-accent-600">Now pick the end day</span>' : ''}
      </div>
      <div class="flex gap-2">
        ${dashButton('Cancel', { variant: 'ghost', size: 'small', attrs: 'data-cal-cancel' })}
        ${dashButton('Apply', { variant: 'solid', size: 'small', disabled: !cal.draft.to, attrs: 'data-cal-apply' })}
      </div>
    </div>
  </div>`
}

interface Opts { value: FilterValue; clusters: ClusterOpt[]; engines: string[]; issues: number; onChange: (v: FilterValue) => void; /** Render just the date-range picker (the prompt page's own picker). */ only?: 'range' }

function barHtml(o: Opts, open: string | null, showInactive: boolean, cal: Cal): string {
  const v = o.value
  const label = v.cluster === 'all' ? 'All clusters' : o.clusters.find((c) => c.slug === v.cluster)?.name ?? v.cluster
  const nEngines = v.engines.length || o.engines.length
  const activeFilters = (v.cluster !== 'all' ? 1 : 0) + (v.engines.length ? 1 : 0)
  const trig = (children: string, name: string, lead: string, extra = '') => button(children, { variant: 'secondary', size: 'small', leadingIcon: lead, trailingIcon: name === 'filters' ? undefined : 'RiArrowDownSLine', attrs: `data-fpop="${name}" aria-expanded="${open === name}" ${extra}` })
  const panel = (name: string, cls: string, inner: string, dialogCls = DIALOG) => (open === name ? `<div data-fpop-panel="${name}" role="dialog" class="${cx(POP, cls)}"><div class="${dialogCls}">${inner}</div></div>` : '')
  const rangeBlock = `<div class="relative">${trig(rangeLabel(v), 'range', 'RiCalendarLine', 'aria-haspopup="dialog"')}
        ${open === 'range' ? `<div data-fpop-panel="range" role="dialog" class="${cx(POP, 'left-0 top-full w-[780px] overflow-hidden p-0')}"><div class="flex flex-col gap-0 p-0 outline-none">${calendarHtml(v, cal)}</div></div>` : ''}</div>`
  if (o.only === 'range') return rangeBlock
  return `<div class="flex flex-wrap items-center gap-2">
      <div class="relative">${trig(`<span class="max-w-[200px] truncate">${esc(label)}</span>`, 'cluster', 'RiLayoutRowLine', 'aria-label="Cluster"')}
        ${panel('cluster', 'left-0 top-full max-h-[22rem] w-72 overflow-y-auto', clusterList(v.cluster, o.clusters, showInactive), 'flex flex-col gap-3 p-1 outline-none')}</div>
      ${rangeBlock}
      <div class="relative">${trig(`${nEngines} of ${o.engines.length} engines`, 'engines', 'RiStackLine')}
        ${panel('engines', 'left-0 top-full w-56', engineList(o.engines, v.engines), 'flex flex-col gap-3 p-1 outline-none')}</div>
      <div class="relative">${trig(`All filters${activeFilters > 0 ? `<span class="ml-1.5 grid size-4 place-items-center rounded-full bg-accent-600 text-caption-2-semibold text-text-white">${activeFilters}</span>` : ''}`, 'filters', 'RiFilter3Line')}
        ${panel('filters', 'left-0 top-full w-72', `<p class="text-caption-1-semibold text-text-tertiary">Cluster</p>
          <div class="mt-2 max-h-52 overflow-y-auto rounded-xl border border-separator-border p-1">${clusterList(v.cluster, o.clusters, showInactive)}</div>
          <p class="mt-4 text-caption-1-semibold text-text-tertiary">Engines</p>
          <div class="mt-2 rounded-xl border border-separator-border p-1">${engineList(o.engines, v.engines)}</div>
          <div class="mt-3 flex justify-end border-t border-separator-border pt-3">${dashButton('Reset filters', { variant: 'ghost', size: 'small', attrs: 'data-f-reset' })}</div>`, 'flex flex-col gap-0 p-3 outline-none')}</div>
    </div>
    <a href="#needs-attention" data-scan-health class="${cx('inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-body-2-medium outline-none ring-1 ring-inset focus-visible:ring-2 focus-visible:ring-border-focus-ring', o.issues ? 'bg-status-yellow-background text-status-yellow-text ring-status-yellow-text/30 hover:opacity-90' : 'bg-status-lime-background text-status-lime-text ring-status-lime-text/30')}">${o.issues ? ri('RiAlertFill', 'size-4') : ri('RiCheckboxCircleFill', 'size-4')}Scan health · ${o.issues ? `${o.issues} issue${o.issues === 1 ? '' : 's'}` : 'all clear'}</a>`
}

/** Render the filter bar into `host` and keep it live. `set(v)` pushes an externally changed value (e.g. a page's own cluster tabs). */
export interface FilterBarApi { set: (v: FilterValue) => void }
export function mountFilterBar(host: HTMLElement, o: Opts): FilterBarApi {
  let open: string | null = null
  let showInactive = false
  const calFor = (v: FilterValue): Cal => { const c = resolveRange(v); const d = parseDay(c.to); return { draft: { from: c.from, to: c.to }, hover: null, view: { y: d.getUTCFullYear(), m: d.getUTCMonth() - 1 } } }
  let cal = calFor(o.value)
  if (!o.only) host.className = 'sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-separator-border bg-background-full/85 px-4 py-3 backdrop-blur-md sm:px-6'

  const render = () => {
    host.innerHTML = barHtml(o, open, showInactive, cal)
    const panel = host.querySelector<HTMLElement>('[data-fpop-panel]')
    if (panel) { const r = panel.getBoundingClientRect(); if (r.right > innerWidth - 8) panel.style.left = `${Math.min(0, innerWidth - 8 - r.right)}px` }
  }
  const renderCal = () => { const g = host.querySelector<HTMLElement>('[data-fpop-panel="range"] > div'); if (g) g.innerHTML = calendarHtml(o.value, cal) }
  const emit = (v: FilterValue) => { o.value = v; o.onChange(v) }

  host.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-scan-health]')) { e.preventDefault(); return }
    const pop = t.closest<HTMLElement>('[data-fpop]')
    if (pop) {
      const name = pop.dataset.fpop as string
      if (open === name) open = null
      else { open = name; if (name === 'range') cal = calFor(o.value); if (name === 'cluster' || name === 'filters') showInactive = o.clusters.some((c) => !c.active && c.slug === o.value.cluster) }
      render(); return
    }
    if (t.closest('[data-f-inactive]')) { showInactive = !showInactive; render(); return }
    const cl = t.closest<HTMLElement>('[data-f-cluster]')
    if (cl) { emit({ ...o.value, cluster: cl.dataset.fCluster as string }); if (open === 'cluster') open = null; render(); return }
    const en = t.closest<HTMLElement>('[data-f-engine]')
    if (en) {
      const sel = o.value.engines.length ? o.value.engines : o.engines
      const e1 = en.dataset.fEngine as string
      const next = sel.includes(e1) ? sel.filter((x) => x !== e1) : [...sel, e1]
      emit({ ...o.value, engines: next.length === 0 || next.length === o.engines.length ? [] : next }); render(); return
    }
    if (t.closest('[data-f-reset]')) { emit({ ...o.value, cluster: 'all', engines: [] }); open = null; render(); return }
    // calendar
    const pre = t.closest<HTMLElement>('[data-cal-preset]')
    if (pre) {
      const [kind, a, b] = (pre.dataset.calPreset as string).split(':')
      emit(kind === 'last' ? { ...o.value, range: Number(a) as FilterValue['range'], from: undefined, to: undefined } : { ...o.value, from: a, to: b })
      open = null; render(); return
    }
    const day = t.closest<HTMLElement>('[data-cal-day]')
    if (day && !day.hasAttribute('disabled')) {
      const d = day.dataset.calDay as string
      cal = cal.draft.to ? { ...cal, draft: { from: d, to: null }, hover: null } : { ...cal, draft: { from: cal.draft.from, to: d } }
      renderCal(); return
    }
    const mo = t.closest<HTMLElement>('[data-cal-month]')
    if (mo) { const d = new Date(Date.UTC(cal.view.y, cal.view.m + Number(mo.dataset.calMonth), 1)); cal = { ...cal, view: { y: d.getUTCFullYear(), m: d.getUTCMonth() } }; renderCal(); return }
    if (t.closest('[data-cal-today]')) { const d = parseDay(TODAY); cal = { ...cal, view: { y: d.getUTCFullYear(), m: d.getUTCMonth() - 1 } }; renderCal(); return }
    if (t.closest('[data-cal-cancel]')) { open = null; render(); return }
    if (t.closest('[data-cal-apply]') && cal.draft.to) {
      const [a, b] = cal.draft.from <= cal.draft.to ? [cal.draft.from, cal.draft.to] : [cal.draft.to, cal.draft.from]
      emit({ ...o.value, from: a, to: b }); open = null; render()
    }
  })
  host.addEventListener('mouseover', (e) => {
    if (open !== 'range' || cal.draft.to) return
    const d = (e.target as HTMLElement).closest<HTMLElement>('[data-cal-day]')?.dataset.calDay ?? null
    if (d && d !== cal.hover) { cal = { ...cal, hover: d }; renderCal() }
  })
  document.addEventListener('mousedown', (e) => { if (open && host.isConnected && !host.contains(e.target as Node)) { open = null; render() } })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open && host.isConnected) { open = null; render() } })

  render()
  return { set: (v) => { o.value = v; render() } }
}
