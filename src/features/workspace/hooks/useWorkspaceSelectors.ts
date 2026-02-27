import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useBridgeStore, useSceneStore, useUiStore, useViewportStore, useWorkspaceStore } from '../../../app/state'
import { workspaceSelectors } from '../../../app/state/workspaceSelectors'
import { listPoseStoreEngineCapabilities } from '../../../core/app-commanding'

export function useWorkspaceSelectors() {
  // Workspace state from workspaceStore
  const panels = useWorkspaceStore(useShallow(workspaceSelectors.panels))
  const widgets = useWorkspaceStore(useShallow(workspaceSelectors.widgets))
  const widgetVisibility = useWorkspaceStore(useShallow(workspaceSelectors.widgetVisibility))
  const panelActions = useWorkspaceStore(useShallow(workspaceSelectors.panelActions))
  const widgetActions = useWorkspaceStore(useShallow(workspaceSelectors.widgetActions))
  const layoutActions = useWorkspaceStore(useShallow(workspaceSelectors.layoutActions))

  const bridgeStatus = useBridgeStore((state) => state.bridgeStatus)
  const bridgeUrl = useBridgeStore((state) => state.bridgeUrl)
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)

  const cameraView = useViewportStore((state) => state.cameraView)
  const viewportCameraQuaternion = useViewportStore((state) => state.viewportCameraQuaternion)
  const projectionMode = useViewportStore((state) => state.projectionMode)
  const showDimensions = useViewportStore((state) => state.showDimensions)

  const monitoringCameraCount = useSceneStore((state) => state.monitoringCameras.length)
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)
  const sceneId = useSceneStore((state) => state.sceneId)
  const scenePlacementsCount = useSceneStore((state) => state.scenePlacements.length)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const selectedPlacementId = useSceneStore((state) => state.selectedPlacementId)
  const detectionCount = useSceneStore((state) =>
    state.cameraDetectionOverlays.reduce((total, overlay) => total + overlay.boxes.length, 0),
  )

  const sceneEventTerminalOpen = useUiStore((state) => state.sceneEventTerminalOpen)
  const sceneEventLogCount = useUiStore((state) => state.sceneEventLog.length)
  const activeTool = useUiStore((state) => state.activeToolMode)

  const activeCapabilities = useMemo(
    () => listPoseStoreEngineCapabilities().filter((capability) => capability.enabled).length,
    [sceneEventLogCount],
  )

  return {
    bridgeStatus,
    bridgeUrl,
    sceneRemoteHoldEnabled,
    cameraView,
    viewportCameraQuaternion,
    projectionMode,
    showDimensions,
    monitoringCameraCount,
    sceneEditEnabled,
    sceneId,
    scenePlacementsCount,
    sceneRevision,
    sceneSequence,
    selectedPlacementId,
    detectionCount,
    sceneEventTerminalOpen,
    sceneEventLogCount,
    activeTool,
    activeCapabilities,
    // Workspace state
    ...panels,
    widgets,
    ...widgetVisibility,
    ...panelActions,
    ...widgetActions,
    ...layoutActions,
  }
}
