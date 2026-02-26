type Dict = Record<string, unknown>

export type ParsedBridgeInboundMessage =
  | {
      type: 'invalid'
      reason: 'missing_kind' | 'not_object'
    }
  | {
      detail: string | null
      kind: 'bridge_error'
      message: Dict
      type: 'bridge_error'
    }
  | {
      kind: 'bridge_pose'
      message: Dict
      nonZeroAxes: number | null
      receivedAt: string | null
      sequence: number | null
      type: 'bridge_pose'
    }
  | {
      kind: 'scene_patch'
      message: Dict
      rawKind: string
      type: 'scene_patch'
    }
  | {
      kind: 'scene_snapshot'
      message: Dict
      rawKind: string
      type: 'scene_snapshot'
    }
  | {
      kind: string
      message: Dict
      type: 'other'
    }

function asRecord(value: unknown): Dict | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Dict) : null
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asInteger(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isInteger(numeric)) return null
  return numeric
}

function normalizeKind(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseBridgeInboundMessage(payload: unknown): ParsedBridgeInboundMessage {
  const message = asRecord(payload)
  if (!message) {
    return {
      reason: 'not_object',
      type: 'invalid',
    }
  }

  const rawKind = normalizeKind(message.kind)
  if (!rawKind) {
    return {
      reason: 'missing_kind',
      type: 'invalid',
    }
  }

  if (rawKind === 'bridge_error') {
    return {
      detail: asText(message.details ?? message.message ?? message.code),
      kind: 'bridge_error',
      message,
      type: 'bridge_error',
    }
  }

  if (rawKind === 'bridge_pose') {
    return {
      kind: 'bridge_pose',
      message,
      nonZeroAxes: asInteger(message.nonZeroAxes),
      receivedAt: asText(message.receivedAt ?? message.timestamp),
      sequence: asInteger(message.sequence),
      type: 'bridge_pose',
    }
  }

  if (rawKind === 'bridge_scene_patch' || rawKind === 'scene_patch') {
    return {
      kind: 'scene_patch',
      message,
      rawKind,
      type: 'scene_patch',
    }
  }

  if (rawKind === 'bridge_scene_snapshot' || rawKind === 'scene_snapshot' || rawKind === 'scene_update') {
    return {
      kind: 'scene_snapshot',
      message,
      rawKind,
      type: 'scene_snapshot',
    }
  }

  return {
    kind: rawKind,
    message,
    type: 'other',
  }
}
