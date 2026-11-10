/*
 * Shared GEO page parts: status meta + prompt status chip (`dash/prompt-dialog.tsx`), the per-engine result cell and the
 * pager (`dash/cluster-sections.tsx` → `EngineCell`, `Pager`). Pagers are wired with `wirePager(root, id, cb)`.
 */
import { cx } from './base'
import { dashButton, type DashTone } from './dash-ui'
import type { PromptRow } from './data'

type StatusTone = Extract<DashTone, 'good' | 'warn' | 'bad' | 'neutral'>
export const STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  owned: { label: 'Owned', tone: 'good' },
  weak: { label: 'Cited, not first', tone: 'warn' },
  dropped: { label: 'Dropped', tone: 'bad' },
  missing: { label: 'Never cited', tone: 'neutral' },
}
/** A prompt with no answers yet (added since the last scan, or its cluster is not being scanned) is "not scanned yet", not "never cited". */
export const NOT_SCANNED: { label: string; tone: StatusTone } = { label: 'Not scanned yet', tone: 'neutral' }
export const statusFor = (p: { status: string; answers: number }) => (p.answers === 0 ? NOT_SCANNED : STATUS_META[p.status])

/** One prompt × engine cell: rank when cited, ✓ when cited without a rank, × when not cited, ? when there is no scan. */
export function engineCell(p: PromptRow, engine: string): string {
  const e = p.by_engine.find((x) => x.engine === engine)
  if (!e || e.answers === 0) return `<span title="${engine}: no recent scan" class="inline-grid h-6 w-7 place-items-center rounded-md border border-status-yellow-text/30 bg-status-yellow-background text-caption-2-regular font-semibold text-status-yellow-text">?</span>`
  if (e.cited_answers === 0) return `<span title="${engine}: not cited" class="inline-grid h-6 w-7 place-items-center rounded-md border border-status-rose-text/30 bg-status-rose-background text-caption-2-regular font-semibold text-status-rose-text">&times;</span>`
  return `<span title="${engine}: cited${e.rank != null ? ` at #${e.rank}` : ''}" class="inline-grid h-6 w-7 place-items-center rounded-md border border-status-lime-text/30 bg-status-lime-background text-caption-2-regular font-semibold tabular-nums text-status-lime-text">${e.rank != null ? e.rank : '✓'}</span>`
}

/** Footer pager ("Showing 1–20 of 52 prompts" + Previous / numbers / Next). Empty when everything fits on one page. */
export function pager(id: string, page: number, pages: number, total: number, pageSize: number, noun: string): string {
  if (total <= pageSize) return ''
  const nums: Array<number | '…'> = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return `<footer data-pager="${id}" class="flex flex-wrap items-center justify-between gap-2 border-t border-separator-border px-5 py-3 text-caption-1-regular text-text-secondary">
    <span class="tabular-nums">Showing ${from}&ndash;${to} of ${total} ${noun}</span>
    <nav aria-label="Pages" class="flex items-center gap-1">
      ${dashButton('Previous', { size: 'small', leadingIcon: 'RiArrowLeftSLine', disabled: page === 1, attrs: `data-pg="${page - 1}"` })}
      ${nums.map((n) => (n === '…' ? '<span class="px-1 text-text-tertiary">&hellip;</span>' : `<button type="button" data-pg="${n}" ${n === page ? 'aria-current="page"' : ''} class="${cx('h-7 min-w-7 rounded-md px-2 text-caption-1-regular font-medium tabular-nums', n === page ? 'bg-accent-600 text-text-white' : 'text-text-secondary hover:bg-background-secondary-default')}">${n}</button>`)).join('')}
      ${dashButton('Next', { size: 'small', trailingIcon: 'RiArrowRightSLine', disabled: page === pages, attrs: `data-pg="${page + 1}"` })}
    </nav>
  </footer>`
}

/** Delegated click wiring for every `pager(id, …)` under `root`. */
export function wirePager(root: HTMLElement, id: string, cb: (page: number) => void): void {
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(`[data-pager="${id}"] [data-pg]`)
    if (b && !b.hasAttribute('disabled')) cb(Number(b.dataset.pg))
  })
}
