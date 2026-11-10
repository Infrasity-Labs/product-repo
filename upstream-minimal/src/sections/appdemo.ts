import '../styles/appdemo.css'
import { renderApp } from '../app/shell'

export const id = 'product'

/** The #product section is the real GEO dashboard (see src/app/shell.ts), not a mock-up. */
export function render(host: HTMLElement) {
  renderApp(host)
}
