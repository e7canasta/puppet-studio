import { lazy, Suspense } from 'react'
import type { AppCommand } from '../../../../core/app-commanding'
import type { CameraView, ProjectionMode, ViewportCameraQuaternion } from '../../../../app/state/viewportStore'
import type { ToolMode } from '../../../../app/state/uiStore'
import { WorkspaceAxisGizmo } from './WorkspaceAxisGizmo'
import { WorkspaceViewportAxisReference } from './WorkspaceViewportAxisReference'
import { WorkspaceViewCube } from './WorkspaceViewCube'

const PuppetScene = lazy(() =>
  import('../../../scene/ui/PuppetScene').then((module) => ({ default: module.PuppetScene })),
)

function formatCameraViewLabel(view: CameraView): string {
  if (view === 'iso') return 'iso view'
  if (view === 'sensor') return 'cam'
  return view
}

export type WorkspaceViewportShellProps = {
  activeTool: ToolMode
  cameraQuaternion: ViewportCameraQuaternion
  cameraView: CameraView
  detectionCount: number
  dispatch: (command: AppCommand) => void
  monitoringCameraCount: number
  projectionMode: ProjectionMode
  sceneId: string
  scenePlacementsCount: number
}

export function WorkspaceViewportShell({
  activeTool,
  cameraQuaternion,
  cameraView,
  detectionCount,
  dispatch,
  monitoringCameraCount,
  projectionMode,
  sceneId,
  scenePlacementsCount,
}: WorkspaceViewportShellProps) {
  return (
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
        <WorkspaceAxisGizmo cameraQuaternion={cameraQuaternion} />
      </div>
      <div className="workspace-viewport-viewcube">
        <WorkspaceViewCube
          cameraView={cameraView}
          cameraQuaternion={cameraQuaternion}
          projectionMode={projectionMode}
          onSetCameraView={(view) => dispatch({ kind: 'set_camera_view', view })}
          onToggleProjectionMode={() =>
            dispatch({
              kind: 'set_projection_mode',
              mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
            })
          }
        />
      </div>
    </div>
  )
}
