import { SCENE_COMMAND_SNAP_STEP_M } from '../../../../core/config'
import type { AppCommand } from '../../../../core/app-commanding'
import type { CameraView, ProjectionMode } from '../../../../app/state/viewportStore'
import type { ToolMode } from '../../../../app/state/uiStore'
import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'
import {
  IconCamera,
  IconCube,
  IconMeasure,
  IconMove,
  IconRotate,
  IconSelect,
  IconSimulate,
  IconSnap,
  IconStats,
} from '../../../../shared/ui'

export type WorkspaceToolrailProps = {
  activeTool: ToolMode
  cameraView: CameraView
  canSnapSelection: boolean
  dispatch: (command: AppCommand) => void
  projectionMode: ProjectionMode
  showDimensions: boolean
}

export function WorkspaceToolrail({
  activeTool,
  cameraView,
  canSnapSelection,
  dispatch,
  projectionMode,
  showDimensions,
}: WorkspaceToolrailProps) {
  return (
    <div className="workspace-toolrail">
      <button
        type="button"
        className={activeTool === 'select' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_active_tool', mode: 'select' })}
        title="Select tool"
      >
        <IconSelect className="workspace-toolrail-icon" />
        Sel
      </button>
      <button
        type="button"
        className={activeTool === 'move' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_active_tool', mode: 'move' })}
        title="Move tool"
      >
        <IconMove className="workspace-toolrail-icon" />
        Mv
      </button>
      <button
        type="button"
        className={activeTool === 'rotate' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_active_tool', mode: 'rotate' })}
        title="Rotate tool"
      >
        <IconRotate className="workspace-toolrail-icon" />
        Rot
      </button>
      <div className="workspace-toolrail-separator" />
      <button
        type="button"
        className={cameraView === 'iso' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'iso' })}
        title="Isometric view"
      >
        <IconCube className="workspace-toolrail-icon" />
        IsoV
      </button>
      <button
        type="button"
        className={cameraView === 'front' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'front' })}
        title="Front view"
      >
        <IconCube className="workspace-toolrail-icon" />
        Fr
      </button>
      <button
        type="button"
        className={cameraView === 'right' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'right' })}
        title="Right view"
      >
        <IconCube className="workspace-toolrail-icon" />
        Rt
      </button>
      <button
        type="button"
        className={cameraView === 'left' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'left' })}
        title="Left view"
      >
        <IconCube className="workspace-toolrail-icon" />
        Lf
      </button>
      <button
        type="button"
        className={cameraView === 'back' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'back' })}
        title="Back view"
      >
        <IconCube className="workspace-toolrail-icon" />
        Bk
      </button>
      <button
        type="button"
        className={cameraView === 'top' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'top' })}
        title="Top view"
      >
        <IconRotate className="workspace-toolrail-icon" />
        Top
      </button>
      <button
        type="button"
        className={cameraView === 'sensor' ? 'active' : ''}
        onClick={() => dispatch({ kind: 'set_camera_view', view: 'sensor' })}
        title="Camera view"
      >
        <IconCamera className="workspace-toolrail-icon" />
        Cam
      </button>
      <button
        type="button"
        className={projectionMode === 'orthographic' ? 'active' : ''}
        onClick={() =>
          dispatch({
            kind: 'set_projection_mode',
            mode: projectionMode === 'orthographic' ? 'perspective' : 'orthographic',
          })
        }
        title="Toggle projection"
      >
        <IconCube className="workspace-toolrail-icon" />
        {projectionMode === 'orthographic' ? 'Ortho' : 'Persp'}
      </button>
      <button type="button" onClick={() => dispatch({ kind: 'request_engine_stats' })} title="Engine stats">
        <IconStats className="workspace-toolrail-icon" />
        Stats
      </button>
      <button type="button" onClick={() => dispatch({ kind: 'request_engine_sim_preview' })} title="Simulation preview">
        <IconSimulate className="workspace-toolrail-icon" />
        Sim
      </button>
      <div className="workspace-toolrail-separator" />
      <button
        type="button"
        onClick={() =>
          dispatch({
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
        onClick={() => dispatch({ kind: 'set_show_dimensions', show: !showDimensions })}
        title={`Toggle dimensions overlay (${STUDIO_SHORTCUTS.scene.measure})`}
      >
        <IconMeasure className="workspace-toolrail-icon" />
        Dims
      </button>
    </div>
  )
}
