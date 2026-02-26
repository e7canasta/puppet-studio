import { create } from 'zustand'

export type BridgeStatus = 'disconnected' | 'connecting' | 'connected'
export type SceneRemoteOverrideKind = 'scene_patch' | 'scene_snapshot'

export type DeferredSceneMessage = {
  kind: SceneRemoteOverrideKind
  message: unknown
  receivedAt: string
  revision: number | null
  sequence: number | null
}

export type BridgeState = {
  // Connection state
  bridgeEnabled: boolean
  bridgeError: string | null
  bridgeStatus: BridgeStatus
  bridgeUrl: string

  // Pose tracking
  bridgeLastPoseAt: string | null
  bridgeNonZeroAxes: number | null
  bridgeSequence: number | null

  // Remote scene sync state
  sceneRemoteHoldEnabled: boolean
  sceneRemoteOverrideAt: string | null
  sceneRemoteOverrideKind: SceneRemoteOverrideKind | null
  sceneDeferredApplyPendingConfirm: boolean
  sceneDeferredRemoteCount: number
  sceneDeferredRemoteLastAt: string | null
  sceneDeferredRemoteLastKind: SceneRemoteOverrideKind | null
  sceneDeferredRemoteQueue: DeferredSceneMessage[]

  // Actions
  setBridgeEnabled: (enabled: boolean) => void
  setBridgeError: (error: string | null) => void
  setBridgeStatus: (status: BridgeStatus) => void
  setBridgeUrl: (url: string) => void
  setBridgeMeta: (meta: { nonZeroAxes?: number | null; receivedAt?: string | null; sequence?: number | null }) => void
  setSceneRemoteHoldEnabled: (enabled: boolean) => void
  toggleSceneRemoteHold: () => void
  clearSceneRemoteOverride: () => void
  clearSceneDeferredRemote: () => void
  setSceneDeferredQueue: (queue: DeferredSceneMessage[]) => void
  setSceneDeferredMeta: (meta: {
    count?: number
    lastAt?: string | null
    lastKind?: SceneRemoteOverrideKind | null
    pendingConfirm?: boolean
  }) => void
  setSceneRemoteOverride: (at: string, kind: SceneRemoteOverrideKind) => void
}

export const useBridgeStore = create<BridgeState>((set) => ({
  // Initial state
  bridgeEnabled: true,
  bridgeError: null,
  bridgeStatus: 'disconnected',
  bridgeUrl: 'ws://localhost:8765',
  bridgeLastPoseAt: null,
  bridgeNonZeroAxes: null,
  bridgeSequence: null,
  sceneRemoteHoldEnabled: false,
  sceneRemoteOverrideAt: null,
  sceneRemoteOverrideKind: null,
  sceneDeferredApplyPendingConfirm: false,
  sceneDeferredRemoteCount: 0,
  sceneDeferredRemoteLastAt: null,
  sceneDeferredRemoteLastKind: null,
  sceneDeferredRemoteQueue: [],

  // Actions
  setBridgeEnabled: (enabled) => set({ bridgeEnabled: enabled }),
  setBridgeError: (error) => set({ bridgeError: error }),
  setBridgeStatus: (status) => set({ bridgeStatus: status }),
  setBridgeUrl: (url) => set({ bridgeUrl: url }),
  setBridgeMeta: (meta) =>
    set((state) => ({
      bridgeLastPoseAt: meta.receivedAt ?? state.bridgeLastPoseAt,
      bridgeNonZeroAxes: meta.nonZeroAxes !== undefined ? meta.nonZeroAxes : state.bridgeNonZeroAxes,
      bridgeSequence: meta.sequence !== undefined ? meta.sequence : state.bridgeSequence,
    })),
  setSceneRemoteHoldEnabled: (enabled) => set({ sceneRemoteHoldEnabled: enabled }),
  toggleSceneRemoteHold: () => set((state) => ({ sceneRemoteHoldEnabled: !state.sceneRemoteHoldEnabled })),
  clearSceneRemoteOverride: () =>
    set({
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
    }),
  clearSceneDeferredRemote: () =>
    set({
      sceneDeferredApplyPendingConfirm: false,
      sceneDeferredRemoteCount: 0,
      sceneDeferredRemoteLastAt: null,
      sceneDeferredRemoteLastKind: null,
      sceneDeferredRemoteQueue: [],
    }),
  setSceneDeferredQueue: (queue) =>
    set({
      sceneDeferredRemoteQueue: queue,
      sceneDeferredRemoteCount: queue.length,
    }),
  setSceneDeferredMeta: (meta) =>
    set((state) => ({
      sceneDeferredRemoteCount: meta.count ?? state.sceneDeferredRemoteCount,
      sceneDeferredRemoteLastAt: meta.lastAt !== undefined ? meta.lastAt : state.sceneDeferredRemoteLastAt,
      sceneDeferredRemoteLastKind: meta.lastKind !== undefined ? meta.lastKind : state.sceneDeferredRemoteLastKind,
      sceneDeferredApplyPendingConfirm: meta.pendingConfirm ?? state.sceneDeferredApplyPendingConfirm,
    })),
  setSceneRemoteOverride: (at, kind) =>
    set({
      sceneRemoteOverrideAt: at,
      sceneRemoteOverrideKind: kind,
    }),
}))
