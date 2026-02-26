import { create } from 'zustand'

export type CameraView = 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
export type ProjectionMode = 'orthographic' | 'perspective'
export type ViewportCameraQuaternion = [number, number, number, number]

export type ViewportState = {
  cameraView: CameraView
  viewportCameraQuaternion: ViewportCameraQuaternion
  projectionMode: ProjectionMode
  showDimensions: boolean
  topQuarterTurns: 0 | 1 | 2 | 3
  cameraOverlayFlipX: boolean
  cameraOverlayFlipY: boolean
  selectedMonitoringCameraId: string | null
  setCameraView: (view: CameraView) => void
  setViewportCameraQuaternion: (quaternion: ViewportCameraQuaternion) => void
  setProjectionMode: (mode: ProjectionMode) => void
  setShowDimensions: (show: boolean) => void
  rotateTopView: (direction: -1 | 1) => void
  setCameraOverlayFlip: (axis: 'x' | 'y', enabled: boolean) => void
  resetCameraOverlayFlip: () => void
  setSelectedMonitoringCameraId: (cameraId: string | null) => void
}

function normalizeQuarterTurns(value: number): 0 | 1 | 2 | 3 {
  return (((value % 4) + 4) % 4) as 0 | 1 | 2 | 3
}

export const useViewportStore = create<ViewportState>((set) => ({
  cameraView: 'iso',
  viewportCameraQuaternion: [0, 0, 0, 1],
  projectionMode: 'orthographic',
  showDimensions: true,
  topQuarterTurns: 0,
  cameraOverlayFlipX: false,
  cameraOverlayFlipY: false,
  selectedMonitoringCameraId: null,

  setCameraView: (view) => set({ cameraView: view }),
  setViewportCameraQuaternion: (quaternion) => set({ viewportCameraQuaternion: quaternion }),
  setProjectionMode: (mode) => set({ projectionMode: mode }),
  setShowDimensions: (show) => set({ showDimensions: show }),
  rotateTopView: (direction) =>
    set((state) => ({
      topQuarterTurns: normalizeQuarterTurns(state.topQuarterTurns + direction),
    })),
  setCameraOverlayFlip: (axis, enabled) =>
    set((state) => ({
      cameraOverlayFlipX: axis === 'x' ? enabled : state.cameraOverlayFlipX,
      cameraOverlayFlipY: axis === 'y' ? enabled : state.cameraOverlayFlipY,
    })),
  resetCameraOverlayFlip: () =>
    set({
      cameraOverlayFlipX: false,
      cameraOverlayFlipY: false,
    }),
  setSelectedMonitoringCameraId: (cameraId) => set({ selectedMonitoringCameraId: cameraId }),
}))
