import type { SceneEventEntry, SceneEventLevel } from '../../../core/observability'

export type SceneEventFilters = {
  kindFilter: string
  levelFilter: 'all' | SceneEventLevel
  sceneFilter: string
  searchFilter: string
  sourceFilter: string
}

type SceneEventFilterOptions = {
  kinds: string[]
  scenes: string[]
  sources: string[]
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

export function formatSceneEventTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleTimeString([], { hour12: false }) + `.${String(date.getMilliseconds()).padStart(3, '0')}`
}

export function buildSceneEventFilterOptions(sceneEventLog: SceneEventEntry[]): SceneEventFilterOptions {
  return {
    kinds: uniqueSorted(sceneEventLog.map((entry) => entry.kind)),
    scenes: uniqueSorted(sceneEventLog.map((entry) => entry.sceneId).filter((entry): entry is string => Boolean(entry))),
    sources: uniqueSorted(sceneEventLog.map((entry) => entry.source)),
  }
}

export function filterSceneEvents(sceneEventLog: SceneEventEntry[], filters: SceneEventFilters): SceneEventEntry[] {
  const query = filters.searchFilter.trim().toLowerCase()
  return sceneEventLog.filter((entry) => {
    if (filters.sourceFilter !== 'all' && entry.source !== filters.sourceFilter) return false
    if (filters.kindFilter !== 'all' && entry.kind !== filters.kindFilter) return false
    if (filters.sceneFilter !== 'all' && entry.sceneId !== filters.sceneFilter) return false
    if (filters.levelFilter !== 'all' && entry.level !== filters.levelFilter) return false
    if (!query) return true
    return (
      entry.summary.toLowerCase().includes(query) ||
      entry.kind.toLowerCase().includes(query) ||
      entry.source.toLowerCase().includes(query) ||
      (entry.sceneId ?? '').toLowerCase().includes(query)
    )
  })
}

export function selectSceneEvent(filteredEvents: SceneEventEntry[], selectedEventId: string | null): SceneEventEntry | null {
  if (filteredEvents.length === 0) return null
  if (!selectedEventId) return filteredEvents[filteredEvents.length - 1]
  return filteredEvents.find((entry) => entry.id === selectedEventId) ?? filteredEvents[filteredEvents.length - 1]
}

export function stringifySceneEventPayload(selectedEvent: SceneEventEntry | null): string {
  if (!selectedEvent || typeof selectedEvent.payload === 'undefined') return ''
  try {
    return JSON.stringify(selectedEvent.payload, null, 2)
  } catch {
    return String(selectedEvent.payload)
  }
}
