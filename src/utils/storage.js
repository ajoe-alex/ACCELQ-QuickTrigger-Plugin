const STORAGE_KEY = 'accelq-ci-trigger-tiles-v1'

export function loadTiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load tiles from localStorage', err)
    return []
  }
}

export function saveTiles(tiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles))
  } catch (err) {
    console.error('Failed to save tiles to localStorage', err)
  }
}
