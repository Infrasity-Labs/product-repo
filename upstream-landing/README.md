# Upstream landing page

Vite + React + TypeScript. Layout and proportions follow tryprofound.com and peec.ai, as a light theme. Type is Geist (UI and headlines) and Geist Mono (labels and numbers). All charts and visuals are hand-written SVG and CSS.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

- `src/styles/tokens.css`: design tokens and shared primitives (`.sec`, `.shell`, `.btn`, `.cg`, `.pilltab`, `.tag`, ...). Section styles live next to it, one file per section.
- `src/content.ts`: engines, comparison rows, pricing placeholders (`[PRICE]`, `[N]`), FAQ answers and the sample product data (fictional brand "Tracewell") behind the Analytics view in the hero demo.
- `src/components/Hero.tsx` + `AppDemo.tsx` + `DemoDocs.tsx`: static headline, engine row and the interactive product demo (assistant chat, preview documents, analytics views).
- Motion is deliberately minimal and CSS-only (`src/styles/motion.css`): a one-time fade-up on scroll via a single IntersectionObserver (`src/lib/reveal.ts`), hero fade-in on load, 0.18s tab fades and small card hover lifts. Only opacity and transform animate; reduced-motion users get none. No smooth-scroll library, pinned sections, canvas or animation library.
