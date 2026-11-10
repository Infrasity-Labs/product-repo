/* "Manage competitors" dialog of the Sources page (main's `manage/competitor-controls.tsx` → EditDomainsDialog, kind "competitors"). */
import { ri } from '../lib/icons'
import { esc } from './base'
import { btnGhost, btnPrimary, errorNote, field, inputCls, manageDialogHtml } from './model-results-manage'
import { openOverlay } from './model-results-overlay'
import type { Overlay } from './model-results-overlay'
import { activeClusters, competitorLists } from './sources-overview-data'
import { domainLogo } from './ui'

export function openManageCompetitors(initial: string, onSaved: () => void): void {
  const first = activeClusters[0].slug
  const st = { slug: competitorLists[initial] ? initial : first, items: [...(competitorLists[initial] ?? competitorLists[first])], input: '', error: '', applyAll: false }
  const render = () => {
    const cluster = activeClusters.find((c) => c.slug === st.slug) ?? activeClusters[0]
    const dirty = JSON.stringify([...st.items].sort()) !== JSON.stringify([...competitorLists[st.slug]].sort())
    const picker = field('Cluster', `<select id="mc-cluster" class="${inputCls}" data-mc-cluster>${activeClusters.map((c) => `<option value="${c.slug}"${c.slug === st.slug ? ' selected' : ''}>${esc(c.name)} (${competitorLists[c.slug].length})</option>`).join('')}</select>`, 'mc-cluster')
    const list = st.items.length
      ? `<ul class="divide-y divide-separator-border rounded-xl border border-separator-border">${st.items.map((d) => `<li class="flex items-center gap-2.5 px-3 py-2">${domainLogo(d, 20)}<span class="min-w-0 flex-1 truncate text-body-regular text-text-primary">${esc(d)}</span><button type="button" data-mc-remove="${esc(d)}" aria-label="Remove ${esc(d)}" class="rounded-lg p-1 text-text-tertiary hover:bg-status-rose-background hover:text-status-rose-text">${ri('RiCloseLine', 'size-4')}</button></li>`).join('')}</ul>`
      : '<p class="rounded-xl border border-dashed border-separator-border px-3 py-6 text-center text-body-regular text-text-tertiary">None yet. Add a domain above.</p>'
    return manageDialogHtml({
      title: `Competitors · ${esc(cluster.name)}`,
      description: 'Domains we tag as rivals when they are cited in this cluster.',
      body: `${picker}${st.error ? errorNote(st.error) : ''}
        <div class="flex gap-2"><input data-mc-input data-autofocus class="${inputCls}" value="${esc(st.input)}" placeholder="example.com" aria-label="Add a competitor domain"/><button type="button" data-mc-add class="${btnGhost}">${ri('RiAddLine', 'size-4')}Add</button></div>
        ${list}
        <label class="flex items-center gap-2 text-body-regular text-text-secondary"><input type="checkbox" data-mc-all ${st.applyAll ? 'checked' : ''} class="size-4 rounded border-border-button-default accent-[var(--color-accent-600)]"/>Apply this list to all ${activeClusters.length} clusters</label>`,
      footer: `<button type="button" data-overlay-close class="${btnGhost}">Cancel</button><button type="button" data-mc-save class="${btnPrimary}" ${dirty || st.applyAll ? '' : 'disabled'}>Save</button>`,
    })
  }
  const wire = (el: HTMLElement, o: Overlay) => {
    const redraw = () => { o.update(render()); el.querySelector<HTMLInputElement>('[data-mc-input]')?.focus() }
    const add = () => {
      const parts = st.input.split(/[\s,]+/).map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter((x) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(x))
      if (!parts.length) { st.error = st.input.trim() ? 'That does not look like a domain. Try example.com.' : ''; redraw(); return }
      st.error = ''
      st.items = Array.from(new Set([...st.items, ...parts]))
      st.input = ''
      redraw()
    }
    el.oninput = (e) => { const t = e.target as HTMLInputElement; if (t.dataset.mcInput != null) st.input = t.value }
    el.onkeydown = (e) => { if (e.key === 'Enter' && (e.target as HTMLElement).dataset.mcInput != null) { e.preventDefault(); add() } }
    el.onchange = (e) => {
      const t = e.target as HTMLInputElement
      if (t.dataset.mcCluster != null) { st.slug = t.value; st.items = [...competitorLists[st.slug]]; st.error = ''; redraw() }
      else if (t.dataset.mcAll != null) { st.applyAll = t.checked; redraw() }
    }
    el.onclick = (e) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-mc-add]')) add()
      const rm = t.closest<HTMLElement>('[data-mc-remove]')
      if (rm) { st.items = st.items.filter((d) => d !== rm.dataset.mcRemove); redraw() }
      if (t.closest('[data-mc-save]')) {
        for (const c of st.applyAll ? activeClusters : activeClusters.filter((x) => x.slug === st.slug)) competitorLists[c.slug] = [...st.items]
        o.close()
        onSaved()
      }
    }
  }
  openOverlay({ html: render(), wire })
}
