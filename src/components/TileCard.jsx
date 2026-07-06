import { useState } from 'react'
import { formatRelative } from '../utils/format'
import { PlayIcon, EditIcon, TrashIcon, ChevronRightIcon } from './Icons'

function JobCountBadge({ label, count, color }) {
  if (count === 0) return null
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${color}`}>
      <span className="text-xs font-semibold">{count}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
    </div>
  )
}

export default function TileCard({ tile, jobCounts, onRun, onEdit, onDelete, onOpenDetails, onChangePollFrequency }) {
  const [freqDraft, setFreqDraft] = useState(tile.pollFrequency)
  const [isTriggering, setIsTriggering] = useState(false)

  const latestJob = tile.jobs?.[0]

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn?.()
  }

  const handleRun = async () => {
    setIsTriggering(true)
    await onRun(tile)
    setIsTriggering(false)
  }

  const commitFreq = () => {
    const val = Math.max(3, Number(freqDraft) || 10)
    setFreqDraft(val)
    if (val !== tile.pollFrequency) onChangePollFrequency(val)
  }

  const lastActivity = latestJob?.lastUpdatedAt || tile.createdAt

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
          <p className="text-[10px] text-slate-400/70 font-mono truncate mt-0.5" title={tile.id}>
            ID: {tile.id}
          </p>
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
        <InfoRow label="Total Jobs" value={jobCounts.total || '—'} />
      </dl>

      {/* Job Counts */}
      {jobCounts.total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <JobCountBadge
            label="Running"
            count={jobCounts.running}
            color="bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          />
          <JobCountBadge
            label="Scheduled"
            count={jobCounts.scheduled}
            color="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          />
          <JobCountBadge
            label="Completed"
            count={jobCounts.completed}
            color="bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={stop(handleRun)}
            disabled={isTriggering}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            {isTriggering ? 'Triggering…' : 'Run'}
          </button>
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
        <span>{lastActivity ? `Updated ${formatRelative(lastActivity)}` : 'No activity'}</span>
        <span className="inline-flex items-center gap-0.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
          View Jobs <ChevronRightIcon className="w-3 h-3" />
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
