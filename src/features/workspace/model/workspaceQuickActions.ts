import type { AppCommand } from '../../../core/app-commanding'
import { SCENE_COMMAND_SNAP_STEP_M } from '../../../core/config'
import type { CameraView, ProjectionMode } from '../../../app/state/viewportStore'
import type { ToolMode } from '../../../app/state/uiStore'
import { STUDIO_SHORTCUTS } from '../../../shared/shortcuts'
import type { WorkspaceQuickAction } from '../ui/components/WorkspaceCommandPalette'
import type { WorkspaceWidgetHudState } from './workspaceHudModel'

export type QuickActionsContext = {
  activeTool: ToolMode
  leftPanelOpen: boolean
  projectionMode: ProjectionMode
  rightPanelOpen: boolean
  sceneEditEnabled: boolean
  sceneEventTerminalOpen: boolean
  sceneRemoteHoldEnabled: boolean
  selectedPlacementId: string | null
  showDimensions: boolean
  widgets: WorkspaceWidgetHudState
}

export function buildWorkspaceQuickActions(
  context: QuickActionsContext,
  dispatch: (command: AppCommand) => void,
): WorkspaceQuickAction[] {
  const {
    activeTool,
    leftPanelOpen,
    projectionMode,
    rightPanelOpen,
    sceneEditEnabled,
    sceneEventTerminalOpen,
    sceneRemoteHoldEnabled,
    selectedPlacementId,
    showDimensions,
    widgets,
  } = context

  return [
    {
      execute: () => dispatch({ kind: 'toggle_workspace_left_panel' }),
      group: 'Layout',
      id: 'toggle_left_panel',
      keywords: 'layout panel left properties',
      label: leftPanelOpen ? 'Hide Left Panel' : 'Show Left Panel',
    },
    {
      execute: () => dispatch({ kind: 'toggle_workspace_right_panel' }),
      group: 'Layout',
      id: 'toggle_right_panel',
      keywords: 'layout panel right outliner',
      label: rightPanelOpen ? 'Hide Right Panel' : 'Show Right Panel',
    },
    {
      execute: () => dispatch({ kind: 'toggle_scene_event_terminal' }),
      group: 'Terminal',
      id: 'toggle_terminal',
      keywords: 'terminal event log',
      label: sceneEventTerminalOpen ? 'Hide Terminal' : 'Show Terminal',
      shortcut: STUDIO_SHORTCUTS.terminal.toggle,
    },
    {
      execute: () => dispatch({ kind: 'toggle_scene_edit' }),
      group: 'Scene',
      id: 'toggle_edit',
      keywords: 'scene edit mode',
      label: sceneEditEnabled ? 'Disable Edit Mode' : 'Enable Edit Mode',
    },
    {
      execute: () => dispatch({ kind: 'toggle_scene_remote_hold' }),
      group: 'Scene',
      id: 'toggle_remote_hold',
      keywords: 'remote hold sync',
      label: sceneRemoteHoldEnabled ? 'Disable Remote Hold' : 'Enable Remote Hold',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'iso' }),
      group: 'View',
      id: 'view_iso',
      keywords: 'camera view iso',
      label: 'Switch View: Iso View',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'top' }),
      group: 'View',
      id: 'view_top',
      keywords: 'camera view top',
      label: 'Switch View: Top',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'front' }),
      group: 'View',
      id: 'view_front',
      keywords: 'camera view front',
      label: 'Switch View: Front',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'back' }),
      group: 'View',
      id: 'view_back',
      keywords: 'camera view back rear',
      label: 'Switch View: Back',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'left' }),
      group: 'View',
      id: 'view_left',
      keywords: 'camera view left lateral',
      label: 'Switch View: Left',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'right' }),
      group: 'View',
      id: 'view_right',
      keywords: 'camera view right lateral',
      label: 'Switch View: Right',
    },
    {
      execute: () => dispatch({ kind: 'set_camera_view', view: 'sensor' }),
      group: 'View',
      id: 'view_sensor',
      keywords: 'camera view sensor cam',
      label: 'Switch View: Cam',
    },
    {
      execute: () =>
        dispatch({
          kind: 'set_projection_mode',
          mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
        }),
      group: 'View',
      id: 'toggle_projection_mode',
      keywords: 'projection ortho perspective',
      label: projectionMode === 'orthographic' ? 'Projection: Perspective' : 'Projection: Orthographic',
    },
    {
      execute: () => dispatch({ kind: 'set_active_tool', mode: 'select' }),
      group: 'Tools',
      id: 'tool_select',
      keywords: 'tool select cursor',
      label: activeTool === 'select' ? 'Tool: Select (active)' : 'Tool: Select',
    },
    {
      execute: () => dispatch({ kind: 'set_active_tool', mode: 'move' }),
      group: 'Tools',
      id: 'tool_move',
      keywords: 'tool move transform',
      label: activeTool === 'move' ? 'Tool: Move (active)' : 'Tool: Move',
    },
    {
      execute: () => dispatch({ kind: 'set_active_tool', mode: 'rotate' }),
      group: 'Tools',
      id: 'tool_rotate',
      keywords: 'tool rotate transform',
      label: activeTool === 'rotate' ? 'Tool: Rotate (active)' : 'Tool: Rotate',
    },
    {
      execute: () => dispatch({ kind: 'request_engine_stats' }),
      group: 'Engine',
      id: 'request_engine_stats',
      keywords: 'engine stats telemetry',
      label: 'Request Engine Stats',
    },
    {
      execute: () => dispatch({ kind: 'request_engine_sim_preview' }),
      group: 'Engine',
      id: 'request_engine_sim_preview',
      keywords: 'engine sim preview',
      label: 'Request Simulation Preview',
    },
    {
      execute: () => {
        if (!selectedPlacementId) return
        dispatch({
          kind: 'run_scene_command',
          command: { kind: 'snap_selected_to_grid', stepM: SCENE_COMMAND_SNAP_STEP_M },
        })
      },
      group: 'Tools',
      id: 'snap_selected_to_grid',
      keywords: 'scene snap grid align placement',
      label: selectedPlacementId ? 'Snap Selected Placement' : 'Snap Selected Placement (select one first)',
      shortcut: STUDIO_SHORTCUTS.scene.snap,
    },
    {
      execute: () =>
        dispatch({
          kind: 'set_show_dimensions',
          show: !showDimensions,
        }),
      group: 'Tools',
      id: 'toggle_dimensions',
      keywords: 'measure dimensions overlay',
      label: showDimensions ? 'Hide Dimensions Overlay' : 'Show Dimensions Overlay',
      shortcut: STUDIO_SHORTCUTS.scene.measure,
    },
    {
      execute: () => dispatch({ kind: 'apply_workspace_layout_preset', preset: 'focus' }),
      group: 'Layout',
      id: 'apply_layout_focus',
      keywords: 'layout preset focus',
      label: 'Layout Preset: Focus',
    },
    {
      execute: () => dispatch({ kind: 'apply_workspace_layout_preset', preset: 'authoring' }),
      group: 'Layout',
      id: 'apply_layout_authoring',
      keywords: 'layout preset authoring',
      label: 'Layout Preset: Authoring',
    },
    {
      execute: () => dispatch({ kind: 'apply_workspace_layout_preset', preset: 'observability' }),
      group: 'Layout',
      id: 'apply_layout_observability',
      keywords: 'layout preset observability',
      label: 'Layout Preset: Observability',
    },
    {
      execute: () => dispatch({ kind: 'restore_workspace_layout_defaults' }),
      group: 'Layout',
      id: 'restore_layout_defaults',
      keywords: 'layout reset defaults',
      label: 'Restore Layout Defaults',
    },
    {
      execute: () => dispatch({ kind: 'toggle_workspace_widget_collapsed', widget: 'outliner' }),
      group: 'Widgets',
      id: 'toggle_outliner_collapsed',
      keywords: 'widget outliner collapse expand',
      label: widgets.outliner.collapsed ? 'Expand Outliner Widget' : 'Collapse Outliner Widget',
    },
    {
      execute: () =>
        dispatch({
          kind: 'set_workspace_widget_visible',
          visible: !widgets.camera.visible,
          widget: 'camera',
        }),
      group: 'Widgets',
      id: 'toggle_camera_widget',
      keywords: 'widget camera show hide',
      label: widgets.camera.visible ? 'Hide Camera Widget' : 'Show Camera Widget',
    },
    {
      execute: () =>
        dispatch({
          kind: 'set_workspace_widget_visible',
          visible: !widgets.planogram.visible,
          widget: 'planogram',
        }),
      group: 'Widgets',
      id: 'toggle_planogram_widget',
      keywords: 'widget planogram show hide',
      label: widgets.planogram.visible ? 'Hide Planogram Widget' : 'Show Planogram Widget',
    },
  ]
}
