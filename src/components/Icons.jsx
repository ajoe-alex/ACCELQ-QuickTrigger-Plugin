const base = 'w-4 h-4'

export function PlayIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={base} {...props}>
      <path d="M6.3 4.2a1 1 0 0 1 1.53-.85l8.4 5.3a1 1 0 0 1 0 1.7l-8.4 5.3A1 1 0 0 1 6.3 14.8V4.2Z" />
    </svg>
  )
}

export function StopIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={base} {...props}>
      <rect x="5" y="5" width="10" height="10" rx="1.5" />
    </svg>
  )
}

export function RefreshIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M3.5 9a6.5 6.5 0 0 1 11-4.6l1.5 1.4M16.5 11a6.5 6.5 0 0 1-11 4.6l-1.5-1.4" />
      <path d="M14.7 3.6v2.8h-2.8M5.3 16.4v-2.8h2.8" />
    </svg>
  )
}

export function EditIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M13.5 3.5 16.5 6.5 7 16H4v-3L13.5 3.5Z" />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9.5A1 1 0 0 0 7.6 16.4h4.8a1 1 0 0 0 1-1L14 6" />
    </svg>
  )
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={base} {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  )
}

export function CopyIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <rect x="7" y="7" width="9" height="9" rx="1.3" />
      <path d="M4.5 12.5v-7A1.5 1.5 0 0 1 6 4h7" />
    </svg>
  )
}

export function EyeIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M2 10s2.7-5 8-5 8 5 8 5-2.7 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  )
}

export function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M3 3l14 14M8.3 8.4a2.2 2.2 0 0 0 3.1 3.1M6.1 6.3C4 7.5 2 10 2 10s2.7 5 8 5c1.4 0 2.6-.35 3.6-.87M9.8 5.02C9.87 5.01 9.93 5 10 5c5.3 0 8 5 8 5-.3.55-.9 1.4-1.8 2.2" />
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={base} {...props}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={base} {...props}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  )
}
