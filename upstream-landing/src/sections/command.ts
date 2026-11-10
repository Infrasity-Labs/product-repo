import '../styles/ops.css'
import { appFrame } from '../app/frame'
import { statStrip, clustersTable, movedCard, actionsCard, mountOverview } from '../app/overview-cards'

export const id = 'command'

export function render(host: HTMLElement): void {
  host.innerHTML = `<div class="wrap">
    <h2 class="h2" data-r style="max-width:18ch"><span class="ink">Built for teams that act on the data every week.</span></h2>
    <p class="lead" data-r>Track runs, share what changed and keep everyone on the same citation numbers.</p>

    <div class="op-stack">
      <article class="op-big" data-r>
        <h3 class="op-title">Track every scan with the Command Center</h3>
        <p class="op-sub">See how citations, engines and prompt clusters are moving across your team.</p>
        <div class="op-frame">${appFrame(`<div class="space-y-4">${statStrip()}${clustersTable()}</div>`, { height: 520, fit: 1080 })}</div>
      </article>

      <div class="op-pair">
        <article data-r>
          <h3 class="op-title">Know what moved</h3>
          <p class="op-sub">The prompts and pages that gained or lost citations since the last scan.</p>
          <div class="op-frame">${appFrame(movedCard(), { height: 420, fit: 820 })}</div>
        </article>
        <article data-r>
          <h3 class="op-title">Know what to do next</h3>
          <p class="op-sub">Recommended actions, ranked by how many prompts each one affects.</p>
          <div class="op-frame">${appFrame(actionsCard(), { height: 420, fit: 820 })}</div>
        </article>
      </div>
    </div>
  </div>`

  mountOverview(host)
}
