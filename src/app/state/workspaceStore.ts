import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WorkspaceRightPanelTab = 'camera' | 'planogram'

export type WorkspaceWidgetId = 'camera' | 'outliner' | 'planogram' | 'properties'

export type WorkspaceWidgetHud = {
  collapsed: boolean
  pinned: boolean
  visible: boolean
}

export type WorkspaceWidgetHudState = Record<WorkspaceWidgetId, WorkspaceWidgetHud>

export type WorkspaceLayoutPreset = 'authoring' | 'focus' | 'observability'

// Constants migrated from workspaceHudModel.ts
const WORKSPACE_LEFT_PANEL_MIN_PX = 260
const WORKSPACE_LEFT_PANEL_MAX_PX = 520
const WORKSPACE_LEFT_PANEL_DEFAULT_PX = 340
const WORKSPACE_RIGHT_PANEL_MIN_PX = 260
const WORKSPACE_RIGHT_PANEL_MAX_PX = 520
const WORKSPACE_RIGHT_PANEL_DEFAULT_PX = 340
const WORKSPACE_RIGHT_PANEL_OUTLINER_MIN_PX = 180
const WORKSPACE_RIGHT_PANEL_OUTLINER_MAX_PX = 520
const WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX = 300
const WORKSPACE_TERMINAL_MIN_PX = 180
const WORKSPACE_TERMINAL_MAX_PX = 520
const WORKSPACE_TERMINAL_DEFAULT_PX = 240

const INITIAL_WORKSPACE_WIDGETS: WorkspaceWidgetHudState = {
  camera: { collapsed: true, pinned: true, visible: true },
  outliner: { collapsed: false, pinned: true, visible: true },
  planogram: { collapsed: false, pinned: true, visible: true },
  properties: { collapsed: false, pinned: true, visible: true },
}

// Helper: clamp function
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type WorkspaceState = {
  // State
  leftPanelSizePx: number
  leftPanelOpen: boolean
  rightPanelSizePx: number
  rightPanelOpen: boolean
  rightPanelOutlinerHeightPx: number
  rightPanelTab: WorkspaceRightPanelTab
  terminalHeightPx: number
  widgets: WorkspaceWidgetHudState

  // Actions
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setLeftPanelSize: (sizePx: number) => void
  setRightPanelSize: (sizePx: number) => void
  setRightPanelOutlinerHeight: (sizePx: number) => void
  setTerminalHeight: (sizePx: number) => void
  setWidgetVisible: (widget: WorkspaceWidgetId, visible: boolean) => void
  toggleWidgetCollapsed: (widget: WorkspaceWidgetId) => void
  toggleWidgetPinned: (widget: WorkspaceWidgetId) => void
  activateCameraWidget: () => void
  activatePlanWidget: () => void
  restoreLayoutDefaults: () => void
  applyLayoutPreset: (preset: WorkspaceLayoutPreset) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      leftPanelSizePx: WORKSPACE_LEFT_PANEL_DEFAULT_PX,
      leftPanelOpen: true,
      rightPanelSizePx: WORKSPACE_RIGHT_PANEL_DEFAULT_PX,
      rightPanelOpen: true,
      rightPanelOutlinerHeightPx: WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX,
      rightPanelTab: 'planogram',
      terminalHeightPx: WORKSPACE_TERMINAL_DEFAULT_PX,
      widgets: INITIAL_WORKSPACE_WIDGETS,

      // Actions
      toggleLeftPanel: () =>
        set((state) => {
          if (!state.widgets.properties.visible) {
            return {
              leftPanelOpen: true,
              widgets: {
                ...state.widgets,
                properties: { ...state.widgets.properties, visible: true },
              },
            }
          }
          return { leftPanelOpen: !state.leftPanelOpen }
        }),

      toggleRightPanel: () =>
        set((state) => {
          const anyRightWidgetVisible =
            state.widgets.outliner.visible || state.widgets.camera.visible || state.widgets.planogram.visible
          if (!anyRightWidgetVisible) {
            return {
              rightPanelOpen: true,
              widgets: {
                ...state.widgets,
                outliner: { ...state.widgets.outliner, visible: true },
              },
            }
          }
          return { rightPanelOpen: !state.rightPanelOpen }
        }),

      setLeftPanelSize: (sizePx) =>
        set({
          leftPanelSizePx: clamp(sizePx, WORKSPACE_LEFT_PANEL_MIN_PX, WORKSPACE_LEFT_PANEL_MAX_PX),
        }),

      setRightPanelSize: (sizePx) =>
        set({
          rightPanelSizePx: clamp(sizePx, WORKSPACE_RIGHT_PANEL_MIN_PX, WORKSPACE_RIGHT_PANEL_MAX_PX),
        }),

      setRightPanelOutlinerHeight: (sizePx) =>
        set({
          rightPanelOutlinerHeightPx: clamp(
            sizePx,
            WORKSPACE_RIGHT_PANEL_OUTLINER_MIN_PX,
            WORKSPACE_RIGHT_PANEL_OUTLINER_MAX_PX,
          ),
        }),

      setTerminalHeight: (sizePx) =>
        set({
          terminalHeightPx: clamp(sizePx, WORKSPACE_TERMINAL_MIN_PX, WORKSPACE_TERMINAL_MAX_PX),
        }),

      setWidgetVisible: (widget, visible) =>
        set((state) => {
          const nextWidgets = {
            ...state.widgets,
            [widget]: { ...state.widgets[widget], visible },
          }

          if (widget === 'properties') {
            return {
              widgets: nextWidgets,
              leftPanelOpen: visible,
            }
          }

          const anyRightVisible =
            nextWidgets.outliner.visible || nextWidgets.camera.visible || nextWidgets.planogram.visible
          return {
            widgets: nextWidgets,
            rightPanelOpen: visible ? true : anyRightVisible ? state.rightPanelOpen : false,
          }
        }),

      toggleWidgetCollapsed: (widget) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widget]: { ...state.widgets[widget], collapsed: !state.widgets[widget].collapsed },
          },
        })),

      toggleWidgetPinned: (widget) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widget]: { ...state.widgets[widget], pinned: !state.widgets[widget].pinned },
          },
        })),

      activateCameraWidget: () =>
        set((state) => ({
          rightPanelOpen: true,
          rightPanelTab: 'camera',
          widgets: {
            ...state.widgets,
            camera: { ...state.widgets.camera, visible: true },
          },
        })),

      activatePlanWidget: () =>
        set((state) => ({
          rightPanelOpen: true,
          rightPanelTab: 'planogram',
          widgets: {
            ...state.widgets,
            planogram: { ...state.widgets.planogram, visible: true },
          },
        })),

      restoreLayoutDefaults: () =>
        set({
          leftPanelSizePx: WORKSPACE_LEFT_PANEL_DEFAULT_PX,
          leftPanelOpen: true,
          rightPanelSizePx: WORKSPACE_RIGHT_PANEL_DEFAULT_PX,
          rightPanelOpen: true,
          rightPanelOutlinerHeightPx: WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX,
          rightPanelTab: 'planogram',
          terminalHeightPx: WORKSPACE_TERMINAL_DEFAULT_PX,
          widgets: { ...INITIAL_WORKSPACE_WIDGETS },
        }),

      applyLayoutPreset: (preset) => {
        const state = get()
        if (preset === 'focus') {
          set({
            leftPanelOpen: false,
            rightPanelOpen: false,
            terminalHeightPx: 220,
            widgets: {
              camera: { ...state.widgets.camera, visible: false },
              outliner: { ...state.widgets.outliner, visible: false },
              planogram: { ...state.widgets.planogram, visible: false },
              properties: { ...state.widgets.properties, visible: false },
            },
          })
        } else if (preset === 'observability') {
          set({
            leftPanelOpen: false,
            rightPanelOpen: true,
            rightPanelSizePx: 380,
            rightPanelOutlinerHeightPx: 360,
            rightPanelTab: 'camera',
            terminalHeightPx: 320,
            widgets: {
              camera: { collapsed: false, pinned: true, visible: true },
              outliner: { collapsed: false, pinned: true, visible: true },
              planogram: { collapsed: true, pinned: true, visible: true },
              properties: { collapsed: false, pinned: true, visible: false },
            },
          })
        } else {
          // 'authoring'
          set({
            leftPanelOpen: true,
            leftPanelSizePx: WORKSPACE_LEFT_PANEL_DEFAULT_PX,
            rightPanelOpen: true,
            rightPanelSizePx: WORKSPACE_RIGHT_PANEL_DEFAULT_PX,
            rightPanelOutlinerHeightPx: WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX,
            rightPanelTab: 'planogram',
            terminalHeightPx: WORKSPACE_TERMINAL_DEFAULT_PX,
            widgets: { ...INITIAL_WORKSPACE_WIDGETS },
          })
        }
      },
    }),
    {
      name: 'simula.workspace.layout.v1', // sessionStorage key
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
)
