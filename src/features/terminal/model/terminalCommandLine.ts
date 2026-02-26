import type { AppCommand, AppProjectionMode } from '../../../core/app-commanding'
import { SCENE_COMMAND_SNAP_STEP_M } from '../../../core/config'
import type { WorkspaceLayoutPreset, WorkspaceWidgetId } from '../../../core/workspace-shell'

type TerminalCapabilityStatus = {
  defaultEnabled: boolean
  description: string
  enabled: boolean
  id: string
}

export type TerminalCommandContext = {
  activeToolMode: 'move' | 'rotate' | 'select'
  capabilities: TerminalCapabilityStatus[]
  engineCapabilitiesDisabled: string[]
  engineCapabilitiesEnabled: string[]
  engineCapabilityProfile: 'demo' | 'dev' | 'ops'
  sceneEditEnabled: boolean
  sceneEventAutoScroll: boolean
  sceneEventLogPaused: boolean
  sceneEventTerminalOpen: boolean
  sceneId: string
  sceneRemoteHoldEnabled: boolean
  showDimensions: boolean
}

export type TerminalCommandStatus = 'error' | 'ok'

export type TerminalCommandResult = {
  commands: AppCommand[]
  input: string
  message: string
  status: TerminalCommandStatus
}

type TerminalCommandDefinition = {
  aliases: string[]
  description: string
  execute: (args: string[], context: TerminalCommandContext) => Omit<TerminalCommandResult, 'input' | 'status'> & { status?: TerminalCommandStatus }
  name: string
  usage: string
}

type TerminalCommandCatalog = {
  byAlias: Map<string, TerminalCommandDefinition>
  definitions: TerminalCommandDefinition[]
}

export type TerminalCommandDescriptor = {
  aliases: string[]
  description: string
  name: string
  requiresArgs: boolean
  usage: string
}

function tokenizeCommandLine(raw: string): string[] {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3])
  }
  return tokens
}

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

function toToolMode(value: string | undefined): 'move' | 'rotate' | 'select' | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'select' || normalized === 'sel') return 'select'
  if (normalized === 'move' || normalized === 'mv') return 'move'
  if (normalized === 'rotate' || normalized === 'rot') return 'rotate'
  return null
}

function commandError(message: string): Omit<TerminalCommandResult, 'input'> {
  return {
    commands: [],
    message,
    status: 'error',
  }
}

function makeCommandCatalog(): TerminalCommandCatalog {
  const definitions: TerminalCommandDefinition[] = [
    {
      aliases: ['h', '?'],
      description: 'Muestra comandos disponibles.',
      execute: () => ({
        commands: [],
        message: buildTerminalCommandHelp(),
      }),
      name: 'help',
      usage: 'help',
    },
    {
      aliases: ['plugins'],
      description: 'Lista capacidades registradas en engine runtime.',
      execute: (_args, context) => ({
        commands: [],
        message:
          context.capabilities.length > 0
            ? `capabilities: ${context.capabilities.map((capability) => `${capability.id}:${capability.enabled ? 'on' : 'off'}`).join(', ')}`
            : 'capabilities: none',
      }),
      name: 'caps',
      usage: 'caps',
    },
    {
      aliases: [],
      description: 'Cambia herramienta activa de workspace.',
      execute: (args, context) => {
        const mode = toToolMode(args[0])
        if (!mode) return commandError('invalid tool mode (use: select|move|rotate)')
        if (mode === context.activeToolMode) {
          return {
            commands: [],
            message: `tool already ${mode}`,
          }
        }
        return {
          commands: [{ kind: 'set_active_tool', mode }],
          message: `tool -> ${mode}`,
        }
      },
      name: 'tool',
      usage: 'tool <select|move|rotate>',
    },
    {
      aliases: ['cap_policy'],
      description: 'Muestra perfil activo y overrides de capacidades.',
      execute: (_args, context) => ({
        commands: [],
        message: [
          `profile:${context.engineCapabilityProfile}`,
          `enabled_override:${context.engineCapabilitiesEnabled.join('|') || '-'}`,
          `disabled_override:${context.engineCapabilitiesDisabled.join('|') || '-'}`,
        ].join(' '),
      }),
      name: 'cap_profile',
      usage: 'cap_profile',
    },
    {
      aliases: ['plugin_on'],
      description: 'Habilita una capacidad del engine.',
      execute: (args, context) => {
        const capabilityId = args[0]?.trim()
        if (!capabilityId) return commandError('capability id required')
        const known = context.capabilities.some((capability) => capability.id === capabilityId)
        if (!known) return commandError(`unknown capability '${capabilityId}'`)
        return {
          commands: [{ capabilityId, enabled: true, kind: 'set_engine_capability_enabled' }],
          message: `capability ${capabilityId} -> on`,
        }
      },
      name: 'cap_enable',
      usage: 'cap_enable <capability-id>',
    },
    {
      aliases: ['plugin_off'],
      description: 'Deshabilita una capacidad del engine.',
      execute: (args, context) => {
        const capabilityId = args[0]?.trim()
        if (!capabilityId) return commandError('capability id required')
        const known = context.capabilities.some((capability) => capability.id === capabilityId)
        if (!known) return commandError(`unknown capability '${capabilityId}'`)
        return {
          commands: [{ capabilityId, enabled: false, kind: 'set_engine_capability_enabled' }],
          message: `capability ${capabilityId} -> off`,
        }
      },
      name: 'cap_disable',
      usage: 'cap_disable <capability-id>',
    },
    {
      aliases: ['term', 'toggle'],
      description: 'Alterna terminal (Ctrl+9).',
      execute: (_args, context) => ({
        commands: [{ kind: 'toggle_scene_event_terminal' }],
        message: context.sceneEventTerminalOpen ? 'terminal hidden' : 'terminal shown',
      }),
      name: 'terminal',
      usage: 'terminal',
    },
    {
      aliases: ['ws', 'workspace'],
      description: 'Aplica preset de layout de workspace.',
      execute: (args) => {
        const preset = toWorkspaceLayoutPreset(args[0])
        if (!preset) {
          return commandError('invalid layout preset (use: focus|authoring|observability)')
        }
        return {
          commands: [{ kind: 'apply_workspace_layout_preset', preset }],
          message: `workspace layout preset ${preset}`,
        }
      },
      name: 'layout',
      usage: 'layout <focus|authoring|observability>',
    },
    {
      aliases: ['left'],
      description: 'Alterna panel izquierdo del workspace.',
      execute: () => ({
        commands: [{ kind: 'toggle_workspace_left_panel' }],
        message: 'workspace left panel toggled',
      }),
      name: 'left_panel',
      usage: 'left_panel',
    },
    {
      aliases: ['right'],
      description: 'Alterna panel derecho del workspace.',
      execute: () => ({
        commands: [{ kind: 'toggle_workspace_right_panel' }],
        message: 'workspace right panel toggled',
      }),
      name: 'right_panel',
      usage: 'right_panel',
    },
    {
      aliases: ['layout_default', 'ws_reset'],
      description: 'Restaura layout por defecto del workspace.',
      execute: () => ({
        commands: [{ kind: 'restore_workspace_layout_defaults' }],
        message: 'workspace layout restored to defaults',
      }),
      name: 'layout_reset',
      usage: 'layout_reset',
    },
    {
      aliases: ['widget_on'],
      description: 'Muestra un widget del workspace.',
      execute: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return {
          commands: [{ kind: 'set_workspace_widget_visible', visible: true, widget }],
          message: `widget ${widget} visible`,
        }
      },
      name: 'widget_show',
      usage: 'widget_show <properties|outliner|camera|planogram>',
    },
    {
      aliases: ['widget_off'],
      description: 'Oculta un widget del workspace.',
      execute: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return {
          commands: [{ kind: 'set_workspace_widget_visible', visible: false, widget }],
          message: `widget ${widget} hidden`,
        }
      },
      name: 'widget_hide',
      usage: 'widget_hide <properties|outliner|camera|planogram>',
    },
    {
      aliases: [],
      description: 'Colapsa/expande un widget del workspace.',
      execute: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return {
          commands: [{ kind: 'toggle_workspace_widget_collapsed', widget }],
          message: `widget ${widget} collapsed state toggled`,
        }
      },
      name: 'widget_fold',
      usage: 'widget_fold <properties|outliner|camera|planogram>',
    },
    {
      aliases: [],
      description: 'Alterna pin de un widget del workspace.',
      execute: (args) => {
        const widget = toWorkspaceWidgetId(args[0])
        if (!widget) return commandError('invalid widget (use: properties|outliner|camera|planogram)')
        return {
          commands: [{ kind: 'toggle_workspace_widget_pinned', widget }],
          message: `widget ${widget} pin toggled`,
        }
      },
      name: 'widget_pin',
      usage: 'widget_pin <properties|outliner|camera|planogram>',
    },
    {
      aliases: ['cls'],
      description: 'Limpia el log del terminal.',
      execute: () => ({
        commands: [{ kind: 'clear_scene_event_log' }],
        message: 'terminal log cleared',
      }),
      name: 'clear',
      usage: 'clear',
    },
    {
      aliases: ['logpause'],
      description: 'Pausa/reanuda captura de eventos.',
      execute: (args, context) => {
        const explicitFlag = toBooleanFlag(args[0])
        const nextEnabled = explicitFlag ?? !context.sceneEventLogPaused
        return {
          commands: [{ enabled: nextEnabled, kind: 'set_scene_event_log_paused' }],
          message: nextEnabled ? 'event log paused' : 'event log resumed',
        }
      },
      name: 'pause',
      usage: 'pause [on|off]',
    },
    {
      aliases: ['scroll'],
      description: 'Controla auto-scroll del terminal.',
      execute: (args, context) => {
        const explicitFlag = toBooleanFlag(args[0])
        const nextEnabled = explicitFlag ?? !context.sceneEventAutoScroll
        return {
          commands: [{ enabled: nextEnabled, kind: 'set_scene_event_auto_scroll' }],
          message: `auto-scroll ${nextEnabled ? 'on' : 'off'}`,
        }
      },
      name: 'auto',
      usage: 'auto [on|off]',
    },
    {
      aliases: ['scn'],
      description: 'Cambia el scene id activo.',
      execute: (args, context) => {
        const sceneId = args[0]?.trim()
        if (!sceneId) {
          return commandError(`scene id required (current: ${context.sceneId})`)
        }
        return {
          commands: [{ kind: 'set_scene_id', sceneId }],
          message: `scene set to ${sceneId}`,
        }
      },
      name: 'scene',
      usage: 'scene <scene-id>',
    },
    {
      aliases: ['v'],
      description: 'Cambia vista de cámara.',
      execute: (args) => {
        const rawView = args[0]?.toLowerCase()
        const view =
          rawView === 'f' || rawView === 'front' || rawView === 'frente'
            ? 'front'
            : rawView === 'b' || rawView === 'back' || rawView === 'rear' || rawView === 'atras'
              ? 'back'
              : rawView === 'l' || rawView === 'left' || rawView === 'izquierda'
                ? 'left'
                : rawView === 'r' || rawView === 'right' || rawView === 'derecha'
                  ? 'right'
                  : rawView === 'iso' || rawView === 'sensor' || rawView === 'top'
                    ? rawView
                    : null
        if (view) {
          return {
            commands: [{ kind: 'set_camera_view', view }],
            message: `camera view ${view}`,
          }
        }
        return commandError('invalid view (use: iso | front | back | left | right | top | sensor)')
      },
      name: 'view',
      usage: 'view <iso|front|back|left|right|top|sensor>',
    },
    {
      aliases: ['proj'],
      description: 'Cambia modo de proyección.',
      execute: (args) => {
        const raw = args[0]?.toLowerCase()
        const mode: AppProjectionMode | null =
          raw === 'orthographic' || raw === 'ortho'
            ? 'orthographic'
            : raw === 'perspective' || raw === 'persp'
              ? 'perspective'
              : null
        if (!mode) return commandError('invalid projection (use: orthographic|perspective)')
        return {
          commands: [{ kind: 'set_projection_mode', mode }],
          message: `projection ${mode}`,
        }
      },
      name: 'projection',
      usage: 'projection <orthographic|perspective>',
    },
    {
      aliases: [],
      description: 'Habilita/inhabilita edición local.',
      execute: (args, context) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) {
          return commandError('invalid edit flag (use: on|off)')
        }
        if (explicitFlag === null) {
          return {
            commands: [{ kind: 'toggle_scene_edit' }],
            message: `scene edit ${context.sceneEditEnabled ? 'off' : 'on'}`,
          }
        }
        if (explicitFlag === context.sceneEditEnabled) {
          return {
            commands: [],
            message: `scene edit already ${explicitFlag ? 'on' : 'off'}`,
          }
        }
        return {
          commands: [{ kind: 'toggle_scene_edit' }],
          message: `scene edit ${explicitFlag ? 'on' : 'off'}`,
        }
      },
      name: 'edit',
      usage: 'edit [on|off]',
    },
    {
      aliases: [],
      description: 'Activa/desactiva hold remoto.',
      execute: (args, context) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) {
          return commandError('invalid hold flag (use: on|off)')
        }
        if (explicitFlag === null) {
          return {
            commands: [{ kind: 'toggle_scene_remote_hold' }],
            message: `remote hold ${context.sceneRemoteHoldEnabled ? 'off' : 'on'}`,
          }
        }
        if (explicitFlag === context.sceneRemoteHoldEnabled) {
          return {
            commands: [],
            message: `remote hold already ${explicitFlag ? 'on' : 'off'}`,
          }
        }
        return {
          commands: [{ kind: 'toggle_scene_remote_hold' }],
          message: `remote hold ${explicitFlag ? 'on' : 'off'}`,
        }
      },
      name: 'hold',
      usage: 'hold [on|off]',
    },
    {
      aliases: ['u'],
      description: 'Undo de edición local.',
      execute: () => ({
        commands: [{ kind: 'undo_scene_edit' }],
        message: 'undo',
      }),
      name: 'undo',
      usage: 'undo',
    },
    {
      aliases: ['engine_stats'],
      description: 'Solicita snapshot de métricas del engine runtime.',
      execute: () => ({
        commands: [{ kind: 'request_engine_stats' }],
        message: 'engine stats requested',
      }),
      name: 'stats',
      usage: 'stats',
    },
    {
      aliases: ['sim', 'engine_sim'],
      description: 'Solicita snapshot de simulación local del estado de escena.',
      execute: () => ({
        commands: [{ kind: 'request_engine_sim_preview' }],
        message: 'engine sim preview requested',
      }),
      name: 'sim_preview',
      usage: 'sim_preview',
    },
    {
      aliases: ['r'],
      description: 'Redo de edición local.',
      execute: () => ({
        commands: [{ kind: 'redo_scene_edit' }],
        message: 'redo',
      }),
      name: 'redo',
      usage: 'redo',
    },
    {
      aliases: ['grid_snap'],
      description: 'Ajusta selección a grilla (usa step por default si no se pasa arg).',
      execute: (args) => {
        const explicitStep = args[0]
        const stepM = explicitStep ? toPositiveNumber(explicitStep) : SCENE_COMMAND_SNAP_STEP_M
        if (stepM === null) return commandError('invalid snap step (use positive meters, e.g. 0.05)')
        return {
          commands: [{ kind: 'run_scene_command', command: { kind: 'snap_selected_to_grid', stepM } }],
          message: `snap selected -> step ${stepM.toFixed(3)}m`,
        }
      },
      name: 'snap',
      usage: 'snap [step-m]',
    },
    {
      aliases: [],
      description: 'Selecciona placement o limpia selección.',
      execute: (args) => {
        const token = args[0]?.trim()
        if (!token) return commandError('placement id required')
        return {
          commands: [{ kind: 'set_selected_placement', placementId: token === 'none' ? null : token }],
          message: token === 'none' ? 'selection cleared' : `placement selected: ${token}`,
        }
      },
      name: 'select',
      usage: 'select <placement-id|none>',
    },
    {
      aliases: ['measure', 'msr'],
      description: 'Muestra/oculta dimensiones (toggle si no se pasa flag).',
      execute: (args, context) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null && args.length > 0) return commandError('invalid dims flag (use: on|off)')
        const nextShow = explicitFlag ?? !context.showDimensions
        return {
          commands: [{ kind: 'set_show_dimensions', show: nextShow }],
          message: `dimensions ${nextShow ? 'on' : 'off'}`,
        }
      },
      name: 'dims',
      usage: 'dims [on|off]',
    },
    {
      aliases: [],
      description: 'Habilita/inhabilita bridge.',
      execute: (args) => {
        const explicitFlag = toBooleanFlag(args[0])
        if (explicitFlag === null) return commandError('invalid bridge flag (use: on|off)')
        return {
          commands: [{ enabled: explicitFlag, kind: 'set_bridge_enabled' }],
          message: `bridge ${explicitFlag ? 'on' : 'off'}`,
        }
      },
      name: 'bridge',
      usage: 'bridge <on|off>',
    },
    {
      aliases: ['apply_remote'],
      description: 'Aplica cola diferida remota.',
      execute: () => ({
        commands: [{ kind: 'apply_deferred_scene_remote' }],
        message: 'deferred remote apply requested',
      }),
      name: 'apply',
      usage: 'apply',
    },
    {
      aliases: ['drop_remote'],
      description: 'Limpia cola diferida remota.',
      execute: () => ({
        commands: [{ kind: 'clear_scene_deferred_remote' }],
        message: 'deferred remote queue cleared',
      }),
      name: 'remote_clear',
      usage: 'remote_clear',
    },
  ]

  const byAlias = new Map<string, TerminalCommandDefinition>()
  for (const definition of definitions) {
    byAlias.set(definition.name, definition)
    for (const alias of definition.aliases) {
      byAlias.set(alias, definition)
    }
  }
  return {
    byAlias,
    definitions,
  }
}

const DEFAULT_CATALOG = makeCommandCatalog()
const DEFAULT_DESCRIPTORS: TerminalCommandDescriptor[] = DEFAULT_CATALOG.definitions.map((definition) => ({
  aliases: [...definition.aliases],
  description: definition.description,
  name: definition.name,
  requiresArgs: definition.usage.includes('<'),
  usage: definition.usage,
}))

function findTerminalCommandDescriptor(commandName: string): TerminalCommandDescriptor | null {
  const normalized = commandName.trim().toLowerCase()
  if (!normalized) return null
  return DEFAULT_DESCRIPTORS.find((descriptor) => descriptor.name === normalized) ?? null
}

export function getTerminalCommandDescriptor(commandName: string): TerminalCommandDescriptor | null {
  return findTerminalCommandDescriptor(commandName)
}

export function isTerminalCommandArgumentRequired(commandName: string): boolean {
  const descriptor = findTerminalCommandDescriptor(commandName)
  return descriptor ? descriptor.requiresArgs : false
}

export function listTerminalCommandDescriptors(): TerminalCommandDescriptor[] {
  return DEFAULT_DESCRIPTORS.map((descriptor) => ({
    aliases: [...descriptor.aliases],
    description: descriptor.description,
    name: descriptor.name,
    requiresArgs: descriptor.requiresArgs,
    usage: descriptor.usage,
  }))
}

export function buildTerminalCommandHelp(): string {
  return DEFAULT_CATALOG.definitions
    .map((definition) => `${definition.usage} - ${definition.description}`)
    .join('\n')
}

export function suggestTerminalCommands(prefix: string): string[] {
  const query = prefix.trim().toLowerCase()
  if (!query) return DEFAULT_CATALOG.definitions.map((definition) => definition.name)
  return DEFAULT_CATALOG.definitions
    .filter((definition) => definition.name.startsWith(query) || definition.aliases.some((alias) => alias.startsWith(query)))
    .map((definition) => definition.name)
}

export function runTerminalCommandLine(input: string, context: TerminalCommandContext): TerminalCommandResult | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const tokens = tokenizeCommandLine(trimmed)
  const commandToken = tokens[0]?.toLowerCase()
  if (!commandToken) return null

  const command = DEFAULT_CATALOG.byAlias.get(commandToken)
  if (!command) {
    return {
      commands: [],
      input: trimmed,
      message: `unknown command '${commandToken}' (try: help)`,
      status: 'error',
    }
  }

  const result = command.execute(tokens.slice(1), context)
  return {
    commands: result.commands,
    input: trimmed,
    message: result.message,
    status: result.status ?? 'ok',
  }
}
