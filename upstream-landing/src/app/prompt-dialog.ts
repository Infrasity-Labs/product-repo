/*
 * Port of `dash/prompt-dialog.tsx` + `dash/run-answer.tsx`: the per-prompt popup opened from the Prompts / Engines / cluster tables.
 * Citation rate, share, rank, engines citing you, why, and tabs for model results (with the stored answers), brand comparison,
 * sources, history and related prompts. `openPromptDialog({ cluster, prompt, origin })` opens it; "Open full page" navigates the
 * app window (via a `data-nav="prompt-detail"` click on `origin`) to the full prompt page.
 */
import { ri } from '../lib/icons'
import { chip, closeButton, linkButton, tabs, type ChipColor } from './base'
import { mount as mountCharts, trendLine } from './charts'
import { answerBody, displayUrl, wireAnswerBody } from './chat-modal'
import { fmt, fmtPct, fmtPos, meter, MONO } from './dash-ui'
import { statusFor, STATUS_META } from './dash-parts'
import { ENGINES } from './data'
import { chatFor, type Chat } from './model-results-data'
import { dialogShell, openOverlay } from './model-results-overlay'
import { allPrompts } from './prompts-data'
import { promptDetail, type PromptDetailResponse, type PromptDetailRun } from './prompt-detail-data'
import { cx, domainLogo, ENGINE_META, engineLogo, esc } from './ui'

const TONE_COLOR: Record<string, ChipColor> = { good: 'lime', warn: 'yellow', bad: 'rose', neutral: 'neutral' }
const eyebrow = 'text-caption-1-semibold uppercase tracking-[0.06em] text-text-tertiary'
const card = 'rounded-2xl border border-separator-border bg-background-full'

/** The stored answer for a prompt/engine; prompts without their own transcript show the answer of a sibling prompt in the same cluster. */
function chatForPrompt(prompt: string, cluster: string, engine: string): Chat | undefined {
  const own = chatFor(prompt, engine)
  if (own) return own
  const sibling = allPrompts.find((p) => p.cluster_slug === cluster && chatFor(p.prompt, engine)) ?? allPrompts.find((p) => chatFor(p.prompt, engine))
  const c = sibling ? chatFor(sibling.prompt, engine) : undefined
  return c ? { ...c, prompt } : undefined
}

const when = (ts: string) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
const dayOf = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function runChip(r: PromptDetailRun, selected: boolean): string {
  const day = dayOf(r.ts)
  const body = r.rank != null ? `#${r.rank}` : r.cited ? '\u2713' : '\u00d7'
  return `<button type="button" data-pd-run="${r.run_id}" aria-pressed="${selected}" title="${day}: ${r.cited ? (r.rank != null ? `cited at #${r.rank}` : 'cited') : 'not cited'}. Click to read this answer"
    class="${cx('flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 text-center outline-none transition-all hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-border-focus-ring', r.cited ? 'border-[#a6f4c5] bg-[#f3fbf6] text-[#027a48]' : 'border-[#fecdd6] bg-[#fff6f7] text-[#c01048]', selected && 'ring-2 ring-accent-600 ring-offset-2')}">
    <span class="text-body-semibold tabular-nums leading-5">${body}</span><span class="text-caption-1-regular leading-4 opacity-80">${day}</span></button>`
}

/** One run's answer: brands named in order, the full answer text, and the pages it cited. */
export function runAnswerHtml(o: { engine: string; run: PromptDetailRun; prompt: string; cluster: string; open: boolean }): string {
  const { engine, run } = o
  const chat = chatForPrompt(o.prompt, o.cluster, engine)
  const meta = ENGINE_META[engine]
  const header = `<header class="flex flex-wrap items-center gap-3 border-b border-separator-border bg-background-secondary-default/60 px-5 py-3.5">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-separator-border" style="background:${meta?.soft ?? '#f5f5f5'}">${engineLogo(engine, 18)}</span>
      <div class="min-w-0">
        <p class="text-body-semibold text-text-primary">${esc(engine)}</p>
        <p class="text-caption-1-regular text-text-secondary">${when(run.ts)} UTC${chat ? ` · ${chat.mentions.length} brand${chat.mentions.length === 1 ? '' : 's'} named, in order` : ''}</p>
      </div>
      <span class="ms-auto flex items-center gap-2 text-caption-1-medium text-text-secondary">Your position
        ${run.rank != null ? chip(`#${run.rank}`, { variant: 'subtle', color: 'blue', cls: 'tabular-nums' }) : chip(run.cited ? 'Cited, no rank' : 'Not cited', { variant: 'subtle', color: run.cited ? 'yellow' : 'rose' })}
      </span>
    </header>`
  if (!chat) return `<section aria-label="${esc(engine)} answer from ${when(run.ts)}" class="overflow-hidden rounded-2xl border border-separator-border bg-background-full">${header}</section>`
  const mentions = !chat.mentions.length ? '<p class="text-body-regular text-text-tertiary">No brands detected in this answer.</p>' : `<ol class="grid gap-2.5 sm:grid-cols-2">${chat.mentions.map((m, i) => `
        <li class="${cx('flex items-center gap-3 rounded-xl border px-3 py-2.5', m.is_you ? 'border-accent-200 bg-accent-50' : 'border-separator-border bg-background-full')}">
          <span class="${cx('grid size-6 shrink-0 place-items-center rounded-md text-caption-1-semibold tabular-nums', m.is_you ? 'bg-accent-600 text-text-white' : 'bg-background-tertiary-default text-text-secondary')}">${i + 1}</span>
          ${m.domain ? domainLogo(m.domain, 20, m.is_you) : ''}
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5"><span class="${cx('truncate text-body-medium', m.is_you ? 'text-accent-700' : 'text-text-primary')}">${esc(m.name)}</span>${m.is_you ? chip('You', { variant: 'caption', color: 'blue' }) : ''}</span>
            ${m.domain ? `<span class="block truncate text-caption-1-regular text-text-secondary">${esc(m.domain)}</span>` : ''}
          </span>
          ${m.role === 'mentioned' ? '<span class="shrink-0 text-caption-1-regular text-text-tertiary">mentioned</span>' : ''}
        </li>`).join('')}</ol>`
  const sources = !chat.sources.length ? '<p class="text-body-regular text-text-tertiary">This answer cited no pages.</p>' : `<ul class="divide-y divide-separator-border overflow-hidden rounded-xl border border-separator-border">${chat.sources.slice(0, 10).map((s) => `
        <li class="flex items-center gap-3 px-4 py-3">
          ${domainLogo(s.domain, 20)}
          <span class="min-w-0 flex-1"><span class="block truncate text-body-medium text-text-primary">${esc(s.title || s.domain)}</span><span class="block truncate text-caption-1-regular text-text-secondary">${esc(displayUrl(s.url))}</span></span>
          <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border-button-default bg-background-full px-2.5 text-caption-1-medium text-text-primary outline-none transition-colors hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring">Open${ri('RiExternalLinkLine', 'size-3.5')}</a>
        </li>`).join('')}</ul>`
  return `<section aria-label="${esc(engine)} answer from ${when(run.ts)}" class="overflow-hidden rounded-2xl border border-separator-border bg-background-full">
    ${header}
    <div class="flex flex-col gap-6 p-5">
      <div class="flex flex-col gap-3"><p class="${eyebrow}">Brands named</p>${mentions}</div>
      <div class="flex flex-col gap-3">
        <button type="button" data-pd-answer-toggle aria-expanded="${o.open}" class="flex w-fit items-center gap-1.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">${ri('RiArrowDownSLine', cx('size-4 text-text-tertiary transition-transform', !o.open && '-rotate-90'))}<span class="${eyebrow}">Full answer</span></button>
        ${o.open ? `<div data-answer class="max-h-[min(680px,70vh)] min-h-[260px] overflow-y-auto overflow-x-hidden rounded-xl border border-separator-border bg-background-secondary-default/50 px-5 py-4">${answerBody(chat, true)}</div>` : ''}
      </div>
      <div class="flex flex-col gap-3"><p class="${eyebrow}">Pages cited in this answer <span class="ms-1 font-normal normal-case tabular-nums text-text-tertiary">${chat.sources.length}</span></p>${sources}</div>
    </div>
  </section>`
}

interface State { cluster: string; prompt: string; tab: string; engine: string | null; runId: number | null; answerOpen: boolean }

function bodyHtml(st: State, data: PromptDetailResponse): string {
  const results = [...data.model_results].sort((a, b) => ENGINES.indexOf(a.engine as (typeof ENGINES)[number]) - ENGINES.indexOf(b.engine as (typeof ENGINES)[number]))
  const active = st.engine ?? (results.find((r) => r.in_range !== false && r.runs.length > 0) ?? results.find((r) => r.runs.length > 0))?.engine ?? null
  const activeRuns = [...(results.find((r) => r.engine === active)?.runs ?? [])].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 10)
  const inRange = results.filter((r) => r.in_range !== false && r.answers > 0)
  const citing = inRange.filter((r) => r.cited_answers > 0).length
  const scanned = inRange.length
  const outside = results.filter((r) => r.in_range === false || r.answers === 0)
  const s = data.stats
  const moe = s.answers > 0 ? Math.round(1.96 * Math.sqrt(((s.cited_answers / s.answers) * (1 - s.cited_answers / s.answers)) / s.answers) * 1000) / 10 : null
  const why = data.status === 'owned'
    ? `You are the most cited source here${s.your_share != null ? ` (${Math.round(s.your_share)}% of citations)` : ''} and ${citing} of ${scanned} engines cite you.`
    : data.why_losing.join(' ') || data.suggested_fix?.detail || ''
  const pos = s.position ?? s.last_known_position
  const kpis = [
    { label: 'Citation rate', value: fmtPct(s.cited_pct, 1), extra: moe != null ? `±${moe}` : null, foot: `${fmt(s.cited_answers)} of ${fmt(s.answers)} prompts` },
    { label: 'Your share', value: s.your_share != null ? `${s.your_share}%` : '–', extra: null, foot: 'of all citations for this prompt' },
    { label: 'Rank', value: fmtPos(pos), extra: null, foot: s.prev_position != null ? `was #${s.prev_position}` : 'no earlier scan' },
    { label: 'Engines citing you', value: `${citing}/${scanned}`, extra: null, foot: outside.length ? `+ ${outside.map((r) => r.engine).join(', ')}: no scan in these dates` : 'all engines scanned' },
  ]

  let panel = ''
  if (st.tab === 'models') {
    const selected = activeRuns.find((r) => r.run_id === st.runId) ?? activeRuns[0]
    panel = `<div class="flex flex-col gap-5">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">${results.map((r) => {
        const on = r.engine === active
        return `<button type="button" data-pd-engine="${esc(r.engine)}" ${r.runs.length === 0 ? 'disabled' : ''} class="${cx('flex flex-col gap-1.5 rounded-xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:opacity-55', on ? 'border-accent-600 bg-accent-50 ring-1 ring-accent-600/30' : 'border-separator-border bg-background-full hover:bg-background-secondary-hover')}">
          <span class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 text-body-semibold text-text-primary"><span class="grid size-6 place-items-center rounded-md" style="background:${ENGINE_META[r.engine]?.soft ?? ''}">${engineLogo(r.engine, 14)}</span>${esc(r.engine)}</span>
            <span class="text-body-semibold tabular-nums text-text-primary">${r.runs.length ? fmtPos(r.latest_rank) : 'n/a'}</span>
          </span>
          <span class="text-caption-1-regular text-text-secondary">${r.runs.length ? `cited in ${r.runs.filter((x) => x.cited).length} of ${r.runs.length} runs${r.in_range === false ? ' · none in these dates' : ''}` : 'no recent scan'}</span>
        </button>`
      }).join('')}</div>
      ${selected ? `<div class="flex flex-col gap-2.5">
          <p class="text-caption-1-medium text-text-secondary">${esc(active ?? '')} &middot; latest runs <span class="font-normal text-text-tertiary">(click a run to read its answer)</span></p>
          <div class="flex flex-wrap gap-2">${activeRuns.map((r) => runChip(r, r.run_id === selected.run_id)).join('')}</div>
        </div>
        <div data-pd-answer>${runAnswerHtml({ engine: active ?? '', run: selected, prompt: data.prompt, cluster: data.cluster.slug, open: st.answerOpen })}</div>` : ''}
    </div>`
  } else if (st.tab === 'brands') {
    panel = !data.domain_breakdown.length ? '<p class="text-body-regular text-text-secondary">No citations recorded for this prompt in this range.</p>' : `<ul class="flex flex-col gap-3.5">${data.domain_breakdown.slice(0, 12).map((d, i) => `
      <li class="grid grid-cols-[20px_minmax(120px,180px)_1fr_auto] items-center gap-4 text-body-regular">
        <span class="text-caption-1-medium tabular-nums text-text-tertiary">${i + 1}</span>
        <span class="${cx('flex min-w-0 items-center gap-2', d.is_you ? 'text-body-semibold text-accent-700' : 'text-text-primary')}">${domainLogo(d.domain, 18, d.is_you)}<span class="truncate">${esc(d.domain)}</span></span>
        ${meter(d.pct, d.is_you ? 'indigo' : d.is_competitor ? 'crimson' : 'slate', 'bg-background-tertiary-default')}
        <span class="w-28 text-right tabular-nums text-text-primary">${d.pct}% <span class="text-text-tertiary">&middot; ${fmt(d.citations)}</span></span>
      </li>`).join('')}</ul>`
  } else if (st.tab === 'sources') {
    panel = !data.domain_breakdown.length ? '<p class="text-body-regular text-text-secondary">No sources recorded for this prompt in this range.</p>' : `<div class="${cx(card, 'overflow-x-auto')}">
      <table class="w-full text-body-regular">
        <thead><tr class="border-b border-separator-border text-left text-caption-1-medium text-text-secondary"><th class="px-4 py-3 font-medium">Domain</th><th class="px-4 py-3 text-right font-medium">Pages</th><th class="px-4 py-3 text-right font-medium">Citations</th><th class="px-4 py-3 font-medium">Type</th></tr></thead>
        <tbody class="divide-y divide-separator-border">${[...data.domain_breakdown].sort((a, b) => b.urls - a.urls).slice(0, 12).map((d) => `<tr>
          <td class="px-4 py-3"><span class="${cx('flex items-center gap-2 text-text-primary', d.is_you && 'font-semibold text-accent-700')}">${domainLogo(d.domain, 18, d.is_you)}${esc(d.domain)}</span></td>
          <td class="px-4 py-3 text-right tabular-nums">${fmt(d.urls)}</td><td class="px-4 py-3 text-right tabular-nums">${fmt(d.citations)}</td>
          <td class="px-4 py-3">${chip(d.is_you ? 'You' : d.is_competitor ? 'Competitor' : d.type, { variant: 'caption', color: d.is_you ? 'blue' : d.is_competitor ? 'rose' : 'neutral' })}</td></tr>`).join('')}</tbody>
      </table></div>`
  } else if (st.tab === 'history') {
    const byDay = new Map<string, { total: number; cited: number }>()
    for (const r of results) for (const run of r.runs) { const d = run.ts.slice(0, 10); const e = byDay.get(d) ?? { total: 0, cited: 0 }; e.total++; if (run.cited) e.cited++; byDay.set(d, e) }
    const trend = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([d, e]) => ({ x: new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), y: Math.round((e.cited / e.total) * 100), answers: e.total }))
    panel = `<div class="flex flex-col gap-4">
      <p class="flex items-center gap-2 text-body-regular text-text-secondary">Position, last two runs
        ${chip(fmtPos(data.position_history.from), { variant: 'caption', color: 'neutral', cls: 'tabular-nums' })}&rarr;${chip(fmtPos(data.position_history.to), { variant: 'caption', color: 'blue', cls: 'tabular-nums' })}</p>
      ${trend.length < 2 ? '<p class="text-body-regular text-text-secondary">Not enough scans yet to draw a history.</p>' : `<div class="${cx('h-[220px] w-full', MONO)}">${trendLine({ points: trend, color: '#4f46e5', fmt: (n) => `${Math.round(n)}%`, yMin: 0, yMax: 100, seriesLabel: 'Citation rate' })}</div>`}
    </div>`
  } else {
    panel = !data.related_prompts.length ? '<p class="text-body-regular text-text-secondary">No other prompts in this cluster yet.</p>' : `<ul class="${cx(card, 'divide-y divide-separator-border overflow-hidden')}">${data.related_prompts.map((p) => `<li>
      <button type="button" data-pd-related="${esc(p.prompt)}" class="flex w-full items-center gap-4 px-4 py-3 text-left outline-none transition-colors hover:bg-background-secondary-hover focus-visible:bg-background-secondary-hover">
        <span class="min-w-0 flex-1 truncate text-body-medium text-text-primary">${esc(p.prompt)}</span>
        <span class="shrink-0 text-caption-1-medium tabular-nums text-text-secondary">${fmtPct(p.citation_rate, 0)} &middot; ${fmtPos(p.current_rank)}</span>
      </button></li>`).join('')}</ul>`
  }

  const delta = s.position_delta ? (s.position_delta > 0 ? `up ${s.position_delta}` : `down ${Math.abs(s.position_delta)}`) + (s.prev_position != null ? ` from #${s.prev_position}` : '') : 'no change since the last scan'
  return `<div class="flex flex-col gap-5 pb-4">
    <dl class="${cx(card, 'grid grid-cols-2 divide-separator-border lg:grid-cols-4 lg:divide-x [&>div:nth-child(n+3)]:border-t [&>div:nth-child(n+3)]:border-separator-border lg:[&>div:nth-child(n+3)]:border-t-0')}">
      ${kpis.map((k) => `<div class="flex flex-col gap-1.5 px-5 py-4">
        <dt class="text-caption-1-medium text-text-secondary">${k.label}</dt>
        <dd class="flex items-baseline gap-2 text-[28px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-text-primary">${k.value}${k.extra ? `<span class="${cx('text-caption-1-regular font-normal text-text-tertiary', MONO)}">${k.extra}</span>` : ''}</dd>
        <p class="text-caption-1-regular text-text-secondary">${k.foot}</p></div>`).join('')}
    </dl>
    ${why ? `<p class="rounded-xl bg-background-secondary-default px-5 py-3.5 text-body-regular text-text-secondary"><strong class="font-semibold text-text-primary">${data.status === 'owned' ? 'Why owned: ' : 'Why not first: '}</strong>${esc(why)}</p>` : ''}
    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div class="min-w-0"><div class="flex w-full flex-col gap-5">
        ${tabs('pd-tabs', st.tab, [{ value: 'models', label: 'Model results' }, { value: 'brands', label: 'Compare brands' }, { value: 'sources', label: 'Sources' }, { value: 'history', label: 'History' }, { value: 'related', label: 'Related prompts', count: data.related_prompts.length || undefined }])}
        ${panel}
      </div></div>
      <aside class="flex flex-col gap-4 lg:sticky lg:top-2">
        <div class="${cx(card, 'flex flex-col gap-1.5 p-5')}">
          <p class="${eyebrow}">You in this answer</p>
          <p class="text-[28px] font-semibold leading-9 tabular-nums text-text-primary">${fmtPos(pos)}</p>
          <p class="text-caption-1-regular text-text-secondary">${delta}</p>
        </div>
        ${data.suggested_fix ? `<div class="flex flex-col gap-2 rounded-2xl border border-accent-200 bg-accent-50 p-5">
          <p class="${eyebrow}">Next step</p>
          <p class="text-body-semibold text-text-primary">${esc(data.suggested_fix.headline)}</p>
          <p class="text-body-regular text-text-secondary">${esc(data.suggested_fix.detail)}</p>
          ${data.suggested_fix.target_domains.length > 0 ? `<div class="mt-1 flex flex-wrap gap-1.5">${data.suggested_fix.target_domains.map((d) => chip(esc(d), { variant: 'caption', color: 'soft' })).join('')}</div>` : ''}
          ${linkButton('Open full page', { size: 'small', trailingIcon: 'RiExternalLinkLine', href: '#', cls: 'mt-2 w-fit', attrs: 'data-pd-full' })}
        </div>` : ''}
      </aside>
    </div>
  </div>`
}

function dialogHtml(st: State): string {
  const data = promptDetail(st.cluster, st.prompt)
  const stat = STATUS_META[data.status]
  const p = allPrompts.find((x) => x.cluster_slug === st.cluster && x.prompt === st.prompt)
  const label = p ? statusFor(p).label : stat.label
  return dialogShell({
    label: st.prompt, size: '2xl', cls: '!gap-0 !py-0',
    children: `<div class="flex min-h-0 flex-col gap-5 pb-2 pt-6">
      <div class="flex shrink-0 items-start gap-3 px-6">
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 class="text-title-3-medium text-text-primary">${esc(st.prompt)}</h2>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-caption-1-medium text-text-secondary">
            ${chip(esc(data.cluster.name), { variant: 'caption', color: 'soft' })}
            ${chip(label, { variant: 'caption', color: TONE_COLOR[stat.tone] })}
            ${data.intent ? chip(esc(data.intent), { variant: 'caption', color: 'neutral', cls: 'capitalize' }) : ''}
            <span class="tabular-nums">${fmt(data.stats.answers)} prompts checked</span>
            ${linkButton('Open full page', { size: 'small', trailingIcon: 'RiExternalLinkLine', href: '#', cls: 'ms-auto', attrs: 'data-pd-full' })}
          </div>
        </div>
        ${closeButton({ size: 'sm', label: 'Close', cls: '-me-1 shrink-0', attrs: 'data-overlay-close' })}
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col"><div data-lenis-prevent data-keep-scroll class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 !py-1 text-body-regular text-text-secondary">${bodyHtml(st, data)}</div></div>
    </div>`,
  })
}

/** Open the prompt popup. `origin` is any element inside the app window (used to navigate to the full page). */
export function openPromptDialog(o: { cluster: string; prompt: string; origin?: HTMLElement | null }): void {
  const st: State = { cluster: o.cluster, prompt: o.prompt, tab: 'models', engine: null, runId: null, answerOpen: true }
  openOverlay({
    html: dialogHtml(st),
    wire: (el, overlay) => {
      mountCharts(el)
      el.querySelectorAll<HTMLElement>('[data-answer]').forEach(wireAnswerBody)
      if (el.dataset.pdWired) return
      el.dataset.pdWired = '1'
      el.addEventListener('click', (e) => {
        const t = e.target as HTMLElement
        const redraw = () => overlay.update(dialogHtml(st))
        const tab = t.closest<HTMLElement>('[data-base-tabs="pd-tabs"] [data-v]')
        if (tab) { st.tab = tab.dataset.v as string; redraw(); return }
        const eng = t.closest<HTMLElement>('[data-pd-engine]')
        if (eng) { st.engine = eng.dataset.pdEngine as string; st.runId = null; redraw(); return }
        const run = t.closest<HTMLElement>('[data-pd-run]')
        if (run) { st.runId = Number(run.dataset.pdRun); redraw(); return }
        if (t.closest('[data-pd-answer-toggle]')) { st.answerOpen = !st.answerOpen; redraw(); return }
        const rel = t.closest<HTMLElement>('[data-pd-related]')
        if (rel) { st.prompt = rel.dataset.pdRelated as string; st.tab = 'models'; st.engine = null; st.runId = null; redraw(); return }
        if (t.closest('[data-pd-full]')) {
          e.preventDefault()
          overlay.close()
          const a = document.createElement('a')
          a.dataset.nav = 'prompt-detail'
          a.dataset.cluster = st.cluster
          a.dataset.prompt = st.prompt
          a.hidden = true
          ;(o.origin ?? document.body).appendChild(a)
          a.click()
          a.remove()
        }
      })
    },
  })
}
