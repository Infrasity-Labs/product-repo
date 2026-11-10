/*
 * The cluster page's management dialogs, ported from main's `manage/dialogs.tsx` (ManagePromptsDialog, AddPromptsDialog,
 * EditPromptDialog, DeletePromptDialog, EditDomainsDialog, DeleteClusterDialog) on `manage/manage-ui.tsx`'s ManageDialog.
 * Nothing is persisted: edits live in this session copy (`textsFor`, `domainsFor`) and the page redraws through `onChange`.
 */
import { ri } from '../lib/icons'
import { BRAND, clusters, prompts } from './data'
import { btnDanger, btnGhost, btnPrimary, errorNote, field, inputCls, manageDialogHtml } from './model-results-manage'
import { openOverlay } from './model-results-overlay'
import { domainLogo, esc } from './ui'

/** Session copy of each cluster's prompt texts. */
const texts: Record<string, string[]> = {}
export const textsFor = (slug: string) => (texts[slug] ??= prompts.filter((p) => p.cluster_slug === slug).map((p) => p.prompt))
export const setTexts = (slug: string, next: string[]) => { texts[slug] = next }

/** Edited prompts keep their scan history in the page's map, so remember which original each current text came from. */
const origin: Record<string, Record<string, string>> = {}
export const originalOf = (slug: string, text: string) => origin[slug]?.[text] ?? text
const noteRename = (slug: string, from: string, to: string) => { (origin[slug] ??= {})[to] = originalOf(slug, from) }
/** Prompts in a cluster after this session's edits. */
export const countFor = (slug: string) => (clusters.find((c) => c.slug === slug)?.prompts ?? 0) + textsFor(slug).length - prompts.filter((p) => p.cluster_slug === slug).length

/** Session copy of each cluster's competitor and target domains. */
const domains: Record<string, { competitors: string[]; targets: string[] }> = {}
export const domainsFor = (slug: string) => (domains[slug] ??= {
  competitors: Array.from(new Set(['spanlight.io', 'lumenlace.com', ...(clusters.find((c) => c.slug === slug)?.top_rival ? [clusters.find((c) => c.slug === slug)!.top_rival!.domain] : [])])),
  targets: [BRAND.domain],
})

const clusterName = (slug: string) => clusters.find((c) => c.slug === slug)?.name ?? slug
const activeClusters = () => clusters.filter((c) => c.tracked && c.enabled)
const normalizeDomain = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0]
const isDomain = (s: string) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)
const addIcon = ri('RiAddLine', 'size-4')

/* ── manage one cluster's prompts: search, edit, delete, add ─────────────────────────────────── */
export function openManagePrompts(slug: string, onChange: () => void, openAdd: () => void) {
  const st = { q: '', editing: null as string | null, draft: '', confirming: null as string | null, error: '' }
  const body = () => {
    const items = textsFor(slug)
    const shown = items.filter((p) => !st.q.trim() || p.toLowerCase().includes(st.q.trim().toLowerCase()))
    const search = items.length > 8 ? `<div class="relative">${ri('RiSearchLine', 'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary')}<input data-mp-q class="${inputCls} pl-9" placeholder="Search prompts" value="${esc(st.q)}" aria-label="Search prompts"/></div>` : ''
    const li = (p: string) => {
      if (st.editing === p) return `<li class="px-3 py-2.5"><div class="flex items-center gap-2"><input data-mp-draft data-autofocus class="${inputCls}" value="${esc(st.draft)}" aria-label="Edit prompt"/><button type="button" data-mp-save="${esc(p)}" class="${btnPrimary}">Save</button><button type="button" data-mp-cancel class="${btnGhost}">Cancel</button></div></li>`
      if (st.confirming === p) return `<li class="px-3 py-2.5"><div class="flex flex-wrap items-center justify-between gap-2"><span class="text-body-regular text-status-rose-text">Delete this prompt and its history?</span><span class="flex gap-2"><button type="button" data-mp-del="${esc(p)}" class="${btnDanger}">Delete</button><button type="button" data-mp-cancel class="${btnGhost}">Keep</button></span></div></li>`
      return `<li class="px-3 py-2.5"><div class="flex items-start gap-2"><span class="min-w-0 flex-1 text-body-regular text-text-primary">${esc(p)}</span><button type="button" data-mp-edit="${esc(p)}" aria-label="Edit prompt" class="rounded-lg p-1.5 text-text-tertiary hover:bg-background-secondary-hover hover:text-text-primary">${ri('RiPencilLine', 'size-4')}</button><button type="button" data-mp-ask="${esc(p)}" aria-label="Delete prompt" class="rounded-lg p-1.5 text-text-tertiary hover:bg-status-rose-background hover:text-status-rose-text">${ri('RiDeleteBinLine', 'size-4')}</button></div></li>`
    }
    return `${st.error ? errorNote(st.error) : ''}${search}${items.length === 0 ? '<p class="rounded-xl border border-dashed border-separator-border px-3 py-8 text-center text-body-regular text-text-tertiary">No prompts yet. Add the questions you want to be cited for.</p>' : `<ul class="divide-y divide-separator-border rounded-xl border border-separator-border">${shown.map(li).join('')}${shown.length ? '' : `<li class="px-3 py-6 text-center text-body-regular text-text-tertiary">No prompts match &ldquo;${esc(st.q)}&rdquo;.</li>`}</ul>`}`
  }
  const render = () => manageDialogHtml({
    title: `Prompts · ${esc(clusterName(slug))}`, wide: true,
    description: `${textsFor(slug).length} prompt${textsFor(slug).length === 1 ? '' : 's'}. Editing a prompt starts a fresh history for it.`,
    body: body(),
    footer: `<button type="button" data-mp-add class="${btnPrimary}">${addIcon}Add prompts</button>`,
  })
  openOverlay({
    html: render(),
    wire: (el, o) => {
      const redraw = () => o.update(render())
      el.oninput = (e) => { const t = e.target as HTMLInputElement; if (t.dataset.mpQ != null) { st.q = t.value; redraw(); el.querySelector<HTMLInputElement>('[data-mp-q]')?.focus() } else if (t.dataset.mpDraft != null) st.draft = t.value }
      el.onkeydown = (e) => {
        const t = e.target as HTMLElement
        if (t.dataset.mpDraft != null && e.key === 'Enter') el.querySelector<HTMLElement>('[data-mp-save]')?.click()
      }
      el.onclick = (e) => {
        const t = e.target as HTMLElement
        const items = textsFor(slug)
        if (t.closest('[data-mp-add]')) { o.close(); openAdd(); return }
        const ed = t.closest<HTMLElement>('[data-mp-edit]')
        if (ed) { st.editing = ed.dataset.mpEdit as string; st.draft = st.editing; st.confirming = null; st.error = ''; redraw(); return }
        const ask = t.closest<HTMLElement>('[data-mp-ask]')
        if (ask) { st.confirming = ask.dataset.mpAsk as string; st.editing = null; redraw(); return }
        if (t.closest('[data-mp-cancel]')) { st.editing = null; st.confirming = null; redraw(); return }
        const del = t.closest<HTMLElement>('[data-mp-del]')
        if (del) { setTexts(slug, items.filter((x) => x !== del.dataset.mpDel)); st.confirming = null; redraw(); onChange(); return }
        const sv = t.closest<HTMLElement>('[data-mp-save]')
        if (sv) {
          const orig = sv.dataset.mpSave as string
          const next = st.draft.trim()
          if (!next || next === orig) { st.editing = null; redraw(); return }
          if (items.some((p) => p !== orig && p.toLowerCase() === next.toLowerCase())) { st.error = 'That prompt already exists in this cluster.'; redraw(); return }
          noteRename(slug, orig, next); setTexts(slug, items.map((x) => (x === orig ? next : x))); st.editing = null; st.error = ''; redraw(); onChange()
        }
      }
    },
  })
}

/* ── add prompts (one, or paste many) ────────────────────────────────────────────────────────── */
export function openAddPrompts(slug0: string, onChange: (slug: string) => void) {
  const active = activeClusters()
  const st = { slug: active.some((c) => c.slug === slug0) ? slug0 : active[0]?.slug ?? '', text: '' }
  const parse = () => {
    const have = new Set(textsFor(st.slug).map((p) => p.toLowerCase()))
    const seen = new Set<string>()
    const fresh: string[] = []
    let dup = 0
    for (const line of st.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
      const k = line.toLowerCase()
      if (have.has(k) || seen.has(k)) { dup++; continue }
      seen.add(k); fresh.push(line)
    }
    return { fresh, dup }
  }
  const hint = () => {
    const { fresh, dup } = parse()
    return `Paste a list to add many at once. ${fresh.length > 0 ? `<strong class="text-text-secondary">${fresh.length} new</strong>` : ''}${dup > 0 ? ` · ${dup} already in this cluster, skipped` : ''}${fresh.length > 100 ? '<span class="text-status-rose-text"> · max 100 at a time</span>' : ''}`
  }
  const label = (n: number) => (n > 1 ? `Add ${n} prompts` : 'Add prompt')
  const render = () => {
    const { fresh } = parse()
    return manageDialogHtml({
      title: 'Add prompts', description: 'The questions we ask each AI engine. One per line.', wide: true,
      body: `${field('Cluster', `<select id="ap-cluster" data-ap-cluster class="${inputCls}">${active.map((c) => `<option value="${c.slug}"${c.slug === st.slug ? ' selected' : ''}>${esc(c.name)} (${countFor(c.slug)})</option>`).join('')}</select>`, 'ap-cluster')}
        ${field('Prompts', `<textarea id="ap-text" data-ap-text data-autofocus rows="8" class="${inputCls} font-[inherit] leading-relaxed" placeholder="Best developer marketing agencies for tech startups&#10;How do I measure ROI on developer marketing?">${esc(st.text)}</textarea>`, 'ap-text', hint())}`,
      footer: `<button type="button" data-overlay-close class="${btnGhost}">Cancel</button><button type="button" data-ap-submit class="${btnPrimary}" ${!fresh.length || fresh.length > 100 ? 'disabled' : ''}>${addIcon}<span data-ap-label>${label(fresh.length)}</span></button>`,
    })
  }
  openOverlay({
    html: render(),
    wire: (el, o) => {
      el.oninput = (e) => {
        const t = e.target as HTMLTextAreaElement
        if (t.dataset.apText == null) return
        st.text = t.value
        const { fresh } = parse()
        const btn = el.querySelector<HTMLButtonElement>('[data-ap-submit]')
        if (btn) btn.disabled = !fresh.length || fresh.length > 100
        const lab = el.querySelector<HTMLElement>('[data-ap-label]')
        if (lab) lab.textContent = label(fresh.length)
        const h = el.querySelector<HTMLElement>('#ap-text')?.parentElement?.querySelector('p')
        if (h) h.innerHTML = hint()
      }
      el.onchange = (e) => { const t = e.target as HTMLSelectElement; if (t.dataset.apCluster != null) { st.slug = t.value; o.update(render()); el.querySelector<HTMLElement>('[data-ap-text]')?.focus() } }
      el.onclick = (e) => {
        if (!(e.target as HTMLElement).closest('[data-ap-submit]')) return
        const { fresh } = parse()
        if (!fresh.length || fresh.length > 100) return
        setTexts(st.slug, [...textsFor(st.slug), ...fresh])
        o.close()
        onChange(st.slug)
      }
    },
  }).el.querySelector<HTMLElement>('[data-ap-text]')?.focus()
}

/* ── one prompt: edit / delete (from a prompt row's menu) ────────────────────────────────────── */
export function openEditPrompt(slug: string, prompt: string, onChange: (next: string) => void) {
  const st = { draft: prompt }
  const check = () => {
    const next = st.draft.trim()
    const dup = !!next && next.toLowerCase() !== prompt.toLowerCase() && textsFor(slug).some((p) => p.toLowerCase() === next.toLowerCase())
    return { next, dup, valid: next.length > 0 && next !== prompt && !dup }
  }
  openOverlay({
    html: manageDialogHtml({
      title: 'Edit prompt', description: `In ${esc(clusterName(slug))}. The new wording starts a fresh history.`,
      body: field('Prompt', `<textarea id="ep-text" data-ep data-autofocus rows="3" class="${inputCls}">${esc(prompt)}</textarea>`, 'ep-text', '<span data-ep-dup class="text-status-rose-text" hidden>This prompt already exists in the cluster.</span>'),
      footer: `<button type="button" data-overlay-close class="${btnGhost}">Cancel</button><button type="button" data-ep-save class="${btnPrimary}" disabled>Save</button>`,
    }),
    wire: (el, o) => {
      const sync = () => {
        const { dup, valid } = check()
        const save = el.querySelector<HTMLButtonElement>('[data-ep-save]')
        if (save) save.disabled = !valid
        const d = el.querySelector<HTMLElement>('[data-ep-dup]')
        if (d) d.hidden = !dup
      }
      const submit = () => {
        const { next, valid } = check()
        if (!valid) return
        noteRename(slug, prompt, next)
        setTexts(slug, textsFor(slug).map((p) => (p === prompt ? next : p)))
        o.close()
        onChange(next)
      }
      el.oninput = (e) => { if ((e.target as HTMLElement).dataset.ep != null) { st.draft = (e.target as HTMLTextAreaElement).value; sync() } }
      el.onkeydown = (e) => { if ((e.target as HTMLElement).dataset.ep != null && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }
      el.onclick = (e) => { if ((e.target as HTMLElement).closest('[data-ep-save]')) submit() }
    },
  })
}

export function openDeletePrompt(slug: string, prompt: string, onChange: () => void) {
  openOverlay({
    html: manageDialogHtml({
      title: 'Delete this prompt?', description: `From ${esc(clusterName(slug))}.`,
      body: `<p class="rounded-lg bg-background-secondary-default px-3 py-2 text-body-regular text-text-primary">${esc(prompt)}</p><p class="text-body-regular text-text-secondary">It stops being scanned and disappears from this page. Past scans of it stay in your history.</p>`,
      footer: `<button type="button" data-overlay-close class="${btnGhost}">Keep it</button><button type="button" data-dp-delete class="${btnDanger}">${ri('RiDeleteBinLine', 'size-4')}Delete prompt</button>`,
    }),
    wire: (el, o) => {
      el.onclick = (e) => {
        if (!(e.target as HTMLElement).closest('[data-dp-delete]')) return
        setTexts(slug, textsFor(slug).filter((p) => p !== prompt))
        o.close()
        onChange()
      }
    },
  })
}

/* ── edit competitors / targets ──────────────────────────────────────────────────────────────── */
export function openEditDomains(slug: string, kind: 'competitors' | 'targets', onChange: () => void) {
  const original = domainsFor(slug)[kind]
  const st = { items: [...original], input: '', error: '', applyAll: false }
  const list = () => (st.items.length
    ? `<ul class="divide-y divide-separator-border rounded-xl border border-separator-border">${st.items.map((d) => `<li class="flex items-center gap-2.5 px-3 py-2">${domainLogo(d, 20)}<span class="min-w-0 flex-1 truncate text-body-regular text-text-primary">${esc(d)}</span><button type="button" data-ed-rm="${esc(d)}" aria-label="Remove ${esc(d)}" class="rounded-lg p-1 text-text-tertiary hover:bg-status-rose-background hover:text-status-rose-text">${ri('RiCloseLine', 'size-4')}</button></li>`).join('')}</ul>`
    : '<p class="rounded-xl border border-dashed border-separator-border px-3 py-6 text-center text-body-regular text-text-tertiary">None yet. Add a domain above.</p>')
  const dirty = () => JSON.stringify([...st.items].sort()) !== JSON.stringify([...original].sort())
  const title = kind === 'competitors' ? 'Competitors' : 'Target domains'
  const active = activeClusters()
  const render = () => manageDialogHtml({
    title: `${title} · ${esc(clusterName(slug))}`,
    description: kind === 'competitors' ? 'Domains we tag as rivals when they are cited in this cluster.' : 'The domains that count as you in this cluster\'s answers.',
    body: `${st.error ? errorNote(st.error) : ''}
      <div class="flex gap-2"><input data-ed-input data-autofocus class="${inputCls}" value="${esc(st.input)}" placeholder="example.com" aria-label="Add a ${kind === 'competitors' ? 'competitor' : 'target'} domain"/><button type="button" data-ed-add class="${btnGhost}">${addIcon}Add</button></div>
      ${list()}
      ${kind === 'competitors' && active.length > 1 ? `<label class="flex items-center gap-2 text-body-regular text-text-secondary"><input type="checkbox" data-ed-all ${st.applyAll ? 'checked' : ''} class="size-4 rounded border-border-button-default accent-accent-600"/>Apply this list to all ${active.length} clusters</label>` : ''}`,
    footer: `<button type="button" data-overlay-close class="${btnGhost}">Cancel</button><button type="button" data-ed-save class="${btnPrimary}" ${dirty() ? '' : 'disabled'}>Save</button>`,
  })
  openOverlay({
    html: render(),
    wire: (el, o) => {
      const redraw = () => { o.update(render()); el.querySelector<HTMLInputElement>('[data-ed-input]')?.focus() }
      const add = () => {
        const parts = st.input.split(/[\s,]+/).map(normalizeDomain).filter((d) => d && isDomain(d))
        if (!parts.length) { if (st.input.trim()) { st.error = 'That does not look like a domain. Try example.com.'; redraw() } return }
        st.error = ''; st.items = Array.from(new Set([...st.items, ...parts])); st.input = ''; redraw()
      }
      el.oninput = (e) => { const t = e.target as HTMLInputElement; if (t.dataset.edInput != null) { st.input = t.value; st.error = '' } }
      el.onkeydown = (e) => { if ((e.target as HTMLElement).dataset.edInput != null && e.key === 'Enter') { e.preventDefault(); add() } }
      el.onchange = (e) => { const t = e.target as HTMLInputElement; if (t.dataset.edAll != null) st.applyAll = t.checked }
      el.onclick = (e) => {
        const t = e.target as HTMLElement
        if (t.closest('[data-ed-add]')) { add(); return }
        const rm = t.closest<HTMLElement>('[data-ed-rm]')
        if (rm) { st.items = st.items.filter((x) => x !== rm.dataset.edRm); redraw(); return }
        if (t.closest('[data-ed-save]') && dirty()) {
          if (kind === 'competitors' && st.applyAll) for (const c of active) domainsFor(c.slug).competitors = [...st.items]
          else domainsFor(slug)[kind] = [...st.items]
          o.close()
          onChange()
        }
      }
    },
  })
}

/* ── delete cluster (typed confirmation: it removes every run and answer too) ────────────────── */
export function openDeleteCluster(slug: string, onDeleted: () => void) {
  const c = clusters.find((x) => x.slug === slug)
  if (!c) return
  const n = countFor(slug)
  const ok = (typed: string) => typed.trim().toLowerCase() === c.name.trim().toLowerCase()
  openOverlay({
    html: manageDialogHtml({
      title: `Delete "${esc(c.name)}"?`,
      body: `<div class="flex gap-2.5 rounded-xl border border-status-rose-text/20 bg-status-rose-background px-3 py-2.5 text-body-regular text-status-rose-text">${ri('RiErrorWarningFill', 'mt-0.5 size-4 shrink-0')}<p>This permanently deletes the cluster, its ${n} prompt${n === 1 ? '' : 's'}, and <strong>every scan and answer</strong> recorded for it. It cannot be undone.</p></div>
        ${field('Type the cluster name to confirm', `<input id="del-confirm" data-dc-input data-autofocus class="${inputCls}"/>`, 'del-confirm', `Type <strong class="text-text-secondary">${esc(c.name)}</strong>`)}`,
      footer: `<button type="button" data-overlay-close class="${btnGhost}">Cancel</button><button type="button" data-dc-delete class="${btnDanger}" disabled>${ri('RiDeleteBinLine', 'size-4')}Delete cluster</button>`,
    }),
    wire: (el, o) => {
      const input = () => el.querySelector<HTMLInputElement>('[data-dc-input]')
      const submit = () => { if (!ok(input()?.value ?? '')) return; o.close(); onDeleted() }
      el.oninput = (e) => { if ((e.target as HTMLElement).dataset.dcInput != null) { const b = el.querySelector<HTMLButtonElement>('[data-dc-delete]'); if (b) b.disabled = !ok(input()?.value ?? '') } }
      el.onkeydown = (e) => { if ((e.target as HTMLElement).dataset.dcInput != null && e.key === 'Enter') submit() }
      el.onclick = (e) => { if ((e.target as HTMLElement).closest('[data-dc-delete]')) submit() }
    },
  })
}

