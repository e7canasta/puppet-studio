import type { ParsedBridgeInboundMessage } from './bridgeMessages'

type Dict = Record<string, unknown>

export type BridgeStateAction =
  | {
      kind: 'apply_pose_snapshot'
      message: Dict
      nonZeroAxes: number | null
      receivedAt: string | null
      sequence: number | null
    }
  | {
      kind: 'apply_scene_patch'
      message: Dict
    }
  | {
      kind: 'apply_scene_snapshot'
      message: Dict
    }
  | {
      error: string
      kind: 'set_bridge_error'
    }
  | {
      kind: 'set_bridge_error'
      error: null
    }

export type BridgeStatePort = {
  applyPoseSnapshot: (payload: unknown) => void
  applyScenePatch: (payload: unknown) => void
  applySceneSnapshot: (payload: unknown) => void
  setBridgeError: (error: string | null) => void
  setBridgeMeta: (meta: { nonZeroAxes?: number | null; receivedAt?: string | null; sequence?: number | null }) => void
}

export function mapParsedBridgeInboundToActions(parsed: ParsedBridgeInboundMessage): BridgeStateAction[] {
  if (parsed.type === 'bridge_error') {
    return [
      {
        error: parsed.detail ?? 'bridge_error',
        kind: 'set_bridge_error',
      },
    ]
  }

  if (parsed.type === 'bridge_pose') {
    return [
      {
        kind: 'apply_pose_snapshot',
        message: parsed.message,
        nonZeroAxes: parsed.nonZeroAxes ?? 0,
        receivedAt: parsed.receivedAt ?? new Date().toISOString(),
        sequence: parsed.sequence ?? 0,
      },
      {
        error: null,
        kind: 'set_bridge_error',
      },
    ]
  }

  if (parsed.type === 'scene_snapshot') {
    return [
      {
        kind: 'apply_scene_snapshot',
        message: parsed.message,
      },
      {
        error: null,
        kind: 'set_bridge_error',
      },
    ]
  }

  if (parsed.type === 'scene_patch') {
    return [
      {
        kind: 'apply_scene_patch',
        message: parsed.message,
      },
      {
        error: null,
        kind: 'set_bridge_error',
      },
    ]
  }

  return []
}

export function applyBridgeStateActions(port: BridgeStatePort, actions: BridgeStateAction[]) {
  for (const action of actions) {
    if (action.kind === 'set_bridge_error') {
      port.setBridgeError(action.error)
      continue
    }

    if (action.kind === 'apply_pose_snapshot') {
      port.applyPoseSnapshot(action.message)
      port.setBridgeMeta({
        nonZeroAxes: action.nonZeroAxes,
        receivedAt: action.receivedAt,
        sequence: action.sequence,
      })
      continue
    }

    if (action.kind === 'apply_scene_snapshot') {
      port.applySceneSnapshot(action.message)
      continue
    }

    port.applyScenePatch(action.message)
  }
}
