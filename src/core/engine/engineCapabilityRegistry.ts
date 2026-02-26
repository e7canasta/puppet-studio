import type { EngineCapability } from './engineCapability'

export class EngineCapabilityRegistry<TCommand, TEvent, TState> {
  private readonly byId = new Map<string, EngineCapability<TCommand, TEvent, TState>>()

  clear() {
    this.byId.clear()
  }

  list(): EngineCapability<TCommand, TEvent, TState>[] {
    return [...this.byId.values()]
  }

  match(command: TCommand): EngineCapability<TCommand, TEvent, TState>[] {
    return this.list().filter((capability) => capability.canHandle(command))
  }

  register(capability: EngineCapability<TCommand, TEvent, TState>) {
    if (this.byId.has(capability.id)) {
      throw new Error(`Engine capability '${capability.id}' is already registered.`)
    }
    this.byId.set(capability.id, capability)
  }

  unregister(id: string) {
    this.byId.delete(id)
  }
}
