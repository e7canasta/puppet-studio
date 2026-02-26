import { create } from 'zustand'

import {
  applyScenePatchFromBridge,
  type CameraDetectionOverlay,
  clonePlacements,
  DEFAULT_PLANOGRAM,
  type MonitoringCameraDefinition,
  parseSceneSnapshotFromBridge,
  type SceneSpecialistMeta,
} from '../../core/planogram-domain'
import type { Placement, RoomDefinition } from '../../core/planogram-domain'
import { clampAxis, createDefaultPose } from '../../poseControls'
import type { AxisKey, PartKey, PoseControls } from '../../poseControls'
import type { SceneCommand } from '../../core/scene-domain/sceneCommands'
import {
  dispatchSceneEngineCommand,
  type SceneEngineCommand,
  type SceneEngineCommandMeta,
  type SceneEngineDomainEvent,
  type SceneEngineEffect,
  type SceneHistoryEntry,
  type SceneEngineResult,
} from '../../core/scene-domain/sceneEngine'
import {
  decideSceneRemoteHoldTransition,
  decideSceneSyncIncoming,
  selectSceneDeferredEntriesForApply,
  type SceneSyncDeferredEnvelope,
  type SceneSyncRemoteKind,
} from '../../core/scene-domain/sceneSyncEngine'
import {
  isSceneRemoteVersionStale,
  mergeSceneRemoteVersion,
  type SceneRemoteVersion,
} from '../../core/scene-domain/sceneRemoteVersion'
import { sendBridgePayload } from '../../core/bridge-runtime/bridgeOutbound'
import { runtimeConfig } from '../../core/config/runtimeConfig'
import {
  createSceneEventEntry,
  pushSceneEventEntry,
  type SceneEventEntry,
  type SceneEventInput,
} from '../../core/observability/sceneEventLog'
import { buildScenePatchFromPlacements } from '../../core/scene-domain/scenePatch'

type BridgeStatus = 'disconnected' | 'connecting' | 'connected'
type CameraView = 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
type ToolMode = 'move' | 'rotate' | 'select'
type SceneSource = 'default' | 'scene' | 'local_edit'
type SceneRemoteOverrideKind = SceneSyncRemoteKind
type DeferredSceneMessage = SceneSyncDeferredEnvelope
type ProjectionMode = 'orthographic' | 'perspective'
type ViewportCameraQuaternion = [number, number, number, number]
type ParsedSceneMessage = NonNullable<ReturnType<typeof applyScenePatchFromBridge>>

type PoseState = {
  avatarObjectId: string | null
  avatarPlanPositionM: [number, number]
  avatarRotationDeg: number
  avatarTrackId: string | null
  cameraOverlayFlipX: boolean
  cameraOverlayFlipY: boolean
  pose: PoseControls
  bridgeEnabled: boolean
  bridgeError: string | null
  bridgeLastPoseAt: string | null
  bridgeNonZeroAxes: number | null
  bridgeSequence: number | null
  bridgeStatus: BridgeStatus
  bridgeUrl: string
  cameraDetectionOverlays: CameraDetectionOverlay[]
  cameraView: CameraView
  viewportCameraQuaternion: ViewportCameraQuaternion
  monitoringCameras: MonitoringCameraDefinition[]
  projectionMode: ProjectionMode
  showDimensions: boolean
  sceneError: string | null
  sceneEditEnabled: boolean
  sceneDeferredApplyPendingConfirm: boolean
  sceneDeferredRemoteCount: number
  sceneDeferredRemoteLastAt: string | null
  sceneDeferredRemoteLastKind: SceneRemoteOverrideKind | null
  sceneDeferredRemoteQueue: DeferredSceneMessage[]
  sceneEventAutoScroll: boolean
  sceneEventDroppedWhilePaused: number
  sceneEventLog: SceneEventEntry[]
  sceneEventLogPaused: boolean
  sceneEventTerminalOpen: boolean
  sceneLastEventAt: string | null
  sceneLastAppliedRemoteRevision: number | null
  sceneLastAppliedRemoteSequence: number | null
  scenePlacements: Placement[]
  sceneRevision: number | null
  sceneRemoteOverrideAt: string | null
  sceneRemoteHoldEnabled: boolean
  sceneRemoteOverrideKind: SceneRemoteOverrideKind | null
  sceneRoom: RoomDefinition
  sceneSequence: number | null
  sceneSource: SceneSource
  sceneId: string
  sceneSpecialistGeneratedAt: string | null
  sceneSpecialistSource: string | null
  sceneSpatialAgeS: number | null
  sceneSpatialFresh: boolean | null
  sceneSpatialStaleAfterS: number | null
  sceneSpatialStalePolicy: string | null
  sceneRedoDepth: number
  sceneRedoStack: SceneHistoryEntry[]
  sceneUndoDepth: number
  sceneUndoStack: SceneHistoryEntry[]
  selectedMonitoringCameraId: string | null
  selectedPlacementId: string | null
  topQuarterTurns: 0 | 1 | 2 | 3
  activeToolMode: ToolMode
  applyScenePatch: (message: unknown) => void
  applySceneSnapshot: (message: unknown) => void
  applyDeferredSceneRemote: () => void
  clearScene: (commandMeta?: SceneEngineCommandMeta) => void
  clearSceneDeferredRemote: () => void
  clearSceneEventLog: () => void
  clearSceneRemoteOverride: () => void
  appendSceneEvent: (event: SceneEventInput) => void
  runSceneCommand: (command: SceneCommand, commandMeta?: SceneEngineCommandMeta) => void
  nudgeSelectedPlacement: (deltaXM: number, deltaZM: number) => void
  rotateSelectedPlacement: (deltaDeg: number) => void
  snapSelectedPlacementToGrid: (stepM: number) => void
  redoSceneEdit: (commandMeta?: SceneEngineCommandMeta) => void
  undoSceneEdit: (commandMeta?: SceneEngineCommandMeta) => void
  applyPoseSnapshot: (payload: unknown) => void
  setProjectionMode: (mode: ProjectionMode) => void
  setActiveToolMode: (mode: ToolMode) => void
  setCameraOverlayFlip: (axis: 'x' | 'y', enabled: boolean) => void
  setSceneId: (sceneId: string) => void
  setSceneEditEnabled: (enabled: boolean) => void
  setSceneEventAutoScroll: (enabled: boolean) => void
  setSceneEventLogPaused: (enabled: boolean) => void
  setSceneEventTerminalOpen: (enabled: boolean) => void
  setSceneRemoteHoldEnabled: (enabled: boolean) => void
  setSelectedMonitoringCameraId: (cameraId: string | null) => void
  setSelectedPlacementId: (placementId: string | null) => void
  setShowDimensions: (show: boolean) => void
  toggleSceneEdit: () => void
  toggleSceneEventTerminal: () => void
  toggleSceneRemoteHold: () => void
  setCameraView: (view: CameraView) => void
  setViewportCameraQuaternion: (quaternion: ViewportCameraQuaternion) => void
  rotateTopView: (direction: -1 | 1) => void
  setBridgeEnabled: (enabled: boolean) => void
  setBridgeError: (error: string | null) => void
  setBridgeMeta: (meta: { nonZeroAxes?: number | null; receivedAt?: string | null; sequence?: number | null }) => void
  setBridgeStatus: (status: BridgeStatus) => void
  setBridgeUrl: (url: string) => void
  resetPose: () => void
  resetCameraOverlayFlip: () => void
  setAxis: (part: PartKey, axis: AxisKey, value: number) => void
}

function cloneRoom(room: RoomDefinition): RoomDefinition {
  return {
    depthM: room.depthM,
    heightM: room.heightM,
    wallThicknessM: room.wallThicknessM,
    widthM: room.widthM,
  }
}

function normalizeQuarterTurns(value: number): 0 | 1 | 2 | 3 {
  return (((value % 4) + 4) % 4) as 0 | 1 | 2 | 3
}

function normalizeSceneId(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : 'scene-1'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function mergeSpecialistMeta(
  current: {
    sceneSpecialistGeneratedAt: string | null
    sceneSpecialistSource: string | null
    sceneSpatialAgeS: number | null
    sceneSpatialFresh: boolean | null
    sceneSpatialStaleAfterS: number | null
    sceneSpatialStalePolicy: string | null
  },
  meta: SceneSpecialistMeta | null,
) {
  if (!meta) return current
  return {
    sceneSpecialistGeneratedAt: meta.generatedAt ?? current.sceneSpecialistGeneratedAt,
    sceneSpecialistSource: meta.source ?? current.sceneSpecialistSource,
    sceneSpatialAgeS: meta.spatialAgeS ?? current.sceneSpatialAgeS,
    sceneSpatialFresh: meta.spatialFresh ?? current.sceneSpatialFresh,
    sceneSpatialStaleAfterS: meta.spatialStaleAfterS ?? current.sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy: meta.stalePolicy ?? current.sceneSpatialStalePolicy,
  }
}

function parseSceneMessage(
  kind: SceneRemoteOverrideKind,
  message: unknown,
  base: { placements: Placement[]; room: RoomDefinition },
  baseAvatar: { objectId: string | null; planPositionM: [number, number]; rotationDeg: number; trackId: string | null } | null,
): ParsedSceneMessage | null {
  if (kind === 'scene_patch') {
    return applyScenePatchFromBridge(message, base, baseAvatar)
  }
  return parseSceneSnapshotFromBridge(message, base, baseAvatar)
}

function parseIdentity(payload: Record<string, unknown>): { objectId: string | null; trackId: string | null } {
  const trackCandidate = payload.trackId ?? payload.track_id ?? payload.characterTrackId ?? payload.character_track_id
  const objectCandidate = payload.objectId ?? payload.object_id ?? payload.characterObjectId ?? payload.character_object_id
  const trackId = typeof trackCandidate === 'string' ? trackCandidate : null
  const objectId = typeof objectCandidate === 'string' ? objectCandidate : null
  return { objectId, trackId }
}

function reduceSceneEventAppend(state: PoseState, event: SceneEventInput): Partial<PoseState> {
  if (state.sceneEventLogPaused) {
    return {
      sceneEventDroppedWhilePaused: state.sceneEventDroppedWhilePaused + 1,
    }
  }
  const entry = createSceneEventEntry(event)
  return {
    sceneEventLog: pushSceneEventEntry(state.sceneEventLog, entry, runtimeConfig.sceneEventLogLimit),
  }
}

function hasLocalSceneEdits(state: Pick<PoseState, 'sceneSource' | 'sceneUndoStack' | 'sceneRedoStack'>): boolean {
  return state.sceneSource === 'local_edit' || state.sceneUndoStack.length > 0 || state.sceneRedoStack.length > 0
}

function createDeferredEnvelope(
  kind: SceneRemoteOverrideKind,
  message: unknown,
  parsed: Pick<ParsedSceneMessage, 'receivedAt' | 'revision' | 'sequence'>,
): DeferredSceneMessage {
  return {
    kind,
    message,
    receivedAt: parsed.receivedAt,
    revision: parsed.revision ?? null,
    sequence: parsed.sequence ?? null,
  }
}

function getRemoteVersionFromParsed(parsed: Pick<ParsedSceneMessage, 'revision' | 'sequence'>): SceneRemoteVersion {
  return {
    revision: parsed.revision ?? null,
    sequence: parsed.sequence ?? null,
  }
}

function getAppliedRemoteVersion(state: Pick<PoseState, 'sceneLastAppliedRemoteRevision' | 'sceneLastAppliedRemoteSequence'>): SceneRemoteVersion {
  return {
    revision: state.sceneLastAppliedRemoteRevision,
    sequence: state.sceneLastAppliedRemoteSequence,
  }
}

function reduceAppliedRemoteScene(
  state: PoseState,
  parsed: ParsedSceneMessage,
  kind: SceneRemoteOverrideKind,
  overwrittenLocalEdit: boolean,
): Partial<PoseState> {
  const selectedPlacementId =
    state.selectedPlacementId && parsed.placements.some((placement) => placement.id === state.selectedPlacementId)
      ? state.selectedPlacementId
      : null
  const specialistMeta = mergeSpecialistMeta(
    {
      sceneSpecialistGeneratedAt: state.sceneSpecialistGeneratedAt,
      sceneSpecialistSource: state.sceneSpecialistSource,
      sceneSpatialAgeS: state.sceneSpatialAgeS,
      sceneSpatialFresh: state.sceneSpatialFresh,
      sceneSpatialStaleAfterS: state.sceneSpatialStaleAfterS,
      sceneSpatialStalePolicy: state.sceneSpatialStalePolicy,
    },
    parsed.specialistMeta,
  )

  return {
    avatarObjectId: parsed.avatar?.objectId ?? null,
    avatarPlanPositionM: parsed.avatar?.planPositionM ?? [0, 0],
    avatarRotationDeg: parsed.avatar?.rotationDeg ?? 0,
    avatarTrackId: parsed.avatar?.trackId ?? null,
    cameraDetectionOverlays: parsed.cameraDetectionOverlays ?? state.cameraDetectionOverlays,
    monitoringCameras: parsed.monitoringCameras ?? state.monitoringCameras,
    sceneError: null,
    sceneDeferredApplyPendingConfirm: false,
    sceneDeferredRemoteCount: 0,
    sceneDeferredRemoteLastAt: null,
    sceneDeferredRemoteLastKind: null,
    sceneDeferredRemoteQueue: [],
    sceneLastEventAt: parsed.receivedAt,
    sceneLastAppliedRemoteRevision: Number.isInteger(parsed.revision) ? parsed.revision : state.sceneLastAppliedRemoteRevision,
    sceneLastAppliedRemoteSequence: Number.isInteger(parsed.sequence) ? parsed.sequence : state.sceneLastAppliedRemoteSequence,
    scenePlacements: parsed.placements,
    sceneRemoteOverrideAt: overwrittenLocalEdit ? parsed.receivedAt : state.sceneRemoteOverrideAt,
    sceneRemoteOverrideKind: overwrittenLocalEdit ? kind : state.sceneRemoteOverrideKind,
    sceneRevision: parsed.revision ?? (state.sceneRevision ?? 0) + 1,
    sceneRoom: parsed.room,
    sceneSequence: parsed.sequence ?? state.sceneSequence,
    sceneSource: 'scene',
    sceneRedoDepth: 0,
    sceneRedoStack: [],
    sceneUndoDepth: 0,
    sceneUndoStack: [],
    sceneId: parsed.sceneId ?? state.sceneId,
    ...specialistMeta,
    selectedMonitoringCameraId:
      state.selectedMonitoringCameraId &&
      (parsed.monitoringCameras ?? state.monitoringCameras).some((camera) => camera.id === state.selectedMonitoringCameraId)
        ? state.selectedMonitoringCameraId
        : (parsed.monitoringCameras ?? state.monitoringCameras)[0]?.id ?? null,
    selectedPlacementId,
  }
}

function reduceDeferredSceneRemoteApply(state: PoseState): Partial<PoseState> | PoseState {
  if (state.sceneDeferredRemoteQueue.length === 0) {
    return {
      sceneDeferredApplyPendingConfirm: false,
    }
  }

  const selection = selectSceneDeferredEntriesForApply({
    appliedVersion: getAppliedRemoteVersion(state),
    mode: runtimeConfig.sceneDeferredApplyMode,
    queue: state.sceneDeferredRemoteQueue,
  })
  const entriesToApply = selection.entries
  if (entriesToApply.length === 0 && selection.droppedAsStale > 0) {
    return {
      sceneDeferredApplyPendingConfirm: false,
      sceneDeferredRemoteCount: 0,
      sceneDeferredRemoteLastAt: null,
      sceneDeferredRemoteLastKind: null,
      sceneDeferredRemoteQueue: [],
      sceneError: null,
    }
  }
  if (entriesToApply.length === 0) return state

  let fallbackPlacements = state.scenePlacements
  let fallbackRoom = state.sceneRoom
  let fallbackAvatar = {
    objectId: state.avatarObjectId,
    planPositionM: [state.avatarPlanPositionM[0], state.avatarPlanPositionM[1]] as [number, number],
    rotationDeg: state.avatarRotationDeg,
    trackId: state.avatarTrackId,
  }

  let latestVersion = getAppliedRemoteVersion(state)
  let finalParsed: ParsedSceneMessage | null = null
  let finalKind: SceneRemoteOverrideKind = 'scene_patch'
  let sawValidParsed = false

  for (const entry of entriesToApply) {
    const parsed = parseSceneMessage(
      entry.kind,
      entry.message,
      {
        placements: fallbackPlacements,
        room: fallbackRoom,
      },
      fallbackAvatar,
    )
    if (!parsed) continue
    sawValidParsed = true

    const incomingVersion = getRemoteVersionFromParsed(parsed)
    if (isSceneRemoteVersionStale(incomingVersion, latestVersion)) {
      continue
    }

    fallbackPlacements = parsed.placements
    fallbackRoom = parsed.room
    fallbackAvatar = {
      objectId: parsed.avatar?.objectId ?? null,
      planPositionM: parsed.avatar?.planPositionM ?? [0, 0],
      rotationDeg: parsed.avatar?.rotationDeg ?? 0,
      trackId: parsed.avatar?.trackId ?? null,
    }
    latestVersion = mergeSceneRemoteVersion(latestVersion, incomingVersion)
    finalParsed = parsed
    finalKind = entry.kind
  }

  if (!finalParsed) {
    return {
      sceneDeferredApplyPendingConfirm: false,
      sceneDeferredRemoteCount: 0,
      sceneDeferredRemoteLastAt: null,
      sceneDeferredRemoteLastKind: null,
      sceneDeferredRemoteQueue: [],
      sceneError: sawValidParsed ? null : 'deferred remote queue invalida',
    }
  }

  const overwrittenLocalEdit = hasLocalSceneEdits(state)
  return reduceAppliedRemoteScene(state, finalParsed, finalKind, overwrittenLocalEdit)
}

function publishScenePlacementDiff(
  sceneId: string,
  previous: Placement[],
  next: Placement[],
  commandMeta: SceneEngineCommandMeta | null,
) {
  if (!runtimeConfig.publishLocalSceneCommands) return
  const patch = buildScenePatchFromPlacements(previous, next)
  if (!patch) return
  sendBridgePayload({
    commandAt: commandMeta?.at,
    commandId: commandMeta?.commandId,
    correlationId: commandMeta?.correlationId,
    kind: 'scene_patch',
    sceneId,
    source: commandMeta?.source,
    patch,
  })
}

function reduceSceneEngineCommand(
  state: PoseState,
  command: SceneEngineCommand,
): SceneEngineResult<PoseState> {
  return dispatchSceneEngineCommand(state, command, {
    constraints: runtimeConfig.sceneConstraintZones,
    undoLimit: runtimeConfig.sceneUndoLimit,
  })
}

function applySceneEngineEffect(effect: SceneEngineEffect | null) {
  if (!effect) return
  publishScenePlacementDiff(effect.sceneId, effect.previousPlacements, effect.nextPlacements, effect.commandMeta)
}

function appendSceneEngineEvents(events: SceneEngineDomainEvent[]) {
  if (events.length === 0) return
  const state = usePoseStore.getState()
  for (const event of events) {
    const level =
      event.kind === 'scene_engine_rejected' ? 'warn' : event.kind === 'scene_engine_noop' ? 'debug' : 'info'
    const summary =
      event.kind === 'scene_engine_rejected'
        ? `${event.command} rejected (${event.reason})`
        : event.kind === 'scene_engine_noop'
          ? `${event.command} noop`
          : `${event.command} applied`
    state.appendSceneEvent({
      kind: event.kind,
      level,
      message: event,
      revision: state.sceneRevision,
      sceneId: state.sceneId,
      sequence: state.sceneSequence,
      source: 'frontend.scene_engine',
      summary,
    })
  }
}

function reduceSceneRemoteHoldEnabled(
  state: PoseState,
  enabled: boolean,
): { shouldApplyDeferredNow: boolean; value: Partial<PoseState> | PoseState } {
  const transition = decideSceneRemoteHoldTransition({
    currentEnabled: state.sceneRemoteHoldEnabled,
    deferredCount: state.sceneDeferredRemoteQueue.length,
    nextEnabled: enabled,
    requireConfirmOnRelease: runtimeConfig.sceneDeferredRequireConfirmOnRelease,
    shouldAutoApplyOnRelease: runtimeConfig.sceneDeferredAutoApplyOnRelease,
  })

  if (!transition.changed) {
    return {
      shouldApplyDeferredNow: false,
      value: state,
    }
  }

  return {
    shouldApplyDeferredNow: transition.shouldAutoApplyDeferred,
    value: {
      sceneDeferredApplyPendingConfirm: transition.pendingConfirm,
      sceneRemoteHoldEnabled: transition.nextEnabled,
    },
  }
}

export const usePoseStore = create<PoseState>((set) => ({
  avatarObjectId: null,
  avatarPlanPositionM: [0, 0],
  avatarRotationDeg: 0,
  avatarTrackId: null,
  cameraOverlayFlipX: false,
  cameraOverlayFlipY: false,
  pose: createDefaultPose(),
  bridgeEnabled: true,
  bridgeError: null,
  bridgeLastPoseAt: null,
  bridgeNonZeroAxes: null,
  bridgeSequence: null,
  bridgeStatus: 'disconnected',
  bridgeUrl: 'ws://localhost:8765',
  cameraDetectionOverlays: [],
  cameraView: 'iso',
  viewportCameraQuaternion: [0, 0, 0, 1],
  monitoringCameras: [],
  projectionMode: 'orthographic',
  showDimensions: true,
  sceneError: null,
  sceneEditEnabled: runtimeConfig.defaultSceneEditEnabled,
  sceneDeferredApplyPendingConfirm: false,
  sceneDeferredRemoteCount: 0,
  sceneDeferredRemoteLastAt: null,
  sceneDeferredRemoteLastKind: null,
  sceneDeferredRemoteQueue: [],
  sceneEventAutoScroll: true,
  sceneEventDroppedWhilePaused: 0,
  sceneEventLog: [],
  sceneEventLogPaused: false,
  sceneEventTerminalOpen: runtimeConfig.defaultSceneEventTerminalOpen,
  sceneLastEventAt: null,
  sceneLastAppliedRemoteRevision: null,
  sceneLastAppliedRemoteSequence: null,
  scenePlacements: clonePlacements(DEFAULT_PLANOGRAM.placements),
  sceneRevision: null,
  sceneRemoteHoldEnabled: false,
  sceneRemoteOverrideAt: null,
  sceneRemoteOverrideKind: null,
  sceneRoom: cloneRoom(DEFAULT_PLANOGRAM.room),
  sceneSequence: null,
  sceneSource: 'default',
  sceneId: 'scene-1',
  sceneSpecialistGeneratedAt: null,
  sceneSpecialistSource: null,
  sceneSpatialAgeS: null,
  sceneSpatialFresh: null,
  sceneSpatialStaleAfterS: null,
  sceneSpatialStalePolicy: null,
  sceneRedoDepth: 0,
  sceneRedoStack: [],
  sceneUndoDepth: 0,
  sceneUndoStack: [],
  selectedMonitoringCameraId: null,
  selectedPlacementId: null,
  topQuarterTurns: 0,
  activeToolMode: 'select',
  applyScenePatch: (message) => {
    let ignoredStale = false
    let ignoredStaleRevision: number | null = null
    let ignoredStaleSequence: number | null = null
    let deferredQueued = false
    let deferredQueuedSize = 0
    let deferredQueuedRevision: number | null = null
    let deferredQueuedSequence: number | null = null
    set((state) => {
      const parsed = parseSceneMessage(
        'scene_patch',
        message,
        {
          placements: state.scenePlacements,
          room: state.sceneRoom,
        },
        {
          objectId: state.avatarObjectId,
          planPositionM: [state.avatarPlanPositionM[0], state.avatarPlanPositionM[1]],
          rotationDeg: state.avatarRotationDeg,
          trackId: state.avatarTrackId,
        },
      )
      if (!parsed) return { sceneError: 'scene_patch invalido' }
      const decision = decideSceneSyncIncoming({
        appliedVersion: getAppliedRemoteVersion(state),
        deferredQueue: state.sceneDeferredRemoteQueue,
        deferredQueueLimit: runtimeConfig.sceneDeferredQueueLimit,
        hasLocalEdits: hasLocalSceneEdits(state),
        holdRemoteEnabled: state.sceneRemoteHoldEnabled,
        incoming: createDeferredEnvelope('scene_patch', message, parsed),
      })
      if (decision.type === 'ignore_stale') {
        ignoredStale = true
        ignoredStaleRevision = decision.version.revision
        ignoredStaleSequence = decision.version.sequence
        return state
      }
      if (decision.type === 'defer') {
        deferredQueued = true
        deferredQueuedSize = decision.queue.length
        deferredQueuedRevision = decision.queued.revision
        deferredQueuedSequence = decision.queued.sequence
        return {
          sceneDeferredApplyPendingConfirm: false,
          sceneDeferredRemoteCount: decision.queue.length,
          sceneDeferredRemoteLastAt: decision.queued.receivedAt,
          sceneDeferredRemoteLastKind: decision.queued.kind,
          sceneDeferredRemoteQueue: decision.queue,
        }
      }
      const overwrittenLocalEdit = hasLocalSceneEdits(state)
      return reduceAppliedRemoteScene(state, parsed, 'scene_patch', overwrittenLocalEdit)
    })
    if (ignoredStale) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_patch_ignored_stale',
        level: 'debug',
        message,
        revision: ignoredStaleRevision,
        sequence: ignoredStaleSequence,
        source: 'frontend.scene_sync',
        summary: `ignored stale patch seq:${ignoredStaleSequence ?? '-'} rev:${ignoredStaleRevision ?? '-'}`,
      })
    }
    if (deferredQueued) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_patch_deferred',
        level: 'info',
        message,
        revision: deferredQueuedRevision,
        sequence: deferredQueuedSequence,
        source: 'frontend.scene_sync',
        summary: `deferred patch queue:${deferredQueuedSize}`,
      })
    }
  },
  applySceneSnapshot: (message) => {
    let ignoredStale = false
    let ignoredStaleRevision: number | null = null
    let ignoredStaleSequence: number | null = null
    let deferredQueued = false
    let deferredQueuedSize = 0
    let deferredQueuedRevision: number | null = null
    let deferredQueuedSequence: number | null = null
    set((state) => {
      const parsed = parseSceneMessage(
        'scene_snapshot',
        message,
        {
          placements: state.scenePlacements,
          room: state.sceneRoom,
        },
        {
          objectId: state.avatarObjectId,
          planPositionM: [state.avatarPlanPositionM[0], state.avatarPlanPositionM[1]],
          rotationDeg: state.avatarRotationDeg,
          trackId: state.avatarTrackId,
        },
      )
      if (!parsed) return { sceneError: 'scene_snapshot invalido' }
      const decision = decideSceneSyncIncoming({
        appliedVersion: getAppliedRemoteVersion(state),
        deferredQueue: state.sceneDeferredRemoteQueue,
        deferredQueueLimit: runtimeConfig.sceneDeferredQueueLimit,
        hasLocalEdits: hasLocalSceneEdits(state),
        holdRemoteEnabled: state.sceneRemoteHoldEnabled,
        incoming: createDeferredEnvelope('scene_snapshot', message, parsed),
      })
      if (decision.type === 'ignore_stale') {
        ignoredStale = true
        ignoredStaleRevision = decision.version.revision
        ignoredStaleSequence = decision.version.sequence
        return state
      }
      if (decision.type === 'defer') {
        deferredQueued = true
        deferredQueuedSize = decision.queue.length
        deferredQueuedRevision = decision.queued.revision
        deferredQueuedSequence = decision.queued.sequence
        return {
          sceneDeferredApplyPendingConfirm: false,
          sceneDeferredRemoteCount: decision.queue.length,
          sceneDeferredRemoteLastAt: decision.queued.receivedAt,
          sceneDeferredRemoteLastKind: decision.queued.kind,
          sceneDeferredRemoteQueue: decision.queue,
        }
      }
      const overwrittenLocalEdit = hasLocalSceneEdits(state)
      return reduceAppliedRemoteScene(state, parsed, 'scene_snapshot', overwrittenLocalEdit)
    })
    if (ignoredStale) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_snapshot_ignored_stale',
        level: 'debug',
        message,
        revision: ignoredStaleRevision,
        sequence: ignoredStaleSequence,
        source: 'frontend.scene_sync',
        summary: `ignored stale snapshot seq:${ignoredStaleSequence ?? '-'} rev:${ignoredStaleRevision ?? '-'}`,
      })
    }
    if (deferredQueued) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_snapshot_deferred',
        level: 'info',
        message,
        revision: deferredQueuedRevision,
        sequence: deferredQueuedSequence,
        source: 'frontend.scene_sync',
        summary: `deferred snapshot queue:${deferredQueuedSize}`,
      })
    }
  },
  applyDeferredSceneRemote: () => {
    const stateBefore = usePoseStore.getState()
    const deferredCountBefore = stateBefore.sceneDeferredRemoteQueue.length
    set((state) => reduceDeferredSceneRemoteApply(state))
    const stateAfter = usePoseStore.getState()
    if (deferredCountBefore <= 0) return
    const appliedCount = Math.max(0, deferredCountBefore - stateAfter.sceneDeferredRemoteQueue.length)
    const hadError = Boolean(stateAfter.sceneError && stateAfter.sceneError.includes('deferred'))
    usePoseStore.getState().appendSceneEvent({
      kind: 'scene_deferred_apply',
      level: hadError ? 'warn' : 'info',
      revision: stateAfter.sceneRevision,
      sceneId: stateAfter.sceneId,
      sequence: stateAfter.sceneSequence,
      source: 'frontend.scene_sync',
      summary: hadError
        ? `deferred apply error after:${deferredCountBefore}`
        : `deferred apply before:${deferredCountBefore} applied:${appliedCount}`,
    })
  },
  clearScene: (commandMeta) => {
    let effect: SceneEngineEffect | null = null
    let events: SceneEngineDomainEvent[] = []
    set((state) => {
      const reduced = reduceSceneEngineCommand(state, { kind: 'clear_scene', meta: commandMeta })
      effect = reduced.effect
      events = reduced.events
      return reduced.nextState
    })
    applySceneEngineEffect(effect)
    appendSceneEngineEvents(events)
  },
  clearSceneDeferredRemote: () => {
    set({
      sceneDeferredApplyPendingConfirm: false,
      sceneDeferredRemoteCount: 0,
      sceneDeferredRemoteLastAt: null,
      sceneDeferredRemoteLastKind: null,
      sceneDeferredRemoteQueue: [],
    })
  },
  clearSceneEventLog: () => {
    set({
      sceneEventDroppedWhilePaused: 0,
      sceneEventLog: [],
    })
  },
  clearSceneRemoteOverride: () => {
    set({
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
    })
  },
  appendSceneEvent: (event) => {
    set((state) => reduceSceneEventAppend(state, event))
  },
  runSceneCommand: (command, commandMeta) => {
    let effect: SceneEngineEffect | null = null
    let events: SceneEngineDomainEvent[] = []
    set((state) => {
      const reduced = reduceSceneEngineCommand(state, { kind: 'run_scene_command', meta: commandMeta, payload: command })
      effect = reduced.effect
      events = reduced.events
      return reduced.nextState
    })
    applySceneEngineEffect(effect)
    appendSceneEngineEvents(events)
  },
  nudgeSelectedPlacement: (deltaXM, deltaZM) => {
    usePoseStore.getState().runSceneCommand({ kind: 'move_selected_by', deltaM: [deltaXM, deltaZM] })
  },
  rotateSelectedPlacement: (deltaDeg) => {
    usePoseStore.getState().runSceneCommand({ kind: 'rotate_selected_by', deltaDeg })
  },
  snapSelectedPlacementToGrid: (stepM) => {
    usePoseStore.getState().runSceneCommand({ kind: 'snap_selected_to_grid', stepM })
  },
  undoSceneEdit: (commandMeta) => {
    let effect: SceneEngineEffect | null = null
    let events: SceneEngineDomainEvent[] = []
    set((state) => {
      const reduced = reduceSceneEngineCommand(state, { kind: 'undo', meta: commandMeta })
      effect = reduced.effect
      events = reduced.events
      return reduced.nextState
    })
    applySceneEngineEffect(effect)
    appendSceneEngineEvents(events)
  },
  redoSceneEdit: (commandMeta) => {
    let effect: SceneEngineEffect | null = null
    let events: SceneEngineDomainEvent[] = []
    set((state) => {
      const reduced = reduceSceneEngineCommand(state, { kind: 'redo', meta: commandMeta })
      effect = reduced.effect
      events = reduced.events
      return reduced.nextState
    })
    applySceneEngineEffect(effect)
    appendSceneEngineEvents(events)
  },
  applyPoseSnapshot: (payload) => {
    const packet = asRecord(payload)
    const joints = packet ? packet.joints ?? payload : payload
    if (!joints || typeof joints !== 'object') return

    const { objectId: packetObjectId, trackId: packetTrackId } = packet ? parseIdentity(packet) : { objectId: null, trackId: null }

    set((state) => {
      if (packetTrackId && state.avatarTrackId && packetTrackId !== state.avatarTrackId) {
        return state
      }

      const nextPose: PoseControls = { ...state.pose }
      let changed = false

      for (const part of Object.keys(state.pose) as PartKey[]) {
        const joint = (joints as Record<string, unknown>)[part]
        if (!joint || typeof joint !== 'object') continue

        const x = clampAxis(part, 'x', Number((joint as { x?: number }).x ?? state.pose[part].x))
        const y = clampAxis(part, 'y', Number((joint as { y?: number }).y ?? state.pose[part].y))
        const z = clampAxis(part, 'z', Number((joint as { z?: number }).z ?? state.pose[part].z))

        if (x === state.pose[part].x && y === state.pose[part].y && z === state.pose[part].z) continue
        nextPose[part] = { x, y, z }
        changed = true
      }

      const identityChanged =
        (packetTrackId && packetTrackId !== state.avatarTrackId) || (packetObjectId && packetObjectId !== state.avatarObjectId)

      if (!changed && !identityChanged) return state

      return {
        avatarObjectId: packetObjectId ?? state.avatarObjectId,
        avatarTrackId: packetTrackId ?? state.avatarTrackId,
        pose: changed ? nextPose : state.pose,
      }
    })
  },
  setSceneId: (sceneId) => {
    set({ sceneId: normalizeSceneId(sceneId) })
  },
  setSceneEditEnabled: (enabled) => {
    set((state) => ({
      sceneEditEnabled: enabled,
      sceneError: enabled && state.sceneError === 'edicion local deshabilitada' ? null : state.sceneError,
    }))
  },
  setSceneEventAutoScroll: (enabled) => {
    set({ sceneEventAutoScroll: enabled })
  },
  setSceneEventLogPaused: (enabled) => {
    set((state) => {
      if (state.sceneEventLogPaused === enabled) return state
      if (enabled) return { sceneEventLogPaused: true }

      if (state.sceneEventDroppedWhilePaused <= 0) {
        return {
          sceneEventLogPaused: false,
        }
      }

      const resumeEntry = createSceneEventEntry({
        kind: 'event_log_resume',
        level: 'warn',
        source: 'frontend.terminal',
        summary: `dropped while paused: ${state.sceneEventDroppedWhilePaused}`,
      })
      return {
        sceneEventDroppedWhilePaused: 0,
        sceneEventLog: pushSceneEventEntry(state.sceneEventLog, resumeEntry, runtimeConfig.sceneEventLogLimit),
        sceneEventLogPaused: false,
      }
    })
  },
  setSceneEventTerminalOpen: (enabled) => {
    set({ sceneEventTerminalOpen: enabled })
  },
  setSceneRemoteHoldEnabled: (enabled) => {
    let shouldApplyDeferredNow = false
    let holdChanged = false
    set((state) => {
      const reduced = reduceSceneRemoteHoldEnabled(state, enabled)
      shouldApplyDeferredNow = reduced.shouldApplyDeferredNow
      holdChanged = state.sceneRemoteHoldEnabled !== enabled
      return reduced.value
    })
    if (holdChanged) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_remote_hold_toggle',
        level: 'info',
        source: 'frontend.scene_sync',
        summary: `remote hold ${enabled ? 'enabled' : 'disabled'}`,
      })
    }
    if (shouldApplyDeferredNow) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_remote_hold_release_auto_apply',
        level: 'info',
        source: 'frontend.scene_sync',
        summary: 'hold released -> auto apply deferred',
      })
      usePoseStore.getState().applyDeferredSceneRemote()
    }
  },
  setSelectedMonitoringCameraId: (cameraId) => {
    set({ selectedMonitoringCameraId: cameraId })
  },
  setSelectedPlacementId: (placementId) => {
    set({ selectedPlacementId: placementId })
  },
  setShowDimensions: (show) => {
    set({ showDimensions: show })
  },
  setCameraView: (view) => {
    set({ cameraView: view })
  },
  setViewportCameraQuaternion: (quaternion) => {
    set((state) => {
      const previous = state.viewportCameraQuaternion
      if (
        Math.abs(previous[0] - quaternion[0]) < 0.0001 &&
        Math.abs(previous[1] - quaternion[1]) < 0.0001 &&
        Math.abs(previous[2] - quaternion[2]) < 0.0001 &&
        Math.abs(previous[3] - quaternion[3]) < 0.0001
      ) {
        return state
      }
      return { viewportCameraQuaternion: quaternion }
    })
  },
  toggleSceneEdit: () => {
    set((state) => {
      const nextEnabled = !state.sceneEditEnabled
      return {
        sceneEditEnabled: nextEnabled,
        sceneError: nextEnabled && state.sceneError === 'edicion local deshabilitada' ? null : state.sceneError,
      }
    })
  },
  toggleSceneEventTerminal: () => {
    set((state) => ({ sceneEventTerminalOpen: !state.sceneEventTerminalOpen }))
  },
  toggleSceneRemoteHold: () => {
    let shouldApplyDeferredNow = false
    let nextEnabled = false
    set((state) => {
      nextEnabled = !state.sceneRemoteHoldEnabled
      const reduced = reduceSceneRemoteHoldEnabled(state, nextEnabled)
      shouldApplyDeferredNow = reduced.shouldApplyDeferredNow
      return reduced.value
    })
    usePoseStore.getState().appendSceneEvent({
      kind: 'scene_remote_hold_toggle',
      level: 'info',
      source: 'frontend.scene_sync',
      summary: `remote hold ${nextEnabled ? 'enabled' : 'disabled'}`,
    })
    if (shouldApplyDeferredNow) {
      usePoseStore.getState().appendSceneEvent({
        kind: 'scene_remote_hold_release_auto_apply',
        level: 'info',
        source: 'frontend.scene_sync',
        summary: 'hold released -> auto apply deferred',
      })
      usePoseStore.getState().applyDeferredSceneRemote()
    }
  },
  setProjectionMode: (mode) => {
    set({ projectionMode: mode })
  },
  setActiveToolMode: (mode) => {
    set({ activeToolMode: mode })
  },
  setCameraOverlayFlip: (axis, enabled) => {
    if (axis === 'x') {
      set({ cameraOverlayFlipX: enabled })
      return
    }
    set({ cameraOverlayFlipY: enabled })
  },
  rotateTopView: (direction) => {
    set((state) => {
      const next = normalizeQuarterTurns(state.topQuarterTurns + direction)
      return { topQuarterTurns: next }
    })
  },
  setBridgeEnabled: (enabled) => {
    set({ bridgeEnabled: enabled })
  },
  setBridgeError: (error) => {
    set({ bridgeError: error })
  },
  setBridgeMeta: ({ nonZeroAxes, receivedAt, sequence }) => {
    set({
      bridgeLastPoseAt: receivedAt ?? null,
      bridgeNonZeroAxes: nonZeroAxes ?? null,
      bridgeSequence: sequence ?? null,
    })
  },
  setBridgeStatus: (status) => {
    set({ bridgeStatus: status })
  },
  setBridgeUrl: (url) => {
    set({ bridgeUrl: url })
  },
  resetPose: () => {
    set({ pose: createDefaultPose() })
  },
  resetCameraOverlayFlip: () => {
    set({ cameraOverlayFlipX: false, cameraOverlayFlipY: false })
  },
  setAxis: (part, axis, value) => {
    const safeValue = clampAxis(part, axis, value)
    set((state) => ({
      pose: {
        ...state.pose,
        [part]: {
          ...state.pose[part],
          [axis]: safeValue,
        },
      },
    }))
  },
}))
