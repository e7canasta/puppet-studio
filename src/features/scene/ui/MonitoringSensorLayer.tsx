import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { CameraDetectionOverlay, MonitoringCameraDefinition } from '../../../core/planogram-domain'
import { degToRad } from '../../../core/planogram-domain'
import {
  cameraAngles,
  cameraWorldPosition,
  computeSensorPlaneDistance,
  normalizeDetectionBox2D,
  projectNormalizedDetectionToSensorPlane,
} from '../../../core/scene-domain'

export function MonitoringSensorLayer({
  cameraDetections,
  cameras,
  flipX,
  flipY,
  selectedCameraId,
}: {
  cameraDetections: CameraDetectionOverlay[]
  cameras: MonitoringCameraDefinition[]
  flipX: boolean
  flipY: boolean
  selectedCameraId: string | null
}) {
  const selectedCamera = useMemo(() => {
    if (selectedCameraId) {
      const byId = cameras.find((camera) => camera.id === selectedCameraId)
      if (byId) return byId
    }
    return cameras[0] ?? null
  }, [cameras, selectedCameraId])

  const selectedOverlay = useMemo(() => {
    if (!selectedCamera) return null
    return cameraDetections.find((overlay) => overlay.cameraId === selectedCamera.id) ?? null
  }, [cameraDetections, selectedCamera])
  const selectedSensorDistance = useMemo(
    () => (selectedCamera ? computeSensorPlaneDistance(selectedCamera, 0) : null),
    [selectedCamera],
  )

  return (
    <group>
      {cameras.map((camera) => {
        const isSelected = selectedCamera?.id === camera.id
        const position = cameraWorldPosition(camera)
        const { pitch, yaw } = cameraAngles(camera)
        const guideDistance = isSelected ? (selectedSensorDistance ?? camera.overlayDistanceM) : 1.2
        return (
          <group key={camera.id} position={position}>
            <group rotation={[0, yaw, 0]}>
              <group rotation={[-pitch, 0, 0]}>
                <mesh castShadow renderOrder={4}>
                  <boxGeometry args={[0.1, 0.08, 0.1]} />
                  <meshStandardMaterial color={isSelected ? '#4f46e5' : '#334155'} />
                </mesh>
                <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
                  <coneGeometry args={[0.065, 0.22, 16]} />
                  <meshStandardMaterial color={isSelected ? '#22c55e' : '#475569'} />
                </mesh>
                <mesh position={[0, 0, guideDistance * 0.5]} renderOrder={3}>
                  <boxGeometry args={[0.02, 0.02, Math.max(0.6, guideDistance)]} />
                  <meshStandardMaterial color={isSelected ? '#22c55e' : '#64748b'} transparent opacity={0.6} />
                </mesh>
              </group>
            </group>
          </group>
        )
      })}

      {selectedCamera && selectedSensorDistance ? (
        <group position={cameraWorldPosition(selectedCamera)}>
          <group rotation={[0, cameraAngles(selectedCamera).yaw, 0]}>
            <group rotation={[-cameraAngles(selectedCamera).pitch, 0, 0]}>
              <group position={[0, 0, selectedSensorDistance]}>
                {(() => {
                  const planeHeight = 2 * selectedSensorDistance * Math.tan(degToRad(selectedCamera.fovDeg) * 0.5)
                  const planeWidth = planeHeight * selectedCamera.aspectRatio
                  return (
                    <group>
                      <mesh renderOrder={3}>
                        <planeGeometry args={[planeWidth, planeHeight]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} depthWrite={false} side={DoubleSide} />
                      </mesh>
                      <mesh renderOrder={4}>
                        <planeGeometry args={[planeWidth, planeHeight]} />
                        <meshBasicMaterial color="#0891b2" transparent opacity={0.4} wireframe depthWrite={false} side={DoubleSide} />
                      </mesh>
                      {selectedOverlay?.boxes.map((box) => {
                        const normalized = normalizeDetectionBox2D(box, { flipX, flipY })
                        const projected = projectNormalizedDetectionToSensorPlane(
                          normalized,
                          { height: planeHeight, width: planeWidth },
                          0.001,
                        )
                        const highlight = box.trackId ? '#f97316' : '#e11d48'
                        return (
                          <group key={`${selectedOverlay.cameraId}:${box.id}`} position={[projected.centerX, projected.centerY, 0.004]}>
                            <mesh renderOrder={5}>
                              <planeGeometry args={[projected.boxWidth, projected.boxHeight]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.16} depthWrite={false} side={DoubleSide} />
                            </mesh>
                            <mesh renderOrder={6}>
                              <planeGeometry args={[projected.boxWidth, projected.boxHeight]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.86} wireframe depthWrite={false} side={DoubleSide} />
                            </mesh>
                            <mesh
                              position={[projected.anchorX - projected.centerX, projected.anchorY - projected.centerY, 0.002]}
                              renderOrder={7}
                            >
                              <circleGeometry args={[0.02, 24]} />
                              <meshBasicMaterial color={highlight} transparent opacity={0.95} depthWrite={false} side={DoubleSide} />
                            </mesh>
                          </group>
                        )
                      })}
                    </group>
                  )
                })()}
              </group>
            </group>
          </group>
        </group>
      ) : null}
    </group>
  )
}
