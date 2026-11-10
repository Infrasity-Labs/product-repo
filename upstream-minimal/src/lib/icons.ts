import remix from '../data/remix.json'

/**
 * Icons. The real app (main branch) uses Remix icons (`@remixicon/react`, e.g. RiInformationLine). Use `ri(name, cls)`.
 * Add icons with `node scripts/remix.mjs RiName ...` (React component names), which extracts them from the `remixicon` package.
 */
const remixIcons = remix as Record<string, string>
export function ri(name: string, cls = 'size-4'): string {
  const body = remixIcons[name]
  if (!body) {
    console.warn(`icon missing: ${name}; run node scripts/remix.mjs ${name}`)
    return ''
  }
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`
}
