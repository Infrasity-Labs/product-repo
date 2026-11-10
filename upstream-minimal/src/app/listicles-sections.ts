/*
 * Sections of the Listicles page: port of main's `dash/listicles-sections.tsx` (stat cards, outreach pipeline, cluster tabs, listing-status
 * toggle, per-prompt listicle groups, pitch dialog) as HTML-string builders. State and wiring live in pages/listicles.ts.
 */
import { ri } from '../lib/icons'
import { closeButton, cx, esc, tabs } from './base'
import { dashButton, dchip, fmt, MONO, panel, panelHead, tip, toggle } from './dash-ui'
import { pager } from './dash-parts'
import type { ListiclePromptGroup, ListicleRow } from './listicles-data'
import { dialogShell } from './model-results-overlay'
import { domainTable } from './sources-data'
import { domainLogo, engineLogo, TYPE_LABEL } from './ui'

export const ROW_PAGE = 20

const domainType = (domain: string) => domainTable.find((d) => d.domain === domain)?.type ?? 'Other'
const siteHref = (domain: string) => `https://${domain.replace(/^https?:\/\//i, '')}`

/* ── Stat cards ─────────────────────────────────────────────────────────── */
export interface ListicleStatsData { listicle_citations: number; listicle_citations_caption: string; your_listicle_citations: number; your_listicle_citations_caption: string; listicles_tracked: number; listicles_tracked_clusters: number; not_listing_you: number }

function stat(o: { label: string; hint: string; value: string; foot: string; bad?: boolean }): string {
  return `<section class="${cx('flex flex-col overflow-hidden rounded-2xl border bg-background-full p-5', o.bad ? 'border-status-rose-text/30' : 'border-separator-border')}">
    ${tip(o.hint, `<span class="text-body-regular text-text-secondary">${o.label}</span>`, 'top')}
    <p class="mt-1.5 text-title-1-medium tabular-nums text-text-primary">${o.value}</p>
    <p class="mt-2 truncate text-caption-1-regular text-text-secondary">${esc(o.foot)}</p>
  </section>`
}

export function listicleStats(s: ListicleStatsData): string {
  return `<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    ${stat({ label: 'Listicle citations', hint: "Total citations across all listicle and 'best-of' pages cited by AI engines in this window", value: fmt(s.listicle_citations), foot: s.listicle_citations_caption })}
    ${stat({ label: 'Also cite you', hint: 'Citations where your brand was cited alongside or within these listicle pages', value: fmt(s.your_listicle_citations), foot: s.your_listicle_citations_caption })}
    ${stat({ label: 'Listicles tracked', hint: 'Distinct listicle URLs cited across all active clusters', value: fmt(s.listicles_tracked), foot: `across ${fmt(s.listicles_tracked_clusters)} cluster${s.listicles_tracked_clusters === 1 ? '' : 's'}` })}
    ${stat({ label: 'Not listing you', hint: 'Distinct listicle pages in your space that do not yet cite your brand — prime outreach targets', value: fmt(s.not_listing_you), foot: 'start here', bad: true })}
  </div>`
}

/* ── Outreach pipeline ──────────────────────────────────────────────────── */
export function outreachPipeline(toPitch: number, examples: string[]): string {
  const steps = [
    { label: 'To pitch', count: toPitch, sample: false, examples },
    { label: 'Pitched', count: 0, sample: true, examples: [] as string[] },
    { label: 'Replied', count: 0, sample: true, examples: [] as string[] },
    { label: 'Listed', count: 0, sample: true, examples: [] as string[] },
    { label: 'Cited by AI', count: 0, sample: true, examples: [] as string[] },
  ]
  return panel(
    panelHead({ title: 'Outreach pipeline', hint: "No CRM is connected yet — 'To pitch' reflects real pages that don't cite you; the stages after it have no tracking behind them yet", right: dchip('warn', 'Sample data') }) +
      `<div class="grid grid-cols-1 divide-y divide-separator-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">${steps
        .map((s) => `<div class="p-5">
          <p class="text-caption-1-regular text-text-secondary">${s.label}</p>
          <p class="mt-1 text-title-1-medium tabular-nums text-text-primary">${fmt(s.count)}</p>
          ${s.sample
            ? '<p class="mt-1.5 text-caption-1-regular text-text-tertiary">sample</p>'
            : s.examples.length > 0
              ? `<ul class="mt-2 space-y-1">${s.examples.map((d) => `<li class="flex items-center gap-1.5 truncate text-caption-1-regular text-text-secondary"><span class="shrink-0">${domainLogo(d, 14)}</span><span class="truncate">${esc(d)}</span></li>`).join('')}</ul>`
              : '<p class="mt-1.5 text-caption-1-regular text-text-tertiary">start here</p>'}
        </div>`)
        .join('')}</div>`,
    'overflow-hidden',
  )
}

/* ── Cluster tabs / listed filter ───────────────────────────────────────── */
export const clusterTabs = (list: Array<{ slug: string; name: string; missing_count: number }>, value: string): string =>
  tabs('lst-cluster', value, list.map((c) => ({ value: c.slug, label: esc(c.name), count: c.missing_count > 0 ? `${fmt(c.missing_count)}<span class="sr-only"> missing</span>` : undefined })), 'flex-wrap')

export type ListedFilter = 'all' | 'missing' | 'listed'
export const listedToggle = (value: ListedFilter, total: number, missing: number, listed: number): string =>
  toggle('lst-listed', value, [{ value: 'all', label: `All ${fmt(total)}` }, { value: 'missing', label: `Missing ${fmt(missing)}` }, { value: 'listed', label: `Lists you ${fmt(listed)}` }], 'Listing status')

/* ── Prompt group ───────────────────────────────────────────────────────── */
function listicleLine(r: ListicleRow, prompt: string, key: string): string {
  const typeLabel = TYPE_LABEL[domainType(r.domain)] ?? domainType(r.domain)
  const attrs = `data-pitch="${esc(key)}" data-url="${esc(r.url)}" data-prompt="${esc(prompt)}"`
  return `<li class="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-separator-border px-5 py-3 first:border-t-0 hover:bg-background-secondary-default">
    <span class="shrink-0">${domainLogo(r.domain, 20)}</span>
    <div class="min-w-0 flex-1 basis-64">
      <p class="truncate text-body-regular"><span class="font-semibold text-text-primary">${esc(r.domain)}</span> <span class="text-caption-1-regular text-text-secondary">${esc(typeLabel)}</span></p>
      <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.url)}" class="group inline-flex max-w-full items-center gap-1 text-caption-1-regular text-text-secondary hover:text-accent-600 hover:underline"><span class="truncate">${esc(r.url)}</span>${ri('RiExternalLinkLine', 'h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100')}</a>
    </div>
    <span class="w-[88px] shrink-0">${r.co_cited_with_you ? dchip('good', 'Lists you', { dot: true }) : dchip('bad', 'Missing', { dot: true })}</span>
    <span class="w-14 shrink-0 text-right text-body-regular tabular-nums text-text-primary">${fmt(r.citations)} <span class="text-text-secondary">cites</span></span>
    <span class="flex w-36 shrink-0 items-center gap-1.5 truncate text-caption-1-regular text-text-secondary" title="${esc(r.engines.join(', '))}">${r.engines.length
      ? r.engines.map((e, i) => `<span class="inline-flex items-center gap-1 truncate">${engineLogo(e, 11)}${esc(e)}${i < r.engines.length - 1 ? ',' : ''}</span>`).join('')
      : '<span class="text-text-tertiary">–</span>'}</span>
    <span class="flex w-[104px] shrink-0 justify-end">${r.co_cited_with_you
      ? dashButton('Keep fresh', { variant: 'ghost', size: 'xs', attrs })
      : dashButton('Pitch listing', { variant: 'solid', size: 'small', attrs })}</span>
  </li>`
}

export const groupKey = (g: ListiclePromptGroup) => `${g.cluster_slug}|${g.prompt}`

export function promptGroup(g: ListiclePromptGroup, o: { open: boolean; page: number }): string {
  const key = groupKey(g)
  const pages = Math.max(1, Math.ceil(g.listicles.length / ROW_PAGE))
  const cur = Math.min(o.page, pages)
  const rows = g.listicles.slice((cur - 1) * ROW_PAGE, cur * ROW_PAGE)
  return `<div data-group="${esc(key)}">${panel(
    `<button type="button" data-group-toggle aria-expanded="${o.open}" class="${cx('flex w-full items-start justify-between gap-4 bg-background-secondary-default px-5 py-4 text-left outline-none transition-colors hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring', o.open && 'border-b border-separator-border')}">
      <div class="min-w-0">
        <h3 class="text-body-semibold text-text-primary">${esc(g.prompt)}</h3>
        <p class="mt-0.5 text-caption-1-regular text-text-secondary">${esc(g.cluster_name)} · ${fmt(g.listicles.length)} listicles</p>
      </div>
      <span class="flex shrink-0 items-center gap-2">${g.missing_count > 0 ? dchip('bad', `${fmt(g.missing_count)} skip you`, { dot: true }) : ''}${ri('RiArrowDownSLine', cx('size-4 text-text-secondary transition-transform', o.open ? 'rotate-0' : '-rotate-90'))}</span>
    </button>` +
      (o.open ? `<ul>${rows.map((r) => listicleLine(r, g.prompt, key)).join('')}</ul>${pager(`lg:${key}`, cur, pages, g.listicles.length, ROW_PAGE, 'listicles')}` : ''),
    'overflow-hidden',
  )}</div>`
}

/* ── Pitch dialog (sample contacts + draft composer) ────────────────────── */
const SAMPLE_ROLES = [
  { role: 'Content Lead', first: 'Jordan', last: 'Avery' },
  { role: 'Editor / Partnerships', first: 'Sam', last: 'Rivera' },
  { role: 'SEO / Growth', first: 'Priya', last: 'Nair' },
]
function hashOf(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}
function sampleContacts(domain: string) {
  const h = hashOf(domain)
  return SAMPLE_ROLES.map((r, i) => ({
    name: `${r.first} ${r.last}`, role: r.role, email: `${r.first.toLowerCase()}@${domain}`, score: 60 + ((h >> (i * 4)) % 35), day: [1, 4, 9][i],
    linkedinSearch: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${r.role} ${domain}`)}`,
  }))
}

export type PitchChannel = 'email' | 'linkedin'
export type PitchIntent = 'add' | 'update' | 'data'
const PITCH_INTENT_LABEL: Record<PitchIntent, string> = { add: 'Add us to the list', update: 'Offer an update', data: 'Offer data or a quote' }

export function buildPitchDraft(row: ListicleRow, companyName: string, channel: PitchChannel, intent: PitchIntent): string {
  const ask = intent === 'add'
    ? `add ${companyName} to the list`
    : intent === 'update'
      ? `flag a couple of details on ${companyName}'s entry that could use an update`
      : 'share a short data point or quote that could strengthen the piece'
  if (channel === 'linkedin') return `Hi — I came across "${row.title}" (${row.domain}) and think ${companyName} would be a strong fit. Would you be open to a quick note on how we could ${ask}?`
  return [
    `Subject: Quick addition to "${row.title}"`, '', 'Hi,', '',
    `I came across your page "${row.title}" on ${row.domain} — great roundup. I work with ${companyName}, and wanted to see if we could ${ask}.`, '',
    "Happy to send over anything useful (positioning, pricing, a customer quote) — whatever's easiest on your end.", '',
    'Thanks for considering it!',
  ].join('\n')
}

const chipBtn = (on: boolean) => cx('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-caption-1-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring', on ? 'border-accent-200 bg-accent-50 text-accent-600' : 'border-border-button-default bg-background-full text-text-primary hover:bg-background-secondary-hover')
const sectionLabel = 'text-caption-1-medium text-text-secondary'

export interface PitchState { channel: PitchChannel; intent: PitchIntent; draft: string | null; copied: boolean }

export function pitchDialog(row: ListicleRow, prompt: string, st: PitchState): string {
  const contacts = sampleContacts(row.domain)
  const strategy = `${row.domain} is cited for ${prompt ? `"${prompt}"` : 'prompts like this one'} — ${row.co_cited_with_you ? 'you already show up alongside it, so the goal is to stay fresh or move up.' : `${(row.next_step ?? 'get included').toLowerCase()} and ask to be added, since you aren't cited alongside it yet.`}`
  return dialogShell({
    label: `Pitch ${row.domain}`, size: 'xl',
    children: `<div class="flex shrink-0 items-start gap-3 px-6">
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 class="text-title-3-medium text-text-primary"><span class="flex items-center gap-3">${domainLogo(row.domain, 28)}<span class="truncate">Pitch ${esc(row.domain)}</span></span></h2>
          <p class="mt-1 text-body-regular text-text-secondary"><span class="block truncate" title="${esc(row.title)}">${esc(row.title)}</span></p>
          <div class="flex flex-wrap items-center gap-2">
            ${row.co_cited_with_you ? dchip('good', 'Lists you', { dot: true }) : dchip('bad', 'Missing', { dot: true })}
            ${row.engines.map((e) => dchip('neutral', `${engineLogo(e, 11)}${esc(e)}`)).join('')}
            <a href="${siteHref(row.domain)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-caption-1-medium text-accent-600 hover:underline">Visit site${ri('RiExternalLinkLine', 'size-3')}</a>
          </div>
        </div>
        ${closeButton({ size: 'sm', label: 'Close', cls: '-me-1 shrink-0', attrs: 'data-overlay-close' })}
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col"><div data-lenis-prevent data-keep-scroll class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-2 text-body-regular text-text-secondary">
        <div class="space-y-6">
          <p class="rounded-xl bg-accent-50 p-4 text-body-regular text-text-primary">${esc(strategy)}</p>
          <section>
            <div class="flex items-center justify-between"><p class="${sectionLabel}">People to contact in order</p>${dchip('warn', 'Sample contacts')}</div>
            <ol class="mt-3 divide-y divide-separator-border rounded-xl border border-separator-border">${contacts
              .map((c, i) => `<li class="px-4 py-3">
                <div class="flex items-center gap-3"><span class="grid size-5 shrink-0 place-items-center rounded-full bg-text-primary text-caption-1-semibold text-text-white">${i + 1}</span><span class="min-w-0 flex-1 truncate text-body-medium text-text-primary">${esc(c.name)}</span>${dchip('neutral', `Score ${c.score}`)}</div>
                <p class="mt-1 pl-8 text-caption-1-regular text-text-secondary">${esc(c.role)}</p>
                <div class="mt-1 flex flex-wrap items-center gap-2 pl-8 text-caption-1-regular text-text-secondary"><span class="truncate ${MONO}">${esc(c.email)}</span><span aria-hidden="true">·</span>
                  <a href="${c.linkedinSearch}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-accent-600 hover:underline">${ri('RiLinkedinBoxLine', 'size-3.5')}LinkedIn</a><span aria-hidden="true">·</span><span>Day ${c.day}</span></div>
              </li>`)
              .join('')}</ol>
          </section>
          <section class="border-t border-separator-border pt-6">
            <p class="${sectionLabel}">Create a pitch</p>
            <div class="mt-3 flex gap-2">
              <button type="button" data-channel="email" class="${chipBtn(st.channel === 'email')}">${ri('RiMailLine', 'size-3.5')}Email</button>
              <button type="button" data-channel="linkedin" class="${chipBtn(st.channel === 'linkedin')}">${ri('RiLinkedinBoxLine', 'size-3.5')}LinkedIn DM</button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">${(Object.keys(PITCH_INTENT_LABEL) as PitchIntent[]).map((k) => `<button type="button" data-intent="${k}" class="${chipBtn(st.intent === k)}">${PITCH_INTENT_LABEL[k]}</button>`).join('')}</div>
            ${st.draft
              ? `<div class="relative mt-4"><textarea readonly rows="8" aria-label="Pitch draft" class="w-full resize-none rounded-xl border border-separator-border bg-background-secondary-default p-4 pr-20 text-body-regular text-text-primary outline-none">${esc(st.draft)}</textarea>${dashButton(st.copied ? 'Copied' : 'Copy', { variant: 'outline', size: 'xs', cls: 'absolute right-3 top-3', attrs: 'data-copy' })}</div>`
              : ''}
            <p class="mt-3 text-caption-1-regular text-text-tertiary">Drafted from this page's own data — the contact list above is illustrative, so send it to whoever you actually find.</p>
          </section>
        </div>
      </div></div>
      <div class="mt-2 flex shrink-0 flex-col-reverse gap-2 px-6 sm:flex-row sm:items-center sm:justify-end">${dashButton('Close', { variant: 'outline', size: 'medium', attrs: 'data-overlay-close' })}${dashButton('Create pitch', { variant: 'solid', size: 'medium', attrs: 'data-create' })}</div>`,
  })
}
