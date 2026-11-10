/*
 * HTML-string ports of the real app's `components/base/*` (BoardUI design system), reproducing main's final markup/classes.
 * Static output only (no animation). Interactive pieces ship a `wire…` function: call it on the root after inserting the HTML.
 *
 * Exports (details inline):
 *   cx, esc                              class joiner / HTML escape
 *   chip(children, {variant,color,cls})  badges/chip      (variants bold|subtle|caption; colors orange|lime|rose|yellow|cyan|blue|purple|neutral|gray|soft)
 *   CHIP_COLORS                          chip colour classes
 *   badge(children, color, cls)          badges/badge     (primary|neutral)
 *   statusDot(color, cls)                badges/status-dot (green|yellow|indigo)
 *   button(children, {variant,size,iconOnly,leadingIcon,trailingIcon,cls,attrs,href,disabled})   buttons/button (+ ButtonLink via href)
 *   iconButton(icon, {size,label,cls,attrs,href})                                                  buttons/icon-button
 *   linkButton(children, {variant,size,leadingIcon,trailingIcon,cls,attrs,href,disabled})         buttons/link-button
 *   closeButton({size,label,cls,attrs})                                                            buttons/close-button
 *   tabs / wireTabsBase                  tabs/tabs (underline tab list with optional icon+count)
 *   segmentedControl / wireSegmented     segmented-control (solid|plain)
 *   table helpers: tableCls, tableSmCls  (`bui-table` / `bui-table-sm` classes; build <table>/<th>/<td> yourself)
 *   tooltipSurface(children,{size,side}) static tooltip panel; wireTooltips(root) = hover tooltips for [data-tip]
 *   select(...) / wireSelect(...)        select/select  (custom listbox, controlled by data-* attrs)
 *   MENU_* constants                     dropdown/menu-styles
 *   dropdown (popover menu)              wireMenu(trigger, panel)
 *   input / label / hintText             input/*
 *   modal(...) / openModal / closeModal  modal/modal
 *   popoverPanel(...) / wirePopover      popover/popover
 *   pagination(page,total) / wirePagination(root, id, cb)   pagination/pagination
 *   progressBar / progressCircle / progressTrack            progress
 *   skeleton(...) / spinner(...)         skeleton / spinner
 */
import { ri } from '../lib/icons'

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ')
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

/* ------------------------------------------------------------------ chip */
export type ChipColor = 'orange' | 'lime' | 'rose' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'neutral' | 'gray' | 'soft'
export type ChipVariant = 'bold' | 'subtle' | 'caption'
export const CHIP_COLORS: Record<ChipColor, string> = {
  orange: 'bg-status-orange-background text-status-orange-text',
  lime: 'bg-status-lime-background text-status-lime-text',
  rose: 'bg-status-rose-background text-status-rose-text',
  yellow: 'bg-status-yellow-background text-status-yellow-text',
  cyan: 'bg-status-cyan-background text-status-cyan-text',
  blue: 'bg-status-blue-background text-status-blue-text',
  purple: 'bg-status-purple-background text-status-purple-text',
  neutral: 'bg-background-tertiary-default text-text-secondary',
  gray: 'bg-background-secondary-default text-text-primary',
  soft: 'bg-background-secondary-default text-text-secondary',
}
const CHIP_VARIANT: Record<ChipVariant, string> = {
  bold: 'py-0.5 text-body-medium',
  subtle: 'py-1 text-body-medium',
  caption: 'py-1 text-caption-1-medium',
}
/** Colored label chip (`<Chip>`): rounded-md, px-1.5. */
export function chip(children: string, o: { variant?: ChipVariant; color?: ChipColor; cls?: string; attrs?: string } = {}): string {
  const { variant = 'bold', color = 'neutral', cls, attrs = '' } = o
  return `<span class="${cx('inline-flex items-center justify-center rounded-md px-1.5 whitespace-nowrap', CHIP_VARIANT[variant], CHIP_COLORS[color], cls)}" ${attrs}>${children}</span>`
}

/* ----------------------------------------------------------------- badge */
/** Small numeric counter pill (`<Badge>`). */
export function badge(children: string, color: 'primary' | 'neutral' = 'neutral', cls = ''): string {
  const c = color === 'primary' ? 'bg-accent-400 text-white' : 'bg-badge-neutral-background text-text-secondary'
  return `<span class="${cx('inline-flex items-center justify-center rounded-sm px-1 py-px text-caption-1-semibold tracking-normal whitespace-nowrap', c, cls)}">${children}</span>`
}

/* ------------------------------------------------------------ status dot */
const DOT_HALO = { green: 'bg-status-dot-green-halo', yellow: 'bg-status-dot-yellow-halo', indigo: 'bg-status-dot-indigo-halo' }
const DOT_CORE = { green: 'bg-green-500', yellow: 'bg-yellow-500', indigo: 'bg-indigo-500' }
/** 12px status indicator: solid dot on a tinted halo (`<StatusDot>`). */
export function statusDot(color: 'green' | 'yellow' | 'indigo' = 'green', cls = ''): string {
  return `<span aria-hidden="true" class="${cx('inline-flex size-3 shrink-0 items-center justify-center rounded-full', DOT_HALO[color], cls)}"><span class="${cx('size-1.5 rounded-full', DOT_CORE[color])}"></span></span>`
}

/* --------------------------------------------------------------- buttons */
type IconName = string // Remix component name, e.g. 'RiAddLine'
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'medium' | 'small' | 'xs'
const BTN_BASE = 'inline-flex items-center justify-center gap-0.5 whitespace-nowrap overflow-hidden font-sans select-none cursor-pointer button-press-motion outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:cursor-not-allowed aria-disabled:cursor-not-allowed'
const BTN_SIZE: Record<ButtonSize, string> = { medium: 'h-9 rounded-2lg p-2 text-body-medium', small: 'h-8 rounded-lg px-2 py-1.5 text-body-medium', xs: 'h-6 rounded-sm px-2 text-caption-1-semibold' }
const BTN_ICON_ONLY: Record<ButtonSize, string> = { medium: '', small: 'size-8 p-0', xs: 'size-6 p-0' }
const BTN_ICON: Record<ButtonSize, string> = { medium: 'size-5 shrink-0', small: 'size-[18px] shrink-0', xs: 'size-3.5 shrink-0' }
const BTN_LABEL: Record<ButtonSize, string> = {
  medium: 'inline-flex items-center justify-center px-1 shrink-0',
  small: 'inline-flex items-center justify-center px-0.5 shrink-0',
  xs: 'inline-flex items-center justify-center px-0.5 shrink-0',
}
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-button-primary text-text-white shadow-xs disabled:text-button-primary-disabled-foreground disabled:shadow-none aria-disabled:text-button-primary-disabled-foreground aria-disabled:shadow-none',
  danger: 'bg-button-danger text-text-white shadow-xs disabled:text-foreground-disabled-danger disabled:shadow-none aria-disabled:text-foreground-disabled-danger aria-disabled:shadow-none',
  secondary: 'bg-background-primary-default text-text-primary border border-border-button-default shadow-xs hover:bg-background-primary-hover hover:border-border-button-hover active:bg-background-primary-active active:border-border-button-active disabled:bg-background-primary-disabled disabled:border-border-button-default disabled:text-text-tertiary disabled:shadow-none aria-disabled:bg-background-primary-disabled aria-disabled:border-border-button-default aria-disabled:text-text-tertiary aria-disabled:shadow-none',
  ghost: 'bg-button-ghost-background text-button-ghost-foreground hover:bg-button-ghost-hover active:bg-button-ghost-active disabled:bg-button-ghost-disabled disabled:text-button-ghost-disabled-foreground disabled:shadow-none aria-disabled:bg-button-ghost-disabled aria-disabled:text-button-ghost-disabled-foreground aria-disabled:shadow-none',
}
export interface ButtonOpts {
  variant?: ButtonVariant; size?: ButtonSize; iconOnly?: boolean; leadingIcon?: IconName; trailingIcon?: IconName
  cls?: string; attrs?: string; href?: string; target?: string; rel?: string; disabled?: boolean
}
/** `<Button>` (or `<ButtonLink>` when `href` is given). Icons are Remix names, sized by `size`. */
export function button(children: string | undefined, o: ButtonOpts = {}): string {
  const { variant = 'primary', size = 'medium', iconOnly = false, leadingIcon, trailingIcon, cls, attrs = '', href, target, rel, disabled } = o
  const classes = cx(BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], iconOnly && BTN_ICON_ONLY[size], cls)
  const inner = `${leadingIcon ? ri(leadingIcon, BTN_ICON[size]) : ''}${!iconOnly && children ? `<span class="${BTN_LABEL[size]}">${children}</span>` : ''}${!iconOnly && trailingIcon ? ri(trailingIcon, BTN_ICON[size]) : ''}`
  if (href !== undefined) return `<a class="${classes}" href="${esc(href)}"${target ? ` target="${target}"` : ''}${rel ? ` rel="${rel}"` : ''} ${attrs}>${inner}</a>`
  return `<button type="button" class="${classes}"${disabled ? ' disabled' : ''} ${attrs}>${inner}</button>`
}

const ICONBTN_BASE = 'relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-2lg bg-background-primary-default text-foreground-icon-primary border border-border-button-default shadow-xs select-none cursor-pointer transition-[background-color,border-color,box-shadow,color] duration-150 ease outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring hover:bg-background-primary-hover hover:border-border-button-hover active:bg-background-primary-active active:border-border-button-active disabled:cursor-not-allowed disabled:bg-background-primary-disabled disabled:border-border-button-default disabled:text-icon-button-disabled-foreground disabled:opacity-60 disabled:shadow-none'
/** `<IconButton>`: bordered square holding a Remix icon (medium 36px, small 32px). */
export function iconButton(icon: IconName, o: { size?: 'medium' | 'small'; label: string; cls?: string; attrs?: string; href?: string }): string {
  const size = o.size ?? 'medium'
  const classes = cx(ICONBTN_BASE, size === 'medium' ? 'size-9' : 'size-8', o.cls)
  const glyph = ri(icon, size === 'medium' ? 'size-5 shrink-0' : 'size-4 shrink-0')
  return o.href !== undefined
    ? `<a class="${classes}" href="${esc(o.href)}" aria-label="${esc(o.label)}" ${o.attrs ?? ''}>${glyph}</a>`
    : `<button type="button" class="${classes}" aria-label="${esc(o.label)}" ${o.attrs ?? ''}>${glyph}</button>`
}

const LINKBTN_BASE = 'inline-flex items-center justify-center gap-1 whitespace-nowrap font-sans select-none cursor-pointer rounded-sm underline-offset-3 hover:underline transition-colors duration-150 ease outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:cursor-not-allowed disabled:no-underline aria-disabled:cursor-not-allowed aria-disabled:no-underline'
const LINKBTN_SIZE: Record<ButtonSize, string> = { medium: 'text-body-medium', small: 'text-body-medium', xs: 'text-caption-1-semibold' }
const LINKBTN_VARIANT = {
  primary: 'text-accent-600 active:text-accent-800 disabled:text-text-tertiary aria-disabled:text-text-tertiary',
  secondary: 'text-text-secondary active:text-text-primary disabled:text-text-tertiary aria-disabled:text-text-tertiary',
}
/** `<LinkButton>`: text-only button/anchor with underline on hover. */
export function linkButton(children: string, o: { variant?: 'primary' | 'secondary'; size?: ButtonSize; leadingIcon?: IconName; trailingIcon?: IconName; cls?: string; attrs?: string; href?: string; target?: string; disabled?: boolean } = {}): string {
  const { variant = 'primary', size = 'medium', leadingIcon, trailingIcon, cls, attrs = '', href, target, disabled } = o
  const classes = cx(LINKBTN_BASE, LINKBTN_SIZE[size], LINKBTN_VARIANT[variant], cls)
  const inner = `${leadingIcon ? ri(leadingIcon, BTN_ICON[size]) : ''}${children ? `<span>${children}</span>` : ''}${trailingIcon ? ri(trailingIcon, BTN_ICON[size]) : ''}`
  if (href !== undefined) return `<a class="${classes}" ${disabled ? 'aria-disabled="true"' : `href="${esc(href)}"`}${target ? ` target="${target}"` : ''} ${attrs}>${inner}</a>`
  return `<button type="button" class="${classes}"${disabled ? ' disabled' : ''} ${attrs}>${inner}</button>`
}

const CLOSE_GLYPH = { '2xs': 6.8, xs: 10.8, sm: 12.6, md: 16.2 }
const CLOSE_STROKE = { '2xs': 1.6, xs: 2, sm: 2, md: 2.5 }
const CLOSE_INSET = { '2xs': 0.57, xs: 2, sm: 2, md: 2 }
const CLOSE_BOX = { '2xs': 'size-4', xs: 'size-5', sm: 'size-6', md: 'size-8' }
/** `<CloseButton>`: round grey X. */
export function closeButton(o: { size?: '2xs' | 'xs' | 'sm' | 'md'; label: string; cls?: string; attrs?: string }): string {
  const s = o.size ?? 'xs'
  const g = CLOSE_GLYPH[s], w = CLOSE_STROKE[s], i = CLOSE_INSET[s]
  return `<button type="button" aria-label="${esc(o.label)}" class="${cx('inline-flex shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-foreground-icon-secondary select-none cursor-pointer transition-colors duration-150 ease hover:text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring', CLOSE_BOX[s], o.cls)}" ${o.attrs ?? ''}><svg width="${g}" height="${g}" viewBox="0 0 ${g} ${g}" fill="none" aria-hidden="true"><path d="M${i} ${i}L${g - i} ${g - i}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/><path d="M${g - i} ${i}L${i} ${g - i}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/></svg></button>`
}

/* ------------------------------------------------------------------ tabs */
export interface TabOpt { value: string; label: string; icon?: IconName; count?: string | number }
const TAB_ON = 'text-body-medium text-accent-600'
const TAB_OFF = 'text-body-regular text-text-primary'
const TAB_COUNT_ON = 'bg-tab-count-selected-background text-accent-600'
const TAB_COUNT_OFF = 'bg-black/10 text-text-primary opacity-50'
const TAB_BAR = '<span data-tab-bar aria-hidden="true" class="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 bg-accent-600"></span>'
/** `<Tabs>/<TabList>/<Tab>`: underline tab strip with optional icon and count. Wire with wireTabsBase(root, id, cb). */
export function tabs(id: string, value: string, options: TabOpt[], cls = ''): string {
  return `<div data-base-tabs="${id}" class="relative w-full"><div role="tablist" class="${cx('flex w-full items-center gap-1 border-b border-separator-border', cls)}">${options.map((o) => {
    const on = o.value === value
    return `<button type="button" role="tab" data-v="${o.value}" aria-selected="${on}" class="relative inline-flex cursor-pointer items-center gap-2.5 px-2.5 py-2 whitespace-nowrap outline-none transition-colors duration-150 ease focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-border-focus-ring"><span data-tab-label class="${cx('inline-flex items-center gap-1.5', on ? TAB_ON : TAB_OFF)}">${o.icon ? ri(o.icon, 'size-4 shrink-0') : ''}${o.label}</span>${o.count != null ? `<span data-tab-count class="${cx('inline-flex items-center justify-center rounded-sm px-1 py-px text-caption-1-medium whitespace-nowrap', on ? TAB_COUNT_ON : TAB_COUNT_OFF)}">${o.count}</span>` : ''}${on ? TAB_BAR : ''}</button>`
  }).join('')}</div></div>`
}
const toggleCls = (el: Element | null, classes: string, on: boolean) => classes.split(' ').forEach((c) => el?.classList.toggle(c, on))
export function wireTabsBase(root: ParentNode, id: string, cb: (value: string) => void) {
  const wrap = root.querySelector<HTMLElement>(`[data-base-tabs="${id}"]`)
  if (!wrap) return
  wrap.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]')
    if (!b) return
    wrap.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((o) => {
      const on = o === b
      o.setAttribute('aria-selected', String(on))
      const label = o.querySelector('[data-tab-label]'), count = o.querySelector('[data-tab-count]')
      toggleCls(label, TAB_ON, on); toggleCls(label, TAB_OFF, !on)
      toggleCls(count, TAB_COUNT_ON, on); toggleCls(count, TAB_COUNT_OFF, !on)
      o.querySelector('[data-tab-bar]')?.remove()
      if (on) o.insertAdjacentHTML('beforeend', TAB_BAR)
    })
    cb(b.dataset.v as string)
  })
}

/* ------------------------------------------------------ segmented control */
const SEGC_ON = 'text-body-medium text-text-primary'
const SEGC_OFF = 'text-body-regular text-text-secondary hover:text-text-primary'
const SEGC_THUMB = 'bg-segmented-control-selected-background shadow-2xs'
/** `<SegmentedControl>` (solid = grey track with white thumb behind the selected item). Wire with wireSegmented(root, id, cb). */
export function segmentedControl(id: string, value: string, options: Array<{ value: string; label: string }>, o: { variant?: 'solid' | 'plain'; cls?: string } = {}): string {
  const solid = (o.variant ?? 'solid') === 'solid'
  return `<div role="radiogroup" data-segmented="${id}" data-variant="${solid ? 'solid' : 'plain'}" class="${cx('relative inline-flex items-start gap-0.5 rounded-2lg', solid && 'bg-segmented-control-background p-1', o.cls)}">${options.map((x) => {
    const on = x.value === value
    return `<button type="button" data-v="${x.value}" aria-pressed="${on}" class="${cx('relative z-10 inline-flex cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-center whitespace-nowrap transition-colors duration-200 ease outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring', on ? SEGC_ON : SEGC_OFF, on && solid && SEGC_THUMB)}">${x.label}</button>`
  }).join('')}</div>`
}
export function wireSegmented(root: ParentNode, id: string, cb: (value: string) => void) {
  const list = root.querySelector<HTMLElement>(`[data-segmented="${id}"]`)
  if (!list) return
  const solid = list.dataset.variant === 'solid'
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]')
    if (!b || b.getAttribute('aria-pressed') === 'true') return
    list.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((o) => {
      const on = o === b
      o.setAttribute('aria-pressed', String(on))
      toggleCls(o, SEGC_ON, on); toggleCls(o, SEGC_OFF, !on)
      if (solid) toggleCls(o, SEGC_THUMB, on)
    })
    cb(b.dataset.v as string)
  })
}

/* ----------------------------------------------------------------- table */
/** `<Table>` classes: scroll wrapper + `bui-table` (styling lives in boardui-components.css). Build <table>/<thead>/<tbody> inside. */
export const tableCls = 'bui-table'
export const tableSmCls = 'bui-table bui-table-sm'
export const tableWrap = (inner: string, o: { size?: 'sm' | 'md'; cls?: string; containerCls?: string } = {}) =>
  `<div class="${cx('w-full overflow-x-auto', o.containerCls)}"><table class="${cx('bui-table', o.size === 'sm' && 'bui-table-sm', o.cls)}">${inner}</table></div>`

/* --------------------------------------------------------------- tooltip */
const TOOLTIP_SIZE = { sm: 'px-2.5 py-1.5 text-caption-1-medium', md: 'px-3 py-2 text-body-medium rounded-2lg' }
const CARETS = {
  top: { w: 12, h: 7, path: 'M0 0 L6 6 L12 0', shadow: '0 1.5px 1px' },
  bottom: { w: 12, h: 7, path: 'M0 7 L6 1 L12 7', shadow: '0 -1.5px 1px' },
  left: { w: 7, h: 12, path: 'M0 0 L6 6 L0 12', shadow: '0 1.5px 1px' },
  right: { w: 7, h: 12, path: 'M7 0 L1 6 L7 12', shadow: '0 1.5px 1px' },
}
/** Tooltip surface markup (`side` = side of the TRIGGER it sits on). Normally created by the global [data-tip] delegate. */
export function tooltipSurface(content: string, o: { size?: 'sm' | 'md'; side?: 'top' | 'bottom' | 'left' | 'right'; showArrow?: boolean; cls?: string } = {}): string {
  const { size = 'sm', side = 'top', showArrow = true, cls } = o
  // caret sits on the edge facing the trigger: tooltip above trigger => caret at the bottom, pointing down ('top' glyph)
  const c = CARETS[side]
  const pos = { top: 'left-1/2 top-full -translate-x-1/2', bottom: 'left-1/2 bottom-full -translate-x-1/2', left: 'left-full top-1/2 -translate-y-1/2', right: 'right-full top-1/2 -translate-y-1/2' }[side]
  const arrow = showArrow ? `<svg width="${c.w}" height="${c.h}" viewBox="0 0 ${c.w} ${c.h}" class="absolute block overflow-visible fill-background-primary-default stroke-border-button-default ${pos}" style="filter:drop-shadow(${c.shadow} rgb(0 0 0 / 0.05))"><path d="${c.path}"/></svg>` : ''
  return `<div role="tooltip" class="${cx('pointer-events-none relative max-w-[240px] select-none rounded-lg border border-border-button-default bg-background-primary-default text-text-primary shadow-dropdown', TOOLTIP_SIZE[size], cls)}">${arrow}${content}</div>`
}
let tipEl: HTMLElement | null = null
function showTip(target: HTMLElement) {
  hideTip()
  const content = target.dataset.tip
  if (!content) return
  const side = (target.dataset.side as 'top' | 'bottom' | 'left' | 'right') || 'top'
  const host = target.closest<HTMLElement>('.app') ?? document.body
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:fixed;z-index:120;left:0;top:0;pointer-events:none;'
  wrap.innerHTML = tooltipSurface(esc(content), { side, cls: 'whitespace-normal text-center' })
  host.appendChild(wrap)
  const r = target.getBoundingClientRect(), t = wrap.getBoundingClientRect(), gap = 10
  let x = r.left + r.width / 2 - t.width / 2, y = r.top - t.height - gap
  if (side === 'bottom') y = r.bottom + gap
  if (side === 'left') { x = r.left - t.width - gap; y = r.top + r.height / 2 - t.height / 2 }
  if (side === 'right') { x = r.right + gap; y = r.top + r.height / 2 - t.height / 2 }
  x = Math.max(8, Math.min(window.innerWidth - t.width - 8, x))
  wrap.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
  tipEl = wrap
}
function hideTip() { tipEl?.remove(); tipEl = null }
/** Installed once on import: hovering/focusing any `[data-tip]` element shows a BoardUI tooltip. No wiring needed. */
export function wireTooltips() {
  if ((window as unknown as { __buiTips?: boolean }).__buiTips) return
  ;(window as unknown as { __buiTips?: boolean }).__buiTips = true
  document.addEventListener('mouseover', (e) => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]'); if (t) showTip(t); else hideTip() })
  document.addEventListener('focusin', (e) => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]'); if (t) showTip(t) })
  document.addEventListener('focusout', hideTip)
  document.addEventListener('scroll', hideTip, true)
}
if (typeof window !== 'undefined') wireTooltips()

/* -------------------------------------------------- dropdown / menu styles */
export const MENU_POPOVER_SURFACE = 'z-110 max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl border border-border-button-default bg-background-primary-default p-2.5 shadow-dropdown'
export const MENU_POPOVER_WIDTH = 'w-[266px]'
export const MENU_ITEMS_CONTAINER = 'flex w-full flex-col gap-1 outline-none'
export const MENU_ITEM = 'flex w-full cursor-pointer items-center gap-2 rounded-2lg p-2 text-start text-text-primary outline-none transition-colors'
export const MENU_ITEM_ACTIVE = 'bg-dropdown-item-hover-background'
export const MENU_ITEM_INTERACTIVE = 'hover:bg-dropdown-item-hover-background focus-visible:bg-dropdown-item-hover-background'

/* ---------------------------------------------------------------- select */
export interface SelectOpt { value: string; label: string; html?: string }
/** `<Select>`: trigger button + listbox popover. `html` overrides the label markup (e.g. logo + name). Wire with wireSelect(root, id, cb). */
export function select(id: string, value: string, options: SelectOpt[], o: { size?: 'sm' | 'md'; label?: string; cls?: string; triggerCls?: string; popoverCls?: string } = {}): string {
  const size = o.size ?? 'md'
  const cur = options.find((x) => x.value === value) ?? options[0]
  const item = (x: SelectOpt) => `<button type="button" role="option" data-v="${esc(x.value)}" aria-selected="${x.value === value}" class="${cx(MENU_ITEM, size === 'sm' ? 'px-2 py-1.5 text-body-2-medium' : 'text-body-medium', x.value === value && MENU_ITEM_ACTIVE, 'hover:bg-dropdown-item-hover-background')}">${x.html ?? esc(x.label)}</button>`
  return `<div data-select="${id}" class="${cx('group relative flex flex-col', o.label && 'gap-1', o.cls)}">
    ${o.label ? label(o.label) : ''}
    <button type="button" data-select-trigger aria-haspopup="listbox" aria-expanded="false" class="${cx('flex w-full cursor-pointer items-center justify-between rounded-2lg border border-border-button-default bg-background-primary-default shadow-xs text-text-primary transition-[background-color,border-color,box-shadow,padding,font-size] duration-200 ease hover:bg-background-primary-hover hover:border-border-button-hover outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring', size === 'sm' ? 'gap-1 px-[7px] py-1 text-body-2-medium' : 'gap-1.5 px-2.5 py-2 text-body-medium', o.triggerCls)}"><span data-select-value class="${cx('flex min-w-0 items-center truncate', size === 'sm' ? 'gap-1' : 'gap-[5px]')}">${cur.html ?? esc(cur.label)}</span>${ri('RiArrowDownSLine', cx('shrink-0 text-text-secondary transition-transform duration-200 ease', size === 'sm' ? 'size-3.5' : 'size-4'))}</button>
    <div data-select-pop hidden class="${cx('absolute left-0 top-full mt-1', MENU_POPOVER_WIDTH, MENU_POPOVER_SURFACE, 'p-2', o.popoverCls)}"><div role="listbox" class="${cx(MENU_ITEMS_CONTAINER, 'max-h-[240px] overflow-auto')}">${options.map(item).join('')}</div></div>
  </div>`
}
export function wireSelect(root: ParentNode, id: string, cb: (value: string) => void) {
  const el = root.querySelector<HTMLElement>(`[data-select="${id}"]`)
  if (!el) return
  const trig = el.querySelector<HTMLButtonElement>('[data-select-trigger]')!
  const pop = el.querySelector<HTMLElement>('[data-select-pop]')!
  const val = el.querySelector<HTMLElement>('[data-select-value]')!
  const chev = trig.querySelector('svg')
  const set = (open: boolean) => { pop.hidden = !open; trig.setAttribute('aria-expanded', String(open)); chev?.classList.toggle('rotate-180', open) }
  trig.addEventListener('click', (e) => { e.stopPropagation(); set(!!pop.hidden) })
  pop.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]')
    if (!b) return
    pop.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((o) => { o.setAttribute('aria-selected', String(o === b)); o.classList.toggle(MENU_ITEM_ACTIVE, o === b) })
    val.innerHTML = b.innerHTML
    set(false)
    cb(b.dataset.v as string)
  })
  document.addEventListener('click', (e) => { if (!pop.hidden && !el.contains(e.target as Node)) set(false) })
}

/* --------------------------------------------------------------- popover */
const POPOVER_SURFACE = 'z-110 w-80 max-w-[calc(100vw-32px)] rounded-[20px] border border-border-button-default bg-background-primary-default p-1.5 shadow-dropdown'
/** `<PopoverTrigger>` + `<Popover>`: any trigger HTML plus a panel. `content` goes in the dialog (flex-col gap-3 p-2.5). Wire with wirePopover(root). */
export function popover(trigger: string, content: string, o: { id?: string; cls?: string; dialogCls?: string; align?: 'left' | 'right'; wrapCls?: string } = {}): string {
  return `<div data-pop${o.id ? `="${o.id}"` : ''} class="${cx('relative inline-flex', o.wrapCls)}"><div data-pop-trigger class="inline-flex">${trigger}</div><div data-pop-panel hidden class="${cx('absolute top-full mt-2', o.align === 'right' ? 'right-0' : 'left-0', POPOVER_SURFACE, o.cls)}"><div class="${cx('flex flex-col gap-3 p-2.5 outline-none', o.dialogCls)}">${content}</div></div></div>`
}
export const popoverHeader = (title: string, description?: string) => `<div class="flex flex-col gap-0.5"><h3 class="text-body-medium text-text-primary">${title}</h3>${description ? `<p class="text-body-2-regular text-text-secondary">${description}</p>` : ''}</div>`
export const popoverFooter = (children: string, cls = '') => `<div class="${cx('flex items-center justify-end gap-2', cls)}">${children}</div>`
/** Toggle open/close on trigger click, close on outside click. Dispatches `pop-open` / `pop-close` events on the wrapper. */
export function wirePopover(root: ParentNode, id?: string) {
  root.querySelectorAll<HTMLElement>(id ? `[data-pop="${id}"]` : '[data-pop]').forEach((el) => {
    if (el.dataset.wired) return
    el.dataset.wired = '1'
    const trig = el.querySelector<HTMLElement>('[data-pop-trigger]')!
    const panel = el.querySelector<HTMLElement>('[data-pop-panel]')!
    const set = (open: boolean) => { panel.hidden = !open; el.dispatchEvent(new CustomEvent(open ? 'pop-open' : 'pop-close')) }
    trig.addEventListener('click', (e) => { e.stopPropagation(); set(!!panel.hidden) })
    document.addEventListener('click', (e) => { if (!panel.hidden && !el.contains(e.target as Node)) set(false) })
  })
}

/* ----------------------------------------------------------------- input */
/** `<Label>`. */
export const label = (text: string, required = false) => `<label data-label="true" class="flex cursor-default items-center gap-0.5 text-body-medium text-text-primary">${text}${required ? '<span aria-hidden="true" class="text-body-medium text-text-error-primary">*</span>' : ''}</label>`
/** `<HintText>`. */
export const hintText = (text: string, invalid = false) => `<p class="${cx('pt-px text-caption-1-medium text-text-secondary', invalid && 'text-text-error-primary')}">${text}</p>`
/** `<Input>`: grey field with inset ring. `leadingIcon` is a Remix name. */
export function input(o: { value?: string; placeholder?: string; size?: 'medium' | 'small'; leadingIcon?: string; trailing?: string; type?: string; attrs?: string; cls?: string; inputCls?: string; disabled?: boolean } = {}): string {
  const size = o.size ?? 'medium'
  const hasAddon = !!o.leadingIcon
  const shell = hasAddon ? (size === 'small' ? 'h-8 ps-1 pe-1.5 py-2' : 'h-9 ps-1 pe-2 py-2') : (size === 'small' ? 'h-8 px-1.5 py-2' : 'p-2')
  return `<div class="${cx('relative flex w-full items-center rounded-2lg bg-background-tertiary-default text-foreground-icon-tertiary ring-2 ring-inset ring-transparent transition-[background-color,box-shadow,color] ease hover:ring-border-button-hover focus-within:ring-border-button-active focus-within:hover:ring-border-button-active', shell, o.disabled && 'bg-input-disabled-background text-input-disabled-foreground', o.cls)}"><div class="flex w-full items-center gap-2 min-w-0"><div class="flex flex-1 items-center gap-0.5 min-w-0">${o.leadingIcon ? ri(o.leadingIcon, 'size-5 shrink-0') : ''}<input type="${o.type ?? 'text'}" value="${esc(o.value ?? '')}" placeholder="${esc(o.placeholder ?? '')}"${o.disabled ? ' disabled' : ''} class="${cx('min-w-0 flex-1 bg-transparent border-0 outline-none p-0 m-0 font-sans text-body-regular text-text-primary placeholder:text-text-tertiary focus:placeholder:text-text-primary pl-1 text-left', o.inputCls)}" ${o.attrs ?? ''}/></div>${o.trailing ?? ''}</div></div>`
}

/* ----------------------------------------------------------------- modal */
const MODAL_SIZE = { sm: 'max-w-[400px]', md: 'max-w-[480px]', lg: 'max-w-[640px]', xl: 'max-w-[800px]', '2xl': 'max-w-[1040px]' }
/**
 * `<Modal>` with `<ModalHeader>/<ModalBody>/<ModalFooter>`. Rendered hidden; open with openModal(id), close with closeModal(id)
 * (backdrop click, Esc and any `[data-modal-close]` element also close it). `header.icon` = Remix name, tone default|danger.
 */
export function modal(o: { id: string; title: string; description?: string; icon?: string; tone?: 'default' | 'danger'; body: string; footer?: string; size?: keyof typeof MODAL_SIZE; cls?: string }): string {
  const iconTone = o.tone === 'danger' ? 'bg-notification-error-background text-notification-error-foreground' : 'bg-background-tertiary-default text-foreground-icon-secondary'
  return `<div data-modal="${o.id}" hidden class="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
    <div data-modal-close aria-hidden="true" class="absolute inset-0 bg-black/70"></div>
    <div class="${cx('relative flex max-h-full w-full flex-col outline-none', MODAL_SIZE[o.size ?? 'md'])}"><div role="dialog" aria-modal="true" aria-label="${esc(o.title)}" class="${cx('flex min-h-0 flex-col gap-4 overflow-clip py-6 outline-none rounded-3xl border border-separator-border bg-background-full shadow-xs', o.cls)}">
      <div class="flex shrink-0 items-start gap-3 px-6"><div class="flex min-w-0 flex-1 flex-col">${o.icon ? `<span class="${cx('mb-4 flex size-10 shrink-0 items-center justify-center rounded-full', iconTone)}">${ri(o.icon, 'size-5')}</span>` : ''}<h2 class="text-title-3-medium text-text-primary">${o.title}</h2>${o.description ? `<p class="mt-1 text-body-regular text-text-secondary">${o.description}</p>` : ''}</div>${closeButton({ size: 'sm', label: 'Close', cls: '-me-1 shrink-0', attrs: 'data-modal-close' })}</div>
      <div class="relative flex min-h-0 flex-1 flex-col"><div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-1 text-body-regular text-text-secondary">${o.body}</div></div>
      ${o.footer ? `<div class="mt-2 flex shrink-0 flex-col-reverse gap-2 px-6 sm:flex-row sm:items-center sm:justify-end">${o.footer}</div>` : ''}
    </div></div></div>`
}
export function openModal(id: string, root: ParentNode = document) {
  const el = root.querySelector<HTMLElement>(`[data-modal="${id}"]`)
  if (el) el.hidden = false
}
export function closeModal(id: string, root: ParentNode = document) {
  const el = root.querySelector<HTMLElement>(`[data-modal="${id}"]`)
  if (el) el.hidden = true
}
/** Make [data-modal-close] elements and Escape close their modal. Call once after inserting modal HTML. */
export function wireModals(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-modal]').forEach((m) => {
    if (m.dataset.wired) return
    m.dataset.wired = '1'
    m.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-modal-close]')) m.hidden = true })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) m.hidden = true })
  })
}

/* ------------------------------------------------------------ pagination */
const PAGE_CELL = 'flex size-8 shrink-0 items-center justify-center rounded-lg text-body-medium'
function pageRange(current: number, total: number, sibling: number): Array<number | 'dots'> {
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
  if (sibling * 2 + 5 >= total) return range(1, total)
  const left = Math.max(current - sibling, 1), right = Math.min(current + sibling, total)
  const dl = left > 2, dr = right < total - 2
  if (!dl && dr) return [...range(1, 3 + 2 * sibling), 'dots', total]
  if (dl && !dr) return [1, 'dots', ...range(total - (2 + 2 * sibling), total)]
  return [1, 'dots', ...range(left, right), 'dots', total]
}
function paginationInner(page: number, total: number, sibling: number, prev: string, next: string): string {
  return `${button(prev, { variant: 'secondary', size: 'small', leadingIcon: 'RiArrowLeftLine', disabled: page <= 1, attrs: 'data-go="prev"' })}
    <ul class="flex min-w-0 items-center gap-0.5">${pageRange(page, total, sibling).map((p) => p === 'dots'
      ? `<li aria-hidden="true" class="${PAGE_CELL} text-text-tertiary">…</li>`
      : `<li><button type="button" aria-label="Go to page ${p}" data-go="${p}"${p === page ? ' aria-current="page"' : ''} class="${PAGE_CELL} cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring ${p === page ? 'border border-border-button-default bg-background-primary-default text-text-primary shadow-xs' : 'text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'}">${p}</button></li>`).join('')}</ul>
    ${button(next, { variant: 'secondary', size: 'small', trailingIcon: 'RiArrowRightLine', disabled: page >= total, attrs: 'data-go="next"' })}`
}
/** `<Pagination>` (full, non-compact layout). Wire with wirePagination(root, id, cb). */
export function pagination(id: string, page: number, totalPages: number, o: { siblingCount?: number; cls?: string; previousLabel?: string; nextLabel?: string } = {}): string {
  if (totalPages <= 1) return ''
  const s = o.siblingCount ?? 1, p = o.previousLabel ?? 'Previous', n = o.nextLabel ?? 'Next'
  return `<nav data-pagination="${id}" data-page="${page}" data-total="${totalPages}" data-sibling="${s}" data-prev="${p}" data-next="${n}" aria-label="Pagination" class="${cx('flex w-full items-center justify-between gap-2', o.cls)}">${paginationInner(page, totalPages, s, p, n)}</nav>`
}
export function wirePagination(root: ParentNode, id: string, cb: (page: number) => void) {
  const nav = root.querySelector<HTMLElement>(`[data-pagination="${id}"]`)
  if (!nav) return
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-go]')
    if (!b || b.disabled) return
    const total = Number(nav.dataset.total), cur = Number(nav.dataset.page)
    const g = b.dataset.go
    const page = g === 'prev' ? cur - 1 : g === 'next' ? cur + 1 : Number(g)
    nav.dataset.page = String(page)
    nav.innerHTML = paginationInner(page, total, Number(nav.dataset.sibling), nav.dataset.prev!, nav.dataset.next!)
    cb(page)
  })
}

/* -------------------------------------------------------------- progress */
const TRACK_H = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }
/** `<ProgressTrack>`: rail with accent fill (colour from text colour, pass e.g. `text-status-lime-text` via cls). */
export function progressTrack(pct: number, o: { size?: 'sm' | 'md' | 'lg'; cls?: string } = {}): string {
  return `<div class="${cx('relative w-full rounded-full bg-border-button-default text-accent-500', TRACK_H[o.size ?? 'md'], o.cls)}"><span class="absolute inset-0 overflow-hidden rounded-full"><span class="absolute inset-0 rounded-full bg-current" style="translate:-${100 - Math.min(100, Math.max(0, pct))}% 0"></span></span></div>`
}
/** `<ProgressBar>` with optional label row (value shown at right) and description. */
export function progressBar(pct: number, o: { label?: string; valueText?: string; showValue?: boolean; description?: string; size?: 'sm' | 'md' | 'lg'; cls?: string } = {}): string {
  const showValue = o.showValue ?? o.label != null
  return `<div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" class="${cx('flex w-full flex-col gap-1.5', o.cls)}">${o.label != null || showValue ? `<div class="flex items-baseline justify-between gap-3">${o.label != null ? `<span data-label="true" class="min-w-0 truncate flex cursor-default items-center gap-0.5 text-body-medium text-text-primary">${o.label}</span>` : '<span></span>'}${showValue ? `<span class="shrink-0 text-body-medium text-text-secondary tabular-nums">${o.valueText ?? `${Math.round(pct)}%`}</span>` : ''}</div>` : ''}${progressTrack(pct, { size: o.size })}${o.description ? `<span class="text-caption-1-medium text-text-secondary">${o.description}</span>` : ''}</div>`
}
const RING = { sm: { box: 16, line: 2 }, md: { box: 24, line: 2.5 }, lg: { box: 32, line: 3 } }
/** `<ProgressCircle>` (determinate ring). */
export function progressCircle(pct: number, o: { size?: 'sm' | 'md' | 'lg'; cls?: string } = {}): string {
  const { box, line } = RING[o.size ?? 'md']
  const r = (box - line) / 2, c = 2 * Math.PI * r
  return `<span role="progressbar" aria-valuenow="${Math.round(pct)}" class="inline-flex shrink-0"><svg aria-hidden="true" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" class="${cx('-rotate-90 text-accent-500', o.cls)}"><circle cx="${box / 2}" cy="${box / 2}" r="${r}" fill="none" stroke-width="${line}" class="stroke-border-button-default"/><circle cx="${box / 2}" cy="${box / 2}" r="${r}" fill="none" stroke="currentColor" stroke-width="${line}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg></span>`
}

/* -------------------------------------------------------------- skeleton */
const SK_SHAPE = { rect: 'rounded-xl', text: 'rounded-md', circle: 'rounded-full' }
/** `<Skeleton>` placeholder block. Size via cls (`h-4 w-40`). */
export const skeleton = (cls = '', shape: 'rect' | 'text' | 'circle' = 'rect') => `<span aria-hidden="true" class="${cx('bui-skeleton block bg-text-primary/8 relative', SK_SHAPE[shape], cls)}"></span>`
/** `<SkeletonText>`: stacked lines, the last 60% wide. */
export const skeletonText = (lines = 3, lineCls = 'h-3.5', cls = '') => `<span aria-hidden="true" class="${cx('flex w-full flex-col gap-2.5', cls)}">${Array.from({ length: lines }, (_, i) => skeleton(cx(lineCls, i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'), 'text')).join('')}</span>`

/* --------------------------------------------------------------- spinner */
const SPIN = { xs: { box: 12, line: 1.5 }, sm: { box: 16, line: 2 }, md: { box: 20, line: 2 }, lg: { box: 24, line: 2.5 }, xl: { box: 32, line: 3 } }
function arc(box: number, line: number, width: number, blur: number, opacity: number, a: number, lag: number): string {
  const center = box / 2 - line / 2, inner = center - width / 2, outer = center + width / 2
  const bleed = Math.max(0, outer + blur * 2 - box / 2)
  const ring = `radial-gradient(circle, transparent ${inner}px, #000 ${inner + 0.5}px, #000 ${outer - 0.5}px, transparent ${outer}px)`
  return `<span aria-hidden="true" class="absolute" style="inset:${-bleed}px;${blur > 0 ? `filter:blur(${blur}px);` : ''}opacity:${opacity};rotate:${-lag}deg"><span class="absolute inset-0" style="background:conic-gradient(transparent ${360 - a}deg, currentColor 360deg);mask-image:${ring};-webkit-mask-image:${ring}"></span></span>`
}
/** `<Spinner>` (accent by default; colour from text colour via cls, e.g. `text-white`). */
export function spinner(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md', cls = '', track = true): string {
  const { box, line } = SPIN[size]
  return `<span role="progressbar" aria-label="Loading" class="inline-flex shrink-0"><span aria-hidden="true" class="${cx('relative inline-flex shrink-0 text-accent-500', cls)}" style="width:${box}px;height:${box}px">${track ? `<span class="absolute inset-0 rounded-full border-current opacity-15" style="border-width:${line}px"></span>` : ''}<span class="absolute inset-0 animate-spin [animation-duration:900ms]">${arc(box, line, line * 4, line * 1.6, 0.32, 110, 22)}${arc(box, line, line * 2, line * 0.6, 0.6, 200, 9)}${arc(box, line, line, 0, 1, 290, 0)}<span class="absolute left-1/2 top-0 rounded-full bg-current" style="width:${line}px;height:${line}px;translate:-50% 0"></span></span></span></span>`
}
