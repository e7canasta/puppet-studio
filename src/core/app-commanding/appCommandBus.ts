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

export type AppCommandPort = {
  applyDeferredSceneRemote: () => void
  applyWorkspaceLayoutPreset: (preset: WorkspaceLayoutPreset) => void
  clearScene: (envelope?: AppCommandEnvelope) => void
  clearSceneDeferredRemote: () => void
  clearSceneEventLog: () => void
  clearSceneRemoteOverride: () => void
  redoSceneEdit: (envelope?: AppCommandEnvelope) => void
  requestEngineSimPreview: () => void
  requestEngineStats: () => void
  resetPose: () => void
  resetCameraOverlayFlip: () => void
  rotateTopView: (direction: -1 | 1) => void
  runSceneCommand: (command: SceneCommand, envelope?: AppCommandEnvelope) => void
  setBridgeEnabled: (enabled: boolean) => void
  setCameraOverlayFlip: (axis: AppCameraOverlayAxis, enabled: boolean) => void
  setEngineCapabilityEnabled: (capabilityId: string, enabled: boolean) => void
  setCameraView: (view: AppCameraView) => void
  setProjectionMode: (mode: AppProjectionMode) => void
  setSceneId: (sceneId: string) => void
  setActiveToolMode: (mode: AppToolMode) => void
  setSceneEventAutoScroll: (enabled: boolean) => void
  setSceneEventLogPaused: (enabled: boolean) => void
  setSelectedMonitoringCameraId: (cameraId: string | null) => void
  setSelectedPlacementId: (placementId: string | null) => void
  setShowDimensions: (show: boolean) => void
  toggleSceneEdit: () => void
  toggleSceneEventTerminal: () => void
  toggleSceneRemoteHold: () => void
  toggleWorkspaceLeftPanel: () => void
  toggleWorkspaceRightPanel: () => void
  undoSceneEdit: (envelope?: AppCommandEnvelope) => void
  restoreWorkspaceLayoutDefaults: () => void
  setWorkspaceWidgetVisible: (widget: WorkspaceWidgetId, visible: boolean) => void
  toggleWorkspaceWidgetCollapsed: (widget: WorkspaceWidgetId) => void
  toggleWorkspaceWidgetPinned: (widget: WorkspaceWidgetId) => void
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

export function dispatchAppCommand(port: AppCommandPort, command: AppCommand) {
  if (command.kind === 'apply_workspace_layout_preset') {
    port.applyWorkspaceLayoutPreset(command.preset)
    return
  }
  if (command.kind === 'toggle_scene_event_terminal') {
    port.toggleSceneEventTerminal()
    return
  }
  if (command.kind === 'undo_scene_edit') {
    port.undoSceneEdit()
    return
  }
  if (command.kind === 'redo_scene_edit') {
    port.redoSceneEdit()
    return
  }
  if (command.kind === 'request_engine_stats') {
    port.requestEngineStats()
    return
  }
  if (command.kind === 'request_engine_sim_preview') {
    port.requestEngineSimPreview()
    return
  }
  if (command.kind === 'run_scene_command') {
    port.runSceneCommand(command.command)
    return
  }
  if (command.kind === 'clear_scene') {
    port.clearScene()
    return
  }
  if (command.kind === 'set_selected_placement') {
    port.setSelectedPlacementId(command.placementId)
    return
  }
  if (command.kind === 'set_bridge_enabled') {
    port.setBridgeEnabled(command.enabled)
    return
  }
  if (command.kind === 'set_scene_id') {
    port.setSceneId(command.sceneId)
    return
  }
  if (command.kind === 'set_active_tool') {
    port.setActiveToolMode(command.mode)
    return
  }
  if (command.kind === 'set_scene_event_log_paused') {
    port.setSceneEventLogPaused(command.enabled)
    return
  }
  if (command.kind === 'set_scene_event_auto_scroll') {
    port.setSceneEventAutoScroll(command.enabled)
    return
  }
  if (command.kind === 'clear_scene_event_log') {
    port.clearSceneEventLog()
    return
  }
  if (command.kind === 'set_camera_view') {
    port.setCameraView(command.view)
    return
  }
  if (command.kind === 'set_engine_capability_enabled') {
    port.setEngineCapabilityEnabled(command.capabilityId, command.enabled)
    return
  }
  if (command.kind === 'set_camera_overlay_flip') {
    port.setCameraOverlayFlip(command.axis, command.enabled)
    return
  }
  if (command.kind === 'reset_camera_overlay_flip') {
    port.resetCameraOverlayFlip()
    return
  }
  if (command.kind === 'reset_pose') {
    port.resetPose()
    return
  }
  if (command.kind === 'rotate_top_view') {
    port.rotateTopView(command.direction)
    return
  }
  if (command.kind === 'set_projection_mode') {
    port.setProjectionMode(command.mode)
    return
  }
  if (command.kind === 'toggle_scene_edit') {
    port.toggleSceneEdit()
    return
  }
  if (command.kind === 'toggle_scene_remote_hold') {
    port.toggleSceneRemoteHold()
    return
  }
  if (command.kind === 'toggle_workspace_left_panel') {
    port.toggleWorkspaceLeftPanel()
    return
  }
  if (command.kind === 'toggle_workspace_right_panel') {
    port.toggleWorkspaceRightPanel()
    return
  }
  if (command.kind === 'restore_workspace_layout_defaults') {
    port.restoreWorkspaceLayoutDefaults()
    return
  }
  if (command.kind === 'set_workspace_widget_visible') {
    port.setWorkspaceWidgetVisible(command.widget, command.visible)
    return
  }
  if (command.kind === 'toggle_workspace_widget_collapsed') {
    port.toggleWorkspaceWidgetCollapsed(command.widget)
    return
  }
  if (command.kind === 'toggle_workspace_widget_pinned') {
    port.toggleWorkspaceWidgetPinned(command.widget)
    return
  }
  if (command.kind === 'apply_deferred_scene_remote') {
    port.applyDeferredSceneRemote()
    return
  }
  if (command.kind === 'clear_scene_deferred_remote') {
    port.clearSceneDeferredRemote()
    return
  }
  if (command.kind === 'clear_scene_remote_override') {
    port.clearSceneRemoteOverride()
    return
  }
  if (command.kind === 'set_selected_monitoring_camera') {
    port.setSelectedMonitoringCameraId(command.cameraId)
    return
  }
  if (command.kind === 'set_show_dimensions') {
    port.setShowDimensions(command.show)
    return
  }
}

export function dispatchAppCommandEnvelope(port: AppCommandPort, envelope: AppCommandEnvelope) {
  const { command } = envelope
  if (command.kind === 'clear_scene') {
    port.clearScene(envelope)
    return
  }
  if (command.kind === 'undo_scene_edit') {
    port.undoSceneEdit(envelope)
    return
  }
  if (command.kind === 'redo_scene_edit') {
    port.redoSceneEdit(envelope)
    return
  }
  if (command.kind === 'run_scene_command') {
    port.runSceneCommand(command.command, envelope)
    return
  }
  dispatchAppCommand(port, command)
}
