import { useMemo, useRef, useState } from 'react'
import { useTiles, DEFAULT_TILE_VALUES } from './hooks/useTiles'
import TileCard from './components/TileCard'
import TileForm from './components/TileForm'
import JobDetailsModal from './components/JobDetailsModal'
import { PlusIcon, DownloadIcon, UploadIcon } from './components/Icons'
import { downloadTilesAsJson, readTilesFromFile, categorizeImportedTiles } from './utils/exportImport'

export default function App() {
  const {
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
  } = useTiles()

  const [formTile, setFormTile] = useState(undefined) // undefined = closed, null = new, object = edit
  const [detailsTileId, setDetailsTileId] = useState(null)
  const fileInputRef = useRef(null)

  const detailsTile = tiles.find((t) => t.id === detailsTileId) || null

  const tenantGroups = useMemo(() => {
    const groups = new Map()
    tiles.forEach((tile) => {
      const key = tile.tenantCode?.trim() || 'Unassigned'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(tile)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [tiles])

  const handleSubmit = (data) => {
    if (formTile) {
      updateTile(formTile.id, data)
    } else {
      addTile(data)
    }
    setFormTile(undefined)
  }

  const handleDelete = (tile) => {
    if (window.confirm(`Delete tile "${tile.label || tile.projectName}"? This cannot be undone.`)) {
      deleteTile(tile.id)
      if (detailsTileId === tile.id) setDetailsTileId(null)
    }
  }

  const handleExport = () => {
    if (tiles.length === 0) {
      alert('No tiles to export')
      return
    }
    downloadTilesAsJson(tiles)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importedTiles = await readTilesFromFile(file)
      const { newTiles, duplicateTiles } = categorizeImportedTiles(importedTiles, tiles)

      // Build summary message
      const messages = []
      if (newTiles.length > 0) {
        messages.push(`${newTiles.length} new tile${newTiles.length !== 1 ? 's' : ''}`)
      }
      if (duplicateTiles.length > 0) {
        messages.push(`${duplicateTiles.length} already exist${duplicateTiles.length === 1 ? 's' : ''}`)
      }

      if (newTiles.length === 0 && duplicateTiles.length > 0) {
        // All tiles already exist
        const updateAll = window.confirm(
          `All ${duplicateTiles.length} tile${duplicateTiles.length !== 1 ? 's' : ''} already exist.\n\nDo you want to update them with the imported configuration?`
        )
        if (updateAll) {
          duplicateTiles.forEach((tileData) => {
            updateTile(tileData.id, {
              label: tileData.label,
              baseUrl: tileData.baseUrl,
              tenantCode: tileData.tenantCode,
              projectName: tileData.projectName,
              templateJobId: tileData.templateJobId,
              userId: tileData.userId,
              apiKey: tileData.apiKey,
              pollFrequency: tileData.pollFrequency,
            })
          })
          alert(`Updated ${duplicateTiles.length} tile${duplicateTiles.length !== 1 ? 's' : ''}`)
        }
      } else if (newTiles.length > 0 && duplicateTiles.length === 0) {
        // All tiles are new
        const confirmed = window.confirm(
          `Import ${newTiles.length} new tile${newTiles.length !== 1 ? 's' : ''}?`
        )
        if (confirmed) {
          newTiles.forEach((tileData) => importTile(tileData, true))
          alert(`Imported ${newTiles.length} tile${newTiles.length !== 1 ? 's' : ''}`)
        }
      } else if (newTiles.length > 0 && duplicateTiles.length > 0) {
        // Mix of new and existing
        const choice = window.prompt(
          `Found:\n• ${newTiles.length} new tile${newTiles.length !== 1 ? 's' : ''}\n• ${duplicateTiles.length} existing tile${duplicateTiles.length !== 1 ? 's' : ''}\n\nEnter:\n  "new" - Import only new tiles\n  "all" - Import new + update existing\n  "cancel" - Cancel import`,
          'new'
        )

        if (choice === 'new' || choice === 'all') {
          // Import new tiles
          newTiles.forEach((tileData) => importTile(tileData, true))

          if (choice === 'all') {
            // Also update existing tiles
            duplicateTiles.forEach((tileData) => {
              updateTile(tileData.id, {
                label: tileData.label,
                baseUrl: tileData.baseUrl,
                tenantCode: tileData.tenantCode,
                projectName: tileData.projectName,
                templateJobId: tileData.templateJobId,
                userId: tileData.userId,
                apiKey: tileData.apiKey,
                pollFrequency: tileData.pollFrequency,
              })
            })
            alert(`Imported ${newTiles.length} new + updated ${duplicateTiles.length} existing`)
          } else {
            alert(`Imported ${newTiles.length} new tile${newTiles.length !== 1 ? 's' : ''} (skipped ${duplicateTiles.length} existing)`)
          }
        }
      } else {
        alert('No tiles found in the import file')
      }
    } catch (err) {
      alert(`Import failed: ${err.message}`)
    }

    // Reset file input
    e.target.value = ''
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              QT
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                ACCELQ QuickTrigger
              </h1>
              <p className="text-xs text-slate-400 leading-tight">Trigger and monitor ACCELQ job runs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Import tiles from JSON"
            >
              <UploadIcon className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Export tiles as JSON with curl commands"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setFormTile(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 shadow-sm transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Tile
            </button>
          </div>
        </div>
      </header>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="h-12 w-12 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 mb-4">
              <PlusIcon className="w-5 h-5" />
            </div>
            <h2 className="text-slate-700 dark:text-slate-200 font-medium">No tiles yet</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Add a tile with your ACCELQ tenant, project, and template job details to start triggering runs.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                Import from JSON
              </button>
              <button
                onClick={() => setFormTile(null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 shadow-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add your first tile
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {tenantGroups.map(([tenantCode, tenantTiles]) => (
              <section key={tenantCode}>
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                  {tenantCode}
                  <span className="font-normal normal-case text-slate-400">({tenantTiles.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tenantTiles.map((tile) => (
                    <TileCard
                      key={tile.id}
                      tile={tile}
                      jobCounts={getJobCounts(tile)}
                      onRun={(t) => runTile(t.id)}
                      onEdit={(t) => setFormTile(t)}
                      onDelete={handleDelete}
                      onOpenDetails={(t) => setDetailsTileId(t.id)}
                      onChangePollFrequency={(freq) => setPollFrequency(tile.id, freq)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {formTile !== undefined && (
        <TileForm
          initialData={formTile ? { ...DEFAULT_TILE_VALUES, ...formTile } : null}
          onSubmit={handleSubmit}
          onClose={() => setFormTile(undefined)}
        />
      )}

      {detailsTile && (
        <JobDetailsModal
          tile={detailsTile}
          onClose={() => setDetailsTileId(null)}
          onRun={(t) => runTile(t.id)}
          onStopJob={stopJobPolling}
          onResumeJob={resumeJobPolling}
          onRefreshJob={refreshJob}
          onDeleteJob={deleteJob}
          onClearAllJobs={clearAllJobs}
        />
      )}
    </div>
  )
}
