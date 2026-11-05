import { engines } from '../content'
import { engineLogos } from '../logos'

/** Logo for an engine, looked up by id or display name. Falls back to a colour dot for unknown names. */
export function EngineLogo({ engine, size = 16, className = '' }: { engine: string; size?: number; className?: string }) {
  const e = engines.find((x) => x.id === engine || x.name === engine)
  if (!e) return null
  return <img className={`elogo ${className}`} src={engineLogos[e.id]} width={size} height={size} alt="" draggable={false} />
}
