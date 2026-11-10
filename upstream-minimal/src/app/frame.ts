/*
 * Landing sections embed the REAL app cards (from src/app/pages/*.ts and src/app/overview-cards.ts). This wraps them in the
 * `.app` scope (Tailwind utilities + the app's base styles) inside a quiet rounded container.
 *
 *  - `height`: crop to a fixed visual height with a soft fade at the bottom, so a card reads as a glimpse of the product.
 *  - `fit`: the width (px) the card is laid out at, like a screenshot of the app at that width. The app's responsive
 *    breakpoints follow the viewport, not the container, so a card squeezed into a narrow slot would collapse its columns.
 *    With `fit` the card keeps its real desktop layout and is scaled (CSS `zoom`) down to the slot by `fitFrames()`.
 */
export function appFrame(inner: string, o: { height?: number; fit?: number; pad?: boolean; cls?: string } = {}): string {
  const crop = o.height ? `max-height:${o.height}px` : ''
  const body = o.fit ? `<div data-fit-in style="width:${o.fit}px">${inner}</div>` : inner
  return `<div class="app relative overflow-hidden rounded-2xl border border-separator-border bg-background-secondary-default ${o.pad === false ? '' : 'p-3 sm:p-4'} ${o.cls ?? ''}" style="${crop}"${o.fit ? ` data-fit="${o.fit}"` : ''}>
    ${body}
    ${o.height ? '<div class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background-secondary-default via-background-secondary-default/80 to-transparent"></div>' : ''}
  </div>`
}

const watched = new WeakSet<Element>()
let ro: ResizeObserver | null = null

function apply(frame: HTMLElement) {
  const inner = frame.querySelector<HTMLElement>('[data-fit-in]')
  const fit = Number(frame.dataset.fit)
  if (!inner || !fit) return
  const cs = getComputedStyle(frame)
  const room = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  if (room <= 0) return
  // `zoom` shrinks layout as well as paint, so the frame's height crop keeps working in visual pixels.
  inner.style.zoom = String(Math.min(1, room / fit))
}

/** Scale every `appFrame({ fit })` inside `root` to its slot, and keep it scaled on resize. Safe to call repeatedly. */
export function fitFrames(root: ParentNode = document): void {
  ro ??= new ResizeObserver((entries) => entries.forEach((e) => apply(e.target as HTMLElement)))
  root.querySelectorAll<HTMLElement>('[data-fit]').forEach((f) => {
    if (watched.has(f)) return
    watched.add(f)
    ro!.observe(f)
    apply(f)
  })
}
