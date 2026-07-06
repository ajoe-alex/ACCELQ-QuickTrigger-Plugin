import { useCallback, useEffect, useRef, useState } from 'react'
import { loadTiles, saveTiles } from '../utils/storage'
import { triggerJob, pollJobStatus, isTerminalStatus } from '../utils/api'

export const DEFAULT_TILE_VALUES = {
  baseUrl: 'https://app.accelq.io/',
  tenantCode: 'aqsupport',
  projectName: 'AjoeAlexProject',
  templateJobId: '9782',
  userId: 'aq_support@aqsupport.com',
  apiKey: '',
  pollFrequency: 10,
}

function makeId(prefix = 'tile') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Status categories for counting
const RUNNING_STATUSES = ['running', 'inprogress', 'in progress', 'executing', 'in-progress', 'polling', 'triggering']
const SCHEDULED_STATUSES = ['scheduled', 'waiting', 'queued', 'pending']

function categorizeStatus(rawStatus, internalStatus) {
  const s = (rawStatus || internalStatus || '').toLowerCase().trim()
  if (internalStatus === 'triggering' || internalStatus === 'polling') return 'running'
  if (RUNNING_STATUSES.includes(s)) return 'running'
  if (SCHEDULED_STATUSES.includes(s)) return 'scheduled'
  if (internalStatus === 'terminal' || internalStatus === 'trigger_error' || internalStatus === 'poll_error') return 'completed'
  return 'completed'
}

export function useTiles() {
  const [tiles, setTiles] = useState(() => loadTiles())
  const tilesRef = useRef(tiles)
  // timersRef now stores timers per job: { [jobId]: intervalId }
  const timersRef = useRef({})

  useEffect(() => {
    tilesRef.current = tiles
    saveTiles(tiles)
  }, [tiles])

  const patchTile = useCallback((tileId, patch) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, ...(typeof patch === 'function' ? patch(t) : patch) } : t))
    )
  }, [])

  const patchJob = useCallback((tileId, jobId, patch) => {
    patchTile(tileId, (t) => {
      const jobs = t.jobs || []
      const idx = jobs.findIndex((j) => j.id === jobId)
      if (idx === -1) return {}
      const updatedJobs = [...jobs]
      updatedJobs[idx] = { ...updatedJobs[idx], ...(typeof patch === 'function' ? patch(updatedJobs[idx]) : patch) }
      return { jobs: updatedJobs }
    })
  }, [patchTile])

  const clearJobTimer = useCallback((jobId) => {
    if (timersRef.current[jobId]) {
      clearInterval(timersRef.current[jobId])
      delete timersRef.current[jobId]
    }
  }, [])

  // Poll a specific job
  const pollJob = useCallback(
    async (tileId, jobId, jobPid) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (!tile) return false

      const result = await pollJobStatus(tile, jobPid)
      const summary = result.response?.body?.summary
      const terminal = summary ? isTerminalStatus(summary.status) : false

      patchJob(tileId, jobId, (job) => {
        const updated = { ...job }
        updated.poll = { request: result.request, response: result.response, error: result.error }
        updated.pollCount = (updated.pollCount || 0) + 1
        updated.lastUpdatedAt = Date.now()
        if (result.error) {
          updated.status = 'poll_error'
          updated.polling = false
        } else if (summary) {
          updated.rawStatus = summary.status ?? null
          updated.pass = summary.pass
          updated.fail = summary.fail
          updated.notRun = summary.notRun
          updated.testcaseCount = summary.testcaseCount
          updated.status = terminal ? 'terminal' : 'polling'
          if (terminal) {
            updated.polling = false
            updated.completedAt = Date.now()
          }
        }
        return updated
      })

      if (terminal) clearJobTimer(jobId)
      return terminal
    },
    [patchJob, clearJobTimer]
  )

  const startJobPolling = useCallback(
    (tileId, jobId, jobPid, frequencySeconds) => {
      clearJobTimer(jobId)
      const freq = Math.max(3, Number(frequencySeconds) || 10)
      timersRef.current[jobId] = setInterval(() => {
        pollJob(tileId, jobId, jobPid)
      }, freq * 1000)
    },
    [clearJobTimer, pollJob]
  )

  // Resume polling for jobs that were mid-run when the page was last closed
  useEffect(() => {
    tiles.forEach((tile) => {
      const jobs = tile.jobs || []
      jobs.forEach(async (job) => {
        if (job.polling && job.jobPid && !timersRef.current[job.id]) {
          const terminal = await pollJob(tile.id, job.id, job.jobPid)
          if (!terminal) startJobPolling(tile.id, job.id, job.jobPid, tile.pollFrequency)
        }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      Object.values(timers).forEach(clearInterval)
    }
  }, [])

  const addTile = useCallback((tileData) => {
    const tile = {
      id: makeId('tile'),
      createdAt: Date.now(),
      jobs: [],
      ...tileData,
    }
    setTiles((prev) => [tile, ...prev])
    return tile.id
  }, [])

  // Import a tile - preserves ID if provided, used for import functionality
  const importTile = useCallback((tileData, preserveId = false) => {
    const tile = {
      id: preserveId && tileData.id ? tileData.id : makeId('tile'),
      createdAt: tileData.createdAt || Date.now(),
      jobs: [],
      label: tileData.label,
      baseUrl: tileData.baseUrl,
      tenantCode: tileData.tenantCode,
      projectName: tileData.projectName,
      templateJobId: tileData.templateJobId,
      userId: tileData.userId,
      apiKey: tileData.apiKey,
      pollFrequency: tileData.pollFrequency,
    }
    setTiles((prev) => [tile, ...prev])
    return tile.id
  }, [])

  // Check if a tile with the given ID exists
  const hasTile = useCallback((tileId) => {
    return tilesRef.current.some((t) => t.id === tileId)
  }, [])

  const updateTile = useCallback(
    (tileId, patch) => {
      patchTile(tileId, patch)
    },
    [patchTile]
  )

  const deleteTile = useCallback(
    (tileId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (tile?.jobs) {
        tile.jobs.forEach((job) => clearJobTimer(job.id))
      }
      setTiles((prev) => prev.filter((t) => t.id !== tileId))
    },
    [clearJobTimer]
  )

  // Run a new job - can be called multiple times to trigger concurrent jobs
  const runTile = useCallback(
    async (tileId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (!tile) return

      const jobId = makeId('job')
      const startedAt = Date.now()

      // Add a new job to the jobs array
      const newJob = {
        id: jobId,
        jobPid: null,
        templateJobId: tile.templateJobId,
        status: 'triggering',
        rawStatus: null,
        startedAt,
        lastUpdatedAt: startedAt,
        completedAt: null,
        trigger: null,
        poll: null,
        polling: false,
        pollCount: 0,
        pass: null,
        fail: null,
        notRun: null,
        testcaseCount: null,
      }

      patchTile(tileId, (t) => ({
        jobs: [newJob, ...(t.jobs || [])],
      }))

      const result = await triggerJob(tile)

      if (result.error || !result.response?.ok) {
        patchJob(tileId, jobId, {
          status: 'trigger_error',
          trigger: { request: result.request, response: result.response, error: result.error },
          lastUpdatedAt: Date.now(),
          completedAt: Date.now(),
        })
        return
      }

      const jobPid = result.response.body?.jobPid ?? null
      patchJob(tileId, jobId, {
        jobPid,
        status: jobPid ? 'polling' : 'trigger_error',
        trigger: { request: result.request, response: result.response, error: null },
        polling: !!jobPid,
        lastUpdatedAt: Date.now(),
        completedAt: jobPid ? null : Date.now(),
      })

      if (jobPid) {
        const terminal = await pollJob(tileId, jobId, jobPid)
        if (!terminal) startJobPolling(tileId, jobId, jobPid, tile.pollFrequency)
      }
    },
    [patchTile, patchJob, pollJob, startJobPolling]
  )

  const stopJobPolling = useCallback(
    (tileId, jobId) => {
      clearJobTimer(jobId)
      patchJob(tileId, jobId, { polling: false })
    },
    [clearJobTimer, patchJob]
  )

  const resumeJobPolling = useCallback(
    async (tileId, jobId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      const job = tile?.jobs?.find((j) => j.id === jobId)
      if (!job?.jobPid) return
      patchJob(tileId, jobId, { polling: true, status: 'polling' })
      const terminal = await pollJob(tileId, jobId, job.jobPid)
      if (!terminal) startJobPolling(tileId, jobId, job.jobPid, tile.pollFrequency)
    },
    [patchJob, pollJob, startJobPolling]
  )

  const refreshJob = useCallback(
    (tileId, jobId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      const job = tile?.jobs?.find((j) => j.id === jobId)
      if (job?.jobPid) {
        pollJob(tileId, jobId, job.jobPid)
      }
    },
    [pollJob]
  )

  const deleteJob = useCallback(
    (tileId, jobId) => {
      clearJobTimer(jobId)
      patchTile(tileId, (t) => ({
        jobs: (t.jobs || []).filter((j) => j.id !== jobId),
      }))
    },
    [clearJobTimer, patchTile]
  )

  const clearAllJobs = useCallback(
    (tileId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (tile?.jobs) {
        tile.jobs.forEach((job) => clearJobTimer(job.id))
      }
      patchTile(tileId, { jobs: [] })
    },
    [clearJobTimer, patchTile]
  )

  const setPollFrequency = useCallback(
    (tileId, freq) => {
      const cleanFreq = Math.max(3, Number(freq) || 10)
      const tile = tilesRef.current.find((t) => t.id === tileId)
      patchTile(tileId, { pollFrequency: cleanFreq })
      // Update polling interval for all active jobs
      if (tile?.jobs) {
        tile.jobs.forEach((job) => {
          if (job.polling && job.jobPid) {
            startJobPolling(tileId, job.id, job.jobPid, cleanFreq)
          }
        })
      }
    },
    [patchTile, startJobPolling]
  )

  // Helper to get job counts for a tile
  const getJobCounts = useCallback((tile) => {
    const jobs = tile?.jobs || []
    let running = 0
    let scheduled = 0
    let completed = 0

    jobs.forEach((job) => {
      const category = categorizeStatus(job.rawStatus, job.status)
      if (category === 'running') running++
      else if (category === 'scheduled') scheduled++
      else completed++
    })

    return { running, scheduled, completed, total: jobs.length }
  }, [])

  return {
    tiles,
    addTile,
    importTile,
    hasTile,
    updateTile,
    deleteTile,
    runTile,
    stopJobPolling,
    resumeJobPolling,
    refreshJob,
    deleteJob,
    clearAllJobs,
    setPollFrequency,
    getJobCounts,
  }
}
