import { useRef } from 'react'

import { useCameraPlaneCanvas, useCameraSubspaceState } from '../hooks'

export function CameraSubspaceMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const {
    autoPlanogramFlipX,
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    dispatchFromCameraPanel,
    effectiveFlipX,
    effectiveFlipY,
    monitoringCameras,
    selectedCamera,
    selectedOverlay,
    worldAxisMapping,
  } = useCameraSubspaceState()

  useCameraPlaneCanvas(canvasRef, selectedCamera, selectedOverlay, effectiveFlipX, effectiveFlipY)

  return (
    <div className="sensor-map">
      <div className="sensor-map-head">
        <h3>Subplano Camara</h3>
        <button
          type="button"
          className={cameraView === 'sensor' ? 'active' : ''}
          onClick={() => dispatchFromCameraPanel({ kind: 'set_camera_view', view: 'sensor' })}
          disabled={!selectedCamera}
        >
          Cam view
        </button>
      </div>
      <label className="sensor-map-select">
        <span>Camara</span>
        <select
          value={selectedCamera?.id ?? ''}
          disabled={monitoringCameras.length === 0}
          onChange={(event) =>
            dispatchFromCameraPanel({
              kind: 'set_selected_monitoring_camera',
              cameraId: event.currentTarget.value || null,
            })
          }
        >
          {monitoringCameras.length === 0 ? <option value="">sin metadata</option> : null}
          {monitoringCameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label ?? camera.id}
            </option>
          ))}
        </select>
      </label>
      <div className="sensor-map-flips">
        <button
          type="button"
          className={cameraOverlayFlipX ? 'active' : ''}
          onClick={() =>
            dispatchFromCameraPanel({
              kind: 'set_camera_overlay_flip',
              axis: 'x',
              enabled: !cameraOverlayFlipX,
            })
          }
        >
          Flip X
        </button>
        <button
          type="button"
          className={cameraOverlayFlipY ? 'active' : ''}
          onClick={() =>
            dispatchFromCameraPanel({
              kind: 'set_camera_overlay_flip',
              axis: 'y',
              enabled: !cameraOverlayFlipY,
            })
          }
        >
          Flip Y
        </button>
        <button
          type="button"
          onClick={() => dispatchFromCameraPanel({ kind: 'reset_camera_overlay_flip' })}
          disabled={!cameraOverlayFlipX && !cameraOverlayFlipY}
        >
          Reset
        </button>
      </div>
      <canvas ref={canvasRef} />
      <p className="mini-map-meta">
        boxes: {selectedOverlay?.boxes.length ?? 0} | timestamp: {selectedOverlay?.timestamp ?? '-'}
      </p>
      <p className="mini-map-meta">
        pos: {selectedCamera ? `${selectedCamera.planPositionM[0].toFixed(2)}, ${selectedCamera.planPositionM[1].toFixed(2)}m` : '-'} |
        {' '}
        yaw: {selectedCamera?.yawDeg.toFixed(1) ?? '-'} deg | pitch: {selectedCamera?.pitchDeg.toFixed(1) ?? '-'} deg
      </p>
      <p className="mini-map-meta">
        world +X {'->'} image {worldAxisMapping?.x ?? '-'} | world +Z {'->'} image {worldAxisMapping?.z ?? '-'}
      </p>
      <p className="mini-map-meta">auto-align X con escena: {autoPlanogramFlipX ? 'on' : 'off'}</p>
      <p className="mini-map-meta">anchor UV: bottom-center (footpoint) por defecto</p>
      <p className="mini-map-meta">solo lectura desde metadata.scene</p>
    </div>
  )
}
