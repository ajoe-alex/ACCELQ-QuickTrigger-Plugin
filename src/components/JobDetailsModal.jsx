import { useState } from 'react'
import { CloseIcon, CopyIcon, EyeIcon, EyeOffIcon, ChevronRightIcon, TrashIcon, PlayIcon, StopIcon, RefreshIcon } from './Icons'
import { formatDateTime, formatDuration, formatRelative, maskSecret } from '../utils/format'
import { buildTriggerRequest } from '../utils/api'
import { buildCurlCommand } from '../utils/curl'
import { getStatusStyle } from '../utils/statusStyles'
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

function Section({ title, children, badge, actions }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h4>
          {badge}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
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

function JobTile({ job, onStop, onResume, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const style = getStatusStyle(job.rawStatus, job.status)
  const isPolling = job.polling
  const isTerminal = job.status === 'terminal' || job.status === 'trigger_error' || job.status === 'poll_error'
  const canResume = job.jobPid && !isPolling && !isTerminal
  const duration = job.completedAt && job.startedAt ? job.completedAt - job.startedAt : null

  const statusLabel = () => {
    if (job.status === 'triggering') return 'Triggering…'
    if (job.status === 'trigger_error') return 'Trigger failed'
    if (job.status === 'poll_error') return 'Poll failed'
    return job.rawStatus || 'Pending'
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Job #{job.jobPid || '—'}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${style.chip}`}>
                {statusLabel()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Started {formatRelative(job.startedAt)}</span>
              {duration && <span>{formatDuration(duration)}</span>}
              {job.pollCount > 0 && <span>Polls: {job.pollCount}</span>}
            </div>
          </div>

          {/* Stats */}
          {(job.pass != null || job.fail != null) && (
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.pass ?? 0}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">{job.fail ?? 0}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-500 font-semibold">{job.notRun ?? 0}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isPolling && (
              <button
                onClick={() => onStop(job.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Stop polling"
              >
                <StopIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {canResume && (
              <button
                onClick={() => onResume(job.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                title="Resume polling"
              >
                <PlayIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {job.jobPid && (
              <button
                onClick={() => onRefresh(job.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh now"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(job.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Delete job"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
            <ChevronRightIcon className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Trigger Result */}
          {job.trigger && (
            <div className="pt-3">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-2">Trigger Result</p>
              {job.trigger.error ? (
                <p className="text-xs text-red-500">{job.trigger.error}</p>
              ) : (
                <TriggerResultCard body={job.trigger.response?.body} />
              )}
            </div>
          )}

          {/* Run Summary */}
          {job.poll?.response?.body?.summary && (
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-2">Run Summary</p>
              <RunSummary summary={job.poll.response.body.summary} />
            </div>
          )}

          {job.poll?.error && (
            <p className="text-xs text-red-500">{job.poll.error}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function JobDetailsModal({ tile, onClose, onRun, onStopJob, onResumeJob, onRefreshJob, onDeleteJob, onClearAllJobs }) {
  const [revealSecrets, setRevealSecrets] = useState(false)
  const jobs = tile.jobs || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col"
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
          {/* Tile Config */}
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

          {/* cURL */}
          <Section title="Trigger Job cURL">
            <CurlBlock tile={tile} revealSecrets={revealSecrets} />
          </Section>

          {/* Jobs Section */}
          <Section
            title={`Triggered Jobs (${jobs.length})`}
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRun(tile)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-700 transition-colors"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                  Run New Job
                </button>
                {jobs.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete all jobs from this tile?')) {
                        onClearAllJobs(tile.id)
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            }
          >
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">No jobs have been triggered yet.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobTile
                    key={job.id}
                    job={job}
                    onStop={(jobId) => onStopJob(tile.id, jobId)}
                    onResume={(jobId) => onResumeJob(tile.id, jobId)}
                    onRefresh={(jobId) => onRefreshJob(tile.id, jobId)}
                    onDelete={(jobId) => onDeleteJob(tile.id, jobId)}
                  />
                ))}
              </div>
            )}
          </Section>
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
