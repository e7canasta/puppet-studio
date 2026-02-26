import { create } from 'zustand'
import type { SceneEventLevel } from '../../core/observability'

export type CommandHistoryEntry = {
  at: string
  commandsCount: number
  input: string
  message: string
  status: 'error' | 'ok'
}

export type TerminalUiState = {
  // Filters
  sourceFilter: string
  kindFilter: string
  sceneFilter: string
  levelFilter: 'all' | SceneEventLevel
  searchFilter: string

  // Selected event
  selectedEventId: string | null

  // Command input
  commandInput: string
  commandHistory: CommandHistoryEntry[]
  commandHistoryExpanded: boolean
  commandHistoryCursor: number | null
  commandSuggestionCursor: number | null

  // Command palette
  commandPaletteOpen: boolean
  commandPaletteQuery: string
  commandPaletteSelectedIndex: number

  // Dynamic input (F12 toggle)
  dynamicInputEnabled: boolean

  // Actions
  setSourceFilter: (filter: string) => void
  setKindFilter: (filter: string) => void
  setSceneFilter: (filter: string) => void
  setLevelFilter: (filter: 'all' | SceneEventLevel) => void
  setSearchFilter: (filter: string) => void
  setSelectedEventId: (id: string | null) => void
  setCommandInput: (input: string) => void
  setCommandHistoryExpanded: (expanded: boolean) => void
  setCommandHistoryCursor: (cursor: number | null) => void
  setCommandSuggestionCursor: (cursor: number | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  setCommandPaletteQuery: (query: string) => void
  setCommandPaletteSelectedIndex: (index: number) => void
  setDynamicInputEnabled: (enabled: boolean) => void
  appendCommandHistory: (entry: CommandHistoryEntry) => void
  resetCommandInput: () => void
}

const MAX_COMMAND_HISTORY = 120

export const useTerminalUiStore = create<TerminalUiState>((set) => ({
  // Initial state
  sourceFilter: 'all',
  kindFilter: 'all',
  sceneFilter: 'all',
  levelFilter: 'all',
  searchFilter: '',
  selectedEventId: null,
  commandInput: '',
  commandHistory: [],
  commandHistoryExpanded: false,
  commandHistoryCursor: null,
  commandSuggestionCursor: null,
  commandPaletteOpen: false,
  commandPaletteQuery: '',
  commandPaletteSelectedIndex: 0,
  dynamicInputEnabled: false,

  // Actions
  setSourceFilter: (filter) => set({ sourceFilter: filter }),
  setKindFilter: (filter) => set({ kindFilter: filter }),
  setSceneFilter: (filter) => set({ sceneFilter: filter }),
  setLevelFilter: (filter) => set({ levelFilter: filter }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setCommandInput: (input) => set({ commandInput: input }),
  setCommandHistoryExpanded: (expanded) => set({ commandHistoryExpanded: expanded }),
  setCommandHistoryCursor: (cursor) => set({ commandHistoryCursor: cursor }),
  setCommandSuggestionCursor: (cursor) => set({ commandSuggestionCursor: cursor }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setCommandPaletteQuery: (query) => set({ commandPaletteQuery: query }),
  setCommandPaletteSelectedIndex: (index) => set({ commandPaletteSelectedIndex: index }),
  setDynamicInputEnabled: (enabled) => set({ dynamicInputEnabled: enabled }),

  appendCommandHistory: (entry) =>
    set((state) => {
      const nextHistory = [...state.commandHistory, entry]
      if (nextHistory.length <= MAX_COMMAND_HISTORY) {
        return { commandHistory: nextHistory }
      }
      return { commandHistory: nextHistory.slice(nextHistory.length - MAX_COMMAND_HISTORY) }
    }),

  resetCommandInput: () =>
    set({
      commandInput: '',
      commandHistoryCursor: null,
    }),
}))
