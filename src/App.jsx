import { useMemo, useState } from 'react'
import { useTiles, DEFAULT_TILE_VALUES } from './hooks/useTiles'
import TileCard from './components/TileCard'
import TileForm from './components/TileForm'
import JobDetailsModal from './components/JobDetailsModal'
import { PlusIcon } from './components/Icons'

export default function App() {
  const { tiles, addTile, updateTile, deleteTile, runTile, stopPolling, resumePolling, refreshNow, setPollFrequency } = useTiles()
  const [formTile, setFormTile] = useState(undefined) // undefined = closed, null = new, object = edit
  const [detailsTileId, setDetailsTileId] = useState(null)

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
          <button
            onClick={() => setFormTile(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 shadow-sm transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Tile
          </button>
        </div>
      </header>

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
            <button
              onClick={() => setFormTile(null)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 shadow-sm transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add your first tile
            </button>
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
                      onRun={(t) => runTile(t.id)}
                      onStop={(t) => stopPolling(t.id)}
                      onResume={(t) => resumePolling(t.id)}
                      onRefresh={(t) => refreshNow(t.id)}
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

      {detailsTile && <JobDetailsModal tile={detailsTile} onClose={() => setDetailsTileId(null)} />}
    </div>
  )
}
