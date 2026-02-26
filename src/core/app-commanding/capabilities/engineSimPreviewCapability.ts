import type { AppCommand } from '../appCommandBus'
import type { EngineCapability } from '../../engine'

type PoseStoreLikeState = {
  monitoringCameras?: unknown[]
  sceneDeferredRemoteCount?: number
  sceneEditEnabled?: boolean
  sceneId?: string
  scenePlacements?: Array<{
    assetId: string
    id: string
  }>
  sceneRemoteHoldEnabled?: boolean
  selectedPlacementId?: string | null
}

type EngineSimPreviewSnapshot = {
  byAsset: Record<string, number>
  deferredRemoteCount: number
  generatedAt: string
  monitoringCameras: number
  sceneEditEnabled: boolean
  sceneId: string
  sceneRemoteHoldEnabled: boolean
  selectedPlacementId: string | null
  totalPlacements: number
}

type PoseStoreEngineCapability = EngineCapability<AppCommand, { [key: string]: unknown }, unknown>

function normalizeState(state: unknown): PoseStoreLikeState {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return {}
  return state as PoseStoreLikeState
}

export function createEngineSimPreviewCapability(): PoseStoreEngineCapability {
  return {
    canHandle: (command) => command.kind === 'request_engine_sim_preview',
    execute: ({ emit, state }) => {
      const snapshotState = normalizeState(state)
      const placements = Array.isArray(snapshotState.scenePlacements) ? snapshotState.scenePlacements : []
      const byAsset: Record<string, number> = {}
      for (const placement of placements) {
        const assetId = typeof placement.assetId === 'string' ? placement.assetId : 'unknown'
        byAsset[assetId] = (byAsset[assetId] ?? 0) + 1
      }

      const snapshot: EngineSimPreviewSnapshot = {
        byAsset,
        deferredRemoteCount: Number.isInteger(snapshotState.sceneDeferredRemoteCount)
          ? Number(snapshotState.sceneDeferredRemoteCount)
          : 0,
        generatedAt: new Date().toISOString(),
        monitoringCameras: Array.isArray(snapshotState.monitoringCameras) ? snapshotState.monitoringCameras.length : 0,
        sceneEditEnabled: Boolean(snapshotState.sceneEditEnabled),
        sceneId: typeof snapshotState.sceneId === 'string' ? snapshotState.sceneId : 'scene-1',
        sceneRemoteHoldEnabled: Boolean(snapshotState.sceneRemoteHoldEnabled),
        selectedPlacementId:
          typeof snapshotState.selectedPlacementId === 'string' ? snapshotState.selectedPlacementId : null,
        totalPlacements: placements.length,
      }

      emit('engine.sim_preview_snapshot', snapshot, { source: 'engine.capability.sim_preview' })
      return { stopDispatch: true }
    },
    id: 'engine.sim.preview',
  }
}
