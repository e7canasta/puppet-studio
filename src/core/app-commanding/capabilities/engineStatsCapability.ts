import type { AppCommand } from '../appCommandBus'
import type { EngineCapability } from '../../engine'

type EngineStatsSnapshot = {
  byKind: Record<string, number>
  bySource: Record<string, number>
  generatedAt: string
  totalCommands: number
}

function incrementRecord(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1
}

export function createEngineStatsCapability(): PoseStoreEngineCapability {
  const byKind: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  let totalCommands = 0

  return {
    canHandle: () => true,
    execute: ({ command, emit, envelope }) => {
      totalCommands += 1
      incrementRecord(byKind, command.kind)
      incrementRecord(bySource, envelope.source)

      if (command.kind !== 'request_engine_stats') return

      const snapshot: EngineStatsSnapshot = {
        byKind: { ...byKind },
        bySource: { ...bySource },
        generatedAt: new Date().toISOString(),
        totalCommands,
      }

      emit('engine.stats_snapshot', snapshot, { source: 'engine.capability.stats' })
      return { stopDispatch: true }
    },
    id: 'engine.stats',
  }
}

type PoseStoreEngineCapability = EngineCapability<AppCommand, { [key: string]: unknown }, unknown>

export function isEngineStatsCommand(command: AppCommand): boolean {
  return command.kind === 'request_engine_stats'
}
