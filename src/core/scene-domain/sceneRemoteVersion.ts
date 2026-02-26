export type SceneRemoteVersion = {
  revision: number | null
  sequence: number | null
}

function compareIntegers(a: number | null, b: number | null): -1 | 0 | 1 | null {
  if (typeof a !== 'number' || typeof b !== 'number') return null
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function isSceneRemoteVersionKnown(version: SceneRemoteVersion): boolean {
  return Number.isInteger(version.sequence) || Number.isInteger(version.revision)
}

export function isSceneRemoteVersionStale(incoming: SceneRemoteVersion, baseline: SceneRemoteVersion): boolean {
  const bySequence = compareIntegers(incoming.sequence, baseline.sequence)
  if (bySequence !== null) return bySequence <= 0

  const byRevision = compareIntegers(incoming.revision, baseline.revision)
  if (byRevision !== null) return byRevision <= 0

  return false
}

export function mergeSceneRemoteVersion(
  previous: SceneRemoteVersion,
  incoming: SceneRemoteVersion,
): SceneRemoteVersion {
  return {
    revision: Number.isInteger(incoming.revision) ? incoming.revision : previous.revision,
    sequence: Number.isInteger(incoming.sequence) ? incoming.sequence : previous.sequence,
  }
}
