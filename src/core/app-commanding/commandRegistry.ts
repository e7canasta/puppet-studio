import type { AppCommand } from './appCommandBus'
import type { TerminalCommandContext } from '../../features/terminal/model/terminalCommandLine'

export type AppCommandCategory = 'scene' | 'viewport' | 'bridge' | 'ui' | 'workspace' | 'engine'

export interface TerminalParseResult {
    commands: AppCommand[]
    message: string
    status?: 'error' | 'ok'
}

export interface CommandMeta<
    TCommand extends AppCommand = AppCommand,
    TKind extends TCommand['kind'] = TCommand['kind']
> {
    /** Unique command kind — matches AppCommand.kind exactly */
    id: TKind
    category: AppCommandCategory

    /** UI display */
    label: string
    description: string

    /** Terminal reflection: converts AppCommand → terminal string */
    toTerminalLine?: (cmd: Extract<TCommand, { kind: TKind }>) => string

    /** Terminal parsing: converts (args, context) → AppCommand[] */
    fromTerminalArgs?: (args: string[], ctx: TerminalCommandContext) => TerminalParseResult

    /** Terminal aliases (shorthand names) */
    terminalAliases?: string[]
    terminalUsage?: string

    /** Behavior flags */
    flags?: {
        undoable?: boolean
        macroRecordable?: boolean
        reflectsToTerminal?: boolean
    }
}

class CommandRegistryClass {
    private registry = new Map<string, CommandMeta<any, any>>()

    register<T extends AppCommand>(
        meta: Omit<CommandMeta<T, T['kind']>, 'id'> & { id: T['kind'] }
    ): void {
        if (this.registry.has(meta.id)) {
            throw new Error(`Command '${meta.id}' already registered`)
        }
        this.registry.set(meta.id, meta as any)
    }

    get(id: string): CommandMeta<any, any> | undefined {
        return this.registry.get(id)
    }

    list(): CommandMeta<any, any>[] {
        return [...this.registry.values()]
    }

    byCategory(category: AppCommandCategory): CommandMeta<any, any>[] {
        return this.list().filter(m => m.category === category)
    }
}

export const commandRegistry = new CommandRegistryClass()
