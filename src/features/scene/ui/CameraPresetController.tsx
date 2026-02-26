import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import type { OrthographicCamera, PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { MonitoringCameraDefinition, RoomDefinition } from '../../../core/planogram-domain'
import {
  cameraAngles,
  cameraForward,
  cameraWorldPosition,
  computeSensorPlaneDistance,
  computeTopViewPixelsPerMeter,
} from '../../../core/scene-domain'

function isOrthographicCamera(camera: unknown): camera is OrthographicCamera {
  return Boolean((camera as { isOrthographicCamera?: boolean }).isOrthographicCamera)
}

function isPerspectiveCamera(camera: unknown): camera is PerspectiveCamera {
  return Boolean((camera as { isPerspectiveCamera?: boolean }).isPerspectiveCamera)
}

export function CameraPresetController({
  controlsRef,
  room,
  sensorCamera,
  view,
  topQuarterTurns,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>
  room: RoomDefinition
  sensorCamera: MonitoringCameraDefinition | null
  view: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
  topQuarterTurns: 0 | 1 | 2 | 3
}) {
  const { camera, size } = useThree()
  const appliedPresetRef = useRef<string | null>(null)
  const roomSignature = useMemo(
    () =>
      `${room.widthM.toFixed(3)}|${room.depthM.toFixed(3)}|${room.heightM.toFixed(3)}|${room.wallThicknessM.toFixed(3)}`,
    [room.depthM, room.heightM, room.wallThicknessM, room.widthM],
  )
  const sensorSignature = useMemo(() => {
    if (!sensorCamera) return 'none'
    return [
      sensorCamera.id,
      sensorCamera.planPositionM[0].toFixed(3),
      sensorCamera.planPositionM[1].toFixed(3),
      sensorCamera.heightM.toFixed(3),
      sensorCamera.yawDeg.toFixed(3),
      sensorCamera.pitchDeg.toFixed(3),
      sensorCamera.fovDeg.toFixed(3),
      sensorCamera.aspectRatio.toFixed(4),
    ].join('|')
  }, [
    sensorCamera?.aspectRatio,
    sensorCamera?.fovDeg,
    sensorCamera?.heightM,
    sensorCamera?.id,
    sensorCamera?.pitchDeg,
    sensorCamera?.planPositionM,
    sensorCamera?.yawDeg,
  ])

  useEffect(() => {
    const projectionKind = isOrthographicCamera(camera) ? 'ortho' : 'persp'

    if (view === 'top') {
      const presetKey = `top|${projectionKind}|${topQuarterTurns}|${roomSignature}|${size.width}x${size.height}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const topPixelsPerMeter = computeTopViewPixelsPerMeter(size.width, size.height, room)
      if (isOrthographicCamera(camera)) {
        camera.position.set(0, 10, 0)
        camera.zoom = topPixelsPerMeter
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = 24
        const fovRad = (camera.fov * Math.PI) / 180
        const visibleHeightM = size.height / topPixelsPerMeter
        const distanceY = visibleHeightM / (2 * Math.tan(fovRad / 2))
        camera.position.set(0, distanceY, 0)
      }
      if (topQuarterTurns === 0) camera.up.set(0, 0, 1)
      if (topQuarterTurns === 1) camera.up.set(1, 0, 0)
      if (topQuarterTurns === 2) camera.up.set(0, 0, -1)
      if (topQuarterTurns === 3) camera.up.set(-1, 0, 0)
      controlsRef.current?.target.set(0, 0, 0)
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    if (view === 'sensor' && sensorCamera) {
      const presetKey = `sensor|${projectionKind}|${sensorSignature}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const cameraPosition = cameraWorldPosition(sensorCamera)
      const forward = cameraForward(sensorCamera)
      const sensorDistance = computeSensorPlaneDistance(sensorCamera, 0)

      camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2])
      if (isOrthographicCamera(camera)) {
        camera.zoom = 72
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = Math.max(15, Math.min(95, sensorCamera.fovDeg))
      }
      camera.up.set(0, 1, 0)
      controlsRef.current?.target.set(
        cameraPosition[0] + forward[0] * sensorDistance,
        cameraPosition[1] + forward[1] * sensorDistance,
        cameraPosition[2] + forward[2] * sensorDistance,
      )
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    if (view === 'front' || view === 'back' || view === 'left' || view === 'right') {
      const presetKey = `${view}|${projectionKind}|${roomSignature}`
      if (appliedPresetRef.current === presetKey) return
      appliedPresetRef.current = presetKey

      const roomHalfMax = Math.max(room.widthM, room.depthM) * 0.5
      const sideDistance = roomHalfMax + 2.4
      const sideHeight = Math.max(1.8, room.heightM * 0.58)
      const targetY = Math.max(0.9, room.heightM * 0.4)

      let positionX = 0
      let positionZ = 0
      if (view === 'front') positionZ = sideDistance
      if (view === 'back') positionZ = -sideDistance
      if (view === 'right') positionX = sideDistance
      if (view === 'left') positionX = -sideDistance

      camera.position.set(positionX, sideHeight, positionZ)
      if (isOrthographicCamera(camera)) {
        camera.zoom = 62
      }
      if (isPerspectiveCamera(camera)) {
        camera.fov = 34
      }
      camera.up.set(0, 1, 0)
      controlsRef.current?.target.set(0, targetY, 0)
      controlsRef.current?.update()
      if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
        camera.updateProjectionMatrix()
      }
      return
    }

    const presetKey = `iso|${projectionKind}`
    if (appliedPresetRef.current === presetKey) return
    appliedPresetRef.current = presetKey

    camera.position.set(8, 7.5, 8)
    if (isOrthographicCamera(camera)) camera.zoom = 85
    if (isPerspectiveCamera(camera)) camera.fov = 42
    camera.up.set(0, 1, 0)
    controlsRef.current?.target.set(0, 1.1, -0.5)
    controlsRef.current?.update()
    if (isOrthographicCamera(camera) || isPerspectiveCamera(camera)) {
      camera.updateProjectionMatrix()
    }
  }, [
    camera,
    controlsRef,
    room,
    roomSignature,
    sensorCamera,
    sensorSignature,
    size.height,
    size.width,
    topQuarterTurns,
    view,
  ])

  return null
}
