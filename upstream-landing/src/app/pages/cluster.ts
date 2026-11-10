/*
 * Cluster page — port of main's `src/components/geo/overview/cluster-page.tsx` + `dash/cluster-sections.tsx` (BoardUI design):
 * breadcrumb bar and filter bar, the cluster header (Manage prompts / Add prompts / actions menu), five KPI tiles, citation rate
 * over time beside prompt health and engine coverage, the searchable prompt map (15 per page, click a prompt for its popup),
 * who you compete with, pages that earn citations and what to do next. Untracked clusters show the "Not tracked yet" panel.
 * Reached from the sidebar's Clusters row (`params.cluster` = slug). Management dialogs live in ../cluster-manage.ts.
 */
import { ri } from '../../lib/icons'
import { cx } from '../base'
import { actions, BRAND, clusters, ENGINES, engineRows, kpis, prompts, type Cluster, type PromptRow } from '../data'
import { openAddPrompts, openDeleteCluster, openDeletePrompt, openEditDomains, openEditPrompt, openManagePrompts, countFor, originalOf, textsFor } from '../cluster-manage'
import { defaultFilter, clusterOptions, mountFilterBar, pageBar } from '../dash-header'
import { engineCell, pager, STATUS_META, wirePager } from '../dash-parts'
import { dashButton, dchip, fmt, fmtPct, fmtPos, meter, MONO, move, panel, panelHead } from '../dash-ui'
import { isRealChange, marginOfError } from '../geo-stats'
import { clusterTabs } from '../listicles-data'
import { popMenu, wirePopMenu, type MenuItem } from '../model-results-manage'
import { mountOverview, trendCard } from '../overview-cards'
import { openPromptDialog } from '../prompt-dialog'
import { domainLogo, engineLogo, esc } from '../ui'

export const meta = { id: 'cluster', label: 'Cluster', icon: 'RiStackLine', order: 5, hidden: true }

const PAGE_SIZE = 15
const UNTRACKED_PAGE = 15
const TH = 'h-10 whitespace-nowrap border-b border-separator-border bg-background-secondary-default px-3 text-left align-middle text-caption-1-medium font-medium text-text-secondary'
const ROW_DOMAIN_LOGO = '[&>span]:!rounded-[4px]'

/** Session toggle of each cluster's Auto-monitor (the page's menu changes it). */
const autoMonitor = new Map<string, boolean>()
const enabledOf = (c: Cluster) => autoMonitor.get(c.slug) ?? c.enabled

/** A cluster's scanned prompts after this session's edits (edited prompts keep their history; new ones have no scans yet). */
function rowsFor(slug: string): PromptRow[] {
  return textsFor(slug).flatMap((t) => {
    const base = prompts.find((p) => p.cluster_slug === slug && p.prompt === originalOf(slug, t))
    return base ? [{ ...base, prompt: t }] : []
  })
}

/* ------------------------------------------------------------------ header */
const clusterMenu = (c: Cluster): MenuItem[] => [
  { label: 'Manage prompts', action: 'manage', icon: ri('RiListUnordered', 'h-4 w-4') },
  { label: 'Add prompts', action: 'add', icon: ri('RiAddLine', 'h-4 w-4') },
  { label: 'Edit competitors', action: 'competitors', icon: ri('RiGroupLine', 'h-4 w-4') },
  { label: 'Edit target domains', action: 'targets', icon: ri('RiFocus2Line', 'h-4 w-4') },
  { label: enabledOf(c) ? 'Turn Auto-monitor off' : 'Turn Auto-monitor on', action: 'toggle', icon: ri('RiShutDownLine', 'h-4 w-4'), divider: true },
  { label: 'Delete cluster…', action: 'delete', icon: ri('RiDeleteBinLine', 'h-4 w-4'), danger: true, divider: true },
]

function header(c: Cluster | undefined): string {
  const tracked = clusters.filter((x) => x.tracked)
  const status = c ? (STATUS_META[c.status]?.label.toLowerCase() ?? c.status) : ''
  const actionsHtml = c
    ? `${dashButton('Manage prompts', { variant: 'outline', size: 'small', leadingIcon: 'RiSettings3Line', attrs: 'data-manage-prompts' })}${dashButton('Add prompts', { variant: 'solid', size: 'small', leadingIcon: 'RiAddLine', attrs: 'data-add-prompts' })}${popMenu(clusterMenu(c), `Actions for ${c.name}`)}`
    : ''
  return `<div class="space-y-2.5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <p class="text-caption-1-regular text-text-secondary"><a href="#" data-nav="overview" class="text-accent-700 hover:underline">Overview</a> / Cluster</p>
        <h1 class="mt-0.5 text-title-2-medium font-semibold leading-tight tracking-[-0.015em] text-text-primary">${esc(c?.name ?? 'Cluster')}</h1>
        ${c ? `<p class="mt-1 text-caption-1-regular text-text-secondary"><span class="tabular-nums">${fmt(countFor(c.slug))} prompts</span> &middot; <span class="tabular-nums">${fmt(c.answers)} prompts checked</span> &middot; status: ${esc(status)}</p>` : ''}
      </div>
      ${actionsHtml ? `<div class="flex flex-wrap items-center gap-2">${actionsHtml}</div>` : ''}
    </div>
    ${tracked.length > 1 ? `<nav aria-label="Clusters" class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">${tracked.map((x) => {
      const on = x.slug === c?.slug
      return `<a href="#" data-nav="cluster" data-cluster="${x.slug}" ${on ? 'aria-current="page"' : ''} class="${cx('shrink-0 rounded-full border px-3 py-1 text-caption-1-regular font-medium transition-colors', on ? 'border-accent-200 bg-accent-50 text-accent-700' : 'border-separator-border bg-background-full text-text-secondary hover:bg-background-secondary-default')}">${esc(x.name)}</a>`
    }).join('')}</nav>` : ''}
  </div>`
}

/* ------------------------------------------------------------------ KPIs */
function kpiCard(label: string, value: string, children: string, small = false): string {
  return panel(`<p class="text-caption-1-regular text-text-secondary">${label}</p>
    <div class="${cx('mt-1.5 flex items-baseline gap-1.5 font-semibold leading-none tracking-[-0.02em] tabular-nums text-text-primary', small ? 'text-title-3-medium' : 'text-title-1-medium')}">${value}</div>
    <div class="mt-1.5 text-caption-2-regular leading-[1.5] text-text-secondary">${children}</div>`, 'min-w-0 p-4')
}

function clusterKpis(c: Cluster): string {
  const prevAnswers = c.answers
  const prevCited = Math.round(((c.citation_rate - c.citation_rate_delta) / 100) * prevAnswers)
  const real = isRealChange(c.cited_answers, c.answers, prevCited, prevAnswers)
  const moe = marginOfError(c.cited_answers, c.answers)
  const listicles = clusterTabs.find((t) => t.slug === c.slug)
  return `<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
    ${kpiCard('Citation rate', `${fmtPct(c.citation_rate, 1)}${moe != null ? `<span class="text-caption-2-regular font-normal text-text-tertiary ${MONO}">&plusmn;${moe}</span>` : ''}`,
      `<span class="flex flex-wrap items-center gap-x-1.5 gap-y-1">${c.citation_rate_delta != null ? move(c.citation_rate_delta, ' pts') : ''}${real === true ? dchip('good', 'Real change', { dot: true }) : ''}${real === false ? dchip('neutral', 'Within noise') : ''}</span><span class="block tabular-nums">${fmt(c.cited_answers)} of ${fmt(c.answers)} prompts</span>`)}
    ${kpiCard('Share of voice', fmtPct(c.share_of_voice, 1), c.sov_rank ? `#${c.sov_rank} in this cluster` : 'No cited domains yet')}
    ${kpiCard('Avg position', fmtPos(c.avg_position), 'when cited')}
    ${kpiCard('Top rival', c.top_rival ? `<span class="truncate" title="${esc(c.top_rival.domain)}">${esc(c.top_rival.domain)}</span>` : '–', c.top_rival ? `${Math.round(c.top_rival.pct)}% share` : 'No rival cited yet', true)}
    ${kpiCard('Listicles skipping you', listicles ? fmt(listicles.missing_count) : '–', listicles ? `of ${fmt(listicles.listicle_count)} cited` : 'not available')}
  </div>`
}

/* ------------------------------------------------------------------ prompt health + engines */
const HEALTH = [
  { key: 'owned', label: 'Owned', cls: 'bg-status-lime-background text-status-lime-text', tone: 'good' as const },
  { key: 'weak', label: 'Cited, not first', cls: 'bg-status-yellow-background text-status-yellow-text', tone: 'warn' as const },
  { key: 'dropped', label: 'Dropped', cls: 'bg-status-rose-background text-status-rose-text', tone: 'bad' as const },
  { key: 'missing', label: 'Never cited', cls: 'bg-background-tertiary-default text-text-secondary', tone: 'neutral' as const },
]

function promptHealthPanel(rows: PromptRow[]): string {
  const counts: Record<string, number> = {}
  for (const p of rows) counts[p.status] = (counts[p.status] ?? 0) + 1
  const need = (counts.dropped ?? 0) + (counts.missing ?? 0)
  const body = !rows.length
    ? '<p class="text-caption-1-regular text-text-secondary">No prompts scanned in this range.</p>'
    : `<div class="flex h-8 gap-0.5 overflow-hidden rounded-lg" role="img" aria-label="${esc(HEALTH.map((h) => `${counts[h.key] ?? 0} ${h.label}`).join(', '))}">
        ${HEALTH.map((h) => (counts[h.key] ? `<span class="flex min-w-[26px] items-center justify-center text-caption-1-regular font-semibold tabular-nums ${h.cls}" style="flex-grow:${counts[h.key]}" title="${counts[h.key]} ${h.label}">${counts[h.key]}</span>` : '')).join('')}
      </div>
      <ul class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">${HEALTH.map((h) => `<li class="flex items-center gap-1.5 text-caption-1-regular text-text-secondary">${dchip(h.tone, h.label, { dot: true })}<span class="tabular-nums">${counts[h.key] ?? 0}</span></li>`).join('')}</ul>
      <p class="mt-3 text-caption-1-regular text-text-secondary">${need ? `${need} prompt${need === 1 ? '' : 's'} need attention: ${counts.dropped ?? 0} dropped, ${counts.missing ?? 0} never cited.` : 'Every prompt in this cluster is being cited.'}</p>`
  return panel(`${panelHead({ title: 'Prompt health', right: `<span>${rows.length} prompts</span>` })}<div class="px-5 pb-4">${body}</div>`)
}

/** Whether an engine has too few answers to read a rate from (the app's `isLowData`). */
const isLowData = (answers: number, total: number) => answers < Math.max(30, total * 0.03)

function enginesInCluster(c: Cluster, rows: PromptRow[]): string {
  const total = Math.max(1, rows.length)
  const list = ENGINES.map((engine) => {
    const ran = rows.filter((p) => p.by_engine.some((e) => e.engine === engine && e.answers > 0))
    const cited = ran.filter((p) => p.by_engine.some((e) => e.engine === engine && e.cited_answers > 0))
    const info = engineRows.find((e) => e.engine === engine)
    const low = info ? isLowData(Math.round((info.answers * c.answers) / kpis.answers), c.answers) : ran.length === 0
    return `<li class="grid grid-cols-[140px_1fr_auto] items-center gap-3 text-caption-1-regular">
      <span class="flex items-center gap-1.5 text-text-secondary">${engineLogo(engine, 14)}${engine}</span>
      ${low ? '<span></span>' : meter((cited.length / total) * 100, 'indigo', 'bg-background-secondary-default')}
      ${low ? dchip('warn', 'Low data', { dot: true }) : `<span class="w-12 text-right tabular-nums text-text-secondary">${cited.length}/${ran.length}</span>`}
    </li>`
  }).join('')
  return panel(`${panelHead({ title: 'Engines in this cluster' })}<ul class="space-y-2.5 px-5 pb-4">${list}</ul>`)
}

/* ------------------------------------------------------------------ prompt map */
const rowMenu = (): MenuItem[] => [
  { label: 'Edit prompt', action: 'edit-prompt', icon: ri('RiPencilLine', 'h-4 w-4') },
  { label: 'Delete prompt…', action: 'delete-prompt', icon: ri('RiDeleteBinLine', 'h-4 w-4'), danger: true, divider: true },
]

interface MapState { q: string; page: number }

function mapBody(rows: PromptRow[], st: MapState): string {
  const s = st.q.trim().toLowerCase()
  const filtered = s ? rows.filter((p) => p.prompt.toLowerCase().includes(s)) : rows
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const cur = Math.min(st.page, pages)
  const shown = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  if (!shown.length) return `<p class="px-5 pb-5 text-caption-1-regular text-text-secondary">${rows.length ? 'No prompts match your search.' : 'No prompts scanned in this range yet.'}</p>`
  const body = shown.map((p) => {
    const stt = STATUS_META[p.status]
    const moe = marginOfError(p.cited_answers, p.answers)
    return `<tr data-open-prompt="${esc(p.prompt)}" class="cursor-pointer border-b border-separator-border transition-colors last:border-b-0 hover:bg-background-secondary-default">
      <td class="align-middle min-w-[300px] max-w-[560px] whitespace-normal py-3 pl-5 pr-3">
        <button type="button" data-open-prompt="${esc(p.prompt)}" class="text-left text-body-2-regular font-medium leading-snug text-text-primary outline-none hover:text-accent-700 focus-visible:underline">${esc(p.prompt)}</button>
        <p class="mt-0.5 text-caption-2-regular capitalize text-text-secondary">${p.intent} &middot; ${fmt(p.answers)} prompts checked</p>
      </td>
      <td class="align-middle px-3 py-3">${dchip(stt.tone, stt.label, { dot: true })}</td>
      <td class="align-middle px-3 py-3 text-right tabular-nums"><span class="text-body-2-regular font-medium text-text-primary">${fmtPct(p.citation_rate, 1)}</span>${moe != null ? `<span class="ml-1 text-caption-2-regular text-text-tertiary ${MONO}">&plusmn;${moe}</span>` : ''}</td>
      <td class="align-middle whitespace-nowrap px-3 py-3 text-right tabular-nums"><span class="text-body-2-regular text-text-primary">${fmtPos(p.current_rank)}</span>${p.rank_delta ? move(p.rank_delta, '', 'up', false, 'ml-1.5 text-caption-2-regular') : ''}</td>
      ${ENGINES.map((e) => `<td class="align-middle px-2 py-3 text-center">${engineCell(p, e)}</td>`).join('')}
      <td class="align-middle px-3 py-3 text-caption-1-regular text-text-secondary">${p.most_cited_domain ? `<span class="${cx('inline-flex items-center gap-1.5', p.most_cited_domain.is_you && 'font-medium text-accent-600')}"><span class="inline-flex ${ROW_DOMAIN_LOGO}">${domainLogo(p.most_cited_domain.domain, 14, p.most_cited_domain.is_you)}</span>${esc(p.most_cited_domain.domain)}</span>` : '–'}</td>
      <td class="align-middle py-3 pr-3">${popMenu(rowMenu(), 'Prompt actions', p.prompt)}</td>
    </tr>`
  }).join('')
  return `<div class="relative w-full overflow-x-auto"><table class="w-full caption-bottom border-collapse text-caption-1-regular min-w-[1100px]">
      <thead><tr class="hover:bg-transparent">
        <th class="${TH} min-w-[300px] pl-5">Prompt</th><th class="${TH}">Status</th><th class="${TH} text-right">Cited</th><th class="${TH} text-right">Rank</th>
        ${ENGINES.map((e) => `<th class="${TH} text-center" title="${e}"><span class="inline-flex items-center gap-1">${engineLogo(e, 12)}<span class="hidden xl:inline">${e}</span></span></th>`).join('')}
        <th class="${TH}">Most cited</th><th class="${TH} w-8 pr-3"><span class="sr-only">Actions</span></th>
      </tr></thead><tbody>${body}</tbody></table></div>${pager('map', cur, pages, filtered.length, PAGE_SIZE, 'prompts')}`
}

function promptMap(rows: PromptRow[], st: MapState): string {
  const search = `<label class="relative hidden sm:block"><span class="sr-only">Search prompts</span>${ri('RiSearchLine', 'pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary')}<input data-map-q value="${esc(st.q)}" placeholder="Search prompts" class="h-7 w-44 rounded-md border border-separator-border bg-background-full pl-7 pr-2 text-caption-1-regular text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"/></label>`
  return panel(`${panelHead({ title: 'Prompt map', right: `${search}<span>click a prompt to open it &middot; numbers in engine cells are positions</span>` })}<div data-map-body>${mapBody(rows, st)}</div>`, 'overflow-hidden')
}

/* ------------------------------------------------------------------ insight panels */
function competePanel(rows: PromptRow[]): string {
  const sum = new Map<string, { pct: number; you: boolean }>()
  for (const p of rows) for (const d of p.domain_shares) { const e = sum.get(d.domain) ?? { pct: 0, you: d.is_you }; e.pct += d.pct; sum.set(d.domain, e) }
  const n = Math.max(1, rows.length)
  const list = [...sum.entries()].map(([domain, e]) => ({ domain, pct: Math.round((e.pct / n) * 10) / 10, you: e.you })).sort((a, b) => b.pct - a.pct).slice(0, 8)
  const max = Math.max(1, ...list.map((r) => r.pct))
  const body = !list.length
    ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No citations in this range yet.</p>'
    : `<ul class="space-y-2.5 px-5 pb-4">${list.map((r) => `<li class="grid grid-cols-[minmax(110px,150px)_1fr_auto] items-center gap-3 text-caption-1-regular">
        <span class="${cx('flex min-w-0 items-center gap-2', r.you ? 'font-semibold text-accent-600' : 'text-text-secondary')}"><span class="inline-flex [&>span]:!rounded-[5px]">${domainLogo(r.domain, 16, r.you)}</span><span class="truncate">${esc(r.domain)}</span></span>
        ${meter((r.pct / max) * 100, r.you ? 'indigo' : 'slate', 'bg-background-secondary-default')}
        <span class="w-10 text-right tabular-nums text-text-secondary">${r.pct}%</span></li>`).join('')}</ul>`
  return panel(`${panelHead({ title: 'Who you compete with here', right: '<span>avg share per prompt</span>' })}${body}`, 'flex flex-col')
}

function sourcesPanel(rows: PromptRow[]): string {
  const m = new Map<string, { label: string; domain: string; n: number }>()
  for (const p of rows) {
    if (!p.top_source) continue
    const label = p.top_source.url.replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '')
    const e = m.get(label) ?? { label, domain: p.top_source.domain, n: 0 }
    e.n++; m.set(label, e)
  }
  const list = [...m.values()].sort((a, b) => b.n - a.n).slice(0, 8)
  const own = (d: string) => d === BRAND.domain || d.endsWith(`.${BRAND.domain}`)
  const body = !list.length
    ? '<p class="px-5 pb-4 text-caption-1-regular text-text-secondary">No sources recorded yet.</p>'
    : `<ul class="space-y-2.5 px-5 pb-4">${list.map((r) => `<li class="flex items-center justify-between gap-3 text-caption-1-regular"><a href="https://${esc(r.label)}" target="_blank" rel="noopener noreferrer" title="${esc(r.label)}" class="${cx('min-w-0 truncate hover:underline', own(r.domain) ? 'font-semibold text-accent-600' : 'text-text-secondary')}">${esc(r.label)}</a><span class="shrink-0 tabular-nums text-text-secondary">${r.n}</span></li>`).join('')}</ul>`
  return panel(`${panelHead({ title: 'Pages that earn citations', right: '<span>top source per prompt</span>' })}${body}`, 'flex flex-col')
}

function nextPanel(c: Cluster, rows: PromptRow[]): string {
  const kind = (t: string) => (t === 'data_fix' ? { label: 'Fix', tone: 'warn' as const } : t === 'setup' ? { label: 'Setup', tone: 'neutral' as const } : { label: 'Action', tone: 'accent' as const })
  const mine = actions.filter((a) => a.tags.includes(c.name))
  const todo = mine.filter((a) => a.type !== 'setup').slice(0, 3)
  const missing = rows.filter((p) => p.status === 'missing').length
  const skip = clusterTabs.find((t) => t.slug === c.slug)
  const li = (inner: string, cls = 'py-3') => `<li class="flex items-start gap-2.5 ${cls}">${inner}</li>`
  const items = [
    ...todo.map((a) => li(`${dchip(kind(a.type).tone, kind(a.type).label, { dot: true, cls: 'mt-0.5' })}<div class="min-w-0"><a href="#" class="text-body-2-regular font-semibold leading-snug text-text-primary hover:text-accent-700">${esc(a.title)}</a><p class="mt-0.5 text-caption-1-regular leading-[1.5] text-text-secondary">${esc(a.detail)}</p></div>`, 'py-3 first:pt-1')),
    skip && skip.missing_count > 0 ? li(`${dchip('bad', 'Listicles', { dot: true, cls: 'mt-0.5' })}<div><p class="text-body-2-regular font-semibold text-text-primary">${fmt(skip.missing_count)} listicles skip you</p><a href="#" data-nav="listicles" class="text-caption-1-regular font-medium text-accent-700 hover:underline">Open the pitch list &rarr;</a></div>`) : '',
    missing > 0 ? li(`${dchip('warn', 'Missing', { dot: true, cls: 'mt-0.5' })}<div><p class="text-body-2-regular font-semibold text-text-primary">${missing} prompt${missing === 1 ? '' : 's'} never cite you</p><p class="mt-0.5 text-caption-1-regular leading-[1.5] text-text-secondary">Start with the one with the most prompts checked in the prompt map.</p></div>`) : '',
    !todo.length && !missing && !(skip && skip.missing_count > 0) ? '<li class="py-3 text-caption-1-regular text-text-secondary">Nothing to do right now.</li>' : '',
  ].join('')
  return panel(`${panelHead({ title: 'Next for this cluster' })}<ul class="divide-y divide-separator-border px-5 pb-1">${items}</ul>`, 'flex flex-col', 'next-actions')
}

/* ------------------------------------------------------------------ untracked */
function untrackedPanel(c: Cluster, page: number): string {
  const list = textsFor(c.slug)
  const pages = Math.max(1, Math.ceil(list.length / UNTRACKED_PAGE))
  const cur = Math.min(page, pages)
  const enabled = enabledOf(c)
  const why = !list.length ? 'This cluster has no prompts yet, so there is nothing to scan.' : enabled ? 'No answers have been collected for it yet.' : `Tracking is off, so its ${fmt(list.length)} prompts are not being scanned.`
  const rows = list.slice((cur - 1) * UNTRACKED_PAGE, cur * UNTRACKED_PAGE).map((t) => `<tr class="border-b border-separator-border last:border-b-0">
      <td class="align-middle whitespace-normal py-3 pl-5 pr-3 text-body-2-regular font-medium leading-snug text-text-secondary">${esc(t)}</td>
      <td class="align-middle w-[120px] px-3 py-3">${dchip('neutral', enabled ? 'Not scanned yet' : 'Tracking off', { dot: true })}</td>
      <td class="align-middle w-10 py-3 pr-3">${popMenu(rowMenu(), 'Prompt actions', t)}</td></tr>`).join('')
  return panel(`${panelHead({ title: 'Not tracked yet', right: `<span class="text-caption-1-regular tabular-nums text-text-secondary">${fmt(list.length)} prompts</span>` })}
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-separator-border bg-accent-50/50 px-5 py-3">
      <p class="text-body-2-regular text-text-secondary">${why}${list.length > 0 && !enabled ? ' Turn it on to start collecting answers and see citation rate, share and rank here.' : ''}</p>
      ${list.length > 0 && !enabled ? dashButton('Turn tracking on', { variant: 'solid', size: 'small', attrs: 'data-turn-on' }) : ''}
    </div>
    ${list.length > 0 ? `<div class="relative w-full overflow-x-auto"><table class="w-full caption-bottom border-collapse text-caption-1-regular"><tbody>${rows}</tbody></table></div>` : ''}
    ${pager('untracked', cur, pages, list.length, UNTRACKED_PAGE, 'prompts')}`)
}

/* ------------------------------------------------------------------ page */
function content(c: Cluster | undefined, ms: MapState, upage: number): string {
  if (!c) return '<div class="rounded-2xl border border-dashed border-border-button-default bg-background-full p-8 text-center text-body-2-regular text-text-secondary">We couldn&apos;t find this cluster. <a href="#" data-nav="overview" class="font-medium text-accent-700 hover:underline">Back to the overview</a>.</div>'
  const tracked = c.tracked && enabledOf(c)
  if (!c.tracked && c.answers === 0) return untrackedPanel(c, upage)
  if (!tracked && c.answers > 0) {
    return `<div class="rounded-xl border border-status-yellow-text/30 bg-status-yellow-background px-4 py-3 text-caption-1-regular text-status-yellow-text">Tracking is off for this cluster, so no new scans are running. These numbers come from its earlier scans. Use the cluster menu to turn Auto-monitor on.</div>${body(c, ms)}`
  }
  return body(c, ms)
}

function body(c: Cluster, ms: MapState): string {
  const rows = rowsFor(c.slug)
  return `<div class="space-y-5">
    ${clusterKpis(c)}
    <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.75fr_1fr]">
      ${trendCard()}
      <div class="space-y-5">${promptHealthPanel(rows)}${enginesInCluster(c, rows)}</div>
    </div>
    ${promptMap(rows, ms)}
    <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">${competePanel(rows)}${sourcesPanel(rows)}${nextPanel(c, rows)}</div>
  </div>`
}

const slugOf = (params?: Record<string, string>) => params?.cluster ?? [...clusters].filter((c) => c.tracked && c.answers > 0).sort((a, b) => b.citation_rate - a.citation_rate || b.answers - a.answers)[0]?.slug ?? 'llm-observability'

export function html(params?: Record<string, string>): string {
  const slug = slugOf(params)
  const c = clusters.find((x) => x.slug === slug)
  return `<div class="bg-background-secondary-default text-body-2-regular text-text-primary antialiased" data-cluster="${esc(slug)}">
    ${pageBar('Cluster')}
    <div data-cl-filters></div>
    <main class="mx-auto max-w-[1760px] space-y-5 px-4 pb-10 pt-5 sm:px-6">
      <div data-cl-header>${header(c)}</div>
      <div data-cl-body class="space-y-5">${content(c, { q: '', page: 1 }, 1)}</div>
    </main>
  </div>`
}

/** Opens a page of the app window (the shell swaps pages on any `[data-nav]` click). */
function navigate(root: HTMLElement, id: string, params: Record<string, string> = {}): void {
  const a = document.createElement('a')
  a.dataset.nav = id
  Object.assign(a.dataset, params)
  a.hidden = true
  root.appendChild(a)
  a.click()
  a.remove()
}

export function mount(root: HTMLElement, params?: Record<string, string>): void {
  const slug = slugOf(params)
  const c = clusters.find((x) => x.slug === slug)
  const ms: MapState = { q: '', page: 1 }
  let upage = 1
  const head = root.querySelector<HTMLElement>('[data-cl-header]') as HTMLElement
  const main = root.querySelector<HTMLElement>('[data-cl-body]') as HTMLElement

  const redraw = () => {
    head.innerHTML = header(c)
    main.innerHTML = content(c, ms, upage)
    mountOverview(root)
  }
  const redrawMap = () => {
    if (!c) return
    const host = main.querySelector<HTMLElement>('[data-map-body]')
    if (host) host.innerHTML = mapBody(rowsFor(slug), ms)
  }

  const bar = root.querySelector<HTMLElement>('[data-cl-filters]')
  if (bar) {
    mountFilterBar(bar, {
      value: defaultFilter({ cluster: slug }), clusters: clusterOptions(), engines: [...ENGINES], issues: clusters.some((x) => !x.tracked) ? 1 : 0,
      onChange: (v) => { if (v.cluster !== slug) { if (v.cluster === 'all') navigate(root, 'overview'); else navigate(root, 'cluster', { cluster: v.cluster }) } },
    })
  }

  wirePager(root, 'map', (p) => { ms.page = p; redrawMap() })
  wirePager(root, 'untracked', (p) => { upage = p; redraw() })
  wirePopMenu(root, (action, btn) => {
    if (!c) return
    const prompt = btn.dataset.popmenuId
    if (prompt != null) {
      if (action === 'edit-prompt') openEditPrompt(slug, prompt, () => redraw())
      else if (action === 'delete-prompt') openDeletePrompt(slug, prompt, () => redraw())
      return
    }
    if (action === 'manage') openManagePrompts(slug, redraw, () => openAddPrompts(slug, redraw))
    else if (action === 'add') openAddPrompts(slug, redraw)
    else if (action === 'competitors') openEditDomains(slug, 'competitors', redraw)
    else if (action === 'targets') openEditDomains(slug, 'targets', redraw)
    else if (action === 'toggle') { autoMonitor.set(slug, !enabledOf(c)); redraw() }
    else if (action === 'delete') openDeleteCluster(slug, () => navigate(root, 'overview'))
  })

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    if (t.dataset.mapQ != null) { ms.q = t.value; ms.page = 1; redrawMap() }
  })
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-manage-prompts]')) { openManagePrompts(slug, redraw, () => openAddPrompts(slug, redraw)); return }
    if (t.closest('[data-add-prompts]')) { openAddPrompts(slug, redraw); return }
    if (t.closest('[data-turn-on]') && c) { autoMonitor.set(slug, true); redraw(); return }
    if (t.closest('[data-export]')) { exportCsv(slug); return }
    const row = t.closest<HTMLElement>('[data-open-prompt]')
    if (row && !t.closest('[data-popmenu]')) openPromptDialog({ cluster: slug, prompt: row.dataset.openPrompt as string, origin: row })
  })

  mountOverview(root)
}

function exportCsv(slug: string): void {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Prompt', 'Status', 'Intent', 'Prompts checked', 'Citation rate %', 'Rank', 'Most cited']
  const lines = rowsFor(slug).map((p) => [p.prompt, p.status, p.intent, p.answers, p.citation_rate, p.current_rank, p.most_cited_domain?.domain ?? ''].map(q).join(','))
  const blob = new Blob([[head.map(q).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `geo-${slug}-prompts-30d.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
