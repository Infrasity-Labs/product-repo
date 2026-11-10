/*
 * Port of `components/geo/overview/dash/dash-ui.tsx` (Panel, PanelHead, Tip, Chip, Move, Toggle, Meter, IconTile, DashButton…).
 *
 * Exports:
 *   fmt, fmtPct, fmtPos, fmtDay          number / date formatting
 *   MONO                                  mono font class
 *   engineCardSpan(i, n)                  xl column-span class for engine card i of n
 *   panel(children, cls, id)              <Panel>
 *   panelHead({title,hint,right,cls})     <PanelHead> (hint = tooltip on the info icon)
 *   tip(content, children, side, cls)     <Tip>: hover tooltip around any HTML (content is plain text)
 *   dchip(tone, children, {dot, cls})     dash <Chip> (tone good|bad|warn|neutral|accent)
 *   move(value, suffix, goodWhen, muted, cls)   <Move> arrow delta
 *   toggle(id, value, options, label) + wireToggle(root, id, cb)   <Toggle> (BoardUI SegmentedControl)
 *   meter(value, tone, cls)               <Meter> thin bar
 *   iconTile(childrenHtml, tone, cls)     <IconTile>
 *   dashButton(children, opts)            <DashButton> (outline|solid|ghost → secondary|primary|ghost)
 *   btn / btnOutlineCls / btnSolidCls     legacy button class strings
 */
import { cx, esc, button, chip, segmentedControl, wireSegmented, type ChipColor, type ButtonSize } from './base'
import { ri } from '../lib/icons'

export { cx }
export const fmt = (n: number | null | undefined) => (n == null ? '–' : n.toLocaleString('en-US'))
export const fmtPct = (n: number | null | undefined, d = 0) => (n == null ? '–' : `${n.toFixed(d)}%`)
export const fmtPos = (n: number | null | undefined) => (n == null ? '–' : `#${Math.round(n * 10) / 10}`)
export const fmtDay = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export const MONO = 'font-[family-name:var(--font-plex-mono),ui-monospace,monospace]'

const XL_SPAN: Record<number, string> = { 1: 'xl:col-span-12', 2: 'xl:col-span-6', 3: 'xl:col-span-4', 4: 'xl:col-span-3' }
/** Column classes for item `i` of `n` engine cards on a 12-col grid at xl (pair with `grid sm:grid-cols-2 xl:grid-cols-12`). */
export function engineCardSpan(i: number, n: number): string {
  const top = n > 4 ? Math.ceil(n / 2) : n
  const rowSize = i < top ? top : n - top
  return cx(XL_SPAN[rowSize] ?? 'xl:col-span-3', n % 2 === 1 && i === n - 1 && 'sm:max-xl:col-span-2')
}

/** The page's card: white, hairline separator border, rounded-2xl. */
export const panel = (children: string, cls = '', id?: string) =>
  `<section${id ? ` id="${id}"` : ''} class="${cx('flex flex-col overflow-hidden rounded-2xl border border-separator-border bg-background-full', cls)}">${children}</section>`

/** Hover tooltip on any element. `content` is plain text (escaped); `side` is the preferred placement. */
export const tip = (content: string, children: string, side: 'top' | 'bottom' | 'left' | 'right' = 'top', cls = '') =>
  `<span data-tip="${esc(content)}" data-side="${side}" tabindex="0" class="${cx('inline-flex cursor-help items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring', cls)}">${children}</span>`

export function panelHead(o: { title: string; hint?: string; right?: string; cls?: string }) {
  return `<header class="${cx('flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-separator-border px-5 py-3.5', o.cls)}">
    <div class="flex min-w-0 items-center gap-2"><h2 class="text-body-semibold text-text-primary">${o.title}</h2>${o.hint ? tip(o.hint, ri('RiInformationLine', 'size-4 text-text-tertiary')) : ''}</div>
    ${o.right ? `<div class="flex items-center gap-2 text-caption-1-regular text-text-secondary">${o.right}</div>` : ''}
  </header>`
}

export type DashTone = 'good' | 'bad' | 'warn' | 'neutral' | 'accent'
const CHIP_COLOR: Record<DashTone, ChipColor> = { good: 'lime', bad: 'rose', warn: 'yellow', neutral: 'neutral', accent: 'blue' }
export const dchip = (tone: DashTone, children: string, o: { dot?: boolean; cls?: string } = {}) =>
  chip(`${o.dot ? '<span class="size-1.5 rounded-full bg-current"></span>' : ''}${children}`, { variant: 'caption', color: CHIP_COLOR[tone], cls: cx('gap-1', o.cls) })

/** ↑ 7.9 pts (green) / ↓ 0.4 (red). `goodWhen` flips colours for metrics where lower is better. */
export function move(value: number | null | undefined, suffix = '', goodWhen: 'up' | 'down' = 'up', muted = false, cls = '') {
  if (value == null) return `<span class="${cx('text-text-tertiary', cls)}">–</span>`
  if (value === 0) return `<span class="${cx('tabular-nums text-text-secondary', cls)}">0${suffix}</span>`
  const up = value > 0
  const good = goodWhen === 'up' ? up : !up
  return `<span class="${cx('inline-flex items-center gap-0.5 font-medium tabular-nums', muted ? 'text-text-secondary' : good ? 'text-[#039855]' : 'text-[#c01048]', cls)}">${ri(up ? 'RiArrowUpLine' : 'RiArrowDownLine', 'size-3')}${Math.abs(value)}${suffix}</span>`
}

/** Segmented toggle (Total | By engine) on BoardUI's SegmentedControl. Wire with wireToggle(root, id, cb). */
export const toggle = (id: string, value: string, options: Array<{ value: string; label: string }>, label = '') =>
  segmentedControl(id, value, options).replace('<div role="radiogroup"', `<div role="radiogroup" aria-label="${esc(label)}"`)
export const wireToggle = wireSegmented

const METER: Record<string, string> = { indigo: 'bg-accent-600', crimson: 'bg-[#c01048]', slate: 'bg-text-tertiary', green: 'bg-[#039855]' }
/** Thin progress bar on BoardUI tokens. */
export function meter(value: number, tone: 'indigo' | 'crimson' | 'slate' | 'green' = 'indigo', cls = '') {
  const pct = Math.max(1.5, Math.min(100, value))
  return `<div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" class="${cx('h-1.5 w-full overflow-hidden rounded-full bg-background-tertiary-default', cls)}"><div class="${cx('h-full rounded-full', METER[tone])}" style="width:${pct}%"></div></div>`
}

const TILE: Record<string, string> = {
  indigo: 'bg-accent-50 text-accent-600',
  green: 'bg-status-lime-background text-status-lime-text',
  crimson: 'bg-status-rose-background text-status-rose-text',
  amber: 'bg-status-yellow-background text-status-yellow-text',
  slate: 'bg-background-tertiary-default text-text-secondary',
}
/** Small rounded tile holding an icon (pass `ri(...)` markup; its svg is sized size-4). */
export const iconTile = (children: string, tone: 'indigo' | 'green' | 'crimson' | 'amber' | 'slate' = 'indigo', cls = '') =>
  `<span class="${cx('grid size-8 shrink-0 place-items-center rounded-lg [&>svg]:size-4', TILE[tone], cls)}">${children}</span>`

const BV = { outline: 'secondary', solid: 'primary', ghost: 'ghost' } as const
/** BoardUI Button (or ButtonLink when `href` is set) with the page's weights: outline (secondary) / solid (primary) / ghost. Icons = Remix names. */
export function dashButton(children: string | undefined, o: { variant?: 'outline' | 'solid' | 'ghost'; size?: ButtonSize; href?: string; target?: string; rel?: string; leadingIcon?: string; trailingIcon?: string; iconOnly?: boolean; disabled?: boolean; cls?: string; attrs?: string; title?: string; ariaLabel?: string } = {}) {
  const attrs = `${o.attrs ?? ''}${o.title ? ` title="${esc(o.title)}"` : ''}${o.ariaLabel ? ` aria-label="${esc(o.ariaLabel)}"` : ''}`
  return button(children, { variant: BV[o.variant ?? 'outline'], size: o.size ?? 'small', href: o.href, target: o.target, rel: o.rel, leadingIcon: o.leadingIcon, trailingIcon: o.trailingIcon, iconOnly: o.iconOnly, disabled: o.disabled, cls: o.cls, attrs })
}

export const btn = 'h-8 gap-1.5 rounded-lg px-3 text-body-medium shadow-none'
export const btnOutlineCls = cx(btn, 'border-border-button-default bg-background-full text-text-primary hover:bg-background-secondary-hover')
export const btnSolidCls = cx(btn, 'bg-text-primary text-text-white hover:bg-text-primary/90')
