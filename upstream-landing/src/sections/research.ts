import '../styles/ops.css'

export const id = 'research'

type Paper = { title: string; kicker: string; href: string }
const tabs: { id: string; label: string; papers: Paper[] }[] = [
  {
    id: 'popular', label: 'Popular',
    papers: [
      { title: 'Why track Copilot and Grok', kicker: 'Engines', href: '#engines' },
      { title: 'Engine vs engine: who cites you where', kicker: 'Insight', href: '#product' },
      { title: 'Where developers get their answers', kicker: 'Sources', href: '#product' },
    ],
  },
  {
    id: 'engines', label: 'Engines',
    papers: [
      { title: 'Same prompts, 8 engines', kicker: 'Coverage', href: '#engines' },
      { title: 'Full answer stored, every run', kicker: 'Model results', href: '#product' },
      { title: 'Sources per engine', kicker: 'Sources', href: '#product' },
    ],
  },
  {
    id: 'sources', label: 'Dev sources',
    papers: [
      { title: 'GitHub repos engines trust', kicker: 'GitHub', href: '#product' },
      { title: 'Reddit threads in AI answers', kicker: 'Reddit', href: '#product' },
      { title: 'Listicles and who to pitch', kicker: 'Listicles', href: '#product' },
    ],
  },
]

const arrow = '<svg class="op-card__arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>'

export function render(host: HTMLElement): void {
  host.innerHTML = `<div class="wrap">
    <div class="op-head" data-r>
      <div>
        <h2 class="h2" style="max-width:16ch"><span class="ink">Built around how developers actually search.</span></h2>
        <p class="lead">How AI engines answer developer questions, and what it means for your category.</p>
      </div>
      <a class="pill pill--line pill--sm" href="#product">See all</a>
    </div>
    <div class="op-tabs" role="tablist" aria-label="Research topics" data-r>
      ${tabs.map((t, i) => `<button type="button" role="tab" class="op-tab" id="op-rt-${t.id}" aria-selected="${i === 0}" aria-controls="op-rpanel" tabindex="${i === 0 ? 0 : -1}">${t.label}</button>`).join('')}
    </div>
    <div class="op-rgrid" role="tabpanel" id="op-rpanel" aria-labelledby="op-rt-popular" data-r></div>
  </div>`

  const btns = [...host.querySelectorAll<HTMLButtonElement>('.op-tab')]
  const panel = host.querySelector<HTMLElement>('#op-rpanel')!
  const show = (n: number) => {
    btns.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === n))
      b.tabIndex = i === n ? 0 : -1
    })
    panel.setAttribute('aria-labelledby', btns[n].id)
    panel.innerHTML = tabs[n].papers
      .map((p) => `<a class="op-rcard" href="${p.href}"><span class="label label--dim">${p.kicker}</span><span class="op-rcard__t">${p.title}</span>${arrow}</a>`)
      .join('')
  }
  show(0)
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(i))
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const n = (i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length
      show(n)
      btns[n].focus()
    })
  })
}
