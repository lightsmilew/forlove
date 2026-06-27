const ICONS = {
  treehole: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="26" r="6" fill="currentColor" opacity="0.25" />
      <path d="M24 8c-2 4-6 6-6 10a6 6 0 1 0 12 0c0-4-4-6-6-10z" fill="currentColor" />
      <path d="M18 20c-3 1-5 4-5 7a5 5 0 0 0 10 0" fill="currentColor" opacity="0.55" />
      <path d="M30 20c3 1 5 4 5 7a5 5 0 0 1-10 0" fill="currentColor" opacity="0.55" />
      <circle cx="24" cy="24" r="2.5" fill="#fff" opacity="0.9" />
    </svg>
  ),
  diary: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="10" y="8" width="28" height="32" rx="4" fill="currentColor" opacity="0.2" />
      <path d="M14 8h20a4 4 0 0 1 4 4v28H14V8z" fill="currentColor" />
      <path d="M18 8v32" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M22 18h14M22 24h14M22 30h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.85" />
      <circle cx="34" cy="34" r="7" fill="#ffb6c8" stroke="#fff" strokeWidth="1.5" />
      <path d="M32 34l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  games: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 40c-8-6-14-12-14-20a14 14 0 0 1 28 0c0 8-6 14-14 20z" fill="currentColor" />
      <path d="M24 14v8M20 18h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="17" cy="16" r="2" fill="#fff" opacity="0.9" />
      <circle cx="31" cy="16" r="2" fill="#fff" opacity="0.9" />
    </svg>
  ),
  distance: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse cx="24" cy="38" rx="10" ry="3" fill="currentColor" opacity="0.15" />
      <path d="M24 8a16 16 0 0 1 0 28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.45" />
      <circle cx="36" cy="14" r="3" fill="currentColor" opacity="0.5" />
      <path d="M24 36c-6-8-10-14-10-20a10 10 0 0 1 20 0c0 6-4 12-10 20z" fill="currentColor" />
      <circle cx="24" cy="16" r="4" fill="#fff" opacity="0.95" />
      <circle cx="24" cy="16" r="1.8" fill="currentColor" />
    </svg>
  ),
}

export default function FeatureIcon({ name, variant = 'pink' }) {
  return (
    <div className={`feature-icon-badge feature-icon-badge--${variant}`}>
      {ICONS[name]}
    </div>
  )
}
