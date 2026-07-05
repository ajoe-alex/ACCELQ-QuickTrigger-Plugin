import { getStatusStyle } from '../utils/statusStyles'
import { formatDateTime, formatDuration } from '../utils/format'

function StatTile({ label, value, tone }) {
  return (
    <div className="flex-1 min-w-[64px] rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 px-3 py-2 text-center">
      <div className={`text-lg font-semibold ${tone}`}>{value ?? '—'}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

function InfoItem({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700 dark:text-slate-200 truncate" title={String(value)}>
        {value}
      </dd>
    </div>
  )
}

function platformLabel(hostConfig) {
  if (!hostConfig) return null
  const web = hostConfig.webPlatformDetails
  if (web?.os || web?.browser) {
    return [web.os, web.browser].filter(Boolean).join(' · ')
  }
  const mobile = hostConfig.mobilePlatformDetailsList?.[0] || hostConfig.mobilePlatformDetails
  if (mobile?.os || mobile?.name) {
    return [mobile.name, mobile.os, mobile.osVersion].filter(Boolean).join(' · ')
  }
  return null
}

export function TriggerResultCard({ body }) {
  if (!body) return null
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 space-y-1.5">
      {body.message && <p className="text-sm text-slate-700 dark:text-slate-200">{body.message}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {body.jobPid != null && (
          <span>
            Job PID: <span className="font-medium text-slate-700 dark:text-slate-200">{body.jobPid}</span>
          </span>
        )}
        {body.templateJobPid != null && (
          <span>
            Template Job PID:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">{body.templateJobPid}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function RunSummary({ summary }) {
  if (!summary) return null
  const style = getStatusStyle(summary.status, 'polling')
  const duration = summary.completedTimestamp ? summary.completedTimestamp - summary.startTimestamp : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.chip}`}>{summary.status}</span>
        {summary.bugsCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900">
            {summary.bugsCount} bug{summary.bugsCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <StatTile label="Pass" value={summary.pass} tone="text-emerald-600 dark:text-emerald-400" />
        <StatTile label="Fail" value={summary.fail} tone="text-red-600 dark:text-red-400" />
        <StatTile label="Not Run" value={summary.notRun} tone="text-slate-500" />
        <StatTile label="Total" value={summary.testcaseCount} tone="text-slate-700 dark:text-slate-200" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <InfoItem label="Scenario" value={summary.scnName} />
        <InfoItem label="Purpose" value={summary.purpose} />
        <InfoItem label="Dataset" value={summary.datasetName} />
        <InfoItem label="App Variant" value={summary.appVariantOptionName} />
        <InfoItem label="Created By" value={summary.createdBy} />
        <InfoItem label="Agent" value={summary.hostConfig?.agentName} />
        <InfoItem label="Platform" value={platformLabel(summary.hostConfig)} />
        <InfoItem label="Started" value={formatDateTime(summary.startTimestamp)} />
        <InfoItem
          label="Completed"
          value={summary.completedTimestamp ? formatDateTime(summary.completedTimestamp) : 'In progress'}
        />
        <InfoItem label="Duration" value={duration ? formatDuration(duration) : null} />
      </dl>

      {summary.testCaseSummaryList?.length > 0 && (
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {summary.testCaseSummaryList.map((tc) => {
            const tcStyle = getStatusStyle(tc.status, 'polling')
            const tcDuration = tc.endDate && tc.startDate ? tc.endDate - tc.startDate : null
            return (
              <div
                key={tc.id ?? tc.dbPid ?? tc.name}
                className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${tcStyle.dot}`} />
                  <span className="truncate text-slate-700 dark:text-slate-200">{tc.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 shrink-0">
                  {tcDuration != null && <span>{formatDuration(tcDuration)}</span>}
                  {tc.extResultLink && (
                    <a
                      href={tc.extResultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {summary.extResultUrl && (
        <a
          href={summary.extResultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View full result in ACCELQ →
        </a>
      )}
    </div>
  )
}
