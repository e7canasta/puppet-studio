export type SceneEventLevel = 'debug' | 'error' | 'info' | 'warn'

export type SceneEventEntry = {
  at: string
  id: string
  kind: string
  level: SceneEventLevel
  payload?: unknown
  revision: number | null
  sceneId: string | null
  sequence: number | null
  source: string
  summary: string
}

export type SceneEventInput = {
  at?: string | null
  kind: string
  level?: SceneEventLevel
  message?: unknown
  revision?: number | null
  sceneId?: string | null
  sequence?: number | null
  source: string
  summary?: string
}

const EVENT_PREFIX = 'ev'
let eventSequence = 0

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function readText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readInt(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isInteger(numeric)) return null
  return numeric
}

function inferSceneIdFromPayload(payload: unknown): string | null {
  const packet = asRecord(payload)
  if (!packet) return null
  return readText(packet.sceneId ?? packet.scene_id)
}

function inferVersionFromPayload(payload: unknown): { revision: number | null; sequence: number | null } {
  const packet = asRecord(payload)
  if (!packet) return { revision: null, sequence: null }
  return {
    revision: readInt(packet.revision),
    sequence: readInt(packet.sequence),
  }
}

function summarizeCounts(payload: unknown): string | null {
  const packet = asRecord(payload)
  if (!packet) return null
  const scene = asRecord(packet.scene)
  const patch = asRecord(packet.patch)
  const source = patch ?? scene ?? packet
  const entities = Array.isArray(source.entities) ? source.entities.length : null
  const placements = Array.isArray(source.placements) ? source.placements.length : null
  const upserts = Array.isArray(source.upserts) ? source.upserts.length : null
  const removes = Array.isArray(source.removes) ? source.removes.length : null

  if (upserts !== null || removes !== null) {
    return `upserts:${upserts ?? 0} removes:${removes ?? 0}`
  }
  if (entities !== null) {
    return `entities:${entities}`
  }
  if (placements !== null) {
    return `placements:${placements}`
  }
  return null
}

function summarizePose(payload: unknown): string | null {
  const packet = asRecord(payload)
  if (!packet) return null
  const nonZeroAxes = readInt(packet.nonZeroAxes)
  const sequence = readInt(packet.sequence)
  const fields: string[] = []
  if (sequence !== null) fields.push(`seq:${sequence}`)
  if (nonZeroAxes !== null) fields.push(`axes:${nonZeroAxes}`)
  return fields.length > 0 ? fields.join(' ') : null
}

function summarizeError(payload: unknown): string | null {
  const packet = asRecord(payload)
  if (!packet) return null
  const detail = readText(packet.details ?? packet.message ?? packet.code)
  return detail ? `error:${detail}` : null
}

export function summarizeSceneEvent(kind: string, payload: unknown): string {
  if (kind === 'bridge_pose') {
    const summary = summarizePose(payload)
    return summary ?? 'pose'
  }

  if (
    kind === 'bridge_scene_patch' ||
    kind === 'scene_patch' ||
    kind === 'bridge_scene_snapshot' ||
    kind === 'scene_snapshot' ||
    kind === 'scene_update'
  ) {
    const counts = summarizeCounts(payload)
    return counts ?? 'scene'
  }

  if (kind === 'bridge_error') {
    const summary = summarizeError(payload)
    return summary ?? 'bridge error'
  }

  if (kind === 'scene_subscribe') {
    const sceneId = inferSceneIdFromPayload(payload)
    return sceneId ? `subscribe scene:${sceneId}` : 'subscribe scene'
  }

  return kind
}

export function inferSceneEventSource(kind: string, payload: unknown, fallbackSource: string): string {
  const packet = asRecord(payload)
  const explicitSource = packet ? readText(packet.source ?? packet.specialist ?? packet.producer) : null
  if (explicitSource) return explicitSource
  if (kind === 'bridge_pose') return 'bridge.pose'
  if (kind === 'bridge_scene_patch' || kind === 'scene_patch') return 'bridge.scene_patch'
  if (kind === 'bridge_scene_snapshot' || kind === 'scene_snapshot' || kind === 'scene_update') return 'bridge.scene'
  if (kind === 'scene_subscribe') return 'frontend.scene'
  return fallbackSource
}

export function createSceneEventEntry(input: SceneEventInput): SceneEventEntry {
  const inferredVersion = inferVersionFromPayload(input.message)
  const sceneId = input.sceneId ?? inferSceneIdFromPayload(input.message) ?? null
  const sequence = input.sequence ?? inferredVersion.sequence
  const revision = input.revision ?? inferredVersion.revision
  eventSequence += 1
  return {
    at: input.at ?? new Date().toISOString(),
    id: `${EVENT_PREFIX}-${eventSequence}`,
    kind: input.kind,
    level: input.level ?? 'info',
    payload: input.message,
    revision,
    sceneId,
    sequence,
    source: input.source,
    summary: input.summary ?? summarizeSceneEvent(input.kind, input.message),
  }
}

export function pushSceneEventEntry(queue: SceneEventEntry[], entry: SceneEventEntry, limit: number): SceneEventEntry[] {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 1
  const next = [...queue, entry]
  if (next.length <= safeLimit) return next
  return next.slice(next.length - safeLimit)
}
