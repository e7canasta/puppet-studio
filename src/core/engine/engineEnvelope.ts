export type EngineCommandSource = string

export type EngineCommandEnvelope<TCommand> = {
  at: string
  command: TCommand
  correlationId: string | null
  id: string
  source: EngineCommandSource
}

export type EngineCommandEnvelopeOptions = {
  at?: string
  correlationId?: string | null
  id?: string
  idPrefix?: string
  source?: EngineCommandSource
}

export type EngineEventEnvelope<TEvent> = {
  at: string
  commandId: string | null
  correlationId: string | null
  id: string
  kind: string
  payload: TEvent
  source: string
}

export type EngineEventEnvelopeOptions = {
  at?: string
  commandId?: string | null
  correlationId?: string | null
  id?: string
  idPrefix?: string
  source?: string
}

let commandSequence = 0
let eventSequence = 0

export function createEngineCommandEnvelope<TCommand>(
  command: TCommand,
  options?: EngineCommandEnvelopeOptions,
): EngineCommandEnvelope<TCommand> {
  commandSequence += 1
  const prefix = options?.idPrefix ?? 'engine-cmd'
  return {
    at: options?.at ?? new Date().toISOString(),
    command,
    correlationId: options?.correlationId ?? null,
    id: options?.id ?? `${prefix}-${commandSequence}`,
    source: options?.source ?? 'engine.unknown',
  }
}

export function createEngineEventEnvelope<TEvent>(
  kind: string,
  payload: TEvent,
  options?: EngineEventEnvelopeOptions,
): EngineEventEnvelope<TEvent> {
  eventSequence += 1
  const prefix = options?.idPrefix ?? 'engine-ev'
  return {
    at: options?.at ?? new Date().toISOString(),
    commandId: options?.commandId ?? null,
    correlationId: options?.correlationId ?? null,
    id: options?.id ?? `${prefix}-${eventSequence}`,
    kind,
    payload,
    source: options?.source ?? 'engine.runtime',
  }
}
