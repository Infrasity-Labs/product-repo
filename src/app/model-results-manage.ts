/* Port of the real app's `manage/manage-ui.tsx` building blocks (ManageDialog shell, buttons, Field, ErrorNote, PopMenu) as HTML strings. */
import { ri } from '../lib/icons'
import { closeButton } from './base'
import { dialogShell } from './model-results-overlay'
import { esc } from './ui'

const btnBase = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-body-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:cursor-not-allowed disabled:opacity-50'
export const btnPrimary = `${btnBase} bg-button-primary text-text-white shadow-xs hover:opacity-90`
export const btnGhost = `${btnBase} border border-border-button-default bg-background-primary-default text-text-primary shadow-xs hover:bg-background-primary-hover`
export const btnDanger = `${btnBase} bg-button-danger text-text-white shadow-xs hover:opacity-90`
export const inputCls = 'w-full rounded-lg border border-border-button-default bg-background-full px-3 py-2 text-body-regular text-text-primary placeholder:text-text-tertiary outline-none transition-colors hover:border-border-button-hover focus:ring-2 focus:ring-border-focus-ring'

export const spinnerIcon = () => ri('RiLoader4Line', 'size-4 animate-spin')

export const field = (label: string, control: string, htmlFor: string, hint = '') =>
  `<div class="space-y-1.5"><label for="${htmlFor}" class="block text-body-medium text-text-primary">${label}</label>${control}${hint ? `<p class="text-caption-1-regular text-text-tertiary">${hint}</p>` : ''}</div>`

export const errorNote = (children: string) =>
  `<div role="alert" class="rounded-lg border border-status-rose-text/20 bg-status-rose-background px-3 py-2 text-body-regular text-status-rose-text">${children}</div>`

/** BoardUI Modal wrapper (`ManageDialog`): ModalHeader (title + description + close), ModalBody, ModalFooter. */
export function manageDialogHtml(o: { title: string; description?: string; body: string; footer?: string; wide?: boolean }) {
  return dialogShell({
    label: o.title.replace(/<[^>]*>/g, ''),
    size: o.wide ? 'lg' : 'md',
    children: `<div class="flex shrink-0 items-start gap-3 px-6">
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 class="text-title-3-medium text-text-primary">${o.title}</h2>
          ${o.description ? `<p class="mt-1 text-body-regular text-text-secondary">${o.description}</p>` : ''}
        </div>
        ${closeButton({ size: 'sm', label: 'Close', cls: '-me-1 shrink-0', attrs: 'data-overlay-close' })}
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col"><div data-lenis-prevent data-keep-scroll class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-2 text-body-regular text-text-secondary">${o.body}</div></div>
      ${o.footer ? `<div class="mt-2 flex shrink-0 flex-col-reverse gap-2 px-6 sm:flex-row sm:items-center sm:justify-end">${o.footer}</div>` : ''}`,
  })
}

/* ------------------------------------------------------------------ PopMenu (kebab menu) */
export interface MenuItem { label: string; action: string; icon?: string; danger?: boolean; disabled?: boolean; divider?: boolean }

/** The kebab button of `PopMenu`. Wire with `wirePopMenu(root, onSelect)`; the items are rendered into a fixed-position panel so a table's scroller can't clip it. */
export function popMenu(items: MenuItem[], label = 'More actions', id = ''): string {
  return `<button type="button" data-popmenu="${esc(JSON.stringify(items))}" ${id ? `data-popmenu-id="${esc(id)}"` : ''} aria-label="${esc(label)}" aria-haspopup="menu" aria-expanded="false" class="inline-flex size-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-background-secondary-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">${ri('RiMoreFill', 'size-5')}</button>`
}

let menuPanel: HTMLElement | null = null
let menuBtn: HTMLElement | null = null
const closeMenu = () => { menuPanel?.remove(); menuBtn?.setAttribute('aria-expanded', 'false'); menuPanel = null; menuBtn = null }

/** Delegated wiring: a click on any `[data-popmenu]` inside `root` opens its menu; `onSelect(action, btn)` runs on a pick. */
export function wirePopMenu(root: HTMLElement, onSelect: (action: string, btn: HTMLElement) => void): void {
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-popmenu]')
    if (!btn || !root.contains(btn)) return
    e.stopPropagation()
    if (menuBtn === btn) { closeMenu(); return }
    closeMenu()
    const items = JSON.parse(btn.dataset.popmenu as string) as MenuItem[]
    const r = btn.getBoundingClientRect()
    const width = 220
    const left = Math.max(8, r.right - width)
    const est = items.length * 36 + 12
    const top = r.bottom + 6 + est > innerHeight ? Math.max(8, r.top - est - 6) : r.bottom + 6
    const wrap = document.createElement('div')
    wrap.className = 'app'
    wrap.innerHTML = `<div role="menu" style="top:${top}px;left:${left}px;width:${width}px" class="fixed z-[120] rounded-xl border border-separator-border bg-background-full p-1.5 shadow-lg">${items.map((it) => `<div>${it.divider ? '<div class="my-1 border-t border-separator-border"></div>' : ''}<button type="button" role="menuitem" data-pm-action="${esc(it.action)}" ${it.disabled ? 'disabled' : ''} class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-body-regular transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${it.danger ? 'text-status-rose-text hover:bg-status-rose-background' : 'text-text-primary hover:bg-background-secondary-hover'}">${it.icon ? `<span class="shrink-0 text-text-tertiary">${it.icon}</span>` : ''}${esc(it.label)}</button></div>`).join('')}</div>`
    document.body.appendChild(wrap)
    menuPanel = wrap
    menuBtn = btn
    btn.setAttribute('aria-expanded', 'true')
    wrap.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-pm-action]')
      if (!b) return
      ev.stopPropagation()
      const anchor = menuBtn as HTMLElement
      closeMenu()
      onSelect(b.dataset.pmAction as string, anchor)
    })
    const away = (ev: Event) => {
      if (wrap.contains(ev.target as Node) || btn.contains(ev.target as Node)) return
      closeMenu(); document.removeEventListener('mousedown', away, true)
    }
    document.addEventListener('mousedown', away, true)
    document.addEventListener('keydown', function esc2(ev) { if (ev.key === 'Escape' || !wrap.isConnected) { closeMenu(); document.removeEventListener('keydown', esc2) } })
  })
}

