import { useMemo } from 'react'

import { usePoseStore } from '../../../app/state'
import { selectMonitoringCamera } from '../../../core/scene-domain'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'
import { buildCameraOverlayViewModel, selectCameraOverlay } from '../model'

export function useCameraSubspaceState() {
  const cameraOverlayFlipX = usePoseStore((state) => state.cameraOverlayFlipX)
  const cameraOverlayFlipY = usePoseStore((state) => state.cameraOverlayFlipY)
  const cameraDetectionOverlays = usePoseStore((state) => state.cameraDetectionOverlays)
  const cameraView = usePoseStore((state) => state.cameraView)
  const monitoringCameras = usePoseStore((state) => state.monitoringCameras)
  const selectedMonitoringCameraId = usePoseStore((state) => state.selectedMonitoringCameraId)

  const selectedCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )
  const selectedOverlay = useMemo(
    () => selectCameraOverlay(cameraDetectionOverlays, selectedCamera),
    [cameraDetectionOverlays, selectedCamera],
  )
  const overlayView = useMemo(
    () => buildCameraOverlayViewModel(selectedCamera, selectedOverlay, cameraOverlayFlipX, cameraOverlayFlipY),
    [cameraOverlayFlipX, cameraOverlayFlipY, selectedCamera, selectedOverlay],
  )

  const dispatchFromCameraPanel = createPoseStoreCommandDispatcher('ui.camera_panel')

  return {
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    dispatchFromCameraPanel,
    monitoringCameras,
    selectedCamera,
    ...overlayView,
  }
}
