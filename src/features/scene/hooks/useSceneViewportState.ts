import { useMemo } from 'react'

import { usePoseStore } from '../../../app/state'
import { selectMonitoringCamera } from '../../../core/scene-domain'
import { buildAvatarWorldTransform } from '../model'

export function useSceneViewportState() {
  const avatarPlanPositionM = usePoseStore((state) => state.avatarPlanPositionM)
  const avatarRotationDeg = usePoseStore((state) => state.avatarRotationDeg)
  const cameraDetectionOverlays = usePoseStore((state) => state.cameraDetectionOverlays)
  const cameraOverlayFlipX = usePoseStore((state) => state.cameraOverlayFlipX)
  const cameraOverlayFlipY = usePoseStore((state) => state.cameraOverlayFlipY)
  const cameraView = usePoseStore((state) => state.cameraView)
  const monitoringCameras = usePoseStore((state) => state.monitoringCameras)
  const scenePlacements = usePoseStore((state) => state.scenePlacements)
  const sceneRoom = usePoseStore((state) => state.sceneRoom)
  const projectionMode = usePoseStore((state) => state.projectionMode)
  const selectedMonitoringCameraId = usePoseStore((state) => state.selectedMonitoringCameraId)
  const topQuarterTurns = usePoseStore((state) => state.topQuarterTurns)
  const pose = usePoseStore((state) => state.pose)

  const avatarWorldTransform = useMemo(
    () => buildAvatarWorldTransform(avatarPlanPositionM, avatarRotationDeg),
    [avatarPlanPositionM, avatarRotationDeg],
  )
  const selectedMonitoringCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )

  return {
    avatarWorldPosition: avatarWorldTransform.position,
    avatarYaw: avatarWorldTransform.yaw,
    cameraDetectionOverlays,
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    monitoringCameras,
    pose,
    projectionMode,
    scenePlacements,
    sceneRoom,
    selectedMonitoringCamera,
    topQuarterTurns,
  }
}
