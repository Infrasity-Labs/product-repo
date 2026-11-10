// Usage: node scripts/remix.mjs RiInformationLine RiArrowRightUpLine ...
// Extracts Remix icon SVG path data (the icon set the real app uses via @remixicon/react) into src/data/remix.json.
// Names are the React component names; icons are then rendered with ri('RiInformationLine', 'size-4 text-text-tertiary').
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'

const ROOT = new URL('../node_modules/remixicon/icons/', import.meta.url).pathname
const OUT = new URL('../src/data/remix.json', import.meta.url).pathname
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const files = new Map()
for (const cat of readdirSync(ROOT)) for (const f of readdirSync(ROOT + cat)) if (f.endsWith('.svg')) files.set(f.slice(0, -4), `${ROOT}${cat}/${f}`)

for (const name of process.argv.slice(2)) {
  const kebab = name.replace(/^Ri/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').replace(/([A-Za-z])([0-9])/g, '$1-$2').toLowerCase()
  const file = files.get(kebab) ?? files.get(kebab.replace(/-(\d)/g, '$1'))
  if (!file) { console.error(`missing icon: ${name} (${kebab})`); continue }
  const svg = readFileSync(file, 'utf8')
  out[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<path fill="none" d="M0 0h24v24H0z"\/?>(<\/path>)?/, '').trim()
  console.log('ok', name)
}
writeFileSync(OUT, JSON.stringify(out))
