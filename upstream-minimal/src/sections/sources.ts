import { brands } from '../data/brands'
import '../styles/compare.css'

export const id = 'sources-host'

const NAMES = ['GitHub', 'Reddit', 'Y Combinator', 'dev.to', 'Hashnode', 'Stack Overflow', 'YouTube', 'Medium']
const colorOf = (hex: string) => (hex === '000000' || hex === '181717' || hex === '0A0A0A' ? '#1b1b1f' : `#${hex}`)

export function render(host: HTMLElement): void {
  const tiles = NAMES.map((t) => brands.find((b) => b.title === t))
    .filter((b): b is (typeof brands)[number] => !!b)
    .map((b) => `<li class="cp-tile" title="${b.title}" aria-label="${b.title}" style="--c:${colorOf(b.hex)}"><svg viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="${b.title}"><path d="${b.path}" fill="currentColor"/></svg></li>`)
    .join('')
  host.innerHTML = `<p class="label label--dim cp-srclabel" data-r>Sources engines cite</p><ul class="cp-tiles" data-r aria-label="Sources engines cite">${tiles}</ul>`
}
