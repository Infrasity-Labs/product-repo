/*
 * "Model results" — port of main's `src/components/geo/overview/model-results.tsx` (the per-engine tables on a
 * cluster page, BoardUI tokens), plus the answer modal (`chats/prompt-chat-modal.tsx` → `../chat-modal.ts`) and the
 * result modal (`ResultDetailPanel`, a BoardUI Modal). Reusable: `modelResultsCard(slug)` + `mountModelResults(root)`.
 */
import { ri } from '../../lib/icons'
import { ENGINES } from '../data'
import { chatModalHtml, wireAnswerBody } from '../chat-modal'
import { chatFor, resultsByModel, type DayStatus, type PromptResult } from '../model-results-data'
import { dialogShell, openOverlay, type Overlay } from '../model-results-overlay'
import { closeButton } from '../base'
import { cx, ENGINE_META, engineLogo, esc } from '../ui'

export const meta = { id: 'model-results', label: 'Model results', icon: 'ChatsCircle', order: 15, hidden: true }

/* ------------------------------------------------------------------ formatting helpers */
const shortDate = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatToParts(new Date(iso))
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${g('day')} ${g('month')}, ${g('year')}`
}
const dayKey = (key: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`))
const historyDay = (k: string) => new Date(`${k}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const historyRange = (keys: string[]) => (keys.length > 1 ? `${historyDay(keys[0])} – ${historyDay(keys[keys.length - 1])}` : historyDay(keys[0]))
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u.replace(/^https?:\/\//, '').split('/')[0] } }
const normUrl = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')

interface Mention { url: string; position: string | null }
function parseMention(entry: string): Mention {
  const lines = String(entry).split(/\r?\n/)
  let u = (lines[0] || '').trim()
  let raw = lines.slice(1).join(' ').trim()
  if (u.includes('Rank:')) { const [a, b] = u.split('Rank:'); u = a.trim(); if (!raw && b) raw = b.trim() }
  const m = /\d+/.exec(raw)
  return { url: u, position: m ? m[0] : null }
}
const otherUrlsOf = (r: PromptResult) => {
  const cited = new Set(r.cited_urls.map(normUrl))
  return r.other_urls.filter((e) => !cited.has(normUrl(String(e).split(/\r?\n/)[0].trim())))
}

/* ------------------------------------------------------------------ small parts */
const PROVIDER_LABEL: Record<string, string> = { ChatGPT: 'OpenAI', Claude: 'Anthropic', Perplexity: 'Perplexity', 'Google AI Overview': 'Google AI Overview', Gemini: 'Google', Copilot: 'Microsoft', Grok: 'xAI' }
function modelBadge(name: string, size: 'small' | 'default' = 'default') {
  const m = ENGINE_META[name]
  const px = size === 'small' ? 14 : 18
  const logo = m ? `<img src="${m.src}" alt="${PROVIDER_LABEL[name]}" style="width:${px}px;height:${px}px;border-radius:4px;object-fit:contain;flex-shrink:0"/>` : engineLogo(name, px)
  return `<span style="display:inline-flex;align-items:center;gap:8px">${logo}<span style="font-size:${size === 'small' ? 12 : 13}px;font-weight:600;color:var(--color-text-primary)">${esc(name)}</span></span>`
}

/** The app falls back to a letter tile when a favicon fails to load; here it is always the fallback. */
function domainAvatar(domainOrUrl: string, size = 18) {
  const host = hostOf(domainOrUrl)
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--color-background-tertiary-default);display:flex;align-items:center;justify-content:center;font-size:${size * 0.55}px;font-weight:600;color:var(--color-text-secondary);flex-shrink:0">${esc(host.charAt(0).toUpperCase() || '?')}</div>`
}

const DOT: Record<DayStatus, { bg: string; shadow: string; label: string }> = {
  cited: { bg: '#039855', shadow: 'rgba(34, 197, 94, 0.4)', label: 'Cited' },
  not_cited: { bg: '#c01048', shadow: 'rgba(239, 68, 68, 0.4)', label: 'Not cited' },
  no_data: { bg: 'var(--color-background-tertiary-default)', shadow: 'rgba(203, 213, 225, 0.3)', label: 'No data' },
}
function citationDot(date: string, status: DayStatus, attrs: string) {
  const d = DOT[status]
  const clickable = status !== 'no_data'
  const dot = `<span style="width:10px;height:10px;border-radius:999px;background:${d.bg};display:inline-block;box-shadow:0 2px 4px ${d.shadow}, 0 0 0 1px rgba(15, 23, 42, 0.05);cursor:${clickable ? 'pointer' : 'default'}"></span>`
  const tip = `<div class="pointer-events-none absolute left-1/2 z-[1000] hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-text-primary px-2.5 py-1.5 text-[11px] font-medium text-text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:block group-focus-within:block" style="bottom:calc(100% + 8px)">${dayKey(date)}: ${d.label}<div class="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-text-primary"></div></div>`
  return `<div class="group relative inline-block">${clickable ? `<button type="button" ${attrs} aria-label="${dayKey(date)}: ${d.label}. Open result details" class="block rounded-full group-hover:scale-125">${dot}</button>` : dot}${tip}</div>`
}

/* ------------------------------------------------------------------ the section */
const HOVER_SHIFT = ['group-hover:translate-x-[6px]', 'group-hover:translate-x-[18px]', 'group-hover:translate-x-[20px]', 'group-hover:translate-x-[22px]', 'group-hover:translate-x-[24px]']
const TH = 'border-b border-separator-border p-4 text-left text-caption-1-medium text-text-secondary'

function mentionsCell(others: string[]) {
  if (!others.length) return '<span class="text-caption-1-regular text-text-tertiary">—</span>'
  const MAX = 5
  const shown = others.slice(0, MAX).map((e, i) => {
    const u = (String(e).split(/\r?\n/)[0] || '').trim()
    return `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${esc(u)}" style="z-index:${10 + i};margin-left:${i === 0 ? 0 : -10}px;box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);border-radius:6px;border:1.5px solid var(--color-separator-border);background:var(--color-background-full);display:inline-flex;align-items:center;justify-content:center;padding:0;width:24px;height:24px;overflow:hidden;position:relative;flex-shrink:0" class="${HOVER_SHIFT[i]}">${domainAvatar(u, 20)}</a>`
  }).join('')
  const more = others.length - MAX
  const plus = more > 0 ? `<span class="group-hover:translate-x-[14px]" style="margin-left:-8px;z-index:${10 + MAX};font-size:11px;font-weight:700;color:var(--color-text-secondary);background:var(--color-background-tertiary-default);border:1px solid var(--color-border-button-default);border-radius:6px;padding:2px 6px;display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;position:relative;flex-shrink:0">+${more}</span>` : ''
  return `<div data-mr-mentions="${esc(JSON.stringify(others.map((e) => (String(e).split(/\r?\n/)[0] || '').trim())))}" tabindex="0" class="group relative flex min-h-[32px] cursor-pointer items-center">${shown}${plus}</div>`
}

function rowHtml(engine: string, r: PromptResult, idx: number, last: boolean) {
  const border = last ? '' : 'border-b border-separator-border'
  const others = otherUrlsOf(r)
  const bestIdx = r.ranks.reduce((b, v, i) => (v < r.ranks[b] ? i : b), 0)
  const rank = r.ranks.length ? r.ranks[bestIdx] : null
  const rankUrl = r.cited_urls[bestIdx] ?? ''
  const change = rank != null && r.prev_rank != null ? r.prev_rank - rank : null
  const changeTone = change === null ? 'text-text-tertiary' : change > 0 ? 'text-status-lime-text' : change < 0 ? 'text-status-rose-text' : 'text-text-tertiary'
  const changeText = change === null ? (rank != null ? 'new' : '—') : change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '→ no change'
  const rankCell = rank != null
    ? `<a href="${esc(rankUrl)}" target="_blank" rel="noopener noreferrer" title="${esc(rankUrl)}" class="inline-flex self-start rounded-full border border-separator-border bg-background-tertiary-default px-2.5 py-1 text-caption-1-bold text-text-primary no-underline transition-colors hover:bg-background-secondary-hover hover:text-accent-600" style="font-feature-settings:'tnum'">#${rank}</a>`
    : '<span class="text-caption-1-regular text-text-tertiary">—</span>'
  const dots = r.daily_citations.map((d) => citationDot(d.date, d.status, `data-mr-dot="${esc(engine)}|${idx}|${d.date}"`)).join('')
  return `<tr class="bg-background-full transition-colors hover:bg-background-secondary-hover">
    <td class="max-w-[380px] p-5 align-top ${border}">
      <button type="button" data-mr-answer="${esc(engine)}|${idx}" title="See what ${esc(engine)} answered" class="group flex w-full items-start gap-2 bg-transparent p-0 text-left">
        <span class="m-0 text-body-2-medium leading-relaxed text-text-primary underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:text-accent-700 group-hover:decoration-violet-300">${esc(r.prompt)}</span>
        <span class="mt-0.5 shrink-0 rounded-md border border-separator-border bg-background-full px-1.5 py-px text-caption-2-medium text-text-secondary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View answer</span>
      </button>
    </td>
    <td class="whitespace-nowrap p-5 align-top ${border}"><span class="text-caption-1-medium text-text-secondary">${shortDate(r.run_timestamp)}</span></td>
    <td class="whitespace-nowrap p-5 align-top ${border}"><div class="flex items-center gap-1.5">${dots}</div></td>
    <td class="whitespace-nowrap p-5 align-top ${border}"><div class="flex flex-col gap-1">${rankCell}<span class="text-caption-2-semibold ${changeTone}">${changeText}</span></div></td>
    <td class="max-w-[260px] p-5 align-top ${border}">${mentionsCell(others)}</td>
  </tr>`
}

/** The cluster's results by engine; `promptFilter` narrows every engine to that one prompt (the prompt page's section). */
function resultsFor(slug: string, promptFilter?: string): Record<string, PromptResult[]> {
  const by = resultsByModel(slug)
  if (!promptFilter) return by
  return Object.fromEntries(Object.entries(by).map(([engine, rs]) => [engine, rs.filter((r) => r.prompt === promptFilter)]).filter(([, rs]) => (rs as PromptResult[]).length))
}

function sectionBody(slug: string, open: Set<string>, promptFilter?: string) {
  const by = resultsFor(slug, promptFilter)
  const head = `<div class="mb-4"><h2 class="text-caption-2-bold uppercase tracking-[0.08em] text-text-tertiary">Model Results</h2><p class="mt-1 text-body-2-regular text-text-secondary">Prompt, status, ranks, and other cited URLs</p></div>`
  const entries = Object.entries(by)
  if (!entries.length || !entries[0][1].length) {
    return `${head}<div class="rounded-xl border border-separator-border bg-background-full p-8 text-center text-body-2-regular text-text-tertiary">${promptFilter ? 'No engine has run this prompt yet.' : 'No model results recorded for this cluster yet.'}</div>`
  }
  const windowDateKeys = entries[0][1][0].daily_citations.map((d) => d.date)
  const cards = entries.map(([engine, results]) => {
    const cited = results.filter((r) => r.cited || r.cited_urls.length > 0).length
    const isOpen = open.has(engine)
    const table = isOpen ? `<div class="border-t border-separator-border p-0"><div class="m-3.5 overflow-x-auto rounded-xl border border-separator-border bg-background-secondary-default sm:m-5" data-lenis-prevent>
      <table class="w-full border-collapse" style="font-family:'Inter', system-ui, sans-serif">
        <thead><tr class="bg-background-secondary-default">
          <th class="${TH}">Prompt</th><th class="whitespace-nowrap ${TH}">Date</th>
          <th class="whitespace-nowrap ${TH}"><div>${windowDateKeys.length === 1 ? 'Day' : `${windowDateKeys.length}-Day`} History</div>${windowDateKeys.length > 0 ? `<div class="text-caption-2-regular font-normal text-text-tertiary">${historyRange(windowDateKeys)}</div>` : ''}</th>
          <th class="whitespace-nowrap ${TH}">Rank</th>
          <th class="${TH}"><div>All Mentions</div><div class="mt-1 text-caption-2-regular font-normal leading-tight text-text-tertiary">Other cited URLs shown by answer position.</div></th>
        </tr></thead>
        <tbody>${results.map((r, i) => rowHtml(engine, r, i, i === results.length - 1)).join('')}</tbody>
      </table></div></div>` : ''
    return `<div class="overflow-hidden rounded-2xl border border-separator-border bg-background-full shadow-sm">
      <button type="button" data-mr-toggle="${esc(engine)}" aria-expanded="${isOpen}" class="flex w-full items-center gap-4 bg-transparent px-5 py-4 text-left transition-colors hover:bg-background-secondary-hover">
        ${ri('RiArrowRightSLine', cx('h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200', isOpen && 'rotate-90'))}
        <div class="flex flex-1 flex-col gap-1"><div class="flex items-center gap-2">${modelBadge(engine)}</div>
          <p class="m-0 text-caption-1-regular text-text-tertiary">Cited targets in ${cited}/${results.length} prompts</p></div>
      </button>${table}</div>`
  }).join('')
  return `${head}<div class="flex flex-col gap-4">${cards}</div>`
}

export function modelResultsCard(slug: string, promptFilter?: string): string {
  const first = Object.keys(resultsFor(slug, promptFilter))[0]
  return `<section class="mb-12 mt-8" data-mr="${esc(slug)}"${promptFilter ? ` data-mr-prompt="${esc(promptFilter)}"` : ''}>${sectionBody(slug, new Set(first ? [first] : []), promptFilter)}</section>`
}

/* ------------------------------------------------------------------ answer modal (PromptChatModal) */
interface ChatState { engine: string; prompts: string[]; i: number; allSources: boolean }

const chatHtml = (st: ChatState) => chatModalHtml({
  chat: chatFor(st.prompts[st.i], st.engine),
  prompt: st.prompts[st.i],
  engines: [...ENGINES],
  allSources: st.allSources,
  nav: { hasPrev: st.i > 0, hasNext: st.i < st.prompts.length - 1, prevLabel: 'Previous prompt', nextLabel: 'Next prompt', counter: `${st.engine} · prompt ${st.i + 1} of ${st.prompts.length}` },
})

export function openChatModal(engine: string, prompts: string[], index: number) {
  const st: ChatState = { engine, prompts, i: index, allSources: false }
  let ov: Overlay
  const go = (patch: Partial<ChatState>) => {
    Object.assign(st, patch, { allSources: patch.allSources ?? false })
    ov.update(chatHtml(st))
    ov.el.querySelector<HTMLElement>('[role=dialog]')?.focus({ preventScroll: true })
  }
  const prev = () => { if (st.i > 0) go({ i: st.i - 1 }) }
  const next = () => { if (st.i < st.prompts.length - 1) go({ i: st.i + 1 }) }
  ov = openOverlay({
    html: chatHtml(st),
    wire: (el) => {
      wireAnswerBody(el)
      el.onclick = (e) => {
        const t = e.target as HTMLElement
        const eng = t.closest<HTMLElement>('[data-chat-engine]')
        if (eng) { if (eng.dataset.chatEngine !== st.engine) go({ engine: eng.dataset.chatEngine as string }); return }
        if (t.closest('[data-chat-prev]')) prev()
        else if (t.closest('[data-chat-next]')) next()
        else if (t.closest('[data-chat-sources]')) go({ allSources: !st.allSources })
      }
    },
    onKey: (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    },
  })
}

/* ------------------------------------------------------------------ result modal (ResultDetailPanel) */
const H3 = 'font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:12px;letter-spacing:0.02em'

function panelHtml(r: PromptResult, selDate: string, selStatus: DayStatus): string {
  const others = otherUrlsOf(r).filter((e) => {
    const raw = String(e).split(/\r?\n/)[0].trim()
    return !(raw.includes('google.com/maps') || raw.includes('utm_source=openai') || raw.includes('google.com/s2/favicons') || raw.includes('images.openai.com'))
  })
  const fill = (s: DayStatus) => (s === 'cited' ? '#039855' : s === 'not_cited' ? '#c01048' : 'var(--color-background-tertiary-default)')
  const ring = (s: DayStatus) => (s === 'cited' ? 'var(--color-status-lime-background)' : s === 'not_cited' ? 'var(--color-status-rose-background)' : 'var(--color-separator-border)')
  const days = r.daily_citations.map((d) => {
    const sel = d.date === selDate
    const label = d.status === 'cited' ? 'Cited' : d.status === 'not_cited' ? 'Not Cited' : 'No data'
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1"><div title="${dayKey(d.date)}: ${label}" style="width:${sel ? 16 : 12}px;height:${sel ? 16 : 12}px;border-radius:999px;background:${fill(d.status)};box-shadow:${sel ? `0 0 0 3px ${ring(d.status)}` : 'none'};flex-shrink:0"></div><span style="font-size:9px;color:${sel ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'};font-weight:${sel ? 700 : 400};white-space:nowrap">${dayKey(d.date)}</span></div>`
  }).join('')
  const mark = selStatus === 'cited' ? '✓ Cited' : selStatus === 'not_cited' ? '✗ Not cited' : '— No data'
  const cited = r.cited_urls.length
    ? `<div style="display:flex;flex-direction:column;gap:16px">${r.cited_urls.map((u, i) => `<div><a href="${esc(u)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-accent-600);font-size:13px;word-break:break-all;text-decoration:underline;line-height:1.5">${esc(u)}</a>${r.ranks[i] ? `<div style="margin-top:6px"><span style="display:inline-block;font-size:11px;color:var(--color-status-lime-text);background:var(--color-status-lime-background);border:1px solid var(--color-status-lime-background);padding:3px 10px;border-radius:9999px;font-weight:500">Rank ${r.ranks[i]}</span></div>` : ''}</div>`).join('')}</div>`
    : '<p style="font-size:13px;color:var(--color-text-tertiary);margin:0">No cited URLs</p>'
  const mentions = others.length
    ? `<div><h3 style="${H3}">ALL MENTIONS (${others.length})</h3><div style="display:flex;flex-direction:column;gap:10px">${others.map((e) => {
      const m = parseMention(e)
      return `<div style="display:flex;align-items:center;gap:10px;font-size:13px">${domainAvatar(m.url, 18)}<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-accent-600);text-decoration:underline;word-break:break-all;flex:1">${esc(m.url)}</a>${m.position ? `<span style="font-size:11px;color:var(--color-text-secondary);background:var(--color-background-tertiary-default);padding:2px 6px;border-radius:4px">#${m.position}</span>` : ''}</div>`
    }).join('')}</div></div>`
    : ''
  return dialogShell({
    label: 'Result details',
    size: 'xl',
    cls: '!gap-0 !py-0',
    children: `<div class="flex shrink-0 items-start gap-3 px-6 border-b border-separator-border !px-6 py-5">
        <div class="flex min-w-0 flex-1 flex-col"><h2 class="text-title-3-medium text-text-primary">Result Details</h2></div>
        ${closeButton({ size: 'sm', label: 'Close', cls: '-me-1 shrink-0', attrs: 'data-overlay-close data-autofocus' })}
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col"><div data-lenis-prevent class="min-h-0 flex-1 overflow-y-auto overscroll-contain text-body-regular text-text-secondary"><div style="padding:24px">
        <div style="margin-bottom:28px"><h3 style="${H3}">${r.daily_citations.length}-DAY HISTORY</h3><div style="background:var(--color-background-secondary-default);border:1px solid var(--color-separator-border);border-radius:10px;padding:16px 20px;display:flex;align-items:center;gap:8px">${days}</div><p style="font-size:11px;color:var(--color-text-tertiary);margin:8px 0 0">${mark} on ${dayKey(selDate)} · Citation details below are from the most recent run</p></div>
        <div style="margin-bottom:32px"><h3 style="${H3}">MODEL</h3>${modelBadge(r.model)}</div>
        <div style="margin-bottom:32px"><h3 style="${H3}">PROMPT</h3><p style="font-size:14px;line-height:1.6;color:var(--color-text-secondary);margin:0;white-space:pre-wrap">${esc(r.prompt)}</p></div>
        <div style="margin-bottom:32px"><h3 style="${H3}">CITED TARGET URLs</h3>${cited}</div>
        ${mentions}
      </div></div></div>`,
  })
}

/* ------------------------------------------------------------------ mount */
export function mountModelResults(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-mr]').forEach((section) => {
    const slug = section.dataset.mr as string
    const promptFilter = section.dataset.mrPrompt
    const by = resultsFor(slug, promptFilter)
    const open = new Set<string>(Object.keys(by).slice(0, 1))
    const render = () => { section.innerHTML = sectionBody(slug, open, promptFilter) }
    let tip: HTMLElement | null = null
    let tipAnchor: HTMLElement | null = null
    const hideTip = () => { tip?.remove(); tip = null; tipAnchor = null }

    section.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      const tog = t.closest<HTMLElement>('[data-mr-toggle]')
      if (tog) {
        const k = tog.dataset.mrToggle as string
        if (open.has(k)) open.delete(k); else open.add(k)
        hideTip(); render()
        section.querySelector<HTMLElement>(`[data-mr-toggle="${CSS.escape(k)}"]`)?.focus()
        return
      }
      const ans = t.closest<HTMLElement>('[data-mr-answer]')
      if (ans) {
        const [engine, idx] = (ans.dataset.mrAnswer as string).split('|')
        openChatModal(engine, by[engine].map((r) => r.prompt), Number(idx))
        return
      }
      const dot = t.closest<HTMLElement>('[data-mr-dot]')
      if (dot) {
        const [engine, idx, date] = (dot.dataset.mrDot as string).split('|')
        const r = by[engine][Number(idx)]
        const status = r.daily_citations.find((d) => d.date === date)?.status ?? 'no_data'
        openOverlay({ html: panelHtml(r, date, status) })
      }
    })

    section.addEventListener('mouseover', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-mr-mentions]')
      if (!a || a === tipAnchor) return
      hideTip()
      tipAnchor = a
      const urls = JSON.parse(a.dataset.mrMentions as string) as string[]
      const rect = a.getBoundingClientRect()
      const W = 340, MIN = 120, MAX = 320, GAP = 4, MARGIN = 12
      const below = innerHeight - rect.bottom - GAP - MARGIN
      const above = rect.top - GAP - MARGIN
      const openBelow = below >= MIN || below >= above
      const maxH = Math.max(MIN, Math.min(MAX, openBelow ? below : above))
      const left = Math.min(Math.max(rect.left, MARGIN), innerWidth - W - MARGIN)
      const wrap = document.createElement('div')
      wrap.className = 'app'
      wrap.innerHTML = `<div style="position:fixed;${openBelow ? `top:${rect.bottom}px;padding-top:${GAP}px` : `bottom:${innerHeight - rect.top}px;padding-bottom:${GAP}px`};left:${left}px;z-index:9999"><div data-lenis-prevent style="background:var(--color-background-full);border:1px solid var(--color-separator-border);border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:10px 14px;min-width:220px;max-width:${W}px;max-height:${maxH}px;overflow-y:auto;overscroll-behavior:contain;font-size:12px;color:var(--color-text-secondary)"><div style="font-weight:600;margin-bottom:6px;color:var(--color-text-primary)">All Mentions</div>${urls.map((u) => `<div style="margin-bottom:4px;line-height:1.4"><a href="${esc(u)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-accent-600);text-decoration:underline;font-size:12px;word-break:break-word">${esc(u)}</a></div>`).join('')}</div></div>`
      document.body.appendChild(wrap)
      tip = wrap
      wrap.addEventListener('mouseleave', (ev) => { if (!tipAnchor?.contains(ev.relatedTarget as Node)) hideTip() })
    })
    section.addEventListener('mouseout', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-mr-mentions]')
      if (!a || a !== tipAnchor) return
      const to = e.relatedTarget as Node | null
      if (to && (a.contains(to) || tip?.contains(to))) return
      hideTip()
    })

    render()
  })
}

/* ------------------------------------------------------------------ page */
export function html(params?: Record<string, string>): string {
  return `<div class="mx-auto max-w-[1760px] px-4 pb-12 pt-5 sm:px-6">${modelResultsCard(params?.cluster ?? 'llm-observability')}</div>`
}

export function mount(root: HTMLElement): void {
  mountModelResults(root)
}
