import '../styles/proof.css'
import { appFrame } from '../app/frame'
import { trendCard, whoOwnsCard, engineTable, mountOverview } from '../app/overview-cards'
import { modelResultsCard, mountModelResults } from '../app/pages/model-results'
import { redditThreadsCard } from '../app/pages/reddit'

export const id = 'reinforced'

const items = [
  { viz: appFrame(trendCard(), { height: 400, fit: 860 }), title: 'See your visibility move, week by week', body: 'How often engines cite you over time, so you can see the lift after each fix lands.', cta: 'See Overview' },
  { viz: appFrame(modelResultsCard('llm-observability'), { height: 400, fit: 860 }), title: 'Read the full answer each engine gave', body: 'Open any result to read the complete answer, the pages it cited and where it mentions you.', cta: 'See Model results' },
  { viz: appFrame(redditThreadsCard(), { height: 400, fit: 860 }), title: 'Reddit threads engines quote', body: 'The conversations behind your citations, with the engines that quote them.', cta: 'See Reddit' },
  { viz: appFrame(whoOwnsCard(), { height: 340, fit: 860 }), title: 'See who owns the answers', body: 'Which domains engines cite for your prompts, and where your own site stands among rivals and publishers.', cta: 'See Sources' },
  { viz: appFrame(engineTable(), { height: 340, fit: 1060 }), title: 'Track how each engine cites you', body: 'Answers checked, citation rate, and the sources each engine leans on.', cta: 'See Engines' },
]

export function render(host: HTMLElement): void {
  host.classList.add('pf-sec')
  host.innerHTML = `<div class="wrap">
    <p class="label" data-r>06 — Feedback loop</p>
    <h2 class="h2" data-r><span class="ink">Reinforced by every new data point.</span></h2>
    <p class="pf-lead" data-r>Upstream learns what worked and closes the loop between action and result.</p>
    <div class="pf-rf">
      ${items.map((it) => `<article class="pf-cell" data-r>
        <div class="pf-viz">${it.viz}</div>
        <div class="pf-text"><h3>${it.title}</h3><p>${it.body}</p><button type="button" class="pill pill--line pill--sm">${it.cta}</button></div>
      </article>`).join('')}
    </div>
    <p class="pf-note pf-rf__note" data-r>Sample data from Tracewell</p>
  </div>`

  mountOverview(host)
  mountModelResults(host)
}
