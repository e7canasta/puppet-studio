import type { BridgeSessionLifecycleEvent } from '../../../core/bridge-runtime'
import type { SceneEventInput } from '../../../core/observability'

export function toBridgeLifecycleSceneEvent(event: BridgeSessionLifecycleEvent): SceneEventInput {
  if (event.kind === 'connecting') {
    return {
      kind: 'bridge_connecting',
      level: 'info',
      source: 'bridge.lifecycle',
      summary: `connecting ${event.url}`,
    }
  }

  if (event.kind === 'connected') {
    return {
      kind: 'bridge_connected',
      level: 'info',
      source: 'bridge.lifecycle',
      summary: `connected ${event.url}`,
    }
  }

  if (event.kind === 'disconnected') {
    return {
      kind: 'bridge_disconnected',
      level: event.willReconnect ? 'warn' : 'info',
      source: 'bridge.lifecycle',
      summary: event.willReconnect ? 'disconnected (will reconnect)' : 'disconnected',
    }
  }

  if (event.kind === 'reconnect_scheduled') {
    return {
      kind: 'bridge_reconnect_scheduled',
      level: 'warn',
      source: 'bridge.lifecycle',
      summary: `reconnect in ${event.delayMs}ms`,
    }
  }

  if (event.kind === 'socket_create_error') {
    return {
      kind: 'bridge_socket_create_error',
      level: 'error',
      source: 'bridge.lifecycle',
      summary: event.message,
    }
  }

  if (event.kind === 'socket_error') {
    return {
      kind: 'bridge_socket_error',
      level: 'error',
      source: 'bridge.lifecycle',
      summary: 'socket error',
    }
  }

  if (event.kind === 'inbound_json_invalid') {
    return {
      kind: 'bridge_inbound_json_invalid',
      level: 'warn',
      source: 'bridge.inbound',
      summary: 'invalid json payload',
    }
  }

  return {
    kind: 'scene_subscribe',
    level: 'info',
    message: { kind: 'scene_subscribe', sceneId: event.sceneId },
    source: 'frontend.scene',
    summary: `subscribe scene:${event.sceneId}`,
  }
}
