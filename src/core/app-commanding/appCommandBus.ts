import type { SceneCommand } from '../scene-domain/sceneCommands'
import { createEngineCommandEnvelope, type EngineCommandEnvelope } from '../engine'
import type { WorkspaceLayoutPreset, WorkspaceWidgetId } from '../workspace-shell'

export type AppCameraView = 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
export type AppProjectionMode = 'orthographic' | 'perspective'
export type AppCameraOverlayAxis = 'x' | 'y'
export type AppToolMode = 'move' | 'rotate' | 'select'
export type AppCommandSource = string

export type AppCommand =
  | {
    kind: 'apply_deferred_scene_remote'
  }
  | {
    kind: 'apply_workspace_layout_preset'
    preset: WorkspaceLayoutPreset
  }
  | {
    kind: 'clear_scene'
  }
  | {
    kind: 'clear_scene_deferred_remote'
  }
  | {
    kind: 'clear_scene_event_log'
  }
  | {
    kind: 'clear_scene_remote_override'
  }
  | {
    kind: 'redo_scene_edit'
  }
  | {
    kind: 'request_engine_stats'
  }
  | {
    kind: 'request_engine_sim_preview'
  }
  | {
    kind: 'reset_pose'
  }
  | {
    kind: 'reset_camera_overlay_flip'
  }
  | {
    kind: 'rotate_top_view'
    direction: -1 | 1
  }
  | {
    kind: 'run_scene_command'
    command: SceneCommand
  }
  | {
    kind: 'set_bridge_enabled'
    enabled: boolean
  }
  | {
    kind: 'set_camera_overlay_flip'
    axis: AppCameraOverlayAxis
    enabled: boolean
  }
  | {
    capabilityId: string
    enabled: boolean
    kind: 'set_engine_capability_enabled'
  }
  | {
    kind: 'set_camera_view'
    view: AppCameraView
  }
  | {
    kind: 'set_projection_mode'
    mode: AppProjectionMode
  }
  | {
    kind: 'set_scene_id'
    sceneId: string
  }
  | {
    kind: 'set_active_tool'
    mode: AppToolMode
  }
  | {
    kind: 'set_scene_event_auto_scroll'
    enabled: boolean
  }
  | {
    kind: 'set_scene_event_log_paused'
    enabled: boolean
  }
  | {
    kind: 'set_selected_monitoring_camera'
    cameraId: string | null
  }
  | {
    kind: 'set_selected_placement'
    placementId: string | null
  }
  | {
    kind: 'set_show_dimensions'
    show: boolean
  }
  | {
    kind: 'toggle_scene_edit'
  }
  | {
    kind: 'toggle_scene_event_terminal'
  }
  | {
    kind: 'toggle_scene_remote_hold'
  }
  | {
    kind: 'toggle_workspace_left_panel'
  }
  | {
    kind: 'toggle_workspace_right_panel'
  }
  | {
    kind: 'undo_scene_edit'
  }
  | {
    kind: 'restore_workspace_layout_defaults'
  }
  | {
    kind: 'set_workspace_widget_visible'
    visible: boolean
    widget: WorkspaceWidgetId
  }
  | {
    kind: 'toggle_workspace_widget_collapsed'
    widget: WorkspaceWidgetId
  }
  | {
    kind: 'toggle_workspace_widget_pinned'
    widget: WorkspaceWidgetId
  }

export interface UndoResult {
  undo: () => void
  redo: () => void
}

export type AppCommandPort = {
  applyDeferredSceneRemote: () => UndoResult | void
  applyWorkspaceLayoutPreset: (preset: WorkspaceLayoutPreset) => UndoResult | void
  clearScene: (envelope?: AppCommandEnvelope) => UndoResult | void
  clearSceneDeferredRemote: () => UndoResult | void
  clearSceneEventLog: () => UndoResult | void
  clearSceneRemoteOverride: () => UndoResult | void
  redoSceneEdit: (envelope?: AppCommandEnvelope) => UndoResult | void
  requestEngineSimPreview: () => UndoResult | void
  requestEngineStats: () => UndoResult | void
  resetPose: () => UndoResult | void
  resetCameraOverlayFlip: () => UndoResult | void
  rotateTopView: (direction: -1 | 1) => UndoResult | void
  runSceneCommand: (command: SceneCommand, envelope?: AppCommandEnvelope) => UndoResult | void
  setBridgeEnabled: (enabled: boolean) => UndoResult | void
  setCameraOverlayFlip: (axis: AppCameraOverlayAxis, enabled: boolean) => UndoResult | void
  setEngineCapabilityEnabled: (capabilityId: string, enabled: boolean) => UndoResult | void
  setCameraView: (view: AppCameraView) => UndoResult | void
  setProjectionMode: (mode: AppProjectionMode) => UndoResult | void
  setSceneId: (sceneId: string) => UndoResult | void
  setActiveToolMode: (mode: AppToolMode) => UndoResult | void
  setSceneEventAutoScroll: (enabled: boolean) => UndoResult | void
  setSceneEventLogPaused: (enabled: boolean) => UndoResult | void
  setSelectedMonitoringCameraId: (cameraId: string | null) => UndoResult | void
  setSelectedPlacementId: (placementId: string | null) => UndoResult | void
  setShowDimensions: (show: boolean) => UndoResult | void
  toggleSceneEdit: () => UndoResult | void
  toggleSceneEventTerminal: () => UndoResult | void
  toggleSceneRemoteHold: () => UndoResult | void
  toggleWorkspaceLeftPanel: () => UndoResult | void
  toggleWorkspaceRightPanel: () => UndoResult | void
  undoSceneEdit: (envelope?: AppCommandEnvelope) => UndoResult | void
  restoreWorkspaceLayoutDefaults: () => UndoResult | void
  setWorkspaceWidgetVisible: (widget: WorkspaceWidgetId, visible: boolean) => UndoResult | void
  toggleWorkspaceWidgetCollapsed: (widget: WorkspaceWidgetId) => UndoResult | void
  toggleWorkspaceWidgetPinned: (widget: WorkspaceWidgetId) => UndoResult | void
}

export type AppCommandEnvelope = EngineCommandEnvelope<AppCommand>

export function createAppCommandEnvelope(
  command: AppCommand,
  options?: { at?: string; correlationId?: string | null; id?: string; source?: AppCommandSource },
): AppCommandEnvelope {
  return createEngineCommandEnvelope(command, {
    at: options?.at,
    correlationId: options?.correlationId,
    id: options?.id,
    idPrefix: 'cmd',
    source: options?.source ?? 'ui.unknown',
  })
}

export function dispatchAppCommand(port: AppCommandPort, command: AppCommand): UndoResult | void {
  if (command.kind === 'apply_workspace_layout_preset') return port.applyWorkspaceLayoutPreset(command.preset)
  if (command.kind === 'toggle_scene_event_terminal') return port.toggleSceneEventTerminal()
  if (command.kind === 'undo_scene_edit') return port.undoSceneEdit()
  if (command.kind === 'redo_scene_edit') return port.redoSceneEdit()
  if (command.kind === 'request_engine_stats') return port.requestEngineStats()
  if (command.kind === 'request_engine_sim_preview') return port.requestEngineSimPreview()
  if (command.kind === 'run_scene_command') return port.runSceneCommand(command.command)
  if (command.kind === 'clear_scene') return port.clearScene()
  if (command.kind === 'set_selected_placement') return port.setSelectedPlacementId(command.placementId)
  if (command.kind === 'set_bridge_enabled') return port.setBridgeEnabled(command.enabled)
  if (command.kind === 'set_scene_id') return port.setSceneId(command.sceneId)
  if (command.kind === 'set_active_tool') return port.setActiveToolMode(command.mode)
  if (command.kind === 'set_scene_event_log_paused') return port.setSceneEventLogPaused(command.enabled)
  if (command.kind === 'set_scene_event_auto_scroll') return port.setSceneEventAutoScroll(command.enabled)
  if (command.kind === 'clear_scene_event_log') return port.clearSceneEventLog()
  if (command.kind === 'set_camera_view') return port.setCameraView(command.view)
  if (command.kind === 'set_engine_capability_enabled') return port.setEngineCapabilityEnabled(command.capabilityId, command.enabled)
  if (command.kind === 'set_camera_overlay_flip') return port.setCameraOverlayFlip(command.axis, command.enabled)
  if (command.kind === 'reset_camera_overlay_flip') return port.resetCameraOverlayFlip()
  if (command.kind === 'reset_pose') return port.resetPose()
  if (command.kind === 'rotate_top_view') return port.rotateTopView(command.direction)
  if (command.kind === 'set_projection_mode') return port.setProjectionMode(command.mode)
  if (command.kind === 'toggle_scene_edit') return port.toggleSceneEdit()
  if (command.kind === 'toggle_scene_remote_hold') return port.toggleSceneRemoteHold()
  if (command.kind === 'toggle_workspace_left_panel') return port.toggleWorkspaceLeftPanel()
  if (command.kind === 'toggle_workspace_right_panel') return port.toggleWorkspaceRightPanel()
  if (command.kind === 'restore_workspace_layout_defaults') return port.restoreWorkspaceLayoutDefaults()
  if (command.kind === 'set_workspace_widget_visible') return port.setWorkspaceWidgetVisible(command.widget, command.visible)
  if (command.kind === 'toggle_workspace_widget_collapsed') return port.toggleWorkspaceWidgetCollapsed(command.widget)
  if (command.kind === 'toggle_workspace_widget_pinned') return port.toggleWorkspaceWidgetPinned(command.widget)
  if (command.kind === 'apply_deferred_scene_remote') return port.applyDeferredSceneRemote()
  if (command.kind === 'clear_scene_deferred_remote') return port.clearSceneDeferredRemote()
  if (command.kind === 'clear_scene_remote_override') return port.clearSceneRemoteOverride()
  if (command.kind === 'set_selected_monitoring_camera') return port.setSelectedMonitoringCameraId(command.cameraId)
  if (command.kind === 'set_show_dimensions') return port.setShowDimensions(command.show)
}

export function dispatchAppCommandEnvelope(port: AppCommandPort, envelope: AppCommandEnvelope): UndoResult | void {
  const { command } = envelope
  if (command.kind === 'clear_scene') return port.clearScene(envelope)
  if (command.kind === 'undo_scene_edit') return port.undoSceneEdit(envelope)
  if (command.kind === 'redo_scene_edit') return port.redoSceneEdit(envelope)
  if (command.kind === 'run_scene_command') return port.runSceneCommand(command.command, envelope)
  return dispatchAppCommand(port, command)
}
