/* GEO "AI visibility overview": the page body of main's `components/geo/overview/geo-overview.tsx` (filter bar, title row, panels). */
import {
  actionsCard, attentionCard, citationTimeline, clustersTable, engineTable, headlineCard, mountOverview, movedCard, overviewFilters, ownedVsThirdCard,
  pageHeader, statStrip, topPagesCard, whoOwnsCard,
} from '../overview-cards'

export const meta = { id: 'overview', label: 'Overview', icon: 'RiEyeLine', order: 0 }

export function html(): string {
  return `<div class="bg-background-secondary-default text-body-2-regular text-text-primary antialiased">
    ${overviewFilters()}
    <main class="mx-auto max-w-[1760px] space-y-5 px-4 pb-10 pt-5 sm:px-6">
      ${pageHeader()}
      <div class="space-y-5">
        ${headlineCard()}
        ${statStrip()}
        ${citationTimeline()}
        ${clustersTable()}
        <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">${whoOwnsCard()}${movedCard()}</div>
        <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.75fr_1fr]">${actionsCard()}${attentionCard()}</div>
        <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">${topPagesCard()}${ownedVsThirdCard()}</div>
        ${engineTable()}
      </div>
    </main>
  </div>`
}

export function mount(root: HTMLElement): void {
  mountOverview(root)
}
