import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import type { SceneEventEntry } from '../../../core/observability/sceneEventLog'
import { useTerminalUiStore } from '../../../app/state'
import { buildSceneEventFilterOptions, filterSceneEvents, selectSceneEvent, stringifySceneEventPayload } from '../model'

export function useTerminalFilters(sceneEventLog: SceneEventEntry[]) {
  const {
    sourceFilter,
    kindFilter,
    sceneFilter,
    levelFilter,
    searchFilter,
  } = useTerminalUiStore(
    useShallow((s) => ({
      sourceFilter: s.sourceFilter,
      kindFilter: s.kindFilter,
      sceneFilter: s.sceneFilter,
      levelFilter: s.levelFilter,
      searchFilter: s.searchFilter,
    })),
  )

  const selectedEventId = useTerminalUiStore((s) => s.selectedEventId)

  const {
    setSourceFilter,
    setKindFilter,
    setSceneFilter,
    setLevelFilter,
    setSearchFilter,
    setSelectedEventId,
  } = useTerminalUiStore(
    useShallow((s) => ({
      setSourceFilter: s.setSourceFilter,
      setKindFilter: s.setKindFilter,
      setSceneFilter: s.setSceneFilter,
      setLevelFilter: s.setLevelFilter,
      setSearchFilter: s.setSearchFilter,
      setSelectedEventId: s.setSelectedEventId,
    })),
  )

  const filterOptions = useMemo(() => buildSceneEventFilterOptions(sceneEventLog), [sceneEventLog])

  const filteredEvents = useMemo(
    () =>
      filterSceneEvents(sceneEventLog, {
        kindFilter,
        levelFilter,
        sceneFilter,
        searchFilter,
        sourceFilter,
      }),
    [kindFilter, levelFilter, sceneEventLog, sceneFilter, searchFilter, sourceFilter],
  )

  const selectedEvent = useMemo(() => selectSceneEvent(filteredEvents, selectedEventId), [filteredEvents, selectedEventId])
  const selectedEventPayload = useMemo(() => stringifySceneEventPayload(selectedEvent), [selectedEvent])

  return {
    filters: {
      sourceFilter,
      kindFilter,
      sceneFilter,
      levelFilter,
      searchFilter,
    },
    setters: {
      setSourceFilter,
      setKindFilter,
      setSceneFilter,
      setLevelFilter,
      setSearchFilter,
      setSelectedEventId,
    },
    selectedEventId,
    filterOptions,
    filteredEvents,
    selectedEvent,
    selectedEventPayload,
  }
}
