# Upstream, minimal edition

A from-scratch rebuild of the Upstream landing page: Vite + TypeScript, no UI framework, one three.js scene.

```
npm install
npm run dev      # http://localhost:5174
npm run build    # typecheck + production build
```

## Layout

- `index.html`: hero, the numbered intro sections, pricing, FAQ and CTA. Empty `<section id="...">` hosts mark where rendered sections go.
- `src/sections/*.ts`: one module per rendered section. Each exports `id` (host id) and `render(host)`; `src/main.ts` loads them with `import.meta.glob` and renders them before the reveal observer starts.
- `src/style.css`: the page design system (paper `#f6f5f1`, ink, one indigo accent; Inter with optical sizing for headlines, Geist Mono for labels). Element resets live in `@layer base` so Tailwind utilities win inside the product UI.
- `src/hero3d.ts`: the only three.js code. ~5k scattered points rise "upstream" and lean toward the centre, all computed in a vertex shader; the pointer parts the flow; a soft hole keeps the headline clear; three uniforms per frame; rendering pauses off screen; one static frame for reduced-motion users; its own lazy chunk.
- `src/ui.ts`: nav, cursor dot, rotating engine name, reveals, word-by-word statement, count-ups. `src/main.ts`: entry and Lenis smooth scroll.

## Product UI (replicas of the real app, main branch)

The dashboards, tables and charts are re-creations of the real GEO app's **main branch** (`content-repo`, redesigned with the BoardUI design system), transcribed to HTML strings with the app's own class names. Tailwind v4 (utilities only) runs inside an `.app` scope; `src/styles/app.css` imports the app's real tokens (`src/styles/boardui/{theme,typography,boardui-components}.css`, copied from the app). Icons are Remix icons (`scripts/remix.mjs` extracts them into `src/data/remix.json`; use `ri('RiName', cls)`).

- `src/app/ui.ts`, `base.ts`, `dash-ui.ts`: the app's primitives and base components (Chip, Button, Tabs, Table, Modal, Tooltip…). `charts.ts`: chart layer in the app's look.
- `src/app/shell.ts`: the app window under the hero; pages are discovered from `src/app/pages/*.ts` (`meta`, `html()`, `mount()`). `overview-cards.ts` and the pages export single cards that landing sections embed.
- `src/app/frame.ts`: `appFrame()` crops a card for embedding; with `fit` it keeps the card's desktop layout and scales it to the slot.
- `src/app/data.ts`: fictional Tracewell sample data shaped like the app's types. No real customer data.

Pricing figures are placeholders (`[PRICE]`, `[N]`). All product numbers are sample data.
