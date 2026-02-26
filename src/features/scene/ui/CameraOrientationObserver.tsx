import { useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useViewportStore } from '../../../app/state'

export function CameraOrientationObserver({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const emit = () => {
      useViewportStore.getState().setViewportCameraQuaternion([
        camera.quaternion.x,
        camera.quaternion.y,
        camera.quaternion.z,
        camera.quaternion.w,
      ])
    }

    const scheduleEmit = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        emit()
      })
    }

    emit()
    const controls = controlsRef.current
    controls?.addEventListener('change', scheduleEmit)

    return () => {
      controls?.removeEventListener('change', scheduleEmit)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [camera, controlsRef])

  return null
}
