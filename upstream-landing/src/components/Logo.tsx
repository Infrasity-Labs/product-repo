export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M16 7v13M10 13l6-6 6 6M10 24c0-3 2.5-4 6-4s6 1 6 4"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--fg)' }}>
      <LogoMark size={size} />
      <span className="logo-word" style={{ fontSize: 18, letterSpacing: '-0.04em' }}>Upstream</span>
    </span>
  )
}
