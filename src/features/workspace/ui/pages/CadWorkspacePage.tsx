import { lazy, Suspense, useMemo, useState } from 'react'

import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import {
  createAppCommandDispatcher,
  IconCamera,
  IconOutliner,
  IconPlanogram,
  IconSliders,
} from '../../../../shared/ui'
import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'
import { useWorkspaceSelectors, useResizePanels } from '../../hooks'
import { buildWorkspaceQuickActions } from '../../model'
import {
  WORKSPACE_COMMAND_PALETTE_EVENT,
  WorkspaceCommandPalette,
} from '../components/WorkspaceCommandPalette'
import { WorkspaceDockManager } from '../components/WorkspaceDockManager'
import { WorkspaceHeaderBar } from '../components/WorkspaceHeaderBar'
import { WorkspaceLeftPanel } from '../components/WorkspaceLeftPanel'
import { WorkspaceRightPanel } from '../components/WorkspaceRightPanel'
import { WorkspaceSceneOutliner } from '../components/WorkspaceSceneOutliner'
import { WorkspaceStatusBar } from '../components/WorkspaceStatusBar'
import { WorkspaceTerminalStrip } from '../components/WorkspaceTerminalStrip'
import { WorkspaceToolrail } from '../components/WorkspaceToolrail'
import { WorkspaceViewportShell } from '../components/WorkspaceViewportShell'
import { WorkspaceWidgetCard } from '../components/WorkspaceWidgetCard'

const PoseControlPanel = lazy(() =>
  import('../../../pose/ui/PoseControlPanel').then((module) => ({ default: module.PoseControlPanel })),
)
const CameraSubspaceMap = lazy(() =>
  import('../../../camera/ui/CameraSubspaceMap').then((module) => ({ default: module.CameraSubspaceMap })),
)
const PlanogramMiniMap = lazy(() =>
  import('../../../planogram/ui/PlanogramMiniMap').then((module) => ({ default: module.PlanogramMiniMap })),
)
const SceneEventTerminal = lazy(() =>
  import('../../../terminal/ui/SceneEventTerminal').then((module) => ({ default: module.SceneEventTerminal })),
)

export function CadWorkspacePage() {
  const selectors = useWorkspaceSelectors()
  const { beginResize } = useResizePanels({
    leftPanelSizePx: selectors.leftPanelSizePx,
    rightPanelSizePx: selectors.rightPanelSizePx,
    rightPanelOutlinerHeightPx: selectors.rightPanelOutlinerHeightPx,
    terminalHeightPx: selectors.terminalHeightPx,
    setLeftPanelSize: selectors.setLeftPanelSize,
    setRightPanelSize: selectors.setRightPanelSize,
    setRightPanelOutlinerHeight: selectors.setRightPanelOutlinerHeight,
    setTerminalHeight: selectors.setTerminalHeight,
  })

  const [dockManagerOpen, setDockManagerOpen] = useState(false)
  const dispatchFromWorkspace = createAppCommandDispatcher('ui.workspace_shell')

  const quickActions = useMemo(
    () =>
      buildWorkspaceQuickActions(
        {
          activeTool: selectors.activeTool,
          leftPanelOpen: selectors.leftPanelOpen,
          projectionMode: selectors.projectionMode,
          rightPanelOpen: selectors.rightPanelOpen,
          sceneEditEnabled: selectors.sceneEditEnabled,
          sceneEventTerminalOpen: selectors.sceneEventTerminalOpen,
          sceneRemoteHoldEnabled: selectors.sceneRemoteHoldEnabled,
          selectedPlacementId: selectors.selectedPlacementId,
          showDimensions: selectors.showDimensions,
          widgets: selectors.widgets,
        },
        dispatchFromWorkspace,
      ),
    [
      selectors.activeTool,
      selectors.leftPanelOpen,
      selectors.projectionMode,
      selectors.rightPanelOpen,
      selectors.sceneEditEnabled,
      selectors.sceneEventTerminalOpen,
      selectors.sceneRemoteHoldEnabled,
      selectors.selectedPlacementId,
      selectors.showDimensions,
      selectors.widgets,
      dispatchFromWorkspace,
    ],
  )

  const leftPanelWidthPx = selectors.widgets.properties.collapsed ? 220 : selectors.leftPanelSizePx
  const anyRightWidgetVisible = selectors.showOutlinerWidget || selectors.showCameraWidget || selectors.showPlanWidget
  const rightPanelWidthPx = selectors.widgets.outliner.collapsed ? Math.max(280, selectors.rightPanelSizePx - 40) : selectors.rightPanelSizePx
  const outlinerHeightPx = selectors.widgets.outliner.collapsed ? 36 : selectors.rightPanelOutlinerHeightPx
  const canSnapSelection = selectors.sceneEditEnabled && Boolean(selectors.selectedPlacementId)

  const setWidgetVisibilityFromWorkspace = (widget: WorkspaceWidgetId, visible: boolean) => {
    dispatchFromWorkspace({ kind: 'set_workspace_widget_visible', visible, widget })
  }

  const toggleWidgetCollapsedFromWorkspace = (widget: WorkspaceWidgetId) => {
    dispatchFromWorkspace({ kind: 'toggle_workspace_widget_collapsed', widget })
  }

  const toggleWidgetPinnedFromWorkspace = (widget: WorkspaceWidgetId) => {
    dispatchFromWorkspace({ kind: 'toggle_workspace_widget_pinned', widget })
  }

  const openWorkspaceCommandPalette = () => {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_COMMAND_PALETTE_EVENT, {
        detail: { open: true },
      }),
    )
  }

  return (
    <div className={`cad-workspace ${selectors.sceneEventTerminalOpen ? 'terminal-open' : 'terminal-closed'}`}>
      <WorkspaceHeaderBar
        activeCapabilities={selectors.activeCapabilities}
        bridgeStatus={selectors.bridgeStatus}
        cameraView={selectors.cameraView}
        dockManagerOpen={dockManagerOpen}
        leftPanelOpen={selectors.leftPanelOpen}
        onApplyLayoutPreset={(preset) => dispatchFromWorkspace({ kind: 'apply_workspace_layout_preset', preset })}
        onOpenCommandPalette={openWorkspaceCommandPalette}
        onSetCameraView={(view) => dispatchFromWorkspace({ kind: 'set_camera_view', view })}
        onSetProjectionMode={(mode) => dispatchFromWorkspace({ kind: 'set_projection_mode', mode })}
        onToggleDockManager={() => setDockManagerOpen((open) => !open)}
        onToggleLeftPanel={() => dispatchFromWorkspace({ kind: 'toggle_workspace_left_panel' })}
        onToggleRightPanel={() => dispatchFromWorkspace({ kind: 'toggle_workspace_right_panel' })}
        onToggleSceneEdit={() => dispatchFromWorkspace({ kind: 'toggle_scene_edit' })}
        onToggleSceneRemoteHold={() => dispatchFromWorkspace({ kind: 'toggle_scene_remote_hold' })}
        onToggleTerminal={() => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' })}
        onRestoreLayoutDefaults={() => dispatchFromWorkspace({ kind: 'restore_workspace_layout_defaults' })}
        projectionMode={selectors.projectionMode}
        rightPanelOpen={selectors.rightPanelOpen}
        sceneEditEnabled={selectors.sceneEditEnabled}
        sceneEventTerminalOpen={selectors.sceneEventTerminalOpen}
        sceneId={selectors.sceneId}
        sceneRemoteHoldEnabled={selectors.sceneRemoteHoldEnabled}
      />
      {dockManagerOpen ? (
        <WorkspaceDockManager
          onClose={() => setDockManagerOpen(false)}
          onSetWidgetVisible={setWidgetVisibilityFromWorkspace}
          onToggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          onToggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          widgets={selectors.widgets}
        />
      ) : null}

      <main className="cad-workspace-main">
        <WorkspaceLeftPanel
          selectors={selectors}
          leftPanelWidthPx={leftPanelWidthPx}
          beginResize={beginResize}
          toggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          toggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          setWidgetVisibility={setWidgetVisibilityFromWorkspace}
        />

        <section className="workspace-center">
          <WorkspaceToolrail
            activeTool={selectors.activeTool}
            cameraView={selectors.cameraView}
            canSnapSelection={canSnapSelection}
            dispatch={dispatchFromWorkspace}
            projectionMode={selectors.projectionMode}
            showDimensions={selectors.showDimensions}
          />
          <WorkspaceViewportShell
            activeTool={selectors.activeTool}
            cameraQuaternion={selectors.viewportCameraQuaternion}
            cameraView={selectors.cameraView}
            detectionCount={selectors.detectionCount}
            dispatch={dispatchFromWorkspace}
            monitoringCameraCount={selectors.monitoringCameraCount}
            projectionMode={selectors.projectionMode}
            sceneId={selectors.sceneId}
            scenePlacementsCount={selectors.scenePlacementsCount}
          />
        </section>

        <WorkspaceRightPanel
          selectors={selectors}
          beginResize={beginResize}
          dispatch={dispatchFromWorkspace}
          dockManagerOpen={dockManagerOpen}
          onToggleDockManager={() => setDockManagerOpen((open) => !open)}
          rightPanelWidthPx={rightPanelWidthPx}
          outlinerHeightPx={outlinerHeightPx}
          toggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          toggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          setWidgetVisibility={setWidgetVisibilityFromWorkspace}
        />
      </main>

      <WorkspaceStatusBar
        activeToolMode={selectors.activeTool}
        bridgeUrl={selectors.bridgeUrl}
        cameraView={selectors.cameraView}
        projectionMode={selectors.projectionMode}
        detectionCount={selectors.detectionCount}
        monitoringCameraCount={selectors.monitoringCameraCount}
        placementCount={selectors.scenePlacementsCount}
        sceneEditEnabled={selectors.sceneEditEnabled}
        sceneEventTerminalOpen={selectors.sceneEventTerminalOpen}
        sceneId={selectors.sceneId}
        sceneRemoteHoldEnabled={selectors.sceneRemoteHoldEnabled}
        sceneRevision={selectors.sceneRevision}
        sceneSequence={selectors.sceneSequence}
      />

      <WorkspaceTerminalStrip
        terminalOpen={selectors.sceneEventTerminalOpen}
        terminalHeightPx={selectors.terminalHeightPx}
        eventCount={selectors.sceneEventLogCount}
        onToggle={() => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' })}
        beginResize={beginResize}
      />

      <WorkspaceCommandPalette actions={quickActions} dispatch={dispatchFromWorkspace} />
    </div>
  )
}
