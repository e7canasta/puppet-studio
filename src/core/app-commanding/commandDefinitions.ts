import { commandRegistry } from './commandRegistry'
import { SCENE_COMMAND_SNAP_STEP_M } from '../config'
import type { WorkspaceLayoutPreset, WorkspaceWidgetId } from '../workspace-shell'
import type { AppCameraView, AppProjectionMode, AppToolMode } from './appCommandBus'

function toBooleanFlag(value: string | undefined): boolean | null {
    if (!value) return null
    const normalized = value.toLowerCase()
    if (normalized === 'on' || normalized === '1' || normalized === 'true') return true
    if (normalized === 'off' || normalized === '0' || normalized === 'false') return false
    return null
}

function toPositiveNumber(value: string | undefined): number | null {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
}

function toWorkspaceLayoutPreset(value: string | undefined): WorkspaceLayoutPreset | null {
    if (!value) return null
    const normalized = value.toLowerCase()
    if (normalized === 'focus') return 'focus'
    if (normalized === 'author' || normalized === 'authoring') return 'authoring'
    if (normalized === 'observe' || normalized === 'observability') return 'observability'
    return null
}

function toWorkspaceWidgetId(value: string | undefined): WorkspaceWidgetId | null {
    if (!value) return null
    const normalized = value.toLowerCase()
    if (normalized === 'properties' || normalized === 'props' || normalized === 'left') return 'properties'
    if (normalized === 'outliner' || normalized === 'outline' || normalized === 'tree') return 'outliner'
    if (normalized === 'camera' || normalized === 'cam') return 'camera'
    if (normalized === 'planogram' || normalized === 'plan') return 'planogram'
    return null
}

function toToolMode(value: string | undefined): AppToolMode | null {
    if (!value) return null
    const normalized = value.toLowerCase()
    if (normalized === 'select' || normalized === 'sel') return 'select'
    if (normalized === 'move' || normalized === 'mv') return 'move'
    if (normalized === 'rotate' || normalized === 'rot') return 'rotate'
    return null
}

function commandError(message: string) {
    return { commands: [], message, status: 'error' as const }
}

function boolToken(value: boolean): 'on' | 'off' {
    return value ? 'on' : 'off'
}

// === ENGINE ===
commandRegistry.register({
    id: 'set_engine_capability_enabled',
    category: 'engine',
    label: 'Enable/Disable Engine Capability',
    description: 'Habilita una capacidad del engine.',
    terminalAliases: ['plugin_on', 'plugin_off', 'cap_enable', 'cap_disable'],
    terminalUsage: 'cap_enable <capability-id> | plugin_off <capability-id>',
    toTerminalLine: (cmd) => `${cmd.enabled ? 'cap_enable' : 'cap_disable'} ${cmd.capabilityId}`,
    fromTerminalArgs: (args, ctx) => {
        // This handles both cap_enable and cap_disable since terminalCommandLine strips the command
        // We actually need the original command to know if it's enable or disable.
        // In our new model, fromTerminalArgs happens AFTER parsing the command name.
        // So we'll have to adjust `terminalCommandLine.ts` to pass the matched token name down, 
        // OR we register two virtual commands in terminal.
        // Since AppCommand only has ONE kind for both, we handle it in terminal model,
        // but the cleanest way is a helper in terminalCommandLine mapping `plugin_on` to `set_engine_capability_enabled + true`
        throw new Error('This should be mapped in terminal command catalog due to aliasing differences')
    },
})

commandRegistry.register({
    id: 'request_engine_stats',
    category: 'engine',
    label: 'Request Engine Stats',
    description: 'Solicita snapshot de métricas del engine runtime.',
    terminalAliases: ['engine_stats', 'stats'],
    terminalUsage: 'stats',
    toTerminalLine: () => 'stats',
    fromTerminalArgs: () => ({ commands: [{ kind: 'request_engine_stats' }], message: 'engine stats requested' }),
})

commandRegistry.register({
    id: 'request_engine_sim_preview',
    category: 'engine',
    label: 'Request Engine Sim Preview',
    description: 'Solicita snapshot de simulación local del estado de escena.',
    terminalAliases: ['sim', 'engine_sim', 'sim_preview'],
    terminalUsage: 'sim_preview',
    toTerminalLine: () => 'sim_preview',
    fromTerminalArgs: () => ({ commands: [{ kind: 'request_engine_sim_preview' }], message: 'engine sim preview requested' }),
})

// === WORKSPACE ===
commandRegistry.register({
    id: 'apply_workspace_layout_preset',
    category: 'workspace',
    label: 'Apply Layout Preset',
    description: 'Aplica preset de layout de workspace.',
    terminalAliases: ['ws', 'workspace', 'layout'],
    terminalUsage: 'layout <focus|authoring|observability>',
    toTerminalLine: (cmd) => `layout ${cmd.preset}`,
    fromTerminalArgs: (args) => {
        const preset = toWorkspaceLayoutPreset(args[0])
        if (!preset) return commandError('invalid layout preset (use: focus|authoring|observability)')
        return { commands: [{ kind: 'apply_workspace_layout_preset', preset }], message: `workspace layout preset ${preset}` }
    },
})

commandRegistry.register({
    id: 'restore_workspace_layout_defaults',
    category: 'workspace',
    label: 'Restore Layout Defaults',
    description: 'Restaura layout por defecto del workspace.',
    terminalAliases: ['layout_default', 'ws_reset', 'layout_reset'],
    terminalUsage: 'layout_reset',
    toTerminalLine: () => 'layout_reset',
    fromTerminalArgs: () => ({ commands: [{ kind: 'restore_workspace_layout_defaults' }], message: 'workspace layout restored' }),
})

commandRegistry.register({
    id: 'toggle_workspace_left_panel',
    category: 'workspace',
    label: 'Toggle Left Panel',
    description: 'Alterna panel izquierdo del workspace.',
    terminalAliases: ['left', 'left_panel'],
    terminalUsage: 'left_panel',
    toTerminalLine: () => 'left_panel',
    fromTerminalArgs: () => ({ commands: [{ kind: 'toggle_workspace_left_panel' }], message: 'workspace left panel toggled' }),
})

commandRegistry.register({
    id: 'toggle_workspace_right_panel',
    category: 'workspace',
    label: 'Toggle Right Panel',
    description: 'Alterna panel derecho del workspace.',
    terminalAliases: ['right', 'right_panel'],
    terminalUsage: 'right_panel',
    toTerminalLine: () => 'right_panel',
    fromTerminalArgs: () => ({ commands: [{ kind: 'toggle_workspace_right_panel' }], message: 'workspace right panel toggled' }),
})

commandRegistry.register({
    id: 'set_workspace_widget_visible',
    category: 'workspace',
    label: 'Set Widget Visible',
    description: 'Muestra u oculta un widget del workspace.',
    toTerminalLine: (cmd) => `${cmd.visible ? 'widget_show' : 'widget_hide'} ${cmd.widget}`,
    // Handled specifically in terminal aliases
})

commandRegistry.register({
    id: 'toggle_workspace_widget_collapsed',
    category: 'workspace',
    label: 'Toggle Widget Collapsed',
    description: 'Colapsa/expande un widget del workspace.',
    terminalAliases: ['widget_fold'],
    terminalUsage: 'widget_fold <properties|outliner|camera|planogram>',
    toTerminalLine: (cmd) => `widget_fold ${cmd.widget}`,
    fromTerminalArgs: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return { commands: [{ kind: 'toggle_workspace_widget_collapsed', widget }], message: `widget ${widget} collapsed state toggled` }
    },
})

commandRegistry.register({
    id: 'toggle_workspace_widget_pinned',
    category: 'workspace',
    label: 'Toggle Widget Pinned',
    description: 'Alterna pin de un widget del workspace.',
    terminalAliases: ['widget_pin'],
    terminalUsage: 'widget_pin <properties|outliner|camera|planogram>',
    toTerminalLine: (cmd) => `widget_pin ${cmd.widget}`,
    fromTerminalArgs: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return { commands: [{ kind: 'toggle_workspace_widget_pinned', widget }], message: `widget ${widget} pin toggled` }
    },
})

commandRegistry.register({
    id: 'set_workspace_left_panel_size',
    category: 'workspace',
    label: 'Set Left Panel Size',
    description: 'Ajusta el ancho del panel izquierdo.',
    terminalAliases: ['panel-left'],
    terminalUsage: 'panel-left <pixels>',
    toTerminalLine: (cmd) => `panel-left ${cmd.sizePx}`,
    fromTerminalArgs: (args) => {
        const sizePx = parseInt(args[0], 10)
        if (isNaN(sizePx)) return commandError('Usage: panel-left <pixels>')
        return { commands: [{ kind: 'set_workspace_left_panel_size', sizePx }], message: `left panel size set to ${sizePx}px` }
    },
    flags: { undoable: false, reflectsToTerminal: true },
})

commandRegistry.register({
    id: 'set_workspace_right_panel_size',
    category: 'workspace',
    label: 'Set Right Panel Size',
    description: 'Ajusta el ancho del panel derecho.',
    terminalAliases: ['panel-right'],
    terminalUsage: 'panel-right <pixels>',
    toTerminalLine: (cmd) => `panel-right ${cmd.sizePx}`,
    fromTerminalArgs: (args) => {
        const sizePx = parseInt(args[0], 10)
        if (isNaN(sizePx)) return commandError('Usage: panel-right <pixels>')
        return { commands: [{ kind: 'set_workspace_right_panel_size', sizePx }], message: `right panel size set to ${sizePx}px` }
    },
    flags: { undoable: false, reflectsToTerminal: true },
})

commandRegistry.register({
    id: 'set_workspace_terminal_height',
    category: 'workspace',
    label: 'Set Terminal Height',
    description: 'Ajusta la altura del terminal.',
    terminalAliases: ['terminal-height'],
    terminalUsage: 'terminal-height <pixels>',
    toTerminalLine: (cmd) => `terminal-height ${cmd.sizePx}`,
    fromTerminalArgs: (args) => {
        const sizePx = parseInt(args[0], 10)
        if (isNaN(sizePx)) return commandError('Usage: terminal-height <pixels>')
        return { commands: [{ kind: 'set_workspace_terminal_height', sizePx }], message: `terminal height set to ${sizePx}px` }
    },
    flags: { undoable: false, reflectsToTerminal: true },
})

commandRegistry.register({
    id: 'set_workspace_outliner_height',
    category: 'workspace',
    label: 'Set Outliner Height',
    description: 'Ajusta la altura del widget outliner.',
    terminalAliases: ['outliner-height'],
    terminalUsage: 'outliner-height <pixels>',
    toTerminalLine: (cmd) => `outliner-height ${cmd.sizePx}`,
    fromTerminalArgs: (args) => {
        const sizePx = parseInt(args[0], 10)
        if (isNaN(sizePx)) return commandError('Usage: outliner-height <pixels>')
        return { commands: [{ kind: 'set_workspace_outliner_height', sizePx }], message: `outliner height set to ${sizePx}px` }
    },
    flags: { undoable: false, reflectsToTerminal: true },
})

// === UI ===
commandRegistry.register({
    id: 'set_active_tool',
    category: 'ui',
    label: 'Set Active Tool',
    description: 'Cambia herramienta activa de workspace.',
    terminalAliases: ['tool'],
    terminalUsage: 'tool <select|move|rotate>',
    toTerminalLine: (cmd) => `tool ${cmd.mode}`,
    fromTerminalArgs: (args, ctx) => {
        const mode = toToolMode(args[0])
        if (!mode) return commandError('invalid tool mode (use: select|move|rotate)')
        if (mode === ctx.activeToolMode) return { commands: [], message: `tool already ${mode}` }
        return { commands: [{ kind: 'set_active_tool', mode }], message: `tool -> ${mode}` }
    },
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'toggle_scene_event_terminal',
    category: 'ui',
    label: 'Toggle Terminal',
    description: 'Alterna terminal (Ctrl+9).',
    terminalAliases: ['term', 'toggle', 'terminal'],
    terminalUsage: 'terminal',
    toTerminalLine: () => 'terminal',
    fromTerminalArgs: (args, ctx) => ({ commands: [{ kind: 'toggle_scene_event_terminal' }], message: ctx.sceneEventTerminalOpen ? 'terminal hidden' : 'terminal shown' }),
})

commandRegistry.register({
    id: 'clear_scene_event_log',
    category: 'ui',
    label: 'Clear Terminal Log',
    description: 'Limpia el log del terminal.',
    terminalAliases: ['cls', 'clear'],
    terminalUsage: 'clear',
    toTerminalLine: () => 'clear',
    fromTerminalArgs: () => ({ commands: [{ kind: 'clear_scene_event_log' }], message: 'terminal log cleared' }),
})

commandRegistry.register({
    id: 'set_scene_event_log_paused',
    category: 'ui',
    label: 'Pause Event Log',
    description: 'Pausa/reanuda captura de eventos.',
    terminalAliases: ['logpause', 'pause'],
    terminalUsage: 'pause [on|off]',
    toTerminalLine: (cmd) => `pause ${boolToken(cmd.enabled as boolean)}`,
    fromTerminalArgs: (args, ctx) => {
        const explicitFlag = toBooleanFlag(args[0])
        const nextEnabled = explicitFlag ?? !ctx.sceneEventLogPaused
        return { commands: [{ kind: 'set_scene_event_log_paused', enabled: nextEnabled }], message: nextEnabled ? 'event log paused' : 'event log resumed' }
    },
})

commandRegistry.register({
    id: 'set_scene_event_auto_scroll',
    category: 'ui',
    label: 'Toggle Auto Scroll',
    description: 'Controla auto-scroll del terminal.',
    terminalAliases: ['scroll', 'auto'],
    terminalUsage: 'auto [on|off]',
    toTerminalLine: (cmd) => `auto ${boolToken(cmd.enabled as boolean)}`,
    fromTerminalArgs: (args, ctx) => {
        const explicitFlag = toBooleanFlag(args[0])
        const nextEnabled = explicitFlag ?? !ctx.sceneEventAutoScroll
        return { commands: [{ kind: 'set_scene_event_auto_scroll', enabled: nextEnabled }], message: `auto-scroll ${nextEnabled ? 'on' : 'off'}` }
    },
})

// === SCENE ===
commandRegistry.register({
    id: 'set_scene_id',
    category: 'scene',
    label: 'Set Scene',
    description: 'Cambia el scene id activo.',
    terminalAliases: ['scn', 'scene'],
    terminalUsage: 'scene <scene-id>',
    toTerminalLine: (cmd) => `scene ${cmd.sceneId}`,
    fromTerminalArgs: (args, ctx) => {
        const sceneId = args[0]?.trim()
        if (!sceneId) return commandError(`scene id required (current: ${ctx.sceneId})`)
        return { commands: [{ kind: 'set_scene_id', sceneId }], message: `scene set to ${sceneId}` }
    },
})

commandRegistry.register({
    id: 'clear_scene',
    category: 'scene',
    label: 'Clear Scene',
    description: 'Limpia toda la escena.',
    terminalAliases: ['clear_scene'],
    terminalUsage: 'clear_scene',
    toTerminalLine: () => 'clear_scene',
    fromTerminalArgs: () => ({ commands: [{ kind: 'clear_scene' }], message: 'scene cleared' }),
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_selected_placement',
    category: 'scene',
    label: 'Select Placement',
    description: 'Selecciona placement o limpia selección.',
    terminalAliases: ['select'],
    terminalUsage: 'select <placement-id|none>',
    toTerminalLine: (cmd) => `select ${cmd.placementId ?? 'none'}`,
    fromTerminalArgs: (args) => {
        const token = args[0]?.trim()
        if (!token) return commandError('placement id required')
        return {
            commands: [{ kind: 'set_selected_placement', placementId: token === 'none' ? null : token }],
            message: token === 'none' ? 'selection cleared' : `placement selected: ${token}`,
        }
    },
    flags: { undoable: false },
})

commandRegistry.register({
    id: 'toggle_scene_edit',
    category: 'scene',
    label: 'Toggle Edit Mode',
    description: 'Habilita/inhabilita edición local.',
    terminalAliases: ['edit'],
    terminalUsage: 'edit [on|off]',
    toTerminalLine: () => 'edit',
    fromTerminalArgs: (args, ctx) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) return commandError('invalid edit flag (use: on|off)')
        if (explicitFlag === ctx.sceneEditEnabled) return { commands: [], message: `scene edit already ${explicitFlag ? 'on' : 'off'}` }
        return { commands: [{ kind: 'toggle_scene_edit' }], message: `scene edit ${explicitFlag ?? !ctx.sceneEditEnabled ? 'on' : 'off'}` }
    },
})

commandRegistry.register({
    id: 'undo_scene_edit',
    category: 'scene',
    label: 'Undo Scene Edit',
    description: 'Undo de edición local.',
    terminalAliases: ['u', 'undo'],
    terminalUsage: 'undo',
    toTerminalLine: () => 'undo',
    fromTerminalArgs: () => ({ commands: [{ kind: 'undo_scene_edit' }], message: 'undo' }),
})

commandRegistry.register({
    id: 'redo_scene_edit',
    category: 'scene',
    label: 'Redo Scene Edit',
    description: 'Redo de edición local.',
    terminalAliases: ['r', 'redo'],
    terminalUsage: 'redo',
    toTerminalLine: () => 'redo',
    fromTerminalArgs: () => ({ commands: [{ kind: 'redo_scene_edit' }], message: 'redo' }),
})

commandRegistry.register({
    id: 'run_scene_command',
    category: 'scene',
    label: 'Execute Scene Data Command',
    description: 'Runs data manipulation commands like move or snap.',
    toTerminalLine: (cmd: any) => {
        if (cmd.command.kind === 'snap_selected_to_grid') return `snap ${cmd.command.stepM}`
        if (cmd.command.kind === 'rotate_selected_by') return `rotate ${cmd.command.deltaDeg}`
        return `move ${cmd.command.deltaM[0]} ${cmd.command.deltaM[1]}`
    },
    flags: { undoable: true },
    // fromTerminalArgs mapped virtually in terminal catalog since scene commands have multiple sub-aliases
})

// === VIEWPORT ===
commandRegistry.register({
    id: 'set_camera_view',
    category: 'viewport',
    label: 'Set Camera View',
    description: 'Cambia vista de cámara.',
    terminalAliases: ['v', 'view'],
    terminalUsage: 'view <iso|front|back|left|right|top|sensor>',
    toTerminalLine: (cmd) => `view ${cmd.view}`,
    fromTerminalArgs: (args) => {
        const rawView = args[0]?.toLowerCase()
        const view =
            rawView === 'f' || rawView === 'front' || rawView === 'frente' ? 'front'
                : rawView === 'b' || rawView === 'back' || rawView === 'rear' || rawView === 'atras' ? 'back'
                    : rawView === 'l' || rawView === 'left' || rawView === 'izquierda' ? 'left'
                        : rawView === 'r' || rawView === 'right' || rawView === 'derecha' ? 'right'
                            : rawView === 'iso' || rawView === 'sensor' || rawView === 'top' ? (rawView as AppCameraView)
                                : null
        if (!view) return commandError('invalid view (use: iso | front | back | left | right | top | sensor)')
        return { commands: [{ kind: 'set_camera_view', view }], message: `camera view ${view}` }
    },
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_projection_mode',
    category: 'viewport',
    label: 'Set Projection Mode',
    description: 'Cambia modo de proyección.',
    terminalAliases: ['proj', 'projection'],
    terminalUsage: 'projection <orthographic|perspective>',
    toTerminalLine: (cmd) => `projection ${cmd.mode === 'orthographic' ? 'ortho' : 'persp'}`,
    fromTerminalArgs: (args) => {
        const raw = args[0]?.toLowerCase()
        const mode: AppProjectionMode | null = raw === 'orthographic' || raw === 'ortho' ? 'orthographic' : raw === 'perspective' || raw === 'persp' ? 'perspective' : null
        if (!mode) return commandError('invalid projection (use: orthographic|perspective)')
        return { commands: [{ kind: 'set_projection_mode', mode }], message: `projection ${mode}` }
    },
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_show_dimensions',
    category: 'viewport',
    label: 'Toggle Dimensions',
    description: 'Muestra/oculta dimensiones.',
    terminalAliases: ['measure', 'msr', 'dims'],
    terminalUsage: 'dims [on|off]',
    toTerminalLine: (cmd) => `dims ${boolToken(cmd.show as boolean)}`,
    fromTerminalArgs: (args, ctx) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) return commandError('invalid dims flag (use: on|off)')
        const nextShow = explicitFlag ?? !ctx.showDimensions
        return { commands: [{ kind: 'set_show_dimensions', show: nextShow }], message: `dimensions ${nextShow ? 'on' : 'off'}` }
    },
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'rotate_top_view',
    category: 'viewport',
    label: 'Rotate Top View',
    description: 'Rotar la vista top (CW / CCW).',
    toTerminalLine: (cmd) => (cmd.direction as number) < 0 ? 'top_ccw' : 'top_cw',
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_selected_monitoring_camera',
    category: 'viewport',
    label: 'Select Monitoring Camera',
    description: 'Set la camara de monitoreo activa.',
    toTerminalLine: (cmd) => `camera ${cmd.cameraId ?? 'none'}`,
})

commandRegistry.register({
    id: 'set_camera_overlay_flip',
    category: 'viewport',
    label: 'Flip Camera Overlay',
    description: 'Gira el overlay de camara 2D.',
    toTerminalLine: (cmd) => `flip_${cmd.axis} ${boolToken(cmd.enabled as boolean)}`,
})

commandRegistry.register({
    id: 'reset_camera_overlay_flip',
    category: 'viewport',
    label: 'Reset Camera Flip',
    description: 'Resetea el girado de camara 2D.',
    toTerminalLine: () => 'flip_reset',
})

// === BRIDGE ===
commandRegistry.register({
    id: 'set_bridge_enabled',
    category: 'bridge',
    label: 'Enable/Disable Bridge',
    description: 'Habilita/inhabilita bridge de sincronización remota.',
    terminalAliases: ['bridge'],
    terminalUsage: 'bridge <on|off>',
    toTerminalLine: (cmd) => `bridge ${boolToken(cmd.enabled as boolean)}`,
    fromTerminalArgs: (args) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null) return commandError('invalid bridge flag (use: on|off)')
        return { commands: [{ kind: 'set_bridge_enabled', enabled: explicitFlag }], message: `bridge ${explicitFlag ? 'on' : 'off'}` }
    },
})

commandRegistry.register({
    id: 'toggle_scene_remote_hold',
    category: 'bridge',
    label: 'Toggle Remote Hold',
    description: 'Activa/desactiva hold remoto.',
    terminalAliases: ['hold'],
    terminalUsage: 'hold [on|off]',
    toTerminalLine: () => 'hold',
    fromTerminalArgs: (args, ctx) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) return commandError('invalid hold flag (use: on|off)')
        if (explicitFlag === ctx.sceneRemoteHoldEnabled) return { commands: [], message: `remote hold already ${explicitFlag ? 'on' : 'off'}` }
        return { commands: [{ kind: 'toggle_scene_remote_hold' }], message: `remote hold ${explicitFlag ?? !ctx.sceneRemoteHoldEnabled ? 'on' : 'off'}` }
    },
})

commandRegistry.register({
    id: 'apply_deferred_scene_remote',
    category: 'bridge',
    label: 'Apply Deferred State',
    description: 'Aplica cola diferida remota.',
    terminalAliases: ['apply_remote', 'apply'],
    terminalUsage: 'apply',
    toTerminalLine: () => 'deferred_apply',
    fromTerminalArgs: () => ({ commands: [{ kind: 'apply_deferred_scene_remote' }], message: 'deferred remote apply requested' }),
})

commandRegistry.register({
    id: 'clear_scene_deferred_remote',
    category: 'bridge',
    label: 'Clear Deferred Queue',
    description: 'Limpia cola diferida remota.',
    terminalAliases: ['drop_remote', 'remote_clear'],
    terminalUsage: 'remote_clear',
    toTerminalLine: () => 'deferred_clear',
    fromTerminalArgs: () => ({ commands: [{ kind: 'clear_scene_deferred_remote' }], message: 'deferred remote queue cleared' }),
})

commandRegistry.register({
    id: 'clear_scene_remote_override',
    category: 'bridge',
    label: 'Clear Remote Override',
    description: 'Restores bridge behavior after manual interactions.',
    toTerminalLine: () => 'remote_overwrite_clear',
})

// === POSE / USER ===
commandRegistry.register({
    id: 'reset_pose',
    category: 'avatar',
    label: 'Reset Pose Avatar',
    description: 'Resets the avatar pose tracking state to initial zero pose.',
    toTerminalLine: () => 'pose_reset',
})

commandRegistry.register({
    id: 'set_avatar_position',
    category: 'avatar',
    label: 'Set Avatar Position',
    description: 'Moves avatar to position (x, z) in meters.',
    toTerminalLine: (cmd) => `avatar_pos ${(cmd.position as number[])[0]} ${(cmd.position as number[])[1]}`,
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_avatar_rotation',
    category: 'avatar',
    label: 'Set Avatar Rotation',
    description: 'Rotates avatar by degrees.',
    toTerminalLine: (cmd) => `avatar_rot ${cmd.rotationDeg}`,
    flags: { undoable: true },
})

commandRegistry.register({
    id: 'set_avatar_pose',
    category: 'avatar',
    label: 'Set Avatar Pose',
    description: 'Sets avatar joint pose.',
    toTerminalLine: () => 'avatar_pose [...]',
    flags: { undoable: true },
})

