import { useMemo } from 'react'

import { usePoseStore } from '../../../app/state'
import {
  selectMonitoringCamera,
  selectPlacementLegendItems,
  selectSelectedPlacementView,
} from '../../../core/scene-domain'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'
import {
  buildPlanogramPlacementHitPolygons,
  computePlanogramMiniMapScale,
} from '../model'

export function usePlanogramMiniMapState() {
  const cameraView = usePoseStore((state) => state.cameraView)
  const avatarPlanPositionM = usePoseStore((state) => state.avatarPlanPositionM)
  const avatarRotationDeg = usePoseStore((state) => state.avatarRotationDeg)
  const avatarTrackId = usePoseStore((state) => state.avatarTrackId)
  const sceneError = usePoseStore((state) => state.sceneError)
  const sceneLastEventAt = usePoseStore((state) => state.sceneLastEventAt)
  const scenePlacements = usePoseStore((state) => state.scenePlacements)
  const sceneRevision = usePoseStore((state) => state.sceneRevision)
  const sceneRemoteOverrideAt = usePoseStore((state) => state.sceneRemoteOverrideAt)
  const sceneRemoteOverrideKind = usePoseStore((state) => state.sceneRemoteOverrideKind)
  const sceneRoom = usePoseStore((state) => state.sceneRoom)
  const sceneSequence = usePoseStore((state) => state.sceneSequence)
  const sceneSource = usePoseStore((state) => state.sceneSource)
  const sceneEditEnabled = usePoseStore((state) => state.sceneEditEnabled)
  const sceneRemoteHoldEnabled = usePoseStore((state) => state.sceneRemoteHoldEnabled)
  const sceneDeferredRemoteCount = usePoseStore((state) => state.sceneDeferredRemoteCount)
  const sceneDeferredApplyPendingConfirm = usePoseStore((state) => state.sceneDeferredApplyPendingConfirm)
  const sceneDeferredRemoteLastAt = usePoseStore((state) => state.sceneDeferredRemoteLastAt)
  const sceneDeferredRemoteLastKind = usePoseStore((state) => state.sceneDeferredRemoteLastKind)
  const monitoringCameras = usePoseStore((state) => state.monitoringCameras)
  const projectionMode = usePoseStore((state) => state.projectionMode)
  const selectedMonitoringCameraId = usePoseStore((state) => state.selectedMonitoringCameraId)
  const selectedPlacementId = usePoseStore((state) => state.selectedPlacementId)
  const sceneRedoDepth = usePoseStore((state) => state.sceneRedoDepth)
  const sceneUndoDepth = usePoseStore((state) => state.sceneUndoDepth)
  const showDimensions = usePoseStore((state) => state.showDimensions)
  const topQuarterTurns = usePoseStore((state) => state.topQuarterTurns)

  const selectedPlacementView = useMemo(
    () => selectSelectedPlacementView(scenePlacements, selectedPlacementId),
    [scenePlacements, selectedPlacementId],
  )
  const selectedMonitoringCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )
  const legendItems = useMemo(() => selectPlacementLegendItems(scenePlacements), [scenePlacements])
  const miniMapScale = useMemo(
    () => computePlanogramMiniMapScale(sceneRoom, topQuarterTurns),
    [sceneRoom, topQuarterTurns],
  )
  const placementHitPolygons = useMemo(
    () => buildPlanogramPlacementHitPolygons(scenePlacements, sceneRoom, topQuarterTurns),
    [scenePlacements, sceneRoom, topQuarterTurns],
  )

  const dispatchFromPlanogram = createPoseStoreCommandDispatcher('ui.planogram')

  return {
    avatarPlanPositionM,
    avatarRotationDeg,
    avatarTrackId,
    cameraView,
    dispatchFromPlanogram,
    legendItems,
    miniMapScale,
    monitoringCameras,
    placementHitPolygons,
    projectionMode,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneEditEnabled,
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneRoom,
    sceneSequence,
    sceneSource,
    sceneUndoDepth,
    selectedMonitoringCamera,
    selectedPlacement: selectedPlacementView.placement,
    selectedPlacementAssetId: selectedPlacementView.assetId,
    selectedAsset: selectedPlacementView.asset,
    selectedSize: selectedPlacementView.size,
    showDimensions,
    topQuarterTurns,
  }
}
