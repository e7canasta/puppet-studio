import type { WorkspaceState } from './workspaceStore'

/**
 * Selector factories for workspaceStore
 * Use with useShallow for optimized re-renders
 */
export const workspaceSelectors = {
  /** Panel state (7 props) */
  panels: (s: WorkspaceState) => ({
    leftPanelOpen: s.leftPanelOpen,
    leftPanelSizePx: s.leftPanelSizePx,
    rightPanelOpen: s.rightPanelOpen,
    rightPanelSizePx: s.rightPanelSizePx,
    rightPanelTab: s.rightPanelTab,
    rightPanelOutlinerHeightPx: s.rightPanelOutlinerHeightPx,
    terminalHeightPx: s.terminalHeightPx,
  }),

  /** Widget visibility state (4 props) */
  widgets: (s: WorkspaceState) => s.widgets,

  /** Computed widget visibility (4 props) */
  widgetVisibility: (s: WorkspaceState) => ({
    showCameraWidget: s.rightPanelOpen && s.widgets.camera.visible,
    showPlanWidget: s.rightPanelOpen && s.widgets.planogram.visible,
    showOutlinerWidget: s.rightPanelOpen && s.widgets.outliner.visible,
    showPropertiesWidget: s.leftPanelOpen && s.widgets.properties.visible,
  }),

  /** Panel actions (6 actions) */
  panelActions: (s: WorkspaceState) => ({
    toggleLeftPanel: s.toggleLeftPanel,
    toggleRightPanel: s.toggleRightPanel,
    setLeftPanelSize: s.setLeftPanelSize,
    setRightPanelSize: s.setRightPanelSize,
    setRightPanelOutlinerHeight: s.setRightPanelOutlinerHeight,
    setTerminalHeight: s.setTerminalHeight,
  }),

  /** Widget actions (5 actions) */
  widgetActions: (s: WorkspaceState) => ({
    setWidgetVisible: s.setWidgetVisible,
    toggleWidgetCollapsed: s.toggleWidgetCollapsed,
    toggleWidgetPinned: s.toggleWidgetPinned,
    activateCameraWidget: s.activateCameraWidget,
    activatePlanWidget: s.activatePlanWidget,
  }),

  /** Layout actions (2 actions) */
  layoutActions: (s: WorkspaceState) => ({
    restoreLayoutDefaults: s.restoreLayoutDefaults,
    applyLayoutPreset: s.applyLayoutPreset,
  }),
}
