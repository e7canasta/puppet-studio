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

import { commandRegistry } from '../../../core/app-commanding/commandRegistry'

function makeCommandCatalog(): TerminalCommandCatalog {
  // Built-in help command is the only one not in the global registry 
  // because it needs access to the buildTerminalCommandHelp() which is local here.
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
  ]

  // Virtual alias expansion handles cases where one Terminal command maps to a specific argument
  // of an AppCommand. e.g. `cap_enable <id>` vs `cap_disable <id>` but they are the same AppCommand.
  const VIRTUAL_ALIASES: Record<string, { cmd: string, argsPrefix: string[] }> = {
    'plugin_on': { cmd: 'cap_enable', argsPrefix: [] },
    'plugin_off': { cmd: 'cap_disable', argsPrefix: [] },
    'widget_show': { cmd: 'set_workspace_widget_visible', argsPrefix: ['true'] },
    'widget_hide': { cmd: 'set_workspace_widget_visible', argsPrefix: ['false'] },
  }

  for (const meta of commandRegistry.list()) {
    if (!meta.fromTerminalArgs) continue

    // The primary "name" of the command in terminal is either its first alias, or the id
    const mainAlias = meta.terminalAliases?.[0] ?? meta.id
    const otherAliases = meta.terminalAliases?.slice(1) ?? []

    definitions.push({
      name: mainAlias,
      aliases: otherAliases,
      description: meta.description,
      usage: meta.terminalUsage ?? mainAlias,
      execute: meta.fromTerminalArgs,
    })
  }

  const byAlias = new Map<string, TerminalCommandDefinition>()
  for (const definition of definitions) {
    byAlias.set(definition.name, definition)
    for (const alias of definition.aliases) {
      byAlias.set(alias, definition)
    }
  }

  // Register virtual aliases manually into the map
  for (const [vAlias, target] of Object.entries(VIRTUAL_ALIASES)) {
    const targetDef = byAlias.get(target.cmd) || byAlias.get(target.cmd.replace('cap_', 'set_engine_capability_'))
    if (targetDef) {
      byAlias.set(vAlias, {
        name: vAlias,
        aliases: [],
        description: targetDef.description,
        usage: targetDef.usage.replace(targetDef.name, vAlias),
        execute: (args, ctx) => targetDef.execute([...target.argsPrefix, ...args], ctx)
      })
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
