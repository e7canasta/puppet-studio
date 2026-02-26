import type { WorkspaceLayoutPreset, WorkspaceWidgetId } from '../../../core/workspace-shell'

export type WorkspaceRightPanelTab = 'camera' | 'planogram'
export type WorkspaceWidgetHud = {
  collapsed: boolean
  pinned: boolean
  visible: boolean
}
export type WorkspaceWidgetHudState = Record<WorkspaceWidgetId, WorkspaceWidgetHud>

export const WORKSPACE_LAYOUT_STORAGE_KEY = 'simula.workspace.layout.v1'
export const WORKSPACE_LEFT_PANEL_MIN_PX = 260
export const WORKSPACE_LEFT_PANEL_MAX_PX = 520
export const WORKSPACE_LEFT_PANEL_DEFAULT_PX = 340
export const WORKSPACE_RIGHT_PANEL_MIN_PX = 260
export const WORKSPACE_RIGHT_PANEL_MAX_PX = 520
export const WORKSPACE_RIGHT_PANEL_DEFAULT_PX = 340
export const WORKSPACE_RIGHT_PANEL_OUTLINER_MIN_PX = 180
export const WORKSPACE_RIGHT_PANEL_OUTLINER_MAX_PX = 520
export const WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX = 300
export const WORKSPACE_TERMINAL_MIN_PX = 180
export const WORKSPACE_TERMINAL_MAX_PX = 520
export const WORKSPACE_TERMINAL_DEFAULT_PX = 240

export type WorkspaceHudState = {
  leftPanelSizePx: number
  leftPanelOpen: boolean
  rightPanelSizePx: number
  rightPanelOpen: boolean
  rightPanelOutlinerHeightPx: number
  rightPanelTab: WorkspaceRightPanelTab
  terminalHeightPx: number
  widgets: WorkspaceWidgetHudState
}

const INITIAL_WORKSPACE_WIDGETS: WorkspaceWidgetHudState = {
  camera: { collapsed: true, pinned: true, visible: true },
  outliner: { collapsed: false, pinned: true, visible: true },
  planogram: { collapsed: false, pinned: true, visible: true },
  properties: { collapsed: false, pinned: true, visible: true },
}

export const INITIAL_WORKSPACE_HUD_STATE: WorkspaceHudState = {
  leftPanelSizePx: WORKSPACE_LEFT_PANEL_DEFAULT_PX,
  leftPanelOpen: true,
  rightPanelSizePx: WORKSPACE_RIGHT_PANEL_DEFAULT_PX,
  rightPanelOpen: true,
  rightPanelOutlinerHeightPx: WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX,
  rightPanelTab: 'planogram',
  terminalHeightPx: WORKSPACE_TERMINAL_DEFAULT_PX,
  widgets: INITIAL_WORKSPACE_WIDGETS,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampWorkspaceLeftPanelSize(sizePx: number): number {
  return clamp(sizePx, WORKSPACE_LEFT_PANEL_MIN_PX, WORKSPACE_LEFT_PANEL_MAX_PX)
}

export function clampWorkspaceRightPanelSize(sizePx: number): number {
  return clamp(sizePx, WORKSPACE_RIGHT_PANEL_MIN_PX, WORKSPACE_RIGHT_PANEL_MAX_PX)
}

export function clampWorkspaceRightPanelOutlinerHeight(sizePx: number): number {
  return clamp(sizePx, WORKSPACE_RIGHT_PANEL_OUTLINER_MIN_PX, WORKSPACE_RIGHT_PANEL_OUTLINER_MAX_PX)
}

export function clampWorkspaceTerminalHeight(sizePx: number): number {
  return clamp(sizePx, WORKSPACE_TERMINAL_MIN_PX, WORKSPACE_TERMINAL_MAX_PX)
}

export function mergeWorkspaceHudState(
  base: WorkspaceHudState,
  candidate: Partial<WorkspaceHudState>,
): WorkspaceHudState {
  const candidateWidgets = (candidate.widgets ?? {}) as Partial<WorkspaceWidgetHudState>
  const widgets: WorkspaceWidgetHudState = {
    camera: {
      collapsed: candidateWidgets.camera?.collapsed ?? base.widgets.camera.collapsed,
      pinned: candidateWidgets.camera?.pinned ?? base.widgets.camera.pinned,
      visible: candidateWidgets.camera?.visible ?? base.widgets.camera.visible,
    },
    outliner: {
      collapsed: candidateWidgets.outliner?.collapsed ?? base.widgets.outliner.collapsed,
      pinned: candidateWidgets.outliner?.pinned ?? base.widgets.outliner.pinned,
      visible: candidateWidgets.outliner?.visible ?? base.widgets.outliner.visible,
    },
    planogram: {
      collapsed: candidateWidgets.planogram?.collapsed ?? base.widgets.planogram.collapsed,
      pinned: candidateWidgets.planogram?.pinned ?? base.widgets.planogram.pinned,
      visible: candidateWidgets.planogram?.visible ?? base.widgets.planogram.visible,
    },
    properties: {
      collapsed: candidateWidgets.properties?.collapsed ?? base.widgets.properties.collapsed,
      pinned: candidateWidgets.properties?.pinned ?? base.widgets.properties.pinned,
      visible: candidateWidgets.properties?.visible ?? base.widgets.properties.visible,
    },
  }

  return {
    leftPanelOpen: widgets.properties.visible && (candidate.leftPanelOpen ?? base.leftPanelOpen),
    leftPanelSizePx: clampWorkspaceLeftPanelSize(candidate.leftPanelSizePx ?? base.leftPanelSizePx),
    rightPanelOpen:
      (widgets.outliner.visible || widgets.camera.visible || widgets.planogram.visible) &&
      (candidate.rightPanelOpen ?? base.rightPanelOpen),
    rightPanelSizePx: clampWorkspaceRightPanelSize(candidate.rightPanelSizePx ?? base.rightPanelSizePx),
    rightPanelOutlinerHeightPx: clampWorkspaceRightPanelOutlinerHeight(
      candidate.rightPanelOutlinerHeightPx ?? base.rightPanelOutlinerHeightPx,
    ),
    rightPanelTab:
      candidate.rightPanelTab === 'camera' || candidate.rightPanelTab === 'planogram'
        ? candidate.rightPanelTab
        : base.rightPanelTab,
    terminalHeightPx: clampWorkspaceTerminalHeight(candidate.terminalHeightPx ?? base.terminalHeightPx),
    widgets,
  }
}

export function toggleWorkspaceLeftPanel(state: WorkspaceHudState): WorkspaceHudState {
  if (!state.widgets.properties.visible) {
    return mergeWorkspaceHudState(state, {
      leftPanelOpen: true,
      widgets: {
        ...state.widgets,
        properties: {
          ...state.widgets.properties,
          visible: true,
        },
      },
    })
  }
  return {
    ...state,
    leftPanelOpen: !state.leftPanelOpen,
  }
}

export function toggleWorkspaceRightPanel(state: WorkspaceHudState): WorkspaceHudState {
  const anyRightWidgetVisible = state.widgets.outliner.visible || state.widgets.camera.visible || state.widgets.planogram.visible
  if (!anyRightWidgetVisible) {
    return mergeWorkspaceHudState(state, {
      rightPanelOpen: true,
      widgets: {
        ...state.widgets,
        outliner: {
          ...state.widgets.outliner,
          visible: true,
        },
      },
    })
  }
  return {
    ...state,
    rightPanelOpen: !state.rightPanelOpen,
  }
}

export function setWorkspaceLeftPanelSize(state: WorkspaceHudState, sizePx: number): WorkspaceHudState {
  return {
    ...state,
    leftPanelSizePx: clampWorkspaceLeftPanelSize(sizePx),
  }
}

export function setWorkspaceRightPanelSize(state: WorkspaceHudState, sizePx: number): WorkspaceHudState {
  return {
    ...state,
    rightPanelSizePx: clampWorkspaceRightPanelSize(sizePx),
  }
}

export function setWorkspaceRightPanelOutlinerHeight(state: WorkspaceHudState, sizePx: number): WorkspaceHudState {
  return {
    ...state,
    rightPanelOutlinerHeightPx: clampWorkspaceRightPanelOutlinerHeight(sizePx),
  }
}

export function setWorkspaceTerminalHeight(state: WorkspaceHudState, sizePx: number): WorkspaceHudState {
  return {
    ...state,
    terminalHeightPx: clampWorkspaceTerminalHeight(sizePx),
  }
}

export function restoreWorkspaceLayoutDefaults(): WorkspaceHudState {
  return {
    ...INITIAL_WORKSPACE_HUD_STATE,
    widgets: {
      ...INITIAL_WORKSPACE_WIDGETS,
    },
  }
}

export function applyWorkspaceLayoutPreset(
  state: WorkspaceHudState,
  preset: WorkspaceLayoutPreset,
): WorkspaceHudState {
  if (preset === 'focus') {
    return mergeWorkspaceHudState(state, {
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
  }

  if (preset === 'observability') {
    return mergeWorkspaceHudState(state, {
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
  }

  return mergeWorkspaceHudState(state, {
    leftPanelOpen: true,
    leftPanelSizePx: WORKSPACE_LEFT_PANEL_DEFAULT_PX,
    rightPanelOpen: true,
    rightPanelSizePx: WORKSPACE_RIGHT_PANEL_DEFAULT_PX,
    rightPanelOutlinerHeightPx: WORKSPACE_RIGHT_PANEL_OUTLINER_DEFAULT_PX,
    rightPanelTab: 'planogram',
    terminalHeightPx: WORKSPACE_TERMINAL_DEFAULT_PX,
    widgets: {
      ...INITIAL_WORKSPACE_WIDGETS,
    },
  })
}

export function setWorkspaceWidgetVisible(
  state: WorkspaceHudState,
  widget: WorkspaceWidgetId,
  visible: boolean,
): WorkspaceHudState {
  const next = mergeWorkspaceHudState(state, {
    widgets: {
      ...state.widgets,
      [widget]: { ...state.widgets[widget], visible },
    },
  })
  if (widget === 'properties') {
    return {
      ...next,
      leftPanelOpen: visible ? true : false,
    }
  }
  const anyRightVisible = next.widgets.outliner.visible || next.widgets.camera.visible || next.widgets.planogram.visible
  return {
    ...next,
    rightPanelOpen: visible ? true : anyRightVisible ? next.rightPanelOpen : false,
  }
}

export function toggleWorkspaceWidgetCollapsed(state: WorkspaceHudState, widget: WorkspaceWidgetId): WorkspaceHudState {
  return mergeWorkspaceHudState(state, {
    widgets: {
      ...state.widgets,
      [widget]: {
        ...state.widgets[widget],
        collapsed: !state.widgets[widget].collapsed,
      },
    },
  })
}

export function toggleWorkspaceWidgetPinned(state: WorkspaceHudState, widget: WorkspaceWidgetId): WorkspaceHudState {
  return mergeWorkspaceHudState(state, {
    widgets: {
      ...state.widgets,
      [widget]: {
        ...state.widgets[widget],
        pinned: !state.widgets[widget].pinned,
      },
    },
  })
}

export function activateWorkspaceCameraWidget(state: WorkspaceHudState): WorkspaceHudState {
  return mergeWorkspaceHudState(state, {
    rightPanelOpen: true,
    rightPanelTab: 'camera',
    widgets: {
      ...state.widgets,
      camera: { ...state.widgets.camera, visible: true },
    },
  })
}

export function activateWorkspacePlanWidget(state: WorkspaceHudState): WorkspaceHudState {
  return mergeWorkspaceHudState(state, {
    rightPanelOpen: true,
    rightPanelTab: 'planogram',
    widgets: {
      ...state.widgets,
      planogram: { ...state.widgets.planogram, visible: true },
    },
  })
}
