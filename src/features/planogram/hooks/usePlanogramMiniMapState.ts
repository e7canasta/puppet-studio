import { useMemo } from 'react'

import { useAvatarStore, useBridgeStore, useSceneStore, useViewportStore } from '../../../app/state'
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
  // Viewport state
  const cameraView = useViewportStore((state) => state.cameraView)
  const projectionMode = useViewportStore((state) => state.projectionMode)
  const selectedMonitoringCameraId = useViewportStore((state) => state.selectedMonitoringCameraId)
  const showDimensions = useViewportStore((state) => state.showDimensions)
  const topQuarterTurns = useViewportStore((state) => state.topQuarterTurns)

  // Avatar state
  const avatarPlanPositionM = useAvatarStore((state) => state.avatarPlanPositionM)
  const avatarRotationDeg = useAvatarStore((state) => state.avatarRotationDeg)
  const avatarTrackId = useAvatarStore((state) => state.avatarTrackId)

  // Scene state
  const sceneError = useSceneStore((state) => state.sceneError)
  const sceneLastEventAt = useSceneStore((state) => state.sceneLastEventAt)
  const scenePlacements = useSceneStore((state) => state.scenePlacements)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneRoom = useSceneStore((state) => state.sceneRoom)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const sceneSource = useSceneStore((state) => state.sceneSource)
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)
  const selectedPlacementId = useSceneStore((state) => state.selectedPlacementId)
  const sceneRedoDepth = useSceneStore((state) => state.sceneRedoDepth)
  const sceneUndoDepth = useSceneStore((state) => state.sceneUndoDepth)
  const monitoringCameras = useSceneStore((state) => state.monitoringCameras)
  const sceneRemoteOverrideAt = useSceneStore((state) => state.sceneRemoteOverrideAt)
  const sceneRemoteOverrideKind = useSceneStore((state) => state.sceneRemoteOverrideKind)

  // Bridge state
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)
  const sceneDeferredRemoteCount = useBridgeStore((state) => state.sceneDeferredRemoteCount)
  const sceneDeferredApplyPendingConfirm = useBridgeStore((state) => state.sceneDeferredApplyPendingConfirm)
  const sceneDeferredRemoteLastAt = useBridgeStore((state) => state.sceneDeferredRemoteLastAt)
  const sceneDeferredRemoteLastKind = useBridgeStore((state) => state.sceneDeferredRemoteLastKind)

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
