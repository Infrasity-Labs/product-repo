import '../styles/showcase.css'
import { appFrame } from '../app/frame'
import { promptsTableCard, mountPromptsTable } from '../app/pages/prompts'
import { engineCards, clustersByEngineCard } from '../app/pages/engines'

export const id = 'context'

export function render(host: HTMLElement): void {
  host.innerHTML = `
  <div class="wrap">
    <h2 class="h2" data-r><span class="ink">Underpinned by the context devtool marketers need.</span></h2>
    <p class="sc-lead" data-r>Every AI Search signal and a living synthesis of your brand's data.</p>
    <div class="sc-cx">
      <article class="sc-card" data-r>
        <div data-prompts>${appFrame(promptsTableCard(), { height: 440, fit: 860 })}</div>
        <div class="sc-card__text">
          <h3 class="sc-card__title">Know what people are asking AI</h3>
          <p class="sc-card__sub">Every prompt in your category, with volume and movement, so you chase the questions that matter.</p>
          <a class="pill pill--line pill--sm" href="#product">See Prompts</a>
        </div>
      </article>
      <article class="sc-card" data-r>
        ${appFrame(`<div class="space-y-3">${engineCards()}${clustersByEngineCard()}</div>`, { height: 440, fit: 860 })}
        <div class="sc-card__text">
          <h3 class="sc-card__title">Understand what AI says back</h3>
          <p class="sc-card__sub">See how each engine describes you, who it recommends instead, and why.</p>
          <a class="pill pill--line pill--sm" href="#engines">See Model results</a>
        </div>
      </article>
    </div>
  </div>`

  mountPromptsTable(host.querySelector<HTMLElement>('[data-prompts]')!)
}
