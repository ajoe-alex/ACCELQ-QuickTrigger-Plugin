const PASS_LIKE = ['passed', 'pass', 'completed', 'complete', 'success', 'finished']
const FAIL_LIKE = ['failed', 'fail', 'error', 'aborted', 'stopped', 'cancelled', 'canceled', 'timeout', 'timedout']
const RUNNING_LIKE = ['running', 'inprogress', 'in progress', 'executing', 'in-progress']
const WAITING_LIKE = ['scheduled', 'waiting', 'queued', 'pending']

export function getStatusStyle(rawStatus, internalStatus) {
  if (internalStatus === 'trigger_error' || internalStatus === 'poll_error') {
    return {
      dot: 'bg-red-500',
      chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    }
  }
  if (internalStatus === 'triggering') {
    return {
      dot: 'bg-blue-500 animate-pulse',
      chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
    }
  }

  const s = (rawStatus || '').trim().toLowerCase()
  if (PASS_LIKE.includes(s)) {
    return {
      dot: 'bg-emerald-500',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    }
  }
  if (FAIL_LIKE.includes(s)) {
    return {
      dot: 'bg-red-500',
      chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    }
  }
  if (RUNNING_LIKE.includes(s)) {
    return {
      dot: 'bg-violet-500 animate-pulse',
      chip: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900',
    }
  }
  if (WAITING_LIKE.includes(s)) {
    return {
      dot: 'bg-amber-500 animate-pulse',
      chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    }
  }
  return {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
  }
}
