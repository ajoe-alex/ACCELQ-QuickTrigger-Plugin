export function formatDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export function formatRelative(ts) {
  if (!ts) return '—'
  const diffMs = Date.now() - ts
  const sec = Math.round(diffMs / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}

export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—'
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (s || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

export function maskSecret(value, visible = false) {
  if (!value) return ''
  if (visible) return value
  if (value.length <= 6) return '•'.repeat(value.length)
  return `${value.slice(0, 4)}${'•'.repeat(Math.max(4, value.length - 6))}${value.slice(-2)}`
}
