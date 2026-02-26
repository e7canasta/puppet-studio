import type { AppCommand } from './appCommandBus'
import { commandRegistry } from './commandRegistry'

export function reflectAppCommandToTerminalLine(command: AppCommand): string | null {
  const meta = commandRegistry.get(command.kind)

  if (meta?.toTerminalLine) {
    return meta.toTerminalLine(command as never)
  }

  return null
}
