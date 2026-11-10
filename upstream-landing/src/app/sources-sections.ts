/*
 * Sections of the Sources page: port of main's `components/geo/overview/dash/sources-sections.tsx` (stat strip, tab bar,
 * Domains / Competitors / Your pages tabs) as HTML-string builders. Presentational; state and wiring live in pages/sources.ts.
 */
import { ri } from '../lib/icons'
import { cx, esc, tabs } from './base'
import * as charts from './charts'
import type { LineSeries } from './charts'
import type { DomainType, PromptRow } from './data'
import { trend } from './data'
import { dashButton, dchip, fmt, fmtDay, fmtPct, fmtPos, meter, move, MONO, panel, panelHead, toggle } from './dash-ui'
import { pager } from './dash-parts'
import type { DomainMoverItem, DomainTableRow, UrlTableRow } from './sources-data'
import { domainTypeDescriptions, movers } from './sources-data'
import type { LeaderRow } from './sources-overview-data'
import { newDomains } from './sources-overview-data'
import { domainLogo } from './ui'

export const PAGE_SIZE = 20
const th = 'whitespace-nowrap border-b border-separator-border px-4 py-3 text-left text-caption-1-medium text-text-secondary'
const td = 'px-4 py-3 text-body-regular'

type Tone = 'good' | 'bad' | 'warn' | 'neutral' | 'accent'
export const TYPE_LABEL: Record<DomainType, string> = { You: 'You', Competitor: 'Competitor', Publisher: 'Editorial', Social: 'UGC', Review: 'Review site', Platform: 'Platform', Education: 'Institutional', Other: 'Other' }
const TYPE_TONE: Record<DomainType, Tone> = { You: 'good', Competitor: 'bad', Publisher: 'accent', Social: 'warn', Review: 'good', Platform: 'neutral', Education: 'accent', Other: 'neutral' }
const TYPE_BAR: Record<DomainType, string> = { You: 'bg-status-lime-text', Competitor: 'bg-status-rose-text', Publisher: 'bg-accent-600', Social: 'bg-status-yellow-text', Review: 'bg-status-lime-text', Platform: 'bg-text-secondary', Education: 'bg-accent-400', Other: 'bg-text-tertiary' }
export const typeChip = (type: DomainType) => dchip(TYPE_TONE[type], TYPE_LABEL[type])

export const siteHref = (domain: string) => `https://${domain.replace(/^https?:\/\//i, '')}`
export const emptyRow = (children: string) => `<p class="px-5 py-10 text-center text-caption-1-regular text-text-secondary">${children}</p>`

const inputBase = 'rounded-lg border border-border-button-default bg-background-full text-body-regular text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring'
const sliceFor = <T>(rows: T[], page: number) => {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  return { pages, cur, visible: rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE) }
}

/* ── Popover (BoardUI Popover surface; opened/closed by `wirePops` in pages/sources.ts) ── */
export function popover(o: { id: string; trigger: string; width: string; dialogCls: string; align?: 'start' | 'end'; open?: boolean; children: string; label: string }): string {
  return `<div class="relative" data-pop="${o.id}">
    ${o.trigger}
    <div data-pop-panel role="dialog" aria-label="${esc(o.label)}" ${o.open ? '' : 'hidden'} class="${cx('absolute top-full z-110 mt-2 max-w-[calc(100vw-32px)] rounded-[20px] border border-border-button-default bg-background-primary-default p-1.5 shadow-dropdown', o.width, o.align === 'end' ? 'right-0' : 'left-0')}">
      <div class="${cx('flex flex-col outline-none', o.dialogCls)}">${o.children}</div>
    </div></div>`
}

/* ── Stat strip ──────────────────────────────────────────────────────────── */
export function statStrip(cells: Array<{ label: string; value: string; foot?: string }>): string {
  return `<section class="grid grid-cols-2 divide-x divide-separator-border overflow-hidden rounded-2xl border border-separator-border bg-background-full lg:grid-cols-4 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-separator-border lg:[&>*:nth-child(n+3)]:border-t-0">${cells
    .map((c) => `<div class="min-w-0 p-5">
      <p class="text-caption-1-regular text-text-secondary">${c.label}</p>
      <p class="mt-1.5 truncate text-title-1-medium tabular-nums text-text-primary" title="${esc(c.value)}">${esc(c.value)}</p>
      ${c.foot ? `<p class="mt-1.5 truncate text-caption-1-regular text-text-secondary">${esc(c.foot)}</p>` : ''}
    </div>`)
    .join('')}</section>`
}

export type SourcesTab = 'domains' | 'competitors' | 'pages'
export function tabBar(value: SourcesTab, counts: Partial<Record<SourcesTab, number | null | undefined>>): string {
  const list: Array<{ value: SourcesTab; label: string }> = [{ value: 'domains', label: 'Domains' }, { value: 'competitors', label: 'Competitors' }, { value: 'pages', label: 'Your pages' }]
  return tabs('sources-tab', value, list.map((t) => ({ ...t, count: counts[t.value] != null ? fmt(counts[t.value]) : undefined })))
}

/* ── Domains tab ─────────────────────────────────────────────────────────── */
export type TagMap = Record<string, string[]>

function tagCell(domain: string, tags: string[]): string {
  const add = popover({
    id: `addtag:${domain}`, label: 'Add tag', width: 'w-56', dialogCls: 'gap-2 p-1.5', align: 'start',
    trigger: dashButton('Add tags', { variant: 'ghost', size: 'xs', leadingIcon: 'RiAddLine', attrs: 'data-pop-toggle' }),
    children: `<input data-tag-input="${esc(domain)}" placeholder="Pitch target, Listicle…" aria-label="New tag" class="h-8 w-full ${inputBase} px-2.5" />
      ${dashButton('Add tag', { variant: 'solid', size: 'small', cls: 'w-full', attrs: `data-tag-add="${esc(domain)}"` })}`,
  })
  return `<span class="flex flex-wrap items-center gap-1">${tags
    .map((t) => `<span class="inline-flex h-6 items-center gap-1 rounded-lg border border-separator-border bg-background-full pl-2 pr-1 text-caption-1-regular text-text-primary">${esc(t)}<button type="button" data-tag-remove="${esc(domain)}" data-tag="${esc(t)}" aria-label="Remove tag ${esc(t)}" class="grid size-4 place-items-center rounded-sm text-text-tertiary hover:text-text-primary">${ri('RiCloseLine', 'size-3')}</button></span>`)
    .join('')}${add}</span>`
}

export function domainsToolbar(o: { q: string; types: DomainType[]; typeFilter: DomainType[]; typesOpen: boolean }): string {
  return `<div class="flex flex-wrap items-center justify-between gap-3 border-b border-separator-border px-5 py-3">
    <div class="relative">
      ${ri('RiSearchLine', 'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary')}
      <input data-dom-q value="${esc(o.q)}" placeholder="Search domains or tags" aria-label="Search domains or tags" class="h-8 w-64 ${inputBase} pl-9 pr-3" />
    </div>
    <div class="flex items-center gap-2">
      <div data-types-pop>${typesPopover(o.types, o.typeFilter, o.typesOpen)}</div>
      ${dashButton('Export', { variant: 'outline', size: 'small', attrs: 'data-dom-export' })}
    </div>
  </div>`
}

export function typesPopover(types: DomainType[], typeFilter: DomainType[], open: boolean): string {
  const count = typeFilter.length > 0 ? `<span class="grid h-4 min-w-4 place-items-center rounded-full bg-accent-600 px-1 text-caption-1-semibold text-text-white">${typeFilter.length}</span>` : ''
  return popover({
    id: 'types', label: 'Domain types', width: 'w-52', dialogCls: 'gap-0 p-0', align: 'end', open,
    trigger: dashButton(`Domain types${count}`, { variant: 'outline', size: 'small', leadingIcon: 'RiPriceTag3Line', attrs: 'data-pop-toggle' }),
    children: `<ul role="listbox" aria-multiselectable="true" aria-label="Domain types">${types
      .map((t) => {
        const on = typeFilter.includes(t)
        return `<li><button type="button" role="option" aria-selected="${on}" data-type="${t}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-regular text-text-primary hover:bg-background-secondary-hover">
          <span class="${cx('grid size-4 place-items-center rounded border', on ? 'border-accent-600 bg-accent-600' : 'border-border-button-default')}">${on ? '<span class="size-1.5 rounded-sm bg-background-full"></span>' : ''}</span>${TYPE_LABEL[t]}</button></li>`
      })
      .join('')}</ul>${typeFilter.length > 0 ? '<button type="button" data-types-clear class="mt-1 w-full border-t border-separator-border px-2 py-2 text-left text-caption-1-medium text-accent-600">Clear</button>' : ''}`,
  })
}

/** Table + pager of the Domains tab (re-rendered on search / filter / page / tag changes). */
export function domainsBody(o: { rows: DomainTableRow[]; totalCitations: number; promptsTotal: number; tags: TagMap; page: number }): string {
  const { pages, cur, visible } = sliceFor(o.rows, o.page)
  if (!o.rows.length) return emptyRow('No domains match these filters.') + pager('dom', cur, pages, o.rows.length, PAGE_SIZE, 'domains')
  const r = 'text-right'
  return `<div class="overflow-x-auto"><table class="w-full min-w-[860px]">
    <thead><tr>
      <th scope="col" class="${th} w-12 ">#</th><th scope="col" class="${th}">Source</th><th scope="col" class="${th}">Domain type</th><th scope="col" class="${th}">Domain tags</th>
      <th scope="col" class="${th} ${r}">Citations</th><th scope="col" class="${th} ${r}">Share</th><th scope="col" class="${th} ${r}">30d change</th>
      <th scope="col" class="${th} ${r}">Prompts</th><th scope="col" class="${th} ${r}">Retrieved</th>
    </tr></thead>
    <tbody class="divide-y divide-separator-border">${visible
      .map((d, i) => `<tr class="hover:bg-background-secondary-default">
        <td class="${td} tabular-nums text-text-tertiary">${(cur - 1) * PAGE_SIZE + i + 1}</td>
        <td class="${td}"><a href="${siteHref(d.domain)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 hover:text-accent-600">${domainLogo(d.domain, 20, d.is_you)}<span class="${cx('truncate text-body-medium', d.is_you ? 'text-status-lime-text' : 'text-text-primary')}">${esc(d.domain)}</span></a></td>
        <td class="${td}">${typeChip(d.type)}</td>
        <td class="${td}">${tagCell(d.domain, o.tags[d.domain] ?? [])}</td>
        <td class="${td} text-right text-body-medium tabular-nums text-text-primary">${fmt(d.citation_count)}</td>
        <td class="${td} text-right tabular-nums text-text-primary">${o.totalCitations ? fmtPct((d.citation_count / o.totalCitations) * 100, 1) : '–'}</td>
        <td class="${td} text-right">${move(d.citation_change)}</td>
        <td class="${td} text-right tabular-nums text-text-primary">${fmt(d.prompts)}<span class="text-text-tertiary"> / ${fmt(o.promptsTotal)}</span></td>
        <td class="${td} text-right tabular-nums text-text-primary">${fmtPct(d.in_answers_pct, 1)}</td>
      </tr>`)
      .join('')}</tbody></table></div>${pager('dom', cur, pages, o.rows.length, PAGE_SIZE, 'domains')}`
}

export function domainsTable(o: { rows: DomainTableRow[]; totalCitations: number; promptsTotal: number; tags: TagMap; q: string; types: DomainType[]; typeFilter: DomainType[]; typesOpen: boolean; page: number }): string {
  return panel(`${domainsToolbar(o)}<div data-dom-body>${domainsBody(o)}</div>`, 'overflow-hidden')
}

export function domainTypesPanel(types: Array<{ type: DomainType; pct: number }>): string {
  const max = Math.max(1, ...types.map((t) => t.pct))
  return panel(
    panelHead({ title: 'Domain types', right: '<span>share of citations</span>' }) +
      (!types.length
        ? emptyRow('No citations in this range yet.')
        : `<ul class="space-y-2.5 px-5 py-4">${types
            .map((t) => `<li class="grid grid-cols-[96px_1fr_36px] items-center gap-3" title="${esc(domainTypeDescriptions[t.type] ?? '')}">
              ${typeChip(t.type)}
              <span class="h-1.5 overflow-hidden rounded-full bg-background-tertiary-default"><span class="${cx('block h-full rounded-full', TYPE_BAR[t.type])}" style="width:${Math.max(2, (t.pct / max) * 100)}%"></span></span>
              <span class="text-right text-caption-1-regular tabular-nums text-text-primary">${Math.round(t.pct)}%</span></li>`)
            .join('')}</ul>`),
  )
}

export type MoverTab = 'top' | 'new' | 'trending' | 'losing'
export function moversList(tab: MoverTab): string {
  const list: DomainMoverItem[] = movers[tab] ?? []
  if (!list.length) return emptyRow('Nothing to show in this view yet.')
  return `<ul class="divide-y divide-separator-border">${list
    .slice(0, 6)
    .map((m) => `<li class="flex items-center gap-3 px-5 py-3">
      ${domainLogo(m.domain, 18)}
      <div class="min-w-0 flex-1">
        <a href="${siteHref(m.domain)}" target="_blank" rel="noopener noreferrer" class="block truncate text-body-medium text-text-primary hover:text-accent-600">${esc(m.domain)}</a>
        ${tab === 'new' ? dchip('accent', 'New', { dot: true, cls: 'mt-0.5' }) : typeChip(m.type)}
      </div>
      <span class="shrink-0 text-right text-body-medium tabular-nums text-text-primary">${fmt(m.citation_count)}${tab !== 'new' && m.change != null ? `<span class="ml-1.5 text-caption-1-regular">${move(m.change)}</span>` : ''}</span>
    </li>`)
    .join('')}</ul>`
}
export function moversPanel(tab: MoverTab = 'new'): string {
  const t = toggle('movers-tab', tab, [{ value: 'top', label: 'Top' }, { value: 'new', label: 'New' }, { value: 'trending', label: 'Rising' }, { value: 'losing', label: 'Losing' }], 'Movers')
  return panel(panelHead({ title: 'Domain movers', right: t }) + `<div data-movers>${moversList(tab)}</div>`)
}

export function tagsPanel(tags: TagMap): string {
  const m = new Map<string, number>()
  for (const list of Object.values(tags)) for (const t of list) m.set(t, (m.get(t) ?? 0) + 1)
  const counts = [...m.entries()].sort((a, b) => b[1] - a[1])
  return panel(
    panelHead({ title: 'Your tags' }) +
      `<div class="px-5 py-4">
        ${counts.length > 0 ? `<div class="flex flex-wrap gap-1.5">${counts.map(([t, n]) => `<span class="inline-flex h-6 items-center gap-1 rounded-lg border border-separator-border bg-background-full px-2 text-caption-1-regular text-text-primary">${esc(t)}<span class="text-text-tertiary">${n}</span></span>`).join('')}</div>` : ''}
        <p class="${cx('text-caption-1-regular leading-5 text-text-secondary', counts.length > 0 && 'mt-3')}">Tag domains as Pitch target, Listicle, Distribution or anything else. Search a tag in the table to filter. Tags are saved in this browser.</p>
      </div>`,
  )
}

export function listingGapsPanel(count: number, href = '#'): string {
  return panel(
    panelHead({ title: 'Listing gaps' }) +
      `<div class="px-5 py-4">
        <p class="text-caption-1-regular leading-5 text-text-secondary">Third-party pages that name your rivals but not you. Outreach lives in Listicles, so all of it is in one place.</p>
        ${dashButton(`${fmt(count)} listicles skip you`, { variant: 'outline', size: 'small', trailingIcon: 'RiArrowRightLine', href, cls: 'mt-4', attrs: 'data-nav="listicles"' })}
      </div>`,
  )
}

/* ── Competitors tab ─────────────────────────────────────────────────────── */
const RIVAL_COLORS = ['#c2410c', '#2563eb', '#0f766e', '#525252', '#a16207']

export function sovPanel(rangeDays = 30): string {
  void rangeDays
  const solid = trend.filter((p) => p.answers >= 1)
  const keys: Array<{ domain: string; own: boolean }> = [{ domain: 'You', own: true }]
  for (const p of solid) for (const b of p.sov_brands) if (!b.own && !keys.some((k) => k.domain === b.domain)) keys.push({ domain: b.domain, own: false })
  let ri2 = 0
  const series: LineSeries[] = keys.map((k) => ({
    id: k.domain, color: k.own ? '#4f46e5' : RIVAL_COLORS[ri2++ % RIVAL_COLORS.length],
    points: solid.map((p) => ({ x: fmtDay(p.date), y: k.own ? p.sov : (p.sov_brands.find((b) => !b.own && b.domain === k.domain)?.pct ?? 0), answers: p.answers })),
  }))
  const days = solid.map((p) => fmtDay(p.date))
  const peak = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.y ?? 0)))
  const yMax = Math.max(3, Math.ceil(peak / 3) * 3)
  return panel(
    panelHead({ title: 'Share of voice leaderboard', right: '<span>daily share of all citations</span>' }) +
      `<div class="px-5 pb-5">${days.length < 2
        ? '<p class="py-10 text-center text-caption-1-regular text-text-secondary">Not enough scans in this range to draw a trend yet.</p>'
        : `<div class="h-[240px] w-full ${MONO}">${charts.multiLine({ series, days, fmt: (n) => `${Math.round(n * 10) / 10}%`, yMin: 0, yMax, fillMissing: 0 })}</div>
          <div class="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-caption-1-regular text-text-primary">${series.map((s) => `<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full" style="background:${s.color}"></span>${esc(s.id)}</span>`).join('')}</div>`}</div>`,
  )
}

export function leaderboardTable(o: { rows: LeaderRow[]; page: number; tagBusy: string | null; rival: string | null }): string {
  const { pages, cur, visible } = sliceFor(o.rows, o.page)
  const max = Math.max(1, ...o.rows.map((r) => r.pct))
  const body = !o.rows.length
    ? emptyRow('No citations in this range yet.')
    : `<div class="overflow-x-auto"><table class="w-full min-w-[720px]">
        <thead><tr><th scope="col" class="${th}">Domain</th><th scope="col" class="${th}">Type</th><th scope="col" class="${th}">Share of voice</th><th scope="col" class="${th} text-right">Prompts topped</th><th scope="col" class="${th} pr-4"></th></tr></thead>
        <tbody class="divide-y divide-separator-border">${visible
          .map((d) => `<tr class="hover:bg-background-secondary-default">
            <td class="${td}">${d.type === 'You' ? `<span class="font-semibold text-text-primary">${esc(d.domain)}</span>` : `<a href="${siteHref(d.domain)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 font-medium text-text-primary hover:text-accent-600">${domainLogo(d.domain, 18)}${esc(d.domain)}</a>`}</td>
            <td class="${td}">${typeChip(d.type)}</td>
            <td class="${td}"><span class="inline-flex items-center gap-2.5"><span class="w-24">${meter((d.pct / max) * 100, d.type === 'You' ? 'indigo' : 'slate')}</span><span class="font-medium tabular-nums text-text-primary">${d.pct}%</span></span></td>
            <td class="${td} text-right tabular-nums text-text-primary">${d.promptsTopped}</td>
            <td class="${td} whitespace-nowrap pr-4 text-right">${d.type !== 'You'
              ? `<button type="button" data-lb-tag="${esc(d.domain)}" data-on="${d.type !== 'Competitor'}" ${o.tagBusy === d.domain ? 'disabled' : ''} class="mr-3 text-caption-1-medium text-text-secondary hover:text-accent-600 disabled:opacity-50">${o.tagBusy === d.domain ? 'Saving…' : d.type === 'Competitor' ? 'Untag' : 'Tag as competitor'}</button><button type="button" data-lb-compare="${esc(d.domain)}" class="${cx('text-caption-1-medium', o.rival === d.domain ? 'text-accent-600' : 'text-text-secondary hover:text-accent-600')}">${o.rival === d.domain ? 'Comparing' : 'Compare'}</button>`
              : ''}</td>
          </tr>`)
          .join('')}</tbody></table></div>`
  return panel(
    panelHead({ title: 'Who owns the answers', right: '<span>share of voice and prompts topped</span>' }) +
      body +
      pager('lb', cur, pages, o.rows.length, PAGE_SIZE, 'domains') +
      `<p class="border-t border-separator-border px-5 py-3 text-caption-1-regular text-text-secondary">Types are classified automatically. <button type="button" data-manage class="font-medium text-accent-600 hover:underline">Tag the real rivals</button> to split them from publishers.</p>`,
    'overflow-hidden',
  )
}

export function headToHeadPanel(o: { rivals: string[]; rival: string | null; prompts: PromptRow[]; page: number; selectHtml: string }): string {
  const rows = !o.rival
    ? []
    : o.prompts
        .map((p) => ({ p, them: p.domain_shares.find((d) => d.domain === o.rival)?.pct ?? null, you: p.domain_shares.find((d) => d.is_you)?.pct ?? 0 }))
        .filter((r): r is { p: PromptRow; them: number; you: number } => r.them != null && r.them > r.you)
        .sort((a, b) => b.them - b.you - (a.them - a.you))
  const { pages, cur, visible } = sliceFor(rows, o.page)
  const right = `<span class="hidden sm:inline">prompts where they beat you most</span>${o.rivals.length > 0 ? o.selectHtml : ''}`
  const body = !o.rival
    ? emptyRow('Pick a rival to see where they out-share you.')
    : !rows.length
      ? emptyRow(`${esc(o.rival)} doesn't out-share you on any prompt in this range.`)
      : `<table class="w-full"><thead><tr><th scope="col" class="${th}">Prompt</th><th scope="col" class="${th} text-right">You</th><th scope="col" class="${th} text-right">Them</th></tr></thead>
          <tbody class="divide-y divide-separator-border">${visible
            .map(({ p, them, you }) => `<tr class="hover:bg-background-secondary-default">
              <td class="${td} max-w-0 "><span class="block truncate text-text-primary" title="${esc(p.prompt)}">${esc(p.prompt)}</span></td>
              <td class="${td} text-right tabular-nums text-text-primary">${you}%</td>
              <td class="${td} text-right text-body-medium tabular-nums text-status-rose-text">${them}%</td></tr>`)
            .join('')}</tbody></table>`
  return panel(panelHead({ title: o.rival ? `Head to head: ${esc(o.rival)}` : 'Head to head', right }) + body + pager('h2h', cur, pages, rows.length, PAGE_SIZE, 'prompts'), 'overflow-hidden')
}

export function rivalsByCluster(o: { clusters: Array<{ slug: string; name: string; top_rival: { domain: string; pct: number } | null; competitors: string[] }>; busy: string | null }): string {
  const rows = o.clusters.filter((c) => c.top_rival)
  return panel(
    panelHead({ title: 'Rivals by cluster' }) +
      (!rows.length
        ? emptyRow('No rivals found in this range.')
        : `<ul class="divide-y divide-separator-border">${rows
            .slice(0, PAGE_SIZE)
            .map((c) => {
              const r = c.top_rival as { domain: string; pct: number }
              const tracked = c.competitors.some((x) => x.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() === r.domain.toLowerCase())
              const key = `${c.slug}|${r.domain}`
              return `<li class="grid grid-cols-[1fr_1.3fr_auto] items-center gap-3 px-5 py-3 text-caption-1-regular">
                <span class="truncate text-text-primary" title="${esc(c.name)}">${esc(c.name)}</span>
                <span class="truncate"><span class="font-medium text-text-primary">${esc(r.domain)}</span> <span class="text-text-secondary">${r.pct}%</span></span>
                ${tracked ? dchip('good', 'Tracked', { dot: true }) : dashButton(o.busy === key ? 'Saving…' : 'Track', { variant: 'outline', size: 'xs', disabled: o.busy === key, attrs: `data-track="${esc(c.slug)}|${esc(r.domain)}"` })}</li>`
            })
            .join('')}</ul>`),
  )
}

export function competitorAlerts(rangeDays = 30): string {
  const solid = trend.filter((p) => p.answers >= 1)
  let rows: Array<{ d: string; from: number; to: number }> = []
  if (solid.length >= 2) {
    const first = solid[0], last = solid[solid.length - 1]
    const pctOf = (p: typeof first, d: string) => p.sov_brands.find((b) => !b.own && b.domain === d)?.pct ?? 0
    const names = new Set<string>()
    for (const p of solid) for (const b of p.sov_brands) if (!b.own) names.add(b.domain)
    rows = [...names].map((d) => ({ d, from: pctOf(first, d), to: pctOf(last, d) })).sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
  }
  return panel(
    panelHead({ title: 'Competitor alerts', right: `<span>${rangeDays} day change</span>` }) +
      (!rows.length
        ? emptyRow('Not enough scans to compare rivals yet.')
        : `<ul class="divide-y divide-separator-border">${rows
            .slice(0, 6)
            .map((r) => {
              const delta = r.to - r.from
              const tone: Tone = delta > 0.2 ? 'bad' : delta < -0.2 ? 'good' : 'neutral'
              return `<li class="flex items-center gap-3 px-5 py-3">
                <span class="w-16 shrink-0">${dchip(tone, delta > 0.2 ? 'Rising' : delta < -0.2 ? 'Falling' : 'Steady', { dot: true })}</span>
                <div class="min-w-0"><p class="truncate text-body-medium text-text-primary">${esc(r.d)}</p><p class="text-caption-1-regular tabular-nums text-text-secondary">${r.from}% → ${r.to}% share over ${rangeDays} days</p></div></li>`
            })
            .join('')}</ul>`),
  )
}

export function newDomainsPanel(): string {
  return panel(
    panelHead({ title: 'New and rising domains', right: '<span>cited this window, ~none the one before</span>' }) +
      (!newDomains.length
        ? emptyRow('Nothing new entered the answers this window.')
        : `<ul class="divide-y divide-separator-border">${newDomains
            .slice(0, PAGE_SIZE)
            .map((d) => `<li class="flex items-center gap-3 px-5 py-3">
              ${domainLogo(d.domain, 18)}
              <a href="${siteHref(d.domain)}" target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 truncate text-body-medium text-text-primary hover:text-accent-600">${esc(d.domain)}</a>
              ${typeChip(d.type)}
              <span class="shrink-0 text-caption-1-regular tabular-nums text-text-secondary">${fmt(d.citations)} cites · ${d.prompts} prompts</span></li>`)
            .join('')}</ul>`),
  )
}

/* ── Your pages tab ──────────────────────────────────────────────────────── */
export function yourPagesTable(rows: UrlTableRow[], page: number): string {
  const { pages, cur, visible } = sliceFor(rows, page)
  const max = Math.max(1, ...rows.map((r) => r.citation_count))
  return panel(
    panelHead({ title: 'Your most cited pages', right: '<span>owned URLs, merged across www and utm variants</span>' }) +
      (!rows.length
        ? emptyRow('None of your pages were cited in this range.')
        : `<table class="w-full"><thead><tr><th scope="col" class="${th}">Page</th><th scope="col" class="${th} text-right">Citations</th><th scope="col" class="${th} text-right">Avg pos</th><th scope="col" class="${th} w-36 pr-4"></th></tr></thead>
          <tbody class="divide-y divide-separator-border">${visible
            .map((r) => {
              const host = r.domain.replace(/^www\./, '')
              return `<tr class="hover:bg-background-secondary-default">
                <td class="${td} max-w-0 "><a href="${r.url}" target="_blank" rel="noopener noreferrer" title="${esc(r.url)}" class="block truncate text-text-primary hover:text-accent-600 hover:underline">${esc(r.path && r.path !== '/' ? r.path : `${host}/`)}</a></td>
                <td class="${td} text-right text-body-medium tabular-nums text-text-primary">${fmt(r.citation_count)}</td>
                <td class="${td} text-right tabular-nums text-text-secondary">${r.avg_position != null ? fmtPos(r.avg_position) : '–'}</td>
                <td class="${td} pr-4">${meter((r.citation_count / max) * 100)}</td></tr>`
            })
            .join('')}</tbody></table>`) +
      pager('pages', cur, pages, rows.length, PAGE_SIZE, 'pages'),
    'overflow-hidden',
  )
}
