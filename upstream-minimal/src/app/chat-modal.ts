/*
 * Port of the real app's answer pieces: `chats/chat-modal.tsx` (AnswerBody, Details, EngineSwitcher, ChatModal),
 * `chats/chat-parts.tsx` (BrandAvatar, MentionStack, SourceStack, PositionBadge), `chats/chat-format.ts` and
 * `structured-entity-showcase.tsx`. HTML strings; `wireAnswerBody(root)` makes the structured cards interactive.
 * Used by the Model results answer modal (pages/model-results.ts) and the prompt dialog's inline answers.
 */
import { ri } from '../lib/icons'
import { button, chip, closeButton } from './base'
import type { Chat, ChatMention, StructuredEntity } from './model-results-data'
import { dialogShell } from './model-results-overlay'
import { cx, domainLogo, ENGINE_META, engineLogo, esc, tag } from './ui'

/* ------------------------------------------------------------------ chat-format.ts */
export function relTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const days = Math.floor((now - t) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
export function fullDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
}
export function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
/** "domain.com/path/to/page" without the protocol, www, query or trailing slash. */
export function displayUrl(url: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    return `${u.hostname.replace(/^www\./i, '')}${u.pathname}`.replace(/\/+$/, '')
  } catch {
    return url
  }
}
export const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u.replace(/^https?:\/\//, '').split('/')[0] } }
const siteHref = (domain: string) => `https://${domain.replace(/^https?:\/\//i, '')}`

/* ------------------------------------------------------------------ chat-parts.tsx */
/** A brand's avatar: its logo when we know its site, otherwise a neutral letter tile. */
export function brandAvatar(m: ChatMention, size = 22): string {
  if (m.domain) return domainLogo(m.domain, size, m.is_you)
  return `<span class="${cx('inline-flex shrink-0 items-center justify-center rounded-lg border bg-background-secondary-default font-semibold uppercase text-text-secondary', m.is_you ? 'border-accent-200 ring-1 ring-accent-200' : 'border-separator-border')}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px" aria-hidden="true">${esc(m.name.trim().charAt(0) || '?')}</span>`
}

const stack = (children: string, extra: number, label: string) =>
  `<div class="flex items-center" aria-label="${esc(label)}"><div class="flex -space-x-1.5">${children}</div>${extra > 0 ? `<span class="ml-1.5 text-caption-1-medium text-text-secondary tabular-nums">+${extra}</span>` : ''}</div>`

export function mentionStack(mentions: ChatMention[], max = 3): string {
  if (!mentions.length) return '<span class="text-text-tertiary">—</span>'
  return stack(mentions.slice(0, max).map((m) => `<span title="${esc(m.name)}" class="rounded-lg ring-2 ring-background-full">${brandAvatar(m, 22)}</span>`).join(''), mentions.length - max, `${mentions.length} brands mentioned`)
}

export function sourceStack(sources: Chat['sources'], max = 3): string {
  if (!sources.length) return '<span class="text-text-tertiary">—</span>'
  const seen = new Set<string>()
  const uniq = sources.filter((s) => (seen.has(s.domain) ? false : (seen.add(s.domain), true)))
  return stack(uniq.slice(0, max).map((s) => `<span title="${esc(s.domain)}" class="rounded-lg ring-2 ring-background-full">${domainLogo(s.domain, 22)}</span>`).join(''), uniq.length - max, `${sources.length} sources`)
}

/** Position badge: #1 green, #2-3 amber, lower neutral, none = a dash. */
export function positionBadge(rank: number | null, cited: boolean): string {
  if (rank == null) return cited ? chip('cited', { variant: 'caption', color: 'neutral' }) : '<span class="text-text-tertiary">—</span>'
  const color = rank === 1 ? 'lime' : rank <= 3 ? 'yellow' : 'neutral'
  return chip(String(rank), { variant: 'caption', color, cls: 'min-w-7 tabular-nums' })
}

/* ------------------------------------------------------------------ structured-entity-showcase.tsx */
const SHOWCASE_LIMIT = 8

/** The answer cards for a Claude/Gemini result list: rank, company avatar, linked title, a separate "Source" chip, an expandable summary. */
export function structuredEntityShowcase(entities: StructuredEntity[], intro?: string): string {
  const hasYou = entities.some((e) => e.isYou)
  const items = entities.map((item, index) => {
    const rankNum = item.rank ?? index + 1
    const href = item.sourceUrl || item.url || (item.domain ? siteHref(item.domain) : undefined)
    const showSource = Boolean(item.sourceDomain)
    const long = (item.description?.length ?? 0) > 200
    const logo = item.domain
      ? `<span class="mt-px inline-flex">${domainLogo(item.domain, 20, item.isYou)}</span>`
      : `<span class="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-background-tertiary-default text-caption-2-semibold uppercase text-text-secondary">${esc(item.name.trim().charAt(0) || '?')}</span>`
    const nameCls = 'min-w-0 break-words text-body-2-semibold leading-snug text-text-primary'
    const title = href
      ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="${nameCls} hover:text-accent-700 hover:underline">${esc(item.name)}</a>`
      : `<span class="${nameCls}">${esc(item.name)}</span>`
    const srcDomain = item.sourceDomain || item.domain
    const source = showSource || item.domain
      ? `<a ${href ? `href="${esc(href)}"` : ''} target="_blank" rel="noopener noreferrer" ${showSource ? 'title="The page the answer found this on"' : ''} class="ml-7 inline-flex max-w-[calc(100%-1.75rem)] items-center gap-1.5 rounded-md bg-background-tertiary-default px-1.5 py-0.5 text-caption-1-regular text-text-secondary hover:bg-background-secondary-hover">${showSource ? '<span class="shrink-0 text-text-tertiary">Source</span>' : ''}${domainLogo(srcDomain, 14)}<span class="truncate font-mono">${esc(srcDomain)}</span>${ri('RiExternalLinkLine', 'h-3 w-3 shrink-0 text-text-tertiary')}</a>`
      : ''
    const desc = item.description
      ? `<div class="ml-7"><p class="${cx('text-caption-1-regular leading-relaxed text-text-secondary', long && 'line-clamp-3')}">${esc(item.description)}</p>${long ? '<button type="button" data-sc-desc class="mt-0.5 text-caption-1-medium text-accent-700 hover:underline">Show more</button>' : ''}</div>`
      : ''
    const tags = item.tags && item.tags.length ? `<div class="ml-7 flex flex-wrap gap-1">${item.tags.map((t) => `<span class="rounded bg-background-tertiary-default px-1.5 py-0.5 text-caption-2-regular text-text-secondary">${esc(t)}</span>`).join('')}</div>` : ''
    return `<li ${index >= SHOWCASE_LIMIT ? 'data-sc-extra hidden' : ''} class="${cx('grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-xl border p-4 transition-colors', item.isYou ? 'border-accent-200 bg-accent-50' : 'border-separator-border bg-background-full hover:bg-background-secondary-default')}">
      <span class="${cx('mt-0.5 flex h-6 w-6 items-center justify-center rounded-md text-caption-1-semibold tabular-nums', item.isYou ? 'bg-accent-600 text-text-white' : 'bg-background-tertiary-default text-text-secondary')}">${rankNum}</span>
      <div class="min-w-0 space-y-1.5">
        <div class="flex items-start gap-2">${logo}<div class="flex min-w-0 flex-1 flex-wrap items-start gap-x-2 gap-y-1">${title}${item.isYou ? tag('You', 'violet') : ''}</div></div>
        ${source}${desc}${tags}
      </div></li>`
  }).join('')
  return `<div data-showcase class="space-y-3">
    ${intro ? `<p class="text-body-2-regular leading-relaxed text-text-secondary">${esc(intro)}</p>` : ''}
    <div class="flex items-center justify-between gap-2 text-caption-1-regular text-text-secondary"><span class="font-medium uppercase tracking-wider">${entities.length} result${entities.length === 1 ? '' : 's'} returned</span>${hasYou ? '<span class="text-accent-700">Your pages are highlighted</span>' : ''}</div>
    <ol class="space-y-2">${items}</ol>
    ${entities.length > SHOWCASE_LIMIT ? `<button type="button" data-sc-all="${entities.length}" class="w-full rounded-lg border border-separator-border bg-background-full py-1.5 text-caption-1-medium text-text-secondary hover:bg-background-secondary-hover">Show all ${entities.length} results</button>` : ''}
  </div>`
}

/** Makes `structuredEntityShowcase` cards (show all / show more) interactive inside `root`. Safe to call repeatedly. */
export function wireAnswerBody(root: HTMLElement): void {
  if (root.dataset.answerWired) return
  root.dataset.answerWired = '1'
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const all = t.closest<HTMLElement>('[data-sc-all]')
    if (all) {
      const host = all.closest<HTMLElement>('[data-showcase]')
      const open = all.dataset.scOpen !== '1'
      host?.querySelectorAll<HTMLElement>('[data-sc-extra]').forEach((li) => { li.hidden = !open })
      all.dataset.scOpen = open ? '1' : '0'
      all.textContent = open ? 'Show fewer' : `Show all ${all.dataset.scAll} results`
      return
    }
    const d = t.closest<HTMLElement>('[data-sc-desc]')
    if (d) {
      const p = d.previousElementSibling as HTMLElement
      const clamped = p.classList.toggle('line-clamp-3')
      d.textContent = clamped ? 'Show more' : 'Show less'
    }
  })
}

/* ------------------------------------------------------------------ brand highlighting inside the answer text */
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function brandChip(m: ChatMention, text: string, compact?: boolean): string {
  return `<span class="${cx('mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 align-baseline font-medium text-text-primary', compact ? 'py-0 text-caption-1-regular' : 'py-px', m.is_you ? 'bg-accent-100 ring-1 ring-accent-200' : 'bg-status-yellow-background')}">${m.domain ? domainLogo(m.domain, compact ? 12 : 14, m.is_you) : ''}${text}</span>`
}

function brandify(text: string, mentions: ChatMention[], re: RegExp | null, compact?: boolean): string {
  const safe = esc(text)
  if (!re) return safe
  const by = new Map(mentions.map((m) => [norm(m.name), m]))
  return safe.split(re).map((part, i) => {
    const m = i % 2 === 1 ? by.get(norm(part)) : undefined
    return m ? brandChip(m, part, compact) : part
  }).join('')
}

/** Short or generic link text ("Website", "centerline.net") becomes a compact pill with the site's favicon; a link inside a sentence stays a plain link. */
function answerLink(href: string, label: string, compact?: boolean): string {
  const host = hostOf(href)
  const generic = /^(website|link|source|sources?|read more|learn more|visit( site| website)?)$/i.test(label.trim())
  if (host && (generic || label.length <= (compact ? 60 : 28))) {
    return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="${cx('mx-0.5 inline-flex items-center gap-1 rounded-md border border-separator-border bg-background-full px-1.5 align-baseline !text-accent-700 !no-underline shadow-2xs hover:border-accent-200 hover:bg-accent-50', compact ? 'py-0 text-caption-2-medium' : 'gap-1.5 py-px text-caption-1-medium')}">${domainLogo(host, compact ? 12 : 13)}${esc(generic ? host : label)}${ri('RiExternalLinkLine', 'h-3 w-3 text-accent-600')}</a>`
  }
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
}

/** One answer's body: the structured result cards for Claude/Gemini lists, otherwise the prose with brands marked inline. */
export function answerBody(chat: Chat, compact?: boolean): string {
  if (chat.entities?.length) return structuredEntityShowcase(chat.entities, chat.intro)
  const names = Array.from(new Set(chat.mentions.map((m) => m.name).filter((n) => n.trim().length >= 3))).sort((a, b) => b.length - a.length)
  const re = names.length ? new RegExp(`(?<![\\w.@/-])(${names.map(escRe).join('|')})(?![\\w-]|\\.[a-z])`, 'gi') : null
  const inline = (s: string) => {
    let out = ''
    let at = 0
    for (const m of s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      out += brandify(s.slice(at, m.index), chat.mentions, re, compact) + answerLink(m[2], m[1], compact)
      at = (m.index ?? 0) + m[0].length
    }
    return out + brandify(s.slice(at), chat.mentions, re, compact)
  }
  const blocks = chat.text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  const body = blocks.map((b) => {
    const h = /^###\s+(\d{1,2})[.)]\s+(.*)$/.exec(b)
    if (h) {
      return compact
        ? `<h3 class="mb-1 mt-4 flex items-start gap-2 border-t border-separator-border pt-3 text-body-2-semibold leading-snug text-text-primary first:mt-0 first:border-0 first:pt-0"><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-background-tertiary-default text-caption-2-semibold tabular-nums text-text-secondary">${h[1]}</span><span class="min-w-0">${inline(h[2])}</span></h3>`
        : `<h3 class="mb-2 mt-7 flex items-start gap-2.5 border-t border-separator-border pt-5 text-headline-semibold leading-snug text-text-primary first:mt-0 first:border-0 first:pt-0"><span class="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background-tertiary-default text-caption-1-semibold tabular-nums text-text-secondary">${h[1]}</span><span class="min-w-0">${inline(h[2])}</span></h3>`
    }
    return `<p class="${compact ? 'my-1 first:mt-0 last:mb-0' : 'my-2.5 first:mt-0 last:mb-0'}">${inline(b)}</p>`
  }).join('')
  return `<div class="${cx('min-w-0 break-words [overflow-wrap:anywhere] text-text-primary [&_a]:text-accent-700 [&_a]:underline [&_a]:decoration-accent-200 [&_a]:underline-offset-2 hover:[&_a]:decoration-accent-600', compact ? 'max-w-none text-body-2-regular leading-[1.65]' : 'max-w-3xl text-body-regular leading-7')}">${body}</div>`
}

/* ------------------------------------------------------------------ details panel */
export function chatDetails(chat: Chat, allSources: boolean): string {
  const sources = allSources ? chat.sources : chat.sources.slice(0, 8)
  const brands = chat.mentions.length
    ? `<ul class="space-y-1">${chat.mentions.map((m, i) => `<li class="${cx('flex items-center gap-2.5 rounded-lg px-2 py-1.5', m.is_you ? 'bg-accent-50 ring-1 ring-accent-200' : 'hover:bg-background-full')}">${brandAvatar(m)}<span class="min-w-0 flex-1 truncate text-body-2-medium text-text-primary">${esc(m.name)}</span>${m.is_you ? tag('You', 'violet') : ''}${m.role === 'mentioned' ? '<span class="text-caption-2-regular text-text-tertiary">mentioned</span>' : ''}<span class="w-5 text-right text-caption-1-regular tabular-nums text-text-tertiary">${i + 1}</span></li>`).join('')}</ul>`
    : '<p class="text-caption-1-regular text-text-tertiary">No brands detected in this answer.</p>'
  const src = chat.sources.length
    ? `<ul class="space-y-1">${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-background-full"><span class="mt-0.5 inline-flex">${domainLogo(s.domain, 20)}</span><span class="min-w-0 flex-1"><span class="line-clamp-2 text-body-2-medium leading-snug text-text-primary group-hover:text-accent-700">${esc(s.title || s.domain)}</span><span class="mt-0.5 block truncate text-caption-1-regular text-text-secondary">${esc(displayUrl(s.url))}</span></span>${ri('RiExternalLinkLine', 'mt-1 h-3.5 w-3.5 shrink-0 text-text-tertiary group-hover:text-accent-600')}</a></li>`).join('')}</ul>${chat.sources.length > 8 ? `<button type="button" data-chat-sources class="mt-1.5 w-full rounded-lg py-1.5 text-caption-1-medium text-accent-700 hover:bg-background-full">${allSources ? 'Show fewer' : `Show all ${chat.sources.length} sources`}</button>` : ''}`
    : '<p class="text-caption-1-regular text-text-tertiary">This answer cited no sources.</p>'
  return `<aside class="flex max-h-[38%] min-h-0 shrink-0 flex-col border-t border-separator-border bg-background-secondary-default md:max-h-none md:w-[320px] md:border-l md:border-t-0" aria-label="Details">
    <div class="flex items-center justify-between px-5 py-4"><h3 class="text-body-semibold text-text-primary">Details</h3>${closeButton({ size: 'sm', label: 'Close', cls: 'hidden md:inline-flex', attrs: 'data-overlay-close' })}</div>
    <div data-lenis-prevent class="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5">
      <section><h4 class="mb-2 text-caption-1-medium uppercase tracking-wider text-text-secondary">Brands <span class="tabular-nums text-text-tertiary">${chat.mentions.length}</span></h4>${brands}</section>
      <section><h4 class="mb-2 text-caption-1-medium uppercase tracking-wider text-text-secondary">Sources <span class="tabular-nums text-text-tertiary">${chat.sources.length}</span></h4>${src}</section>
    </div></aside>`
}

/** Model switcher: one pill per engine that answered this prompt; the active one is tinted with the engine's colour. */
export function engineSwitcher(engines: string[], active: string): string {
  return `<div role="tablist" aria-label="Switch model" class="inline-flex items-center gap-0.5 rounded-xl bg-background-tertiary-default p-0.5">${engines.map((e) => {
    const on = e.toLowerCase() === active.toLowerCase()
    return `<button type="button" role="tab" aria-selected="${on}" data-chat-engine="${esc(e)}" class="${cx('inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-body-2-medium transition-colors', on ? 'text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary')}"${on ? ` style="background:${ENGINE_META[e]?.soft ?? ''}"` : ''}>${engineLogo(e, 16)}${esc(e)}</button>`
  }).join('')}</div>`
}

/* ------------------------------------------------------------------ the modal */
export interface ChatModalState {
  chat: Chat | undefined
  prompt: string
  engines: string[]
  allSources: boolean
  nav: { hasPrev: boolean; hasNext: boolean; prevLabel: string; nextLabel: string; counter: string }
}

/** `ChatModal`: header (model switcher, date, position), the conversation, Previous / Next, and the Details panel. Buttons carry `data-chat-prev|next|engine|sources`. */
export function chatModalHtml(st: ChatModalState): string {
  const { chat } = st
  const engine = chat?.engine ?? st.engines[0]
  const meta = ENGINE_META[engine]
  const header = `<header class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-separator-border px-5 py-4">
    ${st.engines.length > 1 ? engineSwitcher(st.engines, engine) : `<span class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-body-semibold text-text-primary" style="background:${meta?.soft ?? ''}">${engineLogo(engine, 18)}${esc(engine)}</span>`}
    <span class="text-caption-1-regular text-text-secondary">${chat ? fullDate(chat.ts) : ''}</span>
    <span class="inline-flex items-center gap-1.5 text-caption-1-regular text-text-secondary">Position ${positionBadge(chat?.rank ?? null, chat?.cited ?? false)}</span>
    <div class="ml-auto flex items-center gap-2">${closeButton({ size: 'sm', label: 'Close', cls: 'md:hidden', attrs: 'data-overlay-close data-autofocus' })}</div>
  </header>`
  const convo = `<div data-lenis-prevent data-keep-scroll class="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
    <div class="mb-6 flex items-start justify-end gap-3"><div class="max-w-[88%] rounded-2xl rounded-tr-md bg-background-tertiary-default px-4 py-3 text-body-regular text-text-primary">${esc(st.prompt)}</div><span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-text-secondary">${ri('RiUserFill', 'size-4')}</span></div>
    <div class="flex items-start gap-3"><span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-separator-border bg-background-full">${engineLogo(engine, 17)}</span><div class="min-w-0 flex-1">${chat ? answerBody(chat) : ''}</div></div>
  </div>`
  const footer = `<footer class="flex items-center justify-between border-t border-separator-border px-5 py-3">
    ${button(st.nav.prevLabel, { variant: 'secondary', size: 'small', leadingIcon: 'RiArrowLeftLine', disabled: !st.nav.hasPrev, attrs: 'data-chat-prev' })}
    <span class="text-caption-1-regular tabular-nums text-text-tertiary">${esc(st.nav.counter)}</span>
    ${button(st.nav.nextLabel, { variant: 'secondary', size: 'small', trailingIcon: 'RiArrowRightLine', disabled: !st.nav.hasNext, attrs: 'data-chat-next' })}
  </footer>`
  return dialogShell({
    label: `${engine} answer`,
    size: '2xl',
    cls: '!gap-0 !py-0 h-[min(800px,92vh)] md:flex-row',
    children: `<div class="flex min-h-0 min-w-0 flex-1 flex-col">${header}${convo}${footer}</div>${chat ? chatDetails(chat, st.allSources) : ''}`,
  })
}
