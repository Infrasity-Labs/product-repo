/*
 * Port of the real app's `src/components/geo/overview/ui.tsx` (and `logos.tsx`) as HTML-string helpers, using main's
 * BoardUI class names so the markup renders exactly like the app. Everything lives inside an `.app` wrapper.
 *
 * Exports:
 *   cx, esc, fmtNum, fmtPct, fmtPos      formatting / class helpers
 *   card(children, cls)                  <Card>        rounded-2xl border border-separator-border bg-background-full
 *   cardHeader({icon,title,subtitle,right})  <CardHeader>; `icon` is a REMIX component name, e.g. 'RiBarChartLine'
 *   cardFooter(children, right)          <CardFooter>
 *   bigNumber(label, value, delta)       <BigNumber>
 *   tag(children, tone) / pill(children, tone)   <Tag>/<Pill> (both render BoardUI Chip, variant caption)
 *   TYPE_DOT / TYPE_TONE / TYPE_LABEL    domain-type palettes
 *   thCls / tdCls / buttonCls / softLinkCls      class strings
 *   delta(value, suffix, goodWhen, title)        <Delta>
 *   sparkline(values, stroke, cls)       <Sparkline>
 *   bar(pct, color, cls, track)          <Bar>  (final width)
 *   emptyNote(children)                  <EmptyNote>
 *   avatar(name,size,you) / domainLogo   <Avatar>
 *   iconBadge(remixName, tone, size)     <IconBadge>
 *   countBadge(n)                        <CountBadge>
 *   rankChip(rank, tone)                 <RankChip>
 *   ENGINE_META / engineLogo(engine,size,cls,inverted) / siteHref(domain)     engine brand marks (logos.tsx)
 *   segmented(id,value,options,cls) / underTabs(id,value,options)  + wireTabs(root,id,cb)   <Segmented>/<UnderTabs>
 *   columnLegend(columns) + wireColumnLegends(root)   <ColumnLegend> (click "i" opens definition list)
 * Ring / AreaSpark / charts live in charts.ts.
 */
import { ri } from '../lib/icons'
import { chip, cx, esc, type ChipColor } from './base'

export { cx, esc }
export const fmtNum = (n: number | null | undefined) => (n == null ? '–' : n.toLocaleString('en-US'))
export const fmtPct = (n: number | null | undefined, digits = 0) => (n == null ? '–' : `${n.toFixed(digits)}%`)
export const fmtPos = (n: number | null | undefined) => (n == null ? '–' : `#${Math.round(n * 10) / 10}`)

/** White surface with subtle clean curves and a hairline border. */
export const card = (children: string, cls = '') => `<section class="${cx('rounded-2xl border border-separator-border bg-background-full', cls)}">${children}</section>`

/** Card header bar: icon, title, info mark and a quiet description on one line, closed off by a hairline. `icon` = Remix name. */
export function cardHeader(o: { icon?: string; title: string; subtitle?: string; right?: string }) {
  return `<div class="flex min-h-12 items-center justify-between gap-3 border-b border-separator-border px-5 py-3">
    <div class="flex min-w-0 items-center gap-2 text-body-regular">
      ${o.icon ? ri(o.icon, 'size-4 shrink-0 text-text-tertiary') : ''}
      <h2 class="shrink-0 text-body-semibold text-text-primary">${o.title}</h2>
      ${ri('RiInformationLine', 'size-4 shrink-0 text-text-tertiary')}
      ${o.subtitle ? `<span class="text-text-tertiary">·</span><span class="truncate text-text-secondary">${o.subtitle}</span>` : ''}
    </div>
    ${o.right ?? ''}
  </div>`
}

/** Light grey strip at the foot of a card ("Showing data for 30 days  +7.7 pts"). */
export const cardFooter = (children: string, right = '') =>
  `<div class="flex items-center justify-between gap-3 border-t border-separator-border bg-background-secondary-default px-5 py-3 text-caption-1-regular text-text-secondary">${children}${right}</div>`

/** Big number with its label above and a coloured change beside it. */
export const bigNumber = (label: string, value: string, delta = '') =>
  `<div class="px-5 pt-4"><p class="text-caption-1-regular text-text-secondary">${label}</p><p class="mt-1 flex items-baseline gap-2"><span class="text-title-3-medium tabular-nums text-text-primary">${value}</span>${delta}</p></div>`

export type Tone = 'green' | 'blue' | 'amber' | 'rose' | 'violet' | 'slate' | 'sky' | 'teal'
const TAG_COLOR: Record<'green' | 'blue' | 'amber' | 'rose' | 'violet' | 'slate', ChipColor> = { green: 'lime', blue: 'blue', amber: 'yellow', rose: 'rose', violet: 'blue', slate: 'neutral' }
const PILL_COLOR: Record<Tone, ChipColor> = { green: 'lime', blue: 'blue', rose: 'rose', amber: 'yellow', violet: 'purple', slate: 'neutral', sky: 'cyan', teal: 'cyan' }
/** Soft tinted chip (the app's <Tag>, BoardUI Chip caption). */
export const tag = (children: string, tone: Tone = 'slate') =>
  chip(children, { variant: 'caption', color: (TAG_COLOR as Record<string, ChipColor>)[tone] ?? 'neutral' })
/** Pastel pill (the app's <Pill>, BoardUI Chip caption). */
export const pill = (children: string, tone: Tone = 'slate') => chip(children, { variant: 'caption', color: PILL_COLOR[tone] ?? 'neutral' })

export const TYPE_DOT: Record<string, string> = { You: '#155dfc', Competitor: '#f43f5e', Publisher: '#0ea5e9', Social: '#f59e0b', Review: '#14b8a6', Platform: '#64748b', Education: '#6366f1', Other: '#94a3b8' }
export const TYPE_TONE: Record<string, Tone> = { You: 'blue', Competitor: 'rose', Publisher: 'blue', Social: 'amber', Review: 'green', Platform: 'slate', Education: 'blue', Other: 'slate' }
export const TYPE_LABEL: Record<string, string> = { You: 'You', Competitor: 'Competitor', Publisher: 'Editorial', Social: 'Social / UGC', Review: 'Review site', Platform: 'Platform', Education: 'Institutional', Other: 'Other' }

/** Table header / cell class strings. */
export const thCls = 'whitespace-nowrap border-b border-separator-border bg-background-secondary-default px-4 py-3 text-left text-caption-1-medium text-text-secondary'
export const tdCls = 'px-4 py-3 text-body-regular text-text-primary'
/** Outlined action button and soft link classes. */
export const buttonCls = 'inline-flex items-center gap-1.5 rounded-lg border border-border-button-default bg-background-full px-3 py-1.5 text-body-medium text-text-primary transition-colors hover:bg-background-secondary-hover'
export const softLinkCls = 'inline-flex items-center rounded-lg bg-background-tertiary-default px-3 py-1.5 text-body-medium text-text-secondary transition-colors hover:bg-background-secondary-hover'

/** Up/down change; `goodWhen` says which direction is an improvement (position: lower is better). */
export function delta(value: number | null | undefined, suffix = '', goodWhen: 'up' | 'down' = 'up', title = 'Change vs the previous period of the same length') {
  if (value == null || value === 0) return ''
  const good = goodWhen === 'up' ? value > 0 : value < 0
  return `<span title="${title}" class="inline-flex items-center gap-0.5 text-body-medium tabular-nums ${good ? 'text-[#039855]' : 'text-[#c01048]'}">${value > 0 ? '↑' : '↓'} ${Math.abs(value)}${suffix}</span>`
}

/** Tiny line with a last-point dot (the app's <Sparkline>). */
export function sparkline(values: Array<number | null>, stroke = '#155dfc', cls = '') {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null)
  const w = 92, h = 28, pad = 3
  if (pts.length < 2) return `<svg width="${w}" height="${h}" class="${cls}"><line x1="${pad}" x2="${w - pad}" y1="${h / 2}" y2="${h / 2}" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/></svg>`
  const max = Math.max(...pts.map((p) => p.v), 1), min = Math.min(...pts.map((p) => p.v), 0)
  const span = Math.max(1, max - min)
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2)
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return `<svg width="${w}" height="${h}" class="${cls}" aria-hidden="true"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(last.i)}" cy="${y(last.v)}" r="2.6" fill="#fff" stroke="${stroke}" stroke-width="1.6"/></svg>`
}

/** Horizontal progress bar (final width, no animation). */
export const bar = (pct: number, color = '#155dfc', cls = 'h-1.5', track = 'bg-background-tertiary-default') =>
  `<div class="${cx('overflow-hidden rounded-full', track, cls)}"><div class="h-full rounded-full" style="width:${Math.max(0, Math.min(100, pct))}%;background:${color}"></div></div>`

/** Muted paragraph used for empty states inside a card. */
export const emptyNote = (children: string) => `<p class="px-4 pb-4 pt-3 text-body-regular text-text-secondary">${children}</p>`

const AVATAR_TONES = ['bg-status-blue-background text-status-blue-text', 'bg-status-cyan-background text-status-cyan-text', 'bg-status-lime-background text-status-lime-text', 'bg-status-yellow-background text-status-yellow-text', 'bg-status-rose-background text-status-rose-text', 'bg-status-orange-background text-status-orange-text', 'bg-status-purple-background text-status-purple-text', 'bg-background-tertiary-default text-text-secondary']
/** Letter avatar with a colour derived from the name (no external favicon requests). */
export function avatar(name: string, size = 32, you = false) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `<span class="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold uppercase ${you ? 'bg-accent-600 text-text-white' : AVATAR_TONES[h % AVATAR_TONES.length]}" style="width:${size}px;height:${size}px;font-size:${size * 0.42}px">${esc(name.replace(/^www\./, '').charAt(0))}</span>`
}

type BadgeTone = 'violet' | 'sky' | 'emerald' | 'amber' | 'rose' | 'slate'
/** Pastel square holding an icon; `name` is a Remix component name (e.g. 'RiStackLine'). */
export function iconBadge(name: string, tone: BadgeTone = 'violet', size = 36) {
  const t = { violet: 'bg-accent-50 text-accent-600', sky: 'bg-status-cyan-background text-status-cyan-text', emerald: 'bg-status-lime-background text-status-lime-text', amber: 'bg-status-yellow-background text-status-yellow-text', rose: 'bg-status-rose-background text-status-rose-text', slate: 'bg-background-tertiary-default text-text-secondary' }[tone]
  return `<span class="inline-flex shrink-0 items-center justify-center rounded-lg ${t}" style="width:${size}px;height:${size}px">${ri(name, 'h-[52%] w-[52%]')}</span>`
}

/** Count badge used inside tabs. */
export const countBadge = (n: number) => chip(n.toLocaleString('en-US'), { variant: 'caption', color: 'neutral', cls: 'tabular-nums' })

/** A rank shown as a chip: "#3", or "Not cited"/"Lost". */
export function rankChip(rank: number | null, tone: 'neutral' | 'good' | 'bad' = 'neutral') {
  const color: ChipColor = tone === 'good' ? 'lime' : tone === 'bad' ? 'rose' : 'neutral'
  return chip(rank == null ? (tone === 'bad' ? 'Lost' : 'Not cited') : `#${rank}`, { variant: 'caption', color, cls: 'min-w-6 tabular-nums' })
}

/** Engine brand marks and chart colours (logos.tsx). Marks are transparent images in /geo-logos. */
export const ENGINE_META: Record<string, { src: string; color: string; soft: string }> = {
  ChatGPT: { src: '/geo-logos/chatgpt.svg', color: '#10a37f', soft: '#e6f6f1' },
  Claude: { src: '/geo-logos/claude.svg', color: '#d97757', soft: '#fbeee8' },
  Gemini: { src: '/geo-logos/gemini.svg', color: '#4285f4', soft: '#e8f0fe' },
  Perplexity: { src: '/geo-logos/perplexity.svg', color: '#20808d', soft: '#e3f1f3' },
  'Google AI Overview': { src: '/geo-logos/google-ai-overview.svg', color: '#ea4335', soft: '#fdecea' },
  Copilot: { src: '/geo-logos/copilot.png', color: '#0078d4', soft: '#e5f1fb' },
  Grok: { src: '/geo-logos/grok.png', color: '#344054', soft: '#f2f4f7' },
}
/** <EngineLogo>; `inverted` flips black marks (ChatGPT, Grok) to white for dark tiles. */
export function engineLogo(engine: string, size = 20, cls = '', inverted = false) {
  const m = ENGINE_META[engine]
  if (!m) return avatar(engine, size)
  return `<img src="${m.src}" alt="${engine}" width="${size}" height="${size}" class="${cx('shrink-0 select-none', inverted && (engine === 'ChatGPT' || engine === 'Grok') && 'brightness-0 invert', cls)}" style="width:${size}px;height:${size}px" draggable="false"/>`
}
export const siteHref = (domain: string) => `https://${domain.replace(/^https?:\/\//i, '')}`

/** Domain tile: the app loads a favicon, falling back to a letter avatar. Here we always use the letter avatar. */
export const domainLogo = (domain: string, size = 32, you = false) => avatar(domain, size, you)

const SEG_ON = 'text-body-medium text-text-primary bg-background-full shadow-xs'
const SEG_OFF = 'text-body-medium text-text-secondary hover:text-text-primary'
/** Segmented control. Wire with wireTabs(root, id, cb). */
export function segmented(id: string, value: string, options: Array<{ value: string; label: string }>, cls = '') {
  return `<div role="tablist" data-tabs="${id}" class="${cx('inline-flex shrink-0 rounded-lg bg-background-tertiary-default p-0.5', cls)}">${options
    .map((o) => `<button type="button" role="tab" data-v="${o.value}" aria-selected="${value === o.value}" class="relative rounded-md px-2.5 py-1 transition-colors ${value === o.value ? SEG_ON : SEG_OFF}"><span class="relative flex items-center gap-1.5">${o.label}</span></button>`)
    .join('')}</div>`
}
const UNDER_ON = 'text-text-primary'
const UNDER_OFF = 'text-text-tertiary hover:text-text-primary'
const UNDER_BAR = '<span data-under class="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent-600"></span>'
/** Underlined tabs. Wire with wireTabs(root, id, cb). */
export function underTabs(id: string, value: string, options: Array<{ value: string; label: string }>) {
  return `<div role="tablist" data-tabs="${id}" data-kind="under" class="flex gap-5 border-b border-separator-border">${options
    .map((o) => `<button type="button" role="tab" data-v="${o.value}" aria-selected="${value === o.value}" class="relative -mb-px flex items-center gap-1.5 pb-2.5 text-body-medium transition-colors ${value === o.value ? UNDER_ON : UNDER_OFF}">${o.label}${value === o.value ? UNDER_BAR : ''}</button>`)
    .join('')}</div>`
}
/** Make a segmented/underline tab group interactive: updates the selected styles, then calls cb(value). */
export function wireTabs(root: ParentNode, id: string, cb: (value: string) => void) {
  const list = root.querySelector<HTMLElement>(`[data-tabs="${id}"]`)
  if (!list) return
  const under = list.dataset.kind === 'under'
  const toggle = (el: Element, classes: string, on: boolean) => classes.split(' ').forEach((c) => el.classList.toggle(c, on))
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-v]')
    if (!b) return
    list.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((o) => {
      const on = o === b
      o.setAttribute('aria-selected', String(on))
      if (under) {
        toggle(o, UNDER_ON, on); toggle(o, UNDER_OFF, !on)
        o.querySelector('[data-under]')?.remove()
        if (on) o.insertAdjacentHTML('beforeend', UNDER_BAR)
      } else {
        toggle(o, SEG_ON, on); toggle(o, SEG_OFF, !on)
      }
    })
    cb(b.dataset.v as string)
  })
}

/** "i" button that opens a definition list for every column in a table. Wire with wireColumnLegends(root). */
export function columnLegend(columns: Array<{ label: string; detail: string }>) {
  return `<div class="relative inline-flex" data-col-legend>
    <button type="button" data-legend-btn aria-label="What do these columns mean?" aria-expanded="false" class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-separator-border bg-background-full text-text-tertiary transition-colors hover:text-text-secondary">${ri('RiInformationLine', 'h-3.5 w-3.5')}</button>
    <div data-legend-panel hidden class="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-separator-border bg-background-full p-4 text-left shadow-lg">
      <p class="mb-2 text-body-semibold text-text-primary">What these columns mean</p>
      <dl class="space-y-2.5">${columns.map((c) => `<div><dt class="text-body-medium text-text-primary">${c.label}</dt><dd class="mt-0.5 text-caption-1-regular text-text-secondary">${c.detail}</dd></div>`).join('')}</dl>
    </div>
  </div>`
}
const LEGEND_OPEN = 'border-accent-300 bg-accent-50 text-accent-600'
const LEGEND_CLOSED = 'border-separator-border bg-background-full text-text-tertiary hover:text-text-secondary'
export function wireColumnLegends(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-col-legend]').forEach((el) => {
    const btn = el.querySelector<HTMLButtonElement>('[data-legend-btn]')!
    const panel = el.querySelector<HTMLElement>('[data-legend-panel]')!
    const set = (open: boolean) => {
      panel.hidden = !open
      btn.setAttribute('aria-expanded', String(open))
      LEGEND_OPEN.split(' ').forEach((c) => btn.classList.toggle(c, open))
      LEGEND_CLOSED.split(' ').forEach((c) => btn.classList.toggle(c, !open))
    }
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(!!panel.hidden) })
    document.addEventListener('click', (e) => { if (!panel.hidden && !el.contains(e.target as Node)) set(false) })
  })
}
