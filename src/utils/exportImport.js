import { buildTriggerRequest } from './api'
import { buildCurlCommand } from './curl'

/**
 * Export tiles as JSON with curl commands
 */
export function exportTiles(tiles) {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tiles: tiles.map((tile) => {
      const request = buildTriggerRequest(tile)
      const curl = buildCurlCommand(request)

      return {
        // Include unique ID for duplicate detection on import
        id: tile.id,
        // Config fields only (no runtime state like jobs)
        label: tile.label || null,
        baseUrl: tile.baseUrl,
        tenantCode: tile.tenantCode,
        projectName: tile.projectName,
        templateJobId: tile.templateJobId,
        userId: tile.userId,
        apiKey: tile.apiKey,
        pollFrequency: tile.pollFrequency,
        createdAt: tile.createdAt,
        // Include curl for reference
        curl,
      }
    }),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download tiles as JSON file
 */
export function downloadTilesAsJson(tiles) {
  const json = exportTiles(tiles)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `accelq-tiles-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate imported JSON
 */
export function parseImportedTiles(jsonString) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON format')
  }

  // Support both array format and object with tiles array
  const tilesArray = Array.isArray(data) ? data : data?.tiles

  if (!Array.isArray(tilesArray)) {
    throw new Error('Expected an array of tiles or an object with a "tiles" array')
  }

  // Validate and clean each tile
  const validTiles = tilesArray.map((tile, index) => {
    if (!tile.baseUrl) throw new Error(`Tile ${index + 1}: missing baseUrl`)
    if (!tile.tenantCode) throw new Error(`Tile ${index + 1}: missing tenantCode`)
    if (!tile.projectName) throw new Error(`Tile ${index + 1}: missing projectName`)
    if (!tile.templateJobId) throw new Error(`Tile ${index + 1}: missing templateJobId`)
    if (!tile.userId) throw new Error(`Tile ${index + 1}: missing userId`)

    return {
      // Preserve ID if present for duplicate detection
      id: tile.id || null,
      label: tile.label || null,
      baseUrl: tile.baseUrl,
      tenantCode: tile.tenantCode,
      projectName: tile.projectName,
      templateJobId: String(tile.templateJobId),
      userId: tile.userId,
      apiKey: tile.apiKey || '',
      pollFrequency: Math.max(3, Number(tile.pollFrequency) || 10),
      createdAt: tile.createdAt || null,
    }
  })

  return validTiles
}

/**
 * Categorize imported tiles as new, existing, or updated
 */
export function categorizeImportedTiles(importedTiles, existingTiles) {
  const existingIds = new Set(existingTiles.map((t) => t.id))

  const newTiles = []
  const duplicateTiles = []

  importedTiles.forEach((tile) => {
    if (tile.id && existingIds.has(tile.id)) {
      duplicateTiles.push(tile)
    } else {
      newTiles.push(tile)
    }
  })

  return { newTiles, duplicateTiles }
}

/**
 * Read file and parse tiles
 */
export function readTilesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const tiles = parseImportedTiles(e.target.result)
        resolve(tiles)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
