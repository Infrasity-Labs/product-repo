/*
 * Port of `manage/dialogs.tsx` (AddPromptsDialog, EditPromptDialog, DeletePromptDialog) and `manage/prompt-actions.tsx`.
 * The window has no backend, so the confirm buttons validate like the real ones and then close the dialog.
 */
import { ri } from '../lib/icons'
import { clusters } from './data'
import { btnDanger, btnGhost, btnPrimary, field, inputCls, manageDialogHtml, popMenu } from './model-results-manage'
import { openOverlay } from './model-results-overlay'
import { allPrompts } from './prompts-data'
import { cx, esc } from './ui'

const wireClose = (el: HTMLElement, close: () => void) => el.querySelectorAll<HTMLElement>('[data-md-cancel]').forEach((b) => b.addEventListener('click', close))

/** The kebab menu for one prompt row (wire with `wirePopMenu`; actions are `edit` / `delete`). */
export const promptActions = (prompt: string, clusterSlug: string) =>
  popMenu([
    { label: 'Edit prompt', action: 'edit', icon: ri('RiPencilLine', 'h-4 w-4') },
    { label: 'Delete prompt…', action: 'delete', icon: ri('RiDeleteBinLine', 'h-4 w-4'), danger: true, divider: true },
  ], 'Prompt actions', `${clusterSlug}|${prompt}`)

export function openEditPrompt(prompt: string, clusterSlug: string): void {
  const cluster = clusters.find((c) => c.slug === clusterSlug)
  if (!cluster) return
  const taken = allPrompts.filter((p) => p.cluster_slug === clusterSlug).map((p) => p.prompt)
  openOverlay({
    html: manageDialogHtml({
      title: 'Edit prompt', description: `In ${esc(cluster.name)}. The new wording starts a fresh history.`,
      body: field('Prompt', `<textarea id="ep-text" data-autofocus rows="3" class="${inputCls}">${esc(prompt)}</textarea>`, 'ep-text', '<span data-hint></span>'),
      footer: `<button type="button" class="${btnGhost}" data-md-cancel>Cancel</button><button type="button" class="${btnPrimary}" data-md-save disabled>Save</button>`,
    }),
    wire: (el, o) => {
      wireClose(el, o.close)
      const ta = el.querySelector<HTMLTextAreaElement>('#ep-text')!
      const save = el.querySelector<HTMLButtonElement>('[data-md-save]')!
      const hint = el.querySelector<HTMLElement>('[data-hint]')!
      const check = () => {
        const next = ta.value.trim()
        const dup = !!next && next.toLowerCase() !== prompt.toLowerCase() && taken.some((p) => p.toLowerCase() === next.toLowerCase())
        hint.innerHTML = dup ? '<span class="text-status-rose-text">This prompt already exists in the cluster.</span>' : ''
        save.disabled = !(next.length > 0 && next !== prompt && !dup)
      }
      ta.addEventListener('input', check)
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!save.disabled) o.close() } })
      save.addEventListener('click', o.close)
    },
  })
}

export function openDeletePrompt(prompt: string, clusterSlug: string): void {
  const cluster = clusters.find((c) => c.slug === clusterSlug)
  if (!cluster) return
  openOverlay({
    html: manageDialogHtml({
      title: 'Delete this prompt?', description: `From ${esc(cluster.name)}.`,
      body: `<p class="rounded-lg bg-background-secondary-default px-3 py-2 text-body-regular text-text-primary">${esc(prompt)}</p><p class="text-body-regular text-text-secondary">It stops being scanned and disappears from this page. Past scans of it stay in your history.</p>`,
      footer: `<button type="button" class="${btnGhost}" data-md-cancel>Keep it</button><button type="button" class="${btnDanger}" data-md-save>${ri('RiDeleteBinLine', 'size-4')}Delete prompt</button>`,
    }),
    wire: (el, o) => { wireClose(el, o.close); el.querySelector('[data-md-save]')?.addEventListener('click', o.close) },
  })
}

const parseLines = (text: string, existing: string[]) => {
  const have = new Set(existing.map((p) => p.toLowerCase()))
  const seen = new Set<string>()
  let duplicates = 0
  const fresh: string[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/^[-*\d.)\s]+(?=\S)/, '')
    if (!line) continue
    const k = line.toLowerCase()
    if (have.has(k) || seen.has(k)) { duplicates++; continue }
    seen.add(k)
    fresh.push(line)
  }
  return { fresh, duplicates }
}

export function openAddPrompts(initialCluster?: string): void {
  const opts = clusters.filter((c) => c.enabled || c.prompts > 0)
  const start = initialCluster && opts.some((c) => c.slug === initialCluster) ? initialCluster : opts[0]?.slug ?? ''
  const existing = (slug: string) => allPrompts.filter((p) => p.cluster_slug === slug).map((p) => p.prompt)
  openOverlay({
    html: manageDialogHtml({
      title: 'Add prompts', description: 'The questions we ask each AI engine. One per line.', wide: true,
      body: `${field('Cluster', `<select id="ap-cluster" class="${inputCls}">${opts.map((c) => `<option value="${c.slug}" ${c.slug === start ? 'selected' : ''}>${esc(c.name)} (${c.prompts})</option>`).join('')}</select>`, 'ap-cluster')}
        ${field('Prompts', `<textarea id="ap-text" data-autofocus rows="8" class="${cx(inputCls, 'font-[inherit] leading-relaxed')}" placeholder="Best developer marketing agencies for tech startups&#10;How do I measure ROI on developer marketing?"></textarea>`, 'ap-text', '<span data-hint>Paste a list to add many at once.</span>')}`,
      footer: `<button type="button" class="${btnGhost}" data-md-cancel>Cancel</button><button type="button" class="${btnPrimary}" data-md-save disabled>${ri('RiAddLine', 'size-4')}<span data-md-label>Add prompt</span></button>`,
    }),
    wire: (el, o) => {
      wireClose(el, o.close)
      const sel = el.querySelector<HTMLSelectElement>('#ap-cluster')!
      const ta = el.querySelector<HTMLTextAreaElement>('#ap-text')!
      const save = el.querySelector<HTMLButtonElement>('[data-md-save]')!
      const hint = el.querySelector<HTMLElement>('[data-hint]')!
      const check = () => {
        const { fresh, duplicates } = parseLines(ta.value, existing(sel.value))
        const tooMany = fresh.length > 100
        hint.innerHTML = `Paste a list to add many at once. ${fresh.length > 0 ? `<strong class="text-text-secondary">${fresh.length} new</strong>` : ''}${duplicates > 0 ? ` · ${duplicates} already in this cluster, skipped` : ''}${tooMany ? '<span class="text-status-rose-text"> · max 100 at a time</span>' : ''}`
        el.querySelector('[data-md-label]')!.textContent = fresh.length > 1 ? `Add ${fresh.length} prompts` : 'Add prompt'
        save.disabled = !fresh.length || tooMany
      }
      ta.addEventListener('input', check)
      sel.addEventListener('change', check)
      save.addEventListener('click', o.close)
    },
  })
}

