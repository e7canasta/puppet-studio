import type { AppCommand } from './appCommandBus'

function boolToken(value: boolean): 'on' | 'off' {
  return value ? 'on' : 'off'
}

export function reflectAppCommandToTerminalLine(command: AppCommand): string | null {
  if (command.kind === 'set_camera_view') return `view ${command.view}`
  if (command.kind === 'set_projection_mode') return `projection ${command.mode === 'orthographic' ? 'ortho' : 'persp'}`
  if (command.kind === 'set_scene_id') return `scene ${command.sceneId}`
  if (command.kind === 'set_active_tool') return `tool ${command.mode}`
  if (command.kind === 'set_show_dimensions') return `dims ${boolToken(command.show)}`
  if (command.kind === 'toggle_scene_edit') return 'edit'
  if (command.kind === 'toggle_scene_remote_hold') return 'hold'
  if (command.kind === 'set_bridge_enabled') return `bridge ${boolToken(command.enabled)}`
  if (command.kind === 'set_scene_event_log_paused') return `pause ${boolToken(command.enabled)}`
  if (command.kind === 'set_scene_event_auto_scroll') return `auto ${boolToken(command.enabled)}`
  if (command.kind === 'toggle_scene_event_terminal') return 'terminal'
  if (command.kind === 'apply_workspace_layout_preset') return `layout ${command.preset}`
  if (command.kind === 'restore_workspace_layout_defaults') return 'layout_reset'
  if (command.kind === 'toggle_workspace_left_panel') return 'left_panel'
  if (command.kind === 'toggle_workspace_right_panel') return 'right_panel'
  if (command.kind === 'set_workspace_widget_visible') {
    return `${command.visible ? 'widget_show' : 'widget_hide'} ${command.widget}`
  }
  if (command.kind === 'toggle_workspace_widget_collapsed') return `widget_fold ${command.widget}`
  if (command.kind === 'toggle_workspace_widget_pinned') return `widget_pin ${command.widget}`
  if (command.kind === 'set_selected_monitoring_camera') {
    return `camera ${command.cameraId ?? 'none'}`
  }
  if (command.kind === 'set_selected_placement') {
    return `select ${command.placementId ?? 'none'}`
  }
  if (command.kind === 'set_camera_overlay_flip') return `flip_${command.axis} ${boolToken(command.enabled)}`
  if (command.kind === 'reset_camera_overlay_flip') return 'flip_reset'
  if (command.kind === 'rotate_top_view') return command.direction < 0 ? 'top_ccw' : 'top_cw'
  if (command.kind === 'request_engine_stats') return 'stats'
  if (command.kind === 'request_engine_sim_preview') return 'sim_preview'
  if (command.kind === 'set_engine_capability_enabled') {
    return `${command.enabled ? 'cap_enable' : 'cap_disable'} ${command.capabilityId}`
  }
  if (command.kind === 'clear_scene') return 'clear_scene'
  if (command.kind === 'undo_scene_edit') return 'undo'
  if (command.kind === 'redo_scene_edit') return 'redo'
  if (command.kind === 'clear_scene_event_log') return 'clear'
  if (command.kind === 'clear_scene_deferred_remote') return 'deferred_clear'
  if (command.kind === 'apply_deferred_scene_remote') return 'deferred_apply'
  if (command.kind === 'clear_scene_remote_override') return 'remote_overwrite_clear'
  if (command.kind === 'reset_pose') return 'pose_reset'

  if (command.kind === 'run_scene_command') {
    if (command.command.kind === 'snap_selected_to_grid') return `snap ${command.command.stepM}`
    if (command.command.kind === 'rotate_selected_by') return `rotate ${command.command.deltaDeg}`
    return `move ${command.command.deltaM[0]} ${command.command.deltaM[1]}`
  }

  return null
}
