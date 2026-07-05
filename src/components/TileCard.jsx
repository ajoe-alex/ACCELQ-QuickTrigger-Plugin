import { useState } from 'react'
import { getStatusStyle } from '../utils/statusStyles'
import { formatRelative } from '../utils/format'
import { PlayIcon, StopIcon, RefreshIcon, EditIcon, TrashIcon, ChevronRightIcon } from './Icons'

function StatCounter({ label, value, tone }) {
  return (
    <div className="flex flex-col items-center px-2">
      <span className={`text-sm font-semibold ${tone}`}>{value ?? '—'}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

export default function TileCard({ tile, onRun, onStop, onResume, onRefresh, onEdit, onDelete, onOpenDetails, onChangePollFrequency }) {
  const [freqDraft, setFreqDraft] = useState(tile.pollFrequency)
  const lastRun = tile.lastRun
  const isBusy = lastRun?.status === 'triggering'
  const isPolling = !!lastRun?.polling
  const style = getStatusStyle(lastRun?.rawStatus, lastRun?.status)

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn?.()
  }

  const statusLabel = () => {
    if (!lastRun) return 'Not run yet'
    if (lastRun.status === 'triggering') return 'Triggering…'
    if (lastRun.status === 'trigger_error') return 'Trigger failed'
    if (lastRun.status === 'poll_error') return 'Status check failed'
    return lastRun.rawStatus || 'Pending'
  }

  const commitFreq = () => {
    const val = Math.max(3, Number(freqDraft) || 10)
    setFreqDraft(val)
    if (val !== tile.pollFrequency) onChangePollFrequency(val)
  }

  return (
    <div
      onClick={() => onOpenDetails(tile)}
      className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-800 transition-all p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {tile.label || tile.projectName}
          </h3>
          <p className="text-xs text-slate-400 truncate">{tile.tenantCode} / {tile.projectName}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={stop(() => onEdit(tile))} className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40" title="Edit tile">
            <EditIcon />
          </button>
          <button onClick={stop(() => onDelete(tile))} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" title="Delete tile">
            <TrashIcon />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <InfoRow label="Base URL" value={tile.baseUrl} />
        <InfoRow label="Template Job ID" value={tile.templateJobId} />
        <InfoRow label="User ID" value={tile.userId} />
        <InfoRow label="Job PID" value={lastRun?.jobPid ?? '—'} />
      </dl>

      <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
          <div className="min-w-0">
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${style.chip}`}>
              {statusLabel()}
            </span>
          </div>
        </div>
        {lastRun && (lastRun.status === 'polling' || lastRun.status === 'terminal') && (
          <div className="flex divide-x divide-slate-200 dark:divide-slate-700 shrink-0">
            <StatCounter label="Pass" value={lastRun.pass} tone="text-emerald-600 dark:text-emerald-400" />
            <StatCounter label="Fail" value={lastRun.fail} tone="text-red-600 dark:text-red-400" />
            <StatCounter label="N/R" value={lastRun.notRun} tone="text-slate-500" />
          </div>
        )}
      </div>

      {(lastRun?.status === 'trigger_error' || lastRun?.status === 'poll_error') && (
        <p className="text-xs text-red-600 dark:text-red-400 -mt-2 line-clamp-2">
          {lastRun.status === 'trigger_error'
            ? lastRun.trigger?.error || `HTTP ${lastRun.trigger?.response?.status ?? ''} ${lastRun.trigger?.response?.statusText ?? ''}`
            : lastRun.poll?.error || `HTTP ${lastRun.poll?.response?.status ?? ''} ${lastRun.poll?.response?.statusText ?? ''}`}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {!isPolling ? (
            <>
              {lastRun?.jobPid && lastRun.status !== 'terminal' && lastRun.status !== 'triggering' && (
                <button
                  onClick={stop(() => onResume(tile))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 transition-colors"
                  title="Resume polling this job's status"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                  Resume
                </button>
              )}
              <button
                onClick={stop(() => onRun(tile))}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                {isBusy ? 'Running…' : lastRun ? 'Run Again' : 'Run'}
              </button>
            </>
          ) : (
            <button
              onClick={stop(() => onStop(tile))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 transition-colors"
            >
              <StopIcon className="w-3.5 h-3.5" />
              Stop
            </button>
          )}
          {lastRun?.jobPid && (
            <button
              onClick={stop(() => onRefresh(tile))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh status now"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Poll</span>
          <input
            type="number"
            min={3}
            value={freqDraft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setFreqDraft(e.target.value)}
            onBlur={(e) => { e.stopPropagation(); commitFreq() }}
            className="w-12 rounded border border-slate-200 dark:border-slate-700 bg-transparent px-1 py-0.5 text-center text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span>s</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 -mt-1">
        <span>{lastRun?.lastUpdatedAt ? `Updated ${formatRelative(lastRun.lastUpdatedAt)}` : 'No activity'}</span>
        <span className="inline-flex items-center gap-0.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Details <ChevronRightIcon className="w-3 h-3" />
        </span>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-600 dark:text-slate-300 truncate" title={String(value)}>{value}</dd>
    </div>
  )
}
