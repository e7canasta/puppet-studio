import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { usePoseStore } from '../../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../../core/app-commanding'
import { SCENE_COMMAND_SNAP_STEP_M } from '../../../../core/config'
import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'
import {
  createPoseStoreCommandDispatcher,
  IconCamera,
  IconCube,
  IconMeasure,
  IconMove,
  IconOutliner,
  IconPlanogram,
  IconRotate,
  IconSelect,
  IconSimulate,
  IconSnap,
  IconSliders,
  IconStats,
} from '../../../../shared/ui'
import { useWorkspaceHudState } from '../../hooks'
import {
  WORKSPACE_COMMAND_PALETTE_EVENT,
  WorkspaceCommandPalette,
  type WorkspaceQuickAction,
} from '../components/WorkspaceCommandPalette'
import { WorkspaceAxisGizmo } from '../components/WorkspaceAxisGizmo'
import { WorkspaceDockManager } from '../components/WorkspaceDockManager'
import { WorkspaceHeaderBar } from '../components/WorkspaceHeaderBar'
import { WorkspaceSceneOutliner } from '../components/WorkspaceSceneOutliner'
import { WorkspaceStatusBar } from '../components/WorkspaceStatusBar'
import { WorkspaceViewportAxisReference } from '../components/WorkspaceViewportAxisReference'
import { WorkspaceViewCube } from '../components/WorkspaceViewCube'
import { WorkspaceWidgetCard } from '../components/WorkspaceWidgetCard'

const PuppetScene = lazy(() =>
  import('../../../scene/ui/PuppetScene').then((module) => ({ default: module.PuppetScene })),
)
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

type ResizeKind = 'left' | 'right' | 'right_outliner' | 'terminal'

type ResizeStart = {
  kind: ResizeKind
  pointerId: number
  sizePx: number
  x: number
  y: number
}

function formatCameraViewLabel(view: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'): string {
  if (view === 'iso') return 'iso view'
  if (view === 'sensor') return 'cam'
  return view
}

export function CadWorkspacePage() {
  const bridgeStatus = usePoseStore((state) => state.bridgeStatus)
  const bridgeUrl = usePoseStore((state) => state.bridgeUrl)
  const cameraView = usePoseStore((state) => state.cameraView)
  const viewportCameraQuaternion = usePoseStore((state) => state.viewportCameraQuaternion)
  const monitoringCameraCount = usePoseStore((state) => state.monitoringCameras.length)
  const projectionMode = usePoseStore((state) => state.projectionMode)
  const sceneEditEnabled = usePoseStore((state) => state.sceneEditEnabled)
  const sceneEventTerminalOpen = usePoseStore((state) => state.sceneEventTerminalOpen)
  const sceneId = usePoseStore((state) => state.sceneId)
  const scenePlacementsCount = usePoseStore((state) => state.scenePlacements.length)
  const sceneRemoteHoldEnabled = usePoseStore((state) => state.sceneRemoteHoldEnabled)
  const sceneRevision = usePoseStore((state) => state.sceneRevision)
  const sceneSequence = usePoseStore((state) => state.sceneSequence)
  const sceneEventLogCount = usePoseStore((state) => state.sceneEventLog.length)
  const activeTool = usePoseStore((state) => state.activeToolMode)
  const selectedPlacementId = usePoseStore((state) => state.selectedPlacementId)
  const showDimensions = usePoseStore((state) => state.showDimensions)
  const detectionCount = usePoseStore((state) =>
    state.cameraDetectionOverlays.reduce((total, overlay) => total + overlay.boxes.length, 0),
  )
  const activeCapabilities = useMemo(
    () => listPoseStoreEngineCapabilities().filter((capability) => capability.enabled).length,
    [sceneEventLogCount],
  )
  const dispatchFromWorkspace = createPoseStoreCommandDispatcher('ui.workspace_shell')
  const {
    leftPanelSizePx,
    leftPanelOpen,
    rightPanelSizePx,
    rightPanelOpen,
    rightPanelOutlinerHeightPx,
    showCameraWidget,
    showOutlinerWidget,
    showPropertiesWidget,
    showPlanWidget,
    terminalHeightPx,
    setLeftPanelSize,
    setRightPanelOutlinerHeight,
    setRightPanelSize,
    setTerminalHeight,
    widgets,
  } = useWorkspaceHudState()

  const resizeStartRef = useRef<ResizeStart | null>(null)
  const [dockManagerOpen, setDockManagerOpen] = useState(false)

  const openWorkspaceCommandPalette = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_COMMAND_PALETTE_EVENT, {
        detail: { open: true },
      }),
    )
  }, [])

  const setWidgetVisibilityFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId, visible: boolean) => {
      dispatchFromWorkspace({ kind: 'set_workspace_widget_visible', visible, widget })
    },
    [dispatchFromWorkspace],
  )

  const toggleWidgetCollapsedFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId) => {
      dispatchFromWorkspace({ kind: 'toggle_workspace_widget_collapsed', widget })
    },
    [dispatchFromWorkspace],
  )

  const toggleWidgetPinnedFromWorkspace = useCallback(
    (widget: WorkspaceWidgetId) => {
      dispatchFromWorkspace({ kind: 'toggle_workspace_widget_pinned', widget })
    },
    [dispatchFromWorkspace],
  )

  const handleResizeMove = useCallback(
    (event: PointerEvent) => {
      const resizeStart = resizeStartRef.current
      if (!resizeStart) return
      if (resizeStart.pointerId !== event.pointerId) return

      if (resizeStart.kind === 'left') {
        const deltaX = event.clientX - resizeStart.x
        setLeftPanelSize(resizeStart.sizePx + deltaX)
        return
      }
      if (resizeStart.kind === 'right') {
        const deltaX = event.clientX - resizeStart.x
        setRightPanelSize(resizeStart.sizePx - deltaX)
        return
      }
      if (resizeStart.kind === 'right_outliner') {
        const deltaY = event.clientY - resizeStart.y
        setRightPanelOutlinerHeight(resizeStart.sizePx + deltaY)
        return
      }
      const deltaY = event.clientY - resizeStart.y
      setTerminalHeight(resizeStart.sizePx - deltaY)
    },
    [setLeftPanelSize, setRightPanelOutlinerHeight, setRightPanelSize, setTerminalHeight],
  )

  const handleResizeEnd = useCallback(
    (event: PointerEvent) => {
      const resizeStart = resizeStartRef.current
      if (!resizeStart || resizeStart.pointerId !== event.pointerId) return
      resizeStartRef.current = null
      window.removeEventListener('pointermove', handleResizeMove)
      window.removeEventListener('pointerup', handleResizeEnd)
    },
    [handleResizeMove],
  )

  const beginResize = useCallback(
    (kind: ResizeKind) => (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const sizePx =
        kind === 'left'
          ? leftPanelSizePx
          : kind === 'right'
            ? rightPanelSizePx
            : kind === 'right_outliner'
              ? rightPanelOutlinerHeightPx
              : terminalHeightPx
      resizeStartRef.current = {
        kind,
        pointerId: event.pointerId,
        sizePx,
        x: event.clientX,
        y: event.clientY,
      }
      window.addEventListener('pointermove', handleResizeMove)
      window.addEventListener('pointerup', handleResizeEnd)
    },
    [
      handleResizeEnd,
      handleResizeMove,
      leftPanelSizePx,
      rightPanelOutlinerHeightPx,
      rightPanelSizePx,
      terminalHeightPx,
    ],
  )

  const quickActions = useMemo<WorkspaceQuickAction[]>(
    () => [
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_workspace_left_panel' }),
        group: 'Layout',
        id: 'toggle_left_panel',
        keywords: 'layout panel left properties',
        label: leftPanelOpen ? 'Hide Left Panel' : 'Show Left Panel',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_workspace_right_panel' }),
        group: 'Layout',
        id: 'toggle_right_panel',
        keywords: 'layout panel right outliner',
        label: rightPanelOpen ? 'Hide Right Panel' : 'Show Right Panel',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' }),
        group: 'Terminal',
        id: 'toggle_terminal',
        keywords: 'terminal event log',
        label: sceneEventTerminalOpen ? 'Hide Terminal' : 'Show Terminal',
        shortcut: STUDIO_SHORTCUTS.terminal.toggle,
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_scene_edit' }),
        group: 'Scene',
        id: 'toggle_edit',
        keywords: 'scene edit mode',
        label: sceneEditEnabled ? 'Disable Edit Mode' : 'Enable Edit Mode',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_scene_remote_hold' }),
        group: 'Scene',
        id: 'toggle_remote_hold',
        keywords: 'remote hold sync',
        label: sceneRemoteHoldEnabled ? 'Disable Remote Hold' : 'Enable Remote Hold',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'iso' }),
        group: 'View',
        id: 'view_iso',
        keywords: 'camera view iso',
        label: 'Switch View: Iso View',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'top' }),
        group: 'View',
        id: 'view_top',
        keywords: 'camera view top',
        label: 'Switch View: Top',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'front' }),
        group: 'View',
        id: 'view_front',
        keywords: 'camera view front',
        label: 'Switch View: Front',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'back' }),
        group: 'View',
        id: 'view_back',
        keywords: 'camera view back rear',
        label: 'Switch View: Back',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'left' }),
        group: 'View',
        id: 'view_left',
        keywords: 'camera view left lateral',
        label: 'Switch View: Left',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'right' }),
        group: 'View',
        id: 'view_right',
        keywords: 'camera view right lateral',
        label: 'Switch View: Right',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'sensor' }),
        group: 'View',
        id: 'view_sensor',
        keywords: 'camera view sensor cam',
        label: 'Switch View: Cam',
      },
      {
        execute: () =>
          dispatchFromWorkspace({
            kind: 'set_projection_mode',
            mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
          }),
        group: 'View',
        id: 'toggle_projection_mode',
        keywords: 'projection ortho perspective',
        label: projectionMode === 'orthographic' ? 'Projection: Perspective' : 'Projection: Orthographic',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'select' }),
        group: 'Tools',
        id: 'tool_select',
        keywords: 'tool select cursor',
        label: activeTool === 'select' ? 'Tool: Select (active)' : 'Tool: Select',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'move' }),
        group: 'Tools',
        id: 'tool_move',
        keywords: 'tool move transform',
        label: activeTool === 'move' ? 'Tool: Move (active)' : 'Tool: Move',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'rotate' }),
        group: 'Tools',
        id: 'tool_rotate',
        keywords: 'tool rotate transform',
        label: activeTool === 'rotate' ? 'Tool: Rotate (active)' : 'Tool: Rotate',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'request_engine_stats' }),
        group: 'Engine',
        id: 'request_engine_stats',
        keywords: 'engine stats telemetry',
        label: 'Request Engine Stats',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'request_engine_sim_preview' }),
        group: 'Engine',
        id: 'request_engine_sim_preview',
        keywords: 'engine sim preview',
        label: 'Request Simulation Preview',
      },
      {
        execute: () => {
          if (!selectedPlacementId) return
          dispatchFromWorkspace({
            kind: 'run_scene_command',
            command: { kind: 'snap_selected_to_grid', stepM: SCENE_COMMAND_SNAP_STEP_M },
          })
        },
        group: 'Tools',
        id: 'snap_selected_to_grid',
        keywords: 'scene snap grid align placement',
        label: selectedPlacementId ? 'Snap Selected Placement' : 'Snap Selected Placement (select one first)',
        shortcut: STUDIO_SHORTCUTS.scene.snap,
      },
      {
        execute: () =>
          dispatchFromWorkspace({
            kind: 'set_show_dimensions',
            show: !showDimensions,
          }),
        group: 'Tools',
        id: 'toggle_dimensions',
        keywords: 'measure dimensions overlay',
        label: showDimensions ? 'Hide Dimensions Overlay' : 'Show Dimensions Overlay',
        shortcut: STUDIO_SHORTCUTS.scene.measure,
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'apply_workspace_layout_preset', preset: 'focus' }),
        group: 'Layout',
        id: 'apply_layout_focus',
        keywords: 'layout preset focus',
        label: 'Layout Preset: Focus',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'apply_workspace_layout_preset', preset: 'authoring' }),
        group: 'Layout',
        id: 'apply_layout_authoring',
        keywords: 'layout preset authoring',
        label: 'Layout Preset: Authoring',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'apply_workspace_layout_preset', preset: 'observability' }),
        group: 'Layout',
        id: 'apply_layout_observability',
        keywords: 'layout preset observability',
        label: 'Layout Preset: Observability',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'restore_workspace_layout_defaults' }),
        group: 'Layout',
        id: 'restore_layout_defaults',
        keywords: 'layout reset defaults',
        label: 'Restore Layout Defaults',
      },
      {
        execute: () => dispatchFromWorkspace({ kind: 'toggle_workspace_widget_collapsed', widget: 'outliner' }),
        group: 'Widgets',
        id: 'toggle_outliner_collapsed',
        keywords: 'widget outliner collapse expand',
        label: widgets.outliner.collapsed ? 'Expand Outliner Widget' : 'Collapse Outliner Widget',
      },
      {
        execute: () =>
          dispatchFromWorkspace({
            kind: 'set_workspace_widget_visible',
            visible: !widgets.camera.visible,
            widget: 'camera',
          }),
        group: 'Widgets',
        id: 'toggle_camera_widget',
        keywords: 'widget camera show hide',
        label: widgets.camera.visible ? 'Hide Camera Widget' : 'Show Camera Widget',
      },
      {
        execute: () =>
          dispatchFromWorkspace({
            kind: 'set_workspace_widget_visible',
            visible: !widgets.planogram.visible,
            widget: 'planogram',
          }),
        group: 'Widgets',
        id: 'toggle_planogram_widget',
        keywords: 'widget planogram show hide',
        label: widgets.planogram.visible ? 'Hide Planogram Widget' : 'Show Planogram Widget',
      },
    ],
    [
      dispatchFromWorkspace,
      leftPanelOpen,
      activeTool,
      projectionMode,
      rightPanelOpen,
      sceneEditEnabled,
      sceneEventTerminalOpen,
      sceneRemoteHoldEnabled,
      selectedPlacementId,
      showDimensions,
      widgets.camera.visible,
      widgets.outliner.collapsed,
      widgets.planogram.visible,
    ],
  )

  const leftPanelWidthPx = widgets.properties.collapsed ? 220 : leftPanelSizePx
  const anyRightWidgetVisible = showOutlinerWidget || showCameraWidget || showPlanWidget
  const rightPanelWidthPx = widgets.outliner.collapsed ? Math.max(280, rightPanelSizePx - 40) : rightPanelSizePx
  const outlinerHeightPx = widgets.outliner.collapsed ? 36 : rightPanelOutlinerHeightPx
  const canSnapSelection = sceneEditEnabled && Boolean(selectedPlacementId)

  return (
    <div className={`cad-workspace ${sceneEventTerminalOpen ? 'terminal-open' : 'terminal-closed'}`}>
      <WorkspaceHeaderBar
        activeCapabilities={activeCapabilities}
        bridgeStatus={bridgeStatus}
        cameraView={cameraView}
        dockManagerOpen={dockManagerOpen}
        leftPanelOpen={leftPanelOpen}
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
        projectionMode={projectionMode}
        rightPanelOpen={rightPanelOpen}
        sceneEditEnabled={sceneEditEnabled}
        sceneEventTerminalOpen={sceneEventTerminalOpen}
        sceneId={sceneId}
        sceneRemoteHoldEnabled={sceneRemoteHoldEnabled}
      />
      {dockManagerOpen ? (
        <WorkspaceDockManager
          onClose={() => setDockManagerOpen(false)}
          onSetWidgetVisible={setWidgetVisibilityFromWorkspace}
          onToggleWidgetCollapsed={toggleWidgetCollapsedFromWorkspace}
          onToggleWidgetPinned={toggleWidgetPinnedFromWorkspace}
          widgets={widgets}
        />
      ) : null}

      <main className="cad-workspace-main">
        {showPropertiesWidget ? (
          <aside className="workspace-side workspace-side-left" style={{ width: `${leftPanelWidthPx}px` }}>
            <div className="workspace-side-content workspace-side-content-tight">
              <WorkspaceWidgetCard
                collapsed={widgets.properties.collapsed}
                icon={<IconSliders className="workspace-widget-head-icon" />}
                label="Properties"
                pinned={widgets.properties.pinned}
                onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('properties')}
                onTogglePinned={() => toggleWidgetPinnedFromWorkspace('properties')}
                onHide={() => setWidgetVisibilityFromWorkspace('properties', false)}
              >
                <Suspense fallback={<div className="panel-shell-loading">Loading controls...</div>}>
                  <PoseControlPanel />
                </Suspense>
              </WorkspaceWidgetCard>
            </div>
          </aside>
        ) : null}
        {showPropertiesWidget ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('left')} /> : null}

        <section className="workspace-center">
          <div className="workspace-toolrail">
            <button
              type="button"
              className={activeTool === 'select' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'select' })}
              title="Select tool"
            >
              <IconSelect className="workspace-toolrail-icon" />
              Sel
            </button>
            <button
              type="button"
              className={activeTool === 'move' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'move' })}
              title="Move tool"
            >
              <IconMove className="workspace-toolrail-icon" />
              Mv
            </button>
            <button
              type="button"
              className={activeTool === 'rotate' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_active_tool', mode: 'rotate' })}
              title="Rotate tool"
            >
              <IconRotate className="workspace-toolrail-icon" />
              Rot
            </button>
            <div className="workspace-toolrail-separator" />
            <button
              type="button"
              className={cameraView === 'iso' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'iso' })}
              title="Isometric view"
            >
              <IconCube className="workspace-toolrail-icon" />
              IsoV
            </button>
            <button
              type="button"
              className={cameraView === 'front' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'front' })}
              title="Front view"
            >
              <IconCube className="workspace-toolrail-icon" />
              Fr
            </button>
            <button
              type="button"
              className={cameraView === 'right' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'right' })}
              title="Right view"
            >
              <IconCube className="workspace-toolrail-icon" />
              Rt
            </button>
            <button
              type="button"
              className={cameraView === 'left' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'left' })}
              title="Left view"
            >
              <IconCube className="workspace-toolrail-icon" />
              Lf
            </button>
            <button
              type="button"
              className={cameraView === 'back' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'back' })}
              title="Back view"
            >
              <IconCube className="workspace-toolrail-icon" />
              Bk
            </button>
            <button
              type="button"
              className={cameraView === 'top' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'top' })}
              title="Top view"
            >
              <IconRotate className="workspace-toolrail-icon" />
              Top
            </button>
            <button
              type="button"
              className={cameraView === 'sensor' ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_camera_view', view: 'sensor' })}
              title="Camera view"
            >
              <IconCamera className="workspace-toolrail-icon" />
              Cam
            </button>
            <button
              type="button"
              className={projectionMode === 'orthographic' ? 'active' : ''}
              onClick={() =>
                dispatchFromWorkspace({
                  kind: 'set_projection_mode',
                  mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
                })
              }
              title="Toggle projection"
            >
              <IconCube className="workspace-toolrail-icon" />
              {projectionMode === 'orthographic' ? 'Ortho' : 'Persp'}
            </button>
            <button type="button" onClick={() => dispatchFromWorkspace({ kind: 'request_engine_stats' })} title="Engine stats">
              <IconStats className="workspace-toolrail-icon" />
              Stats
            </button>
            <button
              type="button"
              onClick={() => dispatchFromWorkspace({ kind: 'request_engine_sim_preview' })}
              title="Simulation preview"
            >
              <IconSimulate className="workspace-toolrail-icon" />
              Sim
            </button>
            <div className="workspace-toolrail-separator" />
            <button
              type="button"
              onClick={() =>
                dispatchFromWorkspace({
                  kind: 'run_scene_command',
                  command: { kind: 'snap_selected_to_grid', stepM: SCENE_COMMAND_SNAP_STEP_M },
                })
              }
              disabled={!canSnapSelection}
              title={`Snap selected placement (${STUDIO_SHORTCUTS.scene.snap})`}
            >
              <IconSnap className="workspace-toolrail-icon" />
              Snap
            </button>
            <button
              type="button"
              className={showDimensions ? 'active' : ''}
              onClick={() => dispatchFromWorkspace({ kind: 'set_show_dimensions', show: !showDimensions })}
              title={`Toggle dimensions overlay (${STUDIO_SHORTCUTS.scene.measure})`}
            >
              <IconMeasure className="workspace-toolrail-icon" />
              Dims
            </button>
          </div>
          <div className="workspace-viewport-shell">
            <Suspense fallback={<div className="scene-shell-loading">Loading scene...</div>}>
              <PuppetScene />
            </Suspense>
            <WorkspaceViewportAxisReference />
            <div className="workspace-viewport-overlay">
              <div className="workspace-viewport-overlay-line">
                <span>{sceneId}</span>
                <span>|</span>
                <span>{formatCameraViewLabel(cameraView)}</span>
                <span>|</span>
                <span
                  className={`workspace-projection-badge ${projectionMode === 'orthographic' ? 'orthographic' : 'perspective'}`}
                >
                  {projectionMode === 'orthographic' ? 'ORTHO' : 'PERSP'}
                </span>
              </div>
              <div className="workspace-viewport-overlay-line muted">
                <span>entities: {scenePlacementsCount}</span>
                <span>|</span>
                <span>cams: {monitoringCameraCount}</span>
                <span>|</span>
                <span>det: {detectionCount}</span>
                <span>|</span>
                <span>tool: {activeTool}</span>
              </div>
            </div>
            <div className="workspace-viewport-gizmo">
              <WorkspaceAxisGizmo cameraQuaternion={viewportCameraQuaternion} />
            </div>
            <div className="workspace-viewport-viewcube">
              <WorkspaceViewCube
                cameraView={cameraView}
                cameraQuaternion={viewportCameraQuaternion}
                projectionMode={projectionMode}
                onSetCameraView={(view) => dispatchFromWorkspace({ kind: 'set_camera_view', view })}
                onToggleProjectionMode={() =>
                  dispatchFromWorkspace({
                    kind: 'set_projection_mode',
                    mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
                  })
                }
              />
            </div>
          </div>
        </section>

        {rightPanelOpen && anyRightWidgetVisible ? <div className="workspace-resize-handle vertical" onPointerDown={beginResize('right')} /> : null}
        {rightPanelOpen && anyRightWidgetVisible ? (
          <aside className="workspace-side workspace-side-right" style={{ width: `${rightPanelWidthPx}px` }}>
            <div className="workspace-side-head workspace-side-head-wrap">
              <button
                type="button"
                className={showOutlinerWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('outliner', !widgets.outliner.visible)}
              >
                Outliner
              </button>
              <button
                type="button"
                className={showCameraWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('camera', !widgets.camera.visible)}
              >
                Camera
              </button>
              <button
                type="button"
                className={showPlanWidget ? 'active' : ''}
                onClick={() => setWidgetVisibilityFromWorkspace('planogram', !widgets.planogram.visible)}
              >
                Planogram
              </button>
              <button type="button" className={dockManagerOpen ? 'active' : ''} onClick={() => setDockManagerOpen((open) => !open)}>
                Dock
              </button>
            </div>
            <div className="workspace-side-content workspace-side-content-split">
              {showOutlinerWidget ? (
                <div
                  className={`workspace-right-panel-top ${showCameraWidget || showPlanWidget ? '' : 'fill'}`}
                  style={showCameraWidget || showPlanWidget ? { height: `${outlinerHeightPx}px` } : undefined}
                >
                  <WorkspaceWidgetCard
                    collapsed={widgets.outliner.collapsed}
                    icon={<IconOutliner className="workspace-widget-head-icon" />}
                    label="Scene Outliner"
                    pinned={widgets.outliner.pinned}
                    onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('outliner')}
                    onTogglePinned={() => toggleWidgetPinnedFromWorkspace('outliner')}
                    onHide={() => setWidgetVisibilityFromWorkspace('outliner', false)}
                  >
                    <WorkspaceSceneOutliner />
                  </WorkspaceWidgetCard>
                </div>
              ) : null}
              {showOutlinerWidget && (showCameraWidget || showPlanWidget) && !widgets.outliner.collapsed ? (
                <div className="workspace-resize-handle horizontal inset" onPointerDown={beginResize('right_outliner')} />
              ) : null}
              {showCameraWidget || showPlanWidget ? (
                <div className="workspace-right-panel-bottom workspace-widget-stack">
                  {showCameraWidget ? (
                    <WorkspaceWidgetCard
                      collapsed={widgets.camera.collapsed}
                      icon={<IconCamera className="workspace-widget-head-icon" />}
                      label="Camera Map"
                      pinned={widgets.camera.pinned}
                      onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('camera')}
                      onTogglePinned={() => toggleWidgetPinnedFromWorkspace('camera')}
                      onHide={() => setWidgetVisibilityFromWorkspace('camera', false)}
                    >
                      <Suspense fallback={<div className="hud-widget-loading">Loading camera map...</div>}>
                        <CameraSubspaceMap />
                      </Suspense>
                    </WorkspaceWidgetCard>
                  ) : null}
                  {showPlanWidget ? (
                    <WorkspaceWidgetCard
                      collapsed={widgets.planogram.collapsed}
                      icon={<IconPlanogram className="workspace-widget-head-icon" />}
                      label="Planogram"
                      pinned={widgets.planogram.pinned}
                      onToggleCollapsed={() => toggleWidgetCollapsedFromWorkspace('planogram')}
                      onTogglePinned={() => toggleWidgetPinnedFromWorkspace('planogram')}
                      onHide={() => setWidgetVisibilityFromWorkspace('planogram', false)}
                    >
                      <Suspense fallback={<div className="hud-widget-loading">Loading planogram...</div>}>
                        <PlanogramMiniMap />
                      </Suspense>
                    </WorkspaceWidgetCard>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </main>

      <WorkspaceStatusBar
        activeToolMode={activeTool}
        bridgeUrl={bridgeUrl}
        cameraView={cameraView}
        projectionMode={projectionMode}
        detectionCount={detectionCount}
        monitoringCameraCount={monitoringCameraCount}
        placementCount={scenePlacementsCount}
        sceneEditEnabled={sceneEditEnabled}
        sceneEventTerminalOpen={sceneEventTerminalOpen}
        sceneId={sceneId}
        sceneRemoteHoldEnabled={sceneRemoteHoldEnabled}
        sceneRevision={sceneRevision}
        sceneSequence={sceneSequence}
      />

      <div className="workspace-terminal-strip" style={{ height: sceneEventTerminalOpen ? `${terminalHeightPx + 8}px` : '34px' }}>
        {sceneEventTerminalOpen ? <div className="workspace-resize-handle horizontal" onPointerDown={beginResize('terminal')} /> : null}
        {sceneEventTerminalOpen ? (
          <Suspense fallback={<div className="terminal-shell-loading">Loading terminal...</div>}>
            <SceneEventTerminal layout="docked" />
          </Suspense>
        ) : (
          <button
            type="button"
            className="workspace-terminal-collapsed-bar"
            onClick={() => dispatchFromWorkspace({ kind: 'toggle_scene_event_terminal' })}
          >
            <span>Event Terminal</span>
            <span>events:{sceneEventLogCount}</span>
            <span>{STUDIO_SHORTCUTS.terminal.toggle}</span>
          </button>
        )}
      </div>

      <WorkspaceCommandPalette actions={quickActions} />
    </div>
  )
}
