import type { EngineCommandEnvelope } from './engineEnvelope'

export type EngineCapabilityEmitOptions = {
  at?: string
  correlationId?: string | null
  id?: string
  source?: string
}

export type EngineCapabilityExecutionResult = {
  stopDispatch?: boolean
} | void

export type EngineCapabilityContext<TCommand, TEvent, TState> = {
  command: TCommand
  emit: (kind: string, payload: TEvent, options?: EngineCapabilityEmitOptions) => void
  envelope: EngineCommandEnvelope<TCommand>
  state: TState
}

export type EngineCapability<TCommand, TEvent, TState> = {
  canHandle: (command: TCommand) => boolean
  execute: (context: EngineCapabilityContext<TCommand, TEvent, TState>) => EngineCapabilityExecutionResult
  id: string
}
