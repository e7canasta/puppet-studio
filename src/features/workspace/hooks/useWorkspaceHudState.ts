import { useCallback, useEffect, useState } from 'react'

import {
  subscribeWorkspaceShellCommands,
  type WorkspaceLayoutPreset,
  type WorkspaceWidgetId,
} from '../../../core/workspace-shell'
import {
  applyWorkspaceLayoutPreset,
  activateWorkspaceCameraWidget,
  activateWorkspacePlanWidget,
  INITIAL_WORKSPACE_HUD_STATE,
  mergeWorkspaceHudState,
  restoreWorkspaceLayoutDefaults,
  setWorkspaceLeftPanelSize,
  setWorkspaceRightPanelOutlinerHeight,
  setWorkspaceRightPanelSize,
  setWorkspaceTerminalHeight,
  setWorkspaceWidgetVisible,
  toggleWorkspaceLeftPanel,
  toggleWorkspaceRightPanel,
  toggleWorkspaceWidgetCollapsed,
  toggleWorkspaceWidgetPinned,
  WORKSPACE_LAYOUT_STORAGE_KEY,
} from '../model'

function getInitialWorkspaceHudState() {
  if (typeof window === 'undefined') return INITIAL_WORKSPACE_HUD_STATE
  const raw = window.sessionStorage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY)
  if (!raw) return INITIAL_WORKSPACE_HUD_STATE
  try {
    const parsed = JSON.parse(raw) as Partial<typeof INITIAL_WORKSPACE_HUD_STATE>
    return mergeWorkspaceHudState(INITIAL_WORKSPACE_HUD_STATE, parsed)
  } catch {
    return INITIAL_WORKSPACE_HUD_STATE
  }
}

export function useWorkspaceHudState() {
  const [hudState, setHudState] = useState(getInitialWorkspaceHudState)

  const toggleLeftPanel = useCallback(() => {
    setHudState((state) => toggleWorkspaceLeftPanel(state))
  }, [])

  const toggleCameraWidget = useCallback(() => {
    setHudState((state) => activateWorkspaceCameraWidget(state))
  }, [])

  const togglePlanWidget = useCallback(() => {
    setHudState((state) => activateWorkspacePlanWidget(state))
  }, [])

  const toggleRightPanel = useCallback(() => {
    setHudState((state) => toggleWorkspaceRightPanel(state))
  }, [])

  const setLeftPanelSize = useCallback((sizePx: number) => {
    setHudState((state) => setWorkspaceLeftPanelSize(state, sizePx))
  }, [])

  const setRightPanelSize = useCallback((sizePx: number) => {
    setHudState((state) => setWorkspaceRightPanelSize(state, sizePx))
  }, [])

  const setRightPanelOutlinerHeight = useCallback((sizePx: number) => {
    setHudState((state) => setWorkspaceRightPanelOutlinerHeight(state, sizePx))
  }, [])

  const setTerminalHeight = useCallback((sizePx: number) => {
    setHudState((state) => setWorkspaceTerminalHeight(state, sizePx))
  }, [])

  const setWidgetVisible = useCallback((widget: WorkspaceWidgetId, visible: boolean) => {
    setHudState((state) => setWorkspaceWidgetVisible(state, widget, visible))
  }, [])

  const toggleWidgetCollapsed = useCallback((widget: WorkspaceWidgetId) => {
    setHudState((state) => toggleWorkspaceWidgetCollapsed(state, widget))
  }, [])

  const toggleWidgetPinned = useCallback((widget: WorkspaceWidgetId) => {
    setHudState((state) => toggleWorkspaceWidgetPinned(state, widget))
  }, [])

  const restoreLayoutDefaults = useCallback(() => {
    setHudState(restoreWorkspaceLayoutDefaults())
  }, [])

  const applyLayoutPreset = useCallback((preset: WorkspaceLayoutPreset) => {
    setHudState((state) => applyWorkspaceLayoutPreset(state, preset))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(hudState))
  }, [hudState])

  useEffect(() => {
    return subscribeWorkspaceShellCommands((command) => {
      setHudState((state) => {
        if (command.kind === 'toggle_left_panel') return toggleWorkspaceLeftPanel(state)
        if (command.kind === 'toggle_right_panel') return toggleWorkspaceRightPanel(state)
        if (command.kind === 'restore_layout_defaults') return restoreWorkspaceLayoutDefaults()
        if (command.kind === 'set_widget_visible') return setWorkspaceWidgetVisible(state, command.widget, command.visible)
        if (command.kind === 'toggle_widget_collapsed') return toggleWorkspaceWidgetCollapsed(state, command.widget)
        if (command.kind === 'toggle_widget_pinned') return toggleWorkspaceWidgetPinned(state, command.widget)
        return applyWorkspaceLayoutPreset(state, command.preset)
      })
    })
  }, [])

  return {
    ...hudState,
    showCameraWidget: hudState.rightPanelOpen && hudState.widgets.camera.visible,
    showPlanWidget: hudState.rightPanelOpen && hudState.widgets.planogram.visible,
    showOutlinerWidget: hudState.rightPanelOpen && hudState.widgets.outliner.visible,
    showPropertiesWidget: hudState.leftPanelOpen && hudState.widgets.properties.visible,
    restoreLayoutDefaults,
    applyLayoutPreset,
    setLeftPanelSize,
    setRightPanelOutlinerHeight,
    setRightPanelSize,
    setTerminalHeight,
    setWidgetVisible,
    toggleCameraWidget,
    toggleLeftPanel,
    togglePlanWidget,
    toggleRightPanel,
    toggleWidgetCollapsed,
    toggleWidgetPinned,
  }
}
