import { useCallback, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useSceneStore, useUiStore, useBridgeStore } from '../../../app/state'
import { filterTerminalCommandPaletteItems } from '../model'
import { useTerminalFilters } from './useTerminalFilters'
import { useTerminalCommands } from './useTerminalCommands'
import { useTerminalKeyboard } from './useTerminalKeyboard'
import { useTerminalAutoScroll } from './useTerminalAutoScroll'

export function useSceneEventTerminalState() {
  const {
    activeToolMode,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
  } = useUiStore(
    useShallow((s) => ({
      activeToolMode: s.activeToolMode,
      sceneEventAutoScroll: s.sceneEventAutoScroll,
      sceneEventDroppedWhilePaused: s.sceneEventDroppedWhilePaused,
      sceneEventLog: s.sceneEventLog,
      sceneEventLogPaused: s.sceneEventLogPaused,
      sceneEventTerminalOpen: s.sceneEventTerminalOpen,
    }))
  )

  const { sceneEditEnabled, sceneId } = useSceneStore(
    useShallow((s) => ({
      sceneEditEnabled: s.sceneEditEnabled,
      sceneId: s.sceneId,
    }))
  )

  const sceneRemoteHoldEnabled = useBridgeStore((s) => s.sceneRemoteHoldEnabled)

  const filters = useTerminalFilters(sceneEventLog)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const commandContext = useMemo(
    () => ({
      activeToolMode,
      sceneEventAutoScroll,
      sceneEventLogPaused,
      sceneEventTerminalOpen,
      sceneEditEnabled,
      sceneId,
      sceneRemoteHoldEnabled,
      showDimensions: false,
    }),
    [activeToolMode, sceneEditEnabled, sceneEventAutoScroll, sceneEventLogPaused, sceneEventTerminalOpen, sceneId, sceneRemoteHoldEnabled],
  )

  const commands = useTerminalCommands(commandContext)

  const commandPaletteItems = useMemo(
    () => filterTerminalCommandPaletteItems(commands.commandPaletteQuery),
    [commands.commandPaletteQuery],
  )

  useTerminalKeyboard({
    commandPaletteOpen: commands.commandPaletteOpen,
    commandHistoryExpanded: commands.commandHistoryExpanded,
    dynamicInputEnabled: commands.dynamicInputEnabled,
  })

  useTerminalAutoScroll({
    bodyRef,
    filteredEvents: filters.filteredEvents,
    sceneEventAutoScroll,
    sceneEventTerminalOpen,
  })

  return {
    // Core refs
    bodyRef,

    // Computed values
    filteredEvents: filters.filteredEvents,
    filterOptions: filters.filterOptions,
    selectedEvent: filters.selectedEvent,
    selectedEventPayload: filters.selectedEventPayload,
    commandPaletteItems,

    // UI state from store
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,

    // Composed hooks (spread)
    ...filters.filters,
    ...filters.setters,
    selectedEventId: filters.selectedEventId,
    ...commands,
  }
}
