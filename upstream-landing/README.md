# Upstream landing page

Vite + React + TypeScript. Layout and proportions follow tryprofound.com, re-skinned as a light theme. Motion and Lenis handle animation and smooth scroll; all charts and visuals are hand-written SVG, canvas and CSS.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

- `src/styles/tokens.css`: design tokens and shared primitives (`.sec`, `.shell`, `.btn`, `.cg`, `.pilltab`, `.tag`, ...). Section styles live next to it, one file per section.
- `src/content.ts`: engines, comparison rows, pricing placeholders (`[PRICE]`, `[N]`), FAQ answers and the sample product data (fictional brand "Tracewell") behind the Analytics view in the hero demo.
- `src/components/Hero.tsx` + `AppDemo.tsx` + `DemoDocs.tsx`: the rotating-engine headline and the interactive product demo (assistant chat, preview documents, analytics views).
- `src/components/Problem.tsx`: scroll-driven headline reveal over a drifting canvas network.
- `src/components/Carousel.tsx`: shared scroll-snap carousel used by Results and Reinforced.
