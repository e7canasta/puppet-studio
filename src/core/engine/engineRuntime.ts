import type { EngineCapability, EngineCapabilityEmitOptions } from './engineCapability'
import { EngineCapabilityRegistry } from './engineCapabilityRegistry'
import {
  createEngineCommandEnvelope,
  createEngineEventEnvelope,
  type EngineCommandEnvelope,
  type EngineCommandEnvelopeOptions,
  type EngineEventEnvelope,
} from './engineEnvelope'

export type EngineDispatchResult<TCommand, TEvent> = {
  dispatchedToCommandPort: boolean
  emittedEvents: EngineEventEnvelope<TEvent>[]
  envelope: EngineCommandEnvelope<TCommand>
  handledByCapabilities: string[]
}

export type EngineRuntimeDependencies<TCommand, TEvent, TState> = {
  dispatchCommand: (envelope: EngineCommandEnvelope<TCommand>) => void
  emitEvent?: (event: EngineEventEnvelope<TEvent>) => void
  getState: () => TState
  onCapabilityError?: (context: {
    capabilityId: string
    command: TCommand
    envelope: EngineCommandEnvelope<TCommand>
    error: unknown
  }) => void
  registry?: EngineCapabilityRegistry<TCommand, TEvent, TState>
}

export type EngineRuntime<TCommand, TEvent, TState> = {
  clearCapabilities: () => void
  dispatch: (command: TCommand, options?: EngineCommandEnvelopeOptions) => EngineDispatchResult<TCommand, TEvent>
  dispatchEnvelope: (envelope: EngineCommandEnvelope<TCommand>) => EngineDispatchResult<TCommand, TEvent>
  listCapabilities: () => EngineCapability<TCommand, TEvent, TState>[]
  registerCapability: (capability: EngineCapability<TCommand, TEvent, TState>) => void
  unregisterCapability: (id: string) => void
}

export function createEngineRuntime<TCommand, TEvent, TState>(
  dependencies: EngineRuntimeDependencies<TCommand, TEvent, TState>,
): EngineRuntime<TCommand, TEvent, TState> {
  const capabilityRegistry = dependencies.registry ?? new EngineCapabilityRegistry<TCommand, TEvent, TState>()

  const emitCapabilityEvent = (
    envelope: EngineCommandEnvelope<TCommand>,
    emittedEvents: EngineEventEnvelope<TEvent>[],
    kind: string,
    payload: TEvent,
    options?: EngineCapabilityEmitOptions,
  ) => {
    const eventEnvelope = createEngineEventEnvelope(kind, payload, {
      at: options?.at,
      commandId: envelope.id,
      correlationId: options?.correlationId ?? envelope.correlationId,
      id: options?.id,
      source: options?.source,
    })
    emittedEvents.push(eventEnvelope)
    dependencies.emitEvent?.(eventEnvelope)
  }

  const dispatchEnvelope = (envelope: EngineCommandEnvelope<TCommand>): EngineDispatchResult<TCommand, TEvent> => {
    const emittedEvents: EngineEventEnvelope<TEvent>[] = []
    const matchedCapabilities = capabilityRegistry.match(envelope.command)
    const handledByCapabilities: string[] = []
    let stopDispatch = false

    for (const capability of matchedCapabilities) {
      try {
        const result = capability.execute({
          command: envelope.command,
          emit: (kind, payload, options) => emitCapabilityEvent(envelope, emittedEvents, kind, payload, options),
          envelope,
          state: dependencies.getState(),
        })
        handledByCapabilities.push(capability.id)
        if (result?.stopDispatch) {
          stopDispatch = true
        }
      } catch (error) {
        dependencies.onCapabilityError?.({
          capabilityId: capability.id,
          command: envelope.command,
          envelope,
          error,
        })
      }
    }

    if (!stopDispatch) {
      dependencies.dispatchCommand(envelope)
    }

    return {
      dispatchedToCommandPort: !stopDispatch,
      emittedEvents,
      envelope,
      handledByCapabilities,
    }
  }

  const dispatch = (
    command: TCommand,
    options?: EngineCommandEnvelopeOptions,
  ): EngineDispatchResult<TCommand, TEvent> => {
    const envelope = createEngineCommandEnvelope(command, options)
    return dispatchEnvelope(envelope)
  }

  return {
    clearCapabilities: () => capabilityRegistry.clear(),
    dispatch,
    dispatchEnvelope,
    listCapabilities: () => capabilityRegistry.list(),
    registerCapability: (capability) => capabilityRegistry.register(capability),
    unregisterCapability: (id) => capabilityRegistry.unregister(id),
  }
}
