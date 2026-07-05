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

function makeId() {
  return `tile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useTiles() {
  const [tiles, setTiles] = useState(() => loadTiles())
  const tilesRef = useRef(tiles)
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

  const clearTimer = useCallback((tileId) => {
    if (timersRef.current[tileId]) {
      clearInterval(timersRef.current[tileId])
      delete timersRef.current[tileId]
    }
  }, [])

  // Returns true if the polled status turned out to be terminal.
  const pollOnce = useCallback(
    async (tileId, jobPidOverride) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (!tile) return false
      const jobPid = jobPidOverride ?? tile.lastRun?.jobPid
      if (!jobPid) return false

      const result = await pollJobStatus(tile, jobPid)
      const summary = result.response?.body?.summary
      const terminal = summary ? isTerminalStatus(summary.status) : false

      patchTile(tileId, (t) => {
        if (!t.lastRun || t.lastRun.jobPid !== jobPid) return {}
        const lastRun = { ...t.lastRun }
        lastRun.poll = { request: result.request, response: result.response, error: result.error }
        lastRun.pollCount = (lastRun.pollCount || 0) + 1
        lastRun.lastUpdatedAt = Date.now()
        if (result.error) {
          lastRun.status = 'poll_error'
        } else if (summary) {
          lastRun.rawStatus = summary.status ?? null
          lastRun.pass = summary.pass
          lastRun.fail = summary.fail
          lastRun.notRun = summary.notRun
          lastRun.testcaseCount = summary.testcaseCount
          lastRun.status = terminal ? 'terminal' : 'polling'
          if (terminal) lastRun.polling = false
        }
        return { lastRun }
      })

      if (terminal) clearTimer(tileId)
      return terminal
    },
    [patchTile, clearTimer]
  )

  const startPolling = useCallback(
    (tileId, frequencySeconds) => {
      clearTimer(tileId)
      const freq = Math.max(3, Number(frequencySeconds) || 10)
      timersRef.current[tileId] = setInterval(() => {
        pollOnce(tileId)
      }, freq * 1000)
    },
    [clearTimer, pollOnce]
  )

  // Resume polling for any tile that was mid-run when the page was last closed.
  useEffect(() => {
    tiles.forEach(async (tile) => {
      if (tile.lastRun?.polling && tile.lastRun?.jobPid && !timersRef.current[tile.id]) {
        const terminal = await pollOnce(tile.id)
        if (!terminal) startPolling(tile.id, tile.pollFrequency)
      }
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
      id: makeId(),
      createdAt: Date.now(),
      lastRun: null,
      ...tileData,
    }
    setTiles((prev) => [tile, ...prev])
    return tile.id
  }, [])

  const updateTile = useCallback(
    (tileId, patch) => {
      patchTile(tileId, patch)
    },
    [patchTile]
  )

  const deleteTile = useCallback(
    (tileId) => {
      clearTimer(tileId)
      setTiles((prev) => prev.filter((t) => t.id !== tileId))
    },
    [clearTimer]
  )

  const runTile = useCallback(
    async (tileId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (!tile) return
      clearTimer(tileId)
      const startedAt = Date.now()
      patchTile(tileId, {
        lastRun: {
          jobPid: null,
          templateJobId: tile.templateJobId,
          status: 'triggering',
          rawStatus: null,
          subStatus: null,
          startedAt,
          lastUpdatedAt: startedAt,
          trigger: null,
          poll: null,
          polling: false,
          pollCount: 0,
        },
      })

      const result = await triggerJob(tile)

      if (result.error || !result.response?.ok) {
        patchTile(tileId, (t) => ({
          lastRun: {
            ...t.lastRun,
            status: 'trigger_error',
            trigger: { request: result.request, response: result.response, error: result.error },
            lastUpdatedAt: Date.now(),
          },
        }))
        return
      }

      const jobPid = result.response.body?.jobPid ?? null
      patchTile(tileId, (t) => ({
        lastRun: {
          ...t.lastRun,
          jobPid,
          status: jobPid ? 'polling' : 'trigger_error',
          trigger: { request: result.request, response: result.response, error: null },
          polling: !!jobPid,
          lastUpdatedAt: Date.now(),
        },
      }))

      if (jobPid) {
        const terminal = await pollOnce(tileId, jobPid)
        if (!terminal) startPolling(tileId, tile.pollFrequency)
      }
    },
    [patchTile, clearTimer, pollOnce, startPolling]
  )

  const stopPolling = useCallback(
    (tileId) => {
      clearTimer(tileId)
      patchTile(tileId, (t) => (t.lastRun ? { lastRun: { ...t.lastRun, polling: false } } : {}))
    },
    [clearTimer, patchTile]
  )

  const resumePolling = useCallback(
    async (tileId) => {
      const tile = tilesRef.current.find((t) => t.id === tileId)
      if (!tile?.lastRun?.jobPid) return
      patchTile(tileId, (t) => ({ lastRun: { ...t.lastRun, polling: true, status: 'polling' } }))
      const terminal = await pollOnce(tileId)
      if (!terminal) startPolling(tileId, tile.pollFrequency)
    },
    [patchTile, pollOnce, startPolling]
  )

  const refreshNow = useCallback(
    (tileId) => {
      pollOnce(tileId)
    },
    [pollOnce]
  )

  const setPollFrequency = useCallback(
    (tileId, freq) => {
      const cleanFreq = Math.max(3, Number(freq) || 10)
      const tile = tilesRef.current.find((t) => t.id === tileId)
      patchTile(tileId, { pollFrequency: cleanFreq })
      if (tile?.lastRun?.polling) {
        startPolling(tileId, cleanFreq)
      }
    },
    [patchTile, startPolling]
  )

  return {
    tiles,
    addTile,
    updateTile,
    deleteTile,
    runTile,
    stopPolling,
    resumePolling,
    refreshNow,
    setPollFrequency,
  }
}
