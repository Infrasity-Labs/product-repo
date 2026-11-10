/*
 * In-page overlay used by the answer modal, the result side panel and the cluster "Open prompts" dialog.
 * Lives on <body> inside its own `.app` wrapper (so fixed positioning ignores any transformed ancestor), closes on
 * Escape / backdrop press / `[data-overlay-close]`, locks body scroll and returns focus to the opener.
 */
export interface Overlay {
  el: HTMLElement
  close: () => void
  /** Replace the contents; `wire` runs again afterwards. Focus on the dialog is kept. */
  update: (html: string) => void
}

const stack: Overlay[] = []

export function openOverlay(o: {
  html: string
  wire?: (el: HTMLElement, overlay: Overlay) => void
  onKey?: (e: KeyboardEvent) => void
  onClose?: () => void
}): Overlay {
  const opener = document.activeElement as HTMLElement | null
  const el = document.createElement('div')
  el.className = 'app'
  el.dataset.lenisPrevent = ''
  const prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  const focusDialog = () => {
    const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>('[role=dialog]')
    if (target?.getAttribute('role') === 'dialog') target.style.outline = 'none'
    target?.focus({ preventScroll: true })
  }
  const overlay: Overlay = {
    el,
    close: () => {
      const i = stack.indexOf(overlay)
      if (i < 0) return
      stack.splice(i, 1)
      document.removeEventListener('keydown', onKey, true)
      el.remove()
      document.body.style.overflow = prevOverflow
      o.onClose?.()
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    },
    update: (html) => {
      const scrolls = [...el.querySelectorAll<HTMLElement>('[data-keep-scroll]')].map((s) => s.scrollTop)
      el.innerHTML = html
      el.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((s, i) => { s.scrollTop = scrolls[i] ?? 0 })
      o.wire?.(el, overlay)
    },
  }

  const onKey = (e: KeyboardEvent) => {
    if (stack[stack.length - 1] !== overlay) return
    if (e.key === 'Escape') { e.preventDefault(); overlay.close(); return }
    if (e.key === 'Tab') {
      const items = [...el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select,input,[tabindex="0"]')].filter((n) => n.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === el.querySelector('[role=dialog]'))) { e.preventDefault(); lastItem.focus() }
      else if (!e.shiftKey && active === lastItem) { e.preventDefault(); first.focus() }
      return
    }
    const t = e.target as HTMLElement | null
    if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return
    o.onKey?.(e)
  }

  el.addEventListener('mousedown', (e) => {
    const t = e.target as HTMLElement
    if (t.hasAttribute('data-overlay-backdrop') && t === e.target) overlay.close()
  })
  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-overlay-close]')) overlay.close()
  })

  document.body.appendChild(el)
  stack.push(overlay)
  document.addEventListener('keydown', onKey, true)
  el.innerHTML = o.html
  o.wire?.(el, overlay)
  focusDialog()
  return overlay
}

/* ------------------------------------------------------------------ BoardUI Modal shell (components/base/modal/modal.tsx) */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
const DIALOG_WIDTH: Record<DialogSize, string> = { sm: 'max-w-[400px]', md: 'max-w-[480px]', lg: 'max-w-[640px]', xl: 'max-w-[800px]', '2xl': 'max-w-[1040px]' }

/**
 * A centred BoardUI dialog on a black/70 backdrop: `<ModalOverlay><backdrop/><Modal><Dialog className>children</Dialog></Modal></ModalOverlay>`.
 * Close it with `[data-overlay-close]` or a backdrop press (both handled by `openOverlay`).
 */
export function dialogShell(o: { label: string; size?: DialogSize; cls?: string; children: string }): string {
  return `<div data-overlay-backdrop class="group/modal fixed inset-x-0 top-0 z-100 flex h-screen items-center justify-center p-4 sm:p-6">
    <div data-overlay-backdrop aria-hidden="true" class="absolute inset-0 bg-black/70"></div>
    <div class="relative flex max-h-full w-full flex-col outline-none ${DIALOG_WIDTH[o.size ?? 'md']}">
      <div role="dialog" aria-modal="true" tabindex="-1" aria-label="${o.label.replace(/"/g, '&quot;')}" class="flex min-h-0 flex-col gap-4 overflow-clip py-6 outline-none rounded-3xl border border-separator-border bg-background-full shadow-xs ${o.cls ?? ''}">${o.children}</div>
    </div></div>`
}
