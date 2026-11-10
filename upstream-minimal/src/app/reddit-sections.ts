/* Sections of the Reddit page: port of main's `dash/reddit-sections.tsx` (stat strip, trend, cited-threads table, subreddits panel) as HTML-string builders. */
import { ri } from '../lib/icons'
import { esc } from './base'
import * as charts from './charts'
import type { LineSeries } from './charts'
import { dashButton, dchip, fmt, meter, MONO, panel, panelHead } from './dash-ui'
import { pager } from './dash-parts'
import type { RedditThreadRow } from './reddit-data'
import { redditTrend } from './reddit-data'
import { ENGINE_META } from './ui'

export const PAGE_SIZE = 20
const th = 'whitespace-nowrap border-b border-separator-border px-4 py-3 text-left text-caption-1-medium text-text-secondary'
const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export interface RedditStatsData { threads_cited: number; threads_cited_caption: string; total_citations: number; total_citations_caption: string; mention_rate_pct: number | null; mention_rate_caption: string; top_share_pct: number | null; top_subreddit_caption: string }

/* ── Stat strip ──────────────────────────────────────────────────────────── */
const stat = (label: string, value: string, caption: string) => panel(`<p class="text-caption-1-regular text-text-secondary">${label}</p>
  <p class="mt-1.5 text-title-1-medium tabular-nums text-text-primary">${value}</p>
  <p class="mt-1.5 truncate text-caption-1-regular text-text-secondary">${esc(caption)}</p>`, 'p-5')

export function redditStats(s: RedditStatsData): string {
  return `<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    ${stat('Threads cited', fmt(s.threads_cited), s.threads_cited_caption)}
    ${stat('Citations', fmt(s.total_citations), s.total_citations_caption)}
    ${stat('You are mentioned', s.mention_rate_pct == null ? '–' : `${s.mention_rate_pct}%`, s.mention_rate_caption)}
    ${stat('Top thread share', s.top_share_pct == null ? '–' : `${s.top_share_pct}%`, s.top_subreddit_caption)}
  </div>`
}

/* ── Threads cited vs mentions over time ─────────────────────────────────── */
export function redditTrendPanel(): string {
  const days = redditTrend.map((t) => dayLabel(t.date))
  const series: LineSeries[] = [
    { id: 'Threads cited (cumulative %)', color: '#4f46e5', points: redditTrend.map((t) => ({ x: dayLabel(t.date), y: t.threads_cited_pct, answers: 0 })) },
    { id: 'Mention rate %', color: '#c9704f', points: redditTrend.filter((t) => t.mention_rate_pct != null).map((t) => ({ x: dayLabel(t.date), y: t.mention_rate_pct as number, answers: 0 })) },
  ]
  const empty = series.every((s) => s.points.length < 2)
  return panel(
    panelHead({ title: 'Threads cited vs mentions over time', hint: 'Cumulative distinct threads cited, and cumulative mention rate among checked threads' }) +
      `<div class="px-5 pb-5 pt-4">${empty
        ? '<p class="py-10 text-center text-caption-1-regular text-text-secondary">Not enough scans in this range to draw a trend yet.</p>'
        : `<div class="h-[250px] w-full ${MONO}">${charts.multiLine({ series, days, fmt: (n) => `${Math.round(n)}%`, yMin: 0, yMax: 100 })}</div>
          <div class="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-caption-1-regular text-text-primary">${series.map((s) => `<span class="inline-flex items-center gap-1.5"><span class="h-0.5 w-3 rounded-full" style="background:${s.color}"></span>${esc(s.id)}</span>`).join('')}</div>`}</div>`,
  )
}

/* ── Cited threads ───────────────────────────────────────────────────────── */
function engineDots(engines: Record<string, number>): string {
  const present = Object.entries(engines).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  if (!present.length) return '<span class="text-text-tertiary">–</span>'
  return `<ul class="space-y-0.5">${present.map(([e, n]) => `<li class="flex items-center gap-1.5 text-caption-1-regular text-text-primary"><span class="h-1.5 w-1.5 rounded-full" style="background:${ENGINE_META[e]?.color ?? '#a3a3a3'}"></span>${esc(e)}<span class="tabular-nums text-text-secondary">${n}</span></li>`).join('')}</ul>`
}

const mentionChip = (m: boolean | null) => (m === true ? dchip('good', 'Mentioned', { dot: true }) : m === false ? dchip('bad', 'Not yet', { dot: true }) : dchip('neutral', 'Not checked', { dot: true }))

export const matchesThread = (r: RedditThreadRow, needle: string) => r.title.toLowerCase().includes(needle) || r.subreddit.toLowerCase().includes(needle) || r.url.toLowerCase().includes(needle)

/** Table + pager + "not mentioned" note (re-rendered on search / page). */
export function threadsBody(o: { threads: RedditThreadRow[]; q: string; page: number; notMentionedTop10: number }): string {
  const needle = o.q.trim().toLowerCase()
  const filtered = needle ? o.threads.filter((r) => matchesThread(r, needle)) : o.threads
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const cur = Math.min(o.page, pages)
  const rows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  const table = !rows.length
    ? `<p class="px-5 py-10 text-center text-caption-1-regular text-text-secondary">${o.threads.length ? 'No threads match your search.' : 'No Reddit threads were cited in this window.'}</p>`
    : `<div class="overflow-x-auto"><table class="w-full min-w-[760px]">
        <thead><tr>
          <th scope="col" class="${th} w-12">#</th><th scope="col" class="${th}">Thread</th><th scope="col" class="${th} text-right">Cites</th>
          <th scope="col" class="${th}">Engines</th><th scope="col" class="${th}">You</th><th scope="col" class="${th}"><span class="sr-only">Action</span></th>
        </tr></thead>
        <tbody class="divide-y divide-separator-border">${rows
          .map((r, i) => `<tr class="hover:bg-background-secondary-default">
            <td class="px-4 py-3 tabular-nums text-text-secondary">${(cur - 1) * PAGE_SIZE + i + 1}</td>
            <td class="px-4 py-3"><a href="${r.url}" target="_blank" rel="noopener noreferrer" class="group block min-w-0 max-w-[420px]" title="${esc(r.title)}">
              <span class="flex items-center gap-1 text-body-semibold text-text-primary group-hover:text-accent-600">${ri('RiRedditLine', 'h-3.5 w-3.5 shrink-0 text-text-tertiary')}r/${esc(r.subreddit)}${ri('RiExternalLinkLine', 'h-3 w-3 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100')}</span>
              <span class="mt-0.5 block truncate text-caption-1-regular text-text-secondary">${esc(r.title)}</span></a></td>
            <td class="px-4 py-3 text-right tabular-nums"><span class="text-body-medium text-text-primary">${fmt(r.citations)}</span><span class="block text-caption-1-regular text-text-secondary">${r.share_pct}%</span></td>
            <td class="px-4 py-3">${engineDots(r.engines)}</td>
            <td class="px-4 py-3">${mentionChip(r.mentioned)}</td>
            <td class="px-4 py-3 text-right">${dashButton(r.mentioned === true ? 'Monitor' : 'Draft reply', { variant: r.mentioned === true ? 'outline' : 'solid', size: 'small', attrs: `data-engage="${esc(r.url)}"` })}</td>
          </tr>`)
          .join('')}</tbody></table></div>`
  return `${table}${o.notMentionedTop10 > 0 ? `<p class="border-t border-separator-border bg-status-yellow-background px-5 py-3 text-caption-1-regular text-status-yellow-text">${o.notMentionedTop10} of the top 10 threads don't mention you.</p>` : ''}${pager('threads', cur, pages, filtered.length, PAGE_SIZE, 'threads')}`
}

export function threadsTable(o: { threads: RedditThreadRow[]; q: string; page: number; notMentionedTop10: number }): string {
  const search = `<label class="relative hidden sm:block"><span class="sr-only">Search threads</span>${ri('RiSearchLine', 'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary')}
    <input data-th-q value="${esc(o.q)}" placeholder="Search threads, subreddits" class="h-8 w-56 rounded-lg border border-border-button-default bg-background-full pl-9 pr-3 text-body-regular text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-600 focus-visible:ring-2 focus-visible:ring-border-focus-ring/20" /></label>
    <span>ranked by citation volume</span>`
  return panel(panelHead({ title: 'Cited threads', right: search }) + `<div data-th-body>${threadsBody(o)}</div>`, 'overflow-hidden')
}

/* ── Subreddits that matter ──────────────────────────────────────────────── */
export interface SubredditRow { subreddit: string; threads_in_top10: number; threads_tracked: number; total_citations: number; share_pct: number }

export function subredditsPanel(all: SubredditRow[]): string {
  const subs = all.slice(0, 10)
  const max = Math.max(1, ...subs.map((s) => s.total_citations))
  return panel(
    panelHead({ title: 'Subreddits that matter', hint: 'Rolled up from the cited threads, grouped by subreddit' }) +
      (!subs.length
        ? '<p class="px-5 py-8 text-center text-caption-1-regular text-text-secondary">No Reddit citations in this window yet.</p>'
        : `<ul class="divide-y divide-separator-border px-5 pb-2">${subs
            .map((s) => `<li class="py-3">
              <div class="flex items-center justify-between gap-3"><span class="truncate text-body-medium text-text-primary">r/${esc(s.subreddit)}</span><span class="w-9 shrink-0 text-right text-body-regular tabular-nums text-text-primary">${fmt(s.total_citations)}</span></div>
              ${meter((s.total_citations / max) * 100, 'indigo', 'mt-1.5')}
              <p class="mt-1 text-caption-1-regular tabular-nums text-text-secondary">${fmt(s.threads_tracked)} thread${s.threads_tracked === 1 ? '' : 's'} &middot; ${s.share_pct}% of cites &middot; ${fmt(s.threads_in_top10)} in top 10</p></li>`)
            .join('')}</ul>`),
    'self-start',
  )
}

/** Cited-threads card on its own (static first page). */
export const redditThreadsPanel = (threads: RedditThreadRow[], notMentionedTop10: number) => threadsTable({ threads, q: '', page: 1, notMentionedTop10 })
