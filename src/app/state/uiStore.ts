import { create } from 'zustand'
import { runtimeConfig } from '../../core/config/runtimeConfig'
import {
  createSceneEventEntry,
  pushSceneEventEntry,
  type SceneEventEntry,
  type SceneEventInput,
} from '../../core/observability/sceneEventLog'

export type ToolMode = 'move' | 'rotate' | 'select'

export type UiState = {
  // Tool mode
  activeToolMode: ToolMode

  // Scene event terminal
  sceneEventAutoScroll: boolean
  sceneEventDroppedWhilePaused: number
  sceneEventLog: SceneEventEntry[]
  sceneEventLogPaused: boolean
  sceneEventTerminalOpen: boolean

  // Actions
  setActiveToolMode: (mode: ToolMode) => void
  setSceneEventAutoScroll: (enabled: boolean) => void
  setSceneEventLogPaused: (enabled: boolean) => void
  setSceneEventTerminalOpen: (enabled: boolean) => void
  toggleSceneEventTerminal: () => void
  appendSceneEvent: (event: SceneEventInput) => void
  clearSceneEventLog: () => void
}

export const useUiStore = create<UiState>((set) => ({
  // Initial state
  activeToolMode: 'select',
  sceneEventAutoScroll: true,
  sceneEventDroppedWhilePaused: 0,
  sceneEventLog: [],
  sceneEventLogPaused: false,
  sceneEventTerminalOpen: runtimeConfig.defaultSceneEventTerminalOpen,

  // Actions
  setActiveToolMode: (mode) => set({ activeToolMode: mode }),
  setSceneEventAutoScroll: (enabled) => set({ sceneEventAutoScroll: enabled }),
  setSceneEventLogPaused: (enabled) => set({ sceneEventLogPaused: enabled }),
  setSceneEventTerminalOpen: (enabled) => set({ sceneEventTerminalOpen: enabled }),
  toggleSceneEventTerminal: () => set((state) => ({ sceneEventTerminalOpen: !state.sceneEventTerminalOpen })),

  appendSceneEvent: (event) =>
    set((state) => {
      if (state.sceneEventLogPaused) {
        return {
          sceneEventDroppedWhilePaused: state.sceneEventDroppedWhilePaused + 1,
        }
      }
      const entry = createSceneEventEntry(event)
      return {
        sceneEventLog: pushSceneEventEntry(state.sceneEventLog, entry, runtimeConfig.sceneEventLogLimit),
      }
    }),

  clearSceneEventLog: () =>
    set({
      sceneEventDroppedWhilePaused: 0,
      sceneEventLog: [],
    }),
}))
