import { pushDeferredMessage, selectDeferredMessagesForApply, type SceneDeferredApplyMode } from './sceneDeferred'
import { isSceneRemoteVersionKnown, isSceneRemoteVersionStale, type SceneRemoteVersion } from './sceneRemoteVersion'

export type SceneSyncRemoteKind = 'scene_patch' | 'scene_snapshot'

export type SceneSyncDeferredEnvelope = {
  kind: SceneSyncRemoteKind
  message: unknown
  receivedAt: string
  revision: number | null
  sequence: number | null
}

export type SceneSyncIncomingDecision =
  | {
      type: 'apply_now'
      version: SceneRemoteVersion
    }
  | {
      queue: SceneSyncDeferredEnvelope[]
      queued: SceneSyncDeferredEnvelope
      type: 'defer'
      version: SceneRemoteVersion
    }
  | {
      type: 'ignore_stale'
      version: SceneRemoteVersion
    }

export type SceneSyncHoldTransition = {
  changed: boolean
  nextEnabled: boolean
  pendingConfirm: boolean
  shouldAutoApplyDeferred: boolean
}

function getEnvelopeVersion(entry: Pick<SceneSyncDeferredEnvelope, 'revision' | 'sequence'>): SceneRemoteVersion {
  return {
    revision: entry.revision ?? null,
    sequence: entry.sequence ?? null,
  }
}

function latestKnownDeferredVersion(queue: SceneSyncDeferredEnvelope[]): SceneRemoteVersion {
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    const version = getEnvelopeVersion(queue[index])
    if (isSceneRemoteVersionKnown(version)) return version
  }
  return {
    revision: null,
    sequence: null,
  }
}

export function decideSceneSyncIncoming(params: {
  appliedVersion: SceneRemoteVersion
  deferredQueue: SceneSyncDeferredEnvelope[]
  deferredQueueLimit: number
  hasLocalEdits: boolean
  holdRemoteEnabled: boolean
  incoming: SceneSyncDeferredEnvelope
}): SceneSyncIncomingDecision {
  const incomingVersion = getEnvelopeVersion(params.incoming)
  if (isSceneRemoteVersionStale(incomingVersion, params.appliedVersion)) {
    return {
      type: 'ignore_stale',
      version: incomingVersion,
    }
  }

  const queuedVersion = latestKnownDeferredVersion(params.deferredQueue)
  if (isSceneRemoteVersionStale(incomingVersion, queuedVersion)) {
    return {
      type: 'ignore_stale',
      version: incomingVersion,
    }
  }

  if (params.holdRemoteEnabled && params.hasLocalEdits) {
    const nextQueue = pushDeferredMessage(params.deferredQueue, params.incoming, params.deferredQueueLimit)
    return {
      queue: nextQueue,
      queued: nextQueue[nextQueue.length - 1],
      type: 'defer',
      version: incomingVersion,
    }
  }

  return {
    type: 'apply_now',
    version: incomingVersion,
  }
}

export function decideSceneRemoteHoldTransition(params: {
  currentEnabled: boolean
  deferredCount: number
  nextEnabled: boolean
  requireConfirmOnRelease: boolean
  shouldAutoApplyOnRelease: boolean
}): SceneSyncHoldTransition {
  const changed = params.currentEnabled !== params.nextEnabled
  if (!changed) {
    return {
      changed: false,
      nextEnabled: params.currentEnabled,
      pendingConfirm: false,
      shouldAutoApplyDeferred: false,
    }
  }

  if (!params.nextEnabled && params.deferredCount > 0 && params.shouldAutoApplyOnRelease) {
    if (params.requireConfirmOnRelease) {
      return {
        changed: true,
        nextEnabled: false,
        pendingConfirm: true,
        shouldAutoApplyDeferred: false,
      }
    }
    return {
      changed: true,
      nextEnabled: false,
      pendingConfirm: false,
      shouldAutoApplyDeferred: true,
    }
  }

  return {
    changed: true,
    nextEnabled: params.nextEnabled,
    pendingConfirm: false,
    shouldAutoApplyDeferred: false,
  }
}

export function selectSceneDeferredEntriesForApply(params: {
  appliedVersion: SceneRemoteVersion
  mode: SceneDeferredApplyMode
  queue: SceneSyncDeferredEnvelope[]
}): {
  droppedAsStale: number
  entries: SceneSyncDeferredEnvelope[]
} {
  const selected = selectDeferredMessagesForApply(params.queue, params.mode)
  if (selected.length === 0) {
    return {
      droppedAsStale: 0,
      entries: [],
    }
  }

  let droppedAsStale = 0
  const entries: SceneSyncDeferredEnvelope[] = []
  for (const entry of selected) {
    const version = getEnvelopeVersion(entry)
    if (isSceneRemoteVersionStale(version, params.appliedVersion)) {
      droppedAsStale += 1
      continue
    }
    entries.push(entry)
  }

  return {
    droppedAsStale,
    entries,
  }
}
