import type { WidgetPayload } from '@dna-codes/dna-mcp'

export interface SavedLens {
  id: string
  name: string
  widget: WidgetPayload
  savedAt: number
}

const STORAGE_KEY = 'dna-saved-lenses'

export function loadSavedLenses(): SavedLens[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedLens[]
  } catch {
    return []
  }
}

export function persistSavedLenses(lenses: SavedLens[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lenses))
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

export function clearSavedLenses(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
