import { useState } from 'react'
import { CloseIcon, CopyIcon, EyeIcon, EyeOffIcon, ChevronRightIcon } from './Icons'
import { formatDateTime, maskSecret } from '../utils/format'
import { buildTriggerRequest } from '../utils/api'
import { buildCurlCommand } from '../utils/curl'
import RunSummary, { TriggerResultCard } from './RunSummary'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-600 transition-colors"
    >
      <CopyIcon className="w-3.5 h-3.5" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function HeadersBlock({ headers, revealSecrets }) {
  if (!headers) return null
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 px-3 py-2 space-y-1">
      {Object.entries(headers).map(([key, value]) => {
        const isSecret = /api_key|authorization|token/i.test(key)
        return (
          <div key={key} className="flex text-[12px] gap-2 font-mono">
            <span className="text-slate-400 shrink-0">{key}:</span>
            <span className="text-slate-700 dark:text-slate-300 break-all">
              {isSecret ? maskSecret(String(value), revealSecrets) : String(value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function JsonBlock({ data }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return (
    <div className="relative rounded-lg bg-slate-900 dark:bg-black/40 border border-slate-800">
      <div className="absolute top-1.5 right-2">
        <CopyButton text={text} />
      </div>
      <pre className="text-[12px] text-emerald-300/90 p-3 pr-16 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
        {text}
      </pre>
    </div>
  )
}

function Section({ title, children, badge }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h4>
        {badge}
      </div>
      {children}
    </div>
  )
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-600 transition-colors"
      >
        <ChevronRightIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        {title}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )
}

function RequestLine({ request }) {
  return <p className="text-[12px] font-mono text-slate-500 break-all">{request.method} {request.url}</p>
}

function CurlBlock({ tile, revealSecrets }) {
  const request = buildTriggerRequest(tile)
  const fullCurl = buildCurlCommand(request)
  const displayHeaders = { ...request.headers }
  if (displayHeaders.api_key) displayHeaders.api_key = maskSecret(displayHeaders.api_key, revealSecrets)
  const displayCurl = buildCurlCommand({ ...request, headers: displayHeaders })

  return (
    <div className="relative rounded-lg bg-slate-900 dark:bg-black/40 border border-slate-800">
      <div className="absolute top-1.5 right-2">
        <CopyButton text={fullCurl} />
      </div>
      <pre className="text-[12px] text-emerald-300/90 p-3 pr-16 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
        {displayCurl}
      </pre>
    </div>
  )
}

function StatusPill({ ok, status, statusText }) {
  const tone = ok
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900'
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tone}`}>
      {status} {statusText}
    </span>
  )
}

export default function JobDetailsModal({ tile, onClose }) {
  const [revealSecrets, setRevealSecrets] = useState(false)
  const lastRun = tile.lastRun

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {tile.label || tile.projectName}
            </h2>
            <p className="text-xs text-slate-400">{tile.tenantCode} / {tile.projectName} · Template {tile.templateJobId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRevealSecrets((s) => !s)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title={revealSecrets ? 'Hide secrets' : 'Reveal secrets'}
            >
              {revealSecrets ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              {revealSecrets ? 'Hide keys' : 'Reveal keys'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          <Section title="Tile Configuration">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <ConfigRow label="Base URL" value={tile.baseUrl} />
              <ConfigRow label="Tenant Code" value={tile.tenantCode} />
              <ConfigRow label="Project Name" value={tile.projectName} />
              <ConfigRow label="Template Job ID" value={tile.templateJobId} />
              <ConfigRow label="User ID" value={tile.userId} />
              <ConfigRow label="API Key" value={maskSecret(tile.apiKey, revealSecrets)} mono />
              <ConfigRow label="Poll Frequency" value={`${tile.pollFrequency}s`} />
              <ConfigRow label="Created" value={formatDateTime(tile.createdAt)} />
            </dl>
          </Section>

          <Section title="Trigger Job cURL">
            <CurlBlock tile={tile} revealSecrets={revealSecrets} />
          </Section>

          {!lastRun && (
            <p className="text-sm text-slate-400 italic">No runs have been triggered yet for this tile.</p>
          )}

          {lastRun?.trigger && (
            <Section
              title="Trigger Result"
              badge={lastRun.trigger.response && (
                <StatusPill ok={lastRun.trigger.response.ok} status={lastRun.trigger.response.status} statusText={lastRun.trigger.response.statusText} />
              )}
            >
              <div className="space-y-2">
                {lastRun.trigger.error ? (
                  <p className="text-xs text-red-500">{lastRun.trigger.error}</p>
                ) : (
                  <TriggerResultCard body={lastRun.trigger.response?.body} />
                )}
                <p className="text-[11px] text-slate-400">{formatDateTime(lastRun.trigger.request.timestamp)}</p>
                <Collapsible title="View request & raw response">
                  <RequestLine request={lastRun.trigger.request} />
                  <HeadersBlock headers={lastRun.trigger.request.headers} revealSecrets={revealSecrets} />
                  {!lastRun.trigger.error && <JsonBlock data={lastRun.trigger.response?.body} />}
                </Collapsible>
              </div>
            </Section>
          )}

          {lastRun?.poll && (
            <Section
              title="Run Summary"
              badge={lastRun.poll.response && (
                <StatusPill ok={lastRun.poll.response.ok} status={lastRun.poll.response.status} statusText={lastRun.poll.response.statusText} />
              )}
            >
              <div className="space-y-2">
                {lastRun.poll.error ? (
                  <p className="text-xs text-red-500">{lastRun.poll.error}</p>
                ) : (
                  <RunSummary summary={lastRun.poll.response?.body?.summary} />
                )}
                <p className="text-[11px] text-slate-400">
                  Last checked {formatDateTime(lastRun.poll.request.timestamp)}
                  {lastRun.pollCount ? ` · check #${lastRun.pollCount}` : ''}
                </p>
                <Collapsible title="View request & raw response">
                  <RequestLine request={lastRun.poll.request} />
                  <HeadersBlock headers={lastRun.poll.request.headers} revealSecrets={revealSecrets} />
                  {!lastRun.poll.error && <JsonBlock data={lastRun.poll.response?.body} />}
                </Collapsible>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, value, mono }) {
  return (
    <div className="min-w-0 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <dt className="text-slate-400">{label}</dt>
        <dd className={`text-slate-700 dark:text-slate-200 truncate ${mono ? 'font-mono' : ''}`} title={String(value)}>{value || '—'}</dd>
      </div>
      {value ? <CopyButton text={String(value)} /> : null}
    </div>
  )
}
