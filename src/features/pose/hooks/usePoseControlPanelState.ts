import { useEffect, useState } from 'react'

import { usePoseStore } from '../../../app/state'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'

export function usePoseControlPanelState() {
  const pose = usePoseStore((state) => state.pose)
  const bridgeEnabled = usePoseStore((state) => state.bridgeEnabled)
  const bridgeError = usePoseStore((state) => state.bridgeError)
  const bridgeLastPoseAt = usePoseStore((state) => state.bridgeLastPoseAt)
  const bridgeNonZeroAxes = usePoseStore((state) => state.bridgeNonZeroAxes)
  const bridgeSequence = usePoseStore((state) => state.bridgeSequence)
  const bridgeStatus = usePoseStore((state) => state.bridgeStatus)
  const bridgeUrl = usePoseStore((state) => state.bridgeUrl)
  const sceneError = usePoseStore((state) => state.sceneError)
  const sceneLastEventAt = usePoseStore((state) => state.sceneLastEventAt)
  const scenePlacements = usePoseStore((state) => state.scenePlacements)
  const sceneRevision = usePoseStore((state) => state.sceneRevision)
  const sceneRemoteOverrideAt = usePoseStore((state) => state.sceneRemoteOverrideAt)
  const sceneRemoteOverrideKind = usePoseStore((state) => state.sceneRemoteOverrideKind)
  const sceneRemoteHoldEnabled = usePoseStore((state) => state.sceneRemoteHoldEnabled)
  const sceneDeferredRemoteCount = usePoseStore((state) => state.sceneDeferredRemoteCount)
  const sceneDeferredApplyPendingConfirm = usePoseStore((state) => state.sceneDeferredApplyPendingConfirm)
  const sceneDeferredRemoteLastAt = usePoseStore((state) => state.sceneDeferredRemoteLastAt)
  const sceneDeferredRemoteLastKind = usePoseStore((state) => state.sceneDeferredRemoteLastKind)
  const sceneSequence = usePoseStore((state) => state.sceneSequence)
  const sceneSource = usePoseStore((state) => state.sceneSource)
  const sceneRedoDepth = usePoseStore((state) => state.sceneRedoDepth)
  const sceneId = usePoseStore((state) => state.sceneId)
  const sceneEventTerminalOpen = usePoseStore((state) => state.sceneEventTerminalOpen)
  const sceneSpecialistSource = usePoseStore((state) => state.sceneSpecialistSource)
  const sceneSpecialistGeneratedAt = usePoseStore((state) => state.sceneSpecialistGeneratedAt)
  const sceneSpatialFresh = usePoseStore((state) => state.sceneSpatialFresh)
  const sceneSpatialAgeS = usePoseStore((state) => state.sceneSpatialAgeS)
  const sceneSpatialStaleAfterS = usePoseStore((state) => state.sceneSpatialStaleAfterS)
  const sceneSpatialStalePolicy = usePoseStore((state) => state.sceneSpatialStalePolicy)
  const sceneUndoDepth = usePoseStore((state) => state.sceneUndoDepth)
  const sceneEditEnabled = usePoseStore((state) => state.sceneEditEnabled)
  const setBridgeUrl = usePoseStore((state) => state.setBridgeUrl)
  const setAxis = usePoseStore((state) => state.setAxis)

  const [sceneDraft, setSceneDraft] = useState(sceneId)

  useEffect(() => {
    setSceneDraft(sceneId)
  }, [sceneId])

  const dispatchFromControlPanel = createPoseStoreCommandDispatcher('ui.control_panel')

  return {
    bridgeEnabled,
    bridgeError,
    bridgeLastPoseAt,
    bridgeNonZeroAxes,
    bridgeSequence,
    bridgeStatus,
    bridgeUrl,
    dispatchFromControlPanel,
    pose,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneDraft,
    sceneEditEnabled,
    sceneEventTerminalOpen,
    sceneError,
    sceneId,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneSpecialistGeneratedAt,
    sceneSpecialistSource,
    sceneSpatialAgeS,
    sceneSpatialFresh,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
    setAxis,
    setBridgeUrl,
    setSceneDraft,
  }
}
