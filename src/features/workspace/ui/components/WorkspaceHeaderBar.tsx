import type { WorkspaceLayoutPreset } from '../../../../core/workspace-shell'
import {
  IconCamera,
  IconCommand,
  IconCube,
  IconDock,
  IconPanelLeft,
  IconPanelRight,
  IconRotate,
  IconTerminal,
} from '../../../../shared/ui'

type WorkspaceBridgeStatus = 'connected' | 'connecting' | 'disconnected'
type WorkspaceCameraView = 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
type WorkspaceProjectionMode = 'orthographic' | 'perspective'

type WorkspaceHeaderBarProps = {
  activeCapabilities: number
  bridgeStatus: WorkspaceBridgeStatus
  cameraView: WorkspaceCameraView
  dockManagerOpen: boolean
  leftPanelOpen: boolean
  onApplyLayoutPreset: (preset: WorkspaceLayoutPreset) => void
  onToggleDockManager: () => void
  onSetCameraView: (view: WorkspaceCameraView) => void
  onSetProjectionMode: (mode: WorkspaceProjectionMode) => void
  onOpenCommandPalette: () => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  onToggleSceneEdit: () => void
  onToggleSceneRemoteHold: () => void
  onToggleTerminal: () => void
  onRestoreLayoutDefaults: () => void
  projectionMode: WorkspaceProjectionMode
  rightPanelOpen: boolean
  sceneEditEnabled: boolean
  sceneEventTerminalOpen: boolean
  sceneId: string
  sceneRemoteHoldEnabled: boolean
}

function bridgeStatusClassName(status: WorkspaceBridgeStatus): string {
  if (status === 'connected') return 'connected'
  if (status === 'connecting') return 'connecting'
  return 'disconnected'
}

export function WorkspaceHeaderBar({
  activeCapabilities,
  bridgeStatus,
  cameraView,
  dockManagerOpen,
  leftPanelOpen,
  onApplyLayoutPreset,
  onToggleDockManager,
  onSetCameraView,
  onSetProjectionMode,
  onOpenCommandPalette,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleSceneEdit,
  onToggleSceneRemoteHold,
  onToggleTerminal,
  onRestoreLayoutDefaults,
  projectionMode,
  rightPanelOpen,
  sceneEditEnabled,
  sceneEventTerminalOpen,
  sceneId,
  sceneRemoteHoldEnabled,
}: WorkspaceHeaderBarProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-brand">
        <span className="workspace-wordmark">SIMULA</span>
        <span className="workspace-divider">|</span>
        <span className="workspace-scene-id">{sceneId}</span>
      </div>

      <div className="workspace-header-tools">
        <div className="workspace-chip-group">
          <button
            type="button"
            className={`workspace-chip ${cameraView === 'iso' ? 'active' : ''}`}
            onClick={() => onSetCameraView('iso')}
          >
            <IconCube className="workspace-chip-icon" />
            Iso View
          </button>
          <button
            type="button"
            className={`workspace-chip ${cameraView === 'front' ? 'active' : ''}`}
            onClick={() => onSetCameraView('front')}
          >
            <IconCube className="workspace-chip-icon" />
            Front
          </button>
          <button
            type="button"
            className={`workspace-chip ${cameraView === 'right' ? 'active' : ''}`}
            onClick={() => onSetCameraView('right')}
          >
            <IconCube className="workspace-chip-icon" />
            Right
          </button>
          <button
            type="button"
            className={`workspace-chip ${cameraView === 'top' ? 'active' : ''}`}
            onClick={() => onSetCameraView('top')}
          >
            <IconRotate className="workspace-chip-icon" />
            Top
          </button>
          <button
            type="button"
            className={`workspace-chip ${cameraView === 'sensor' ? 'active' : ''}`}
            onClick={() => onSetCameraView('sensor')}
          >
            <IconCamera className="workspace-chip-icon" />
            Cam
          </button>
        </div>
        <div className="workspace-chip-group" role="group" aria-label="Projection mode">
          <button
            type="button"
            className={projectionMode === 'orthographic' ? 'active' : ''}
            onClick={() => onSetProjectionMode('orthographic')}
          >
            Ortho
          </button>
          <button
            type="button"
            className={projectionMode === 'perspective' ? 'active' : ''}
            onClick={() => onSetProjectionMode('perspective')}
          >
            Persp
          </button>
        </div>
        <button
          type="button"
          className={`workspace-chip ${sceneEditEnabled ? 'active' : ''}`}
          onClick={onToggleSceneEdit}
        >
          Edit {sceneEditEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          className={`workspace-chip ${sceneRemoteHoldEnabled ? 'active hold' : ''}`}
          onClick={onToggleSceneRemoteHold}
        >
          Hold {sceneRemoteHoldEnabled ? 'ON' : 'OFF'}
        </button>
        <div className="workspace-chip-group">
          <button type="button" onClick={() => onApplyLayoutPreset('focus')}>
            Focus
          </button>
          <button type="button" onClick={() => onApplyLayoutPreset('authoring')}>
            Author
          </button>
          <button type="button" onClick={() => onApplyLayoutPreset('observability')}>
            Observe
          </button>
        </div>
      </div>

      <div className="workspace-header-meta">
        <span className="workspace-cap-count">{activeCapabilities} caps</span>
        <span className={`workspace-bridge-status ${bridgeStatusClassName(bridgeStatus)}`}>{bridgeStatus}</span>
        <button
          type="button"
          className="workspace-icon-btn"
          title="Workspace command palette (Ctrl/Cmd + K)"
          onClick={onOpenCommandPalette}
        >
          <IconCommand className="workspace-icon-svg" />
          Cmd
        </button>
        <button
          type="button"
          className={`workspace-icon-btn ${dockManagerOpen ? 'active' : ''}`}
          title="Dock manager"
          onClick={onToggleDockManager}
        >
          <IconDock className="workspace-icon-svg" />
          Dock
        </button>
        <button type="button" className={`workspace-icon-btn ${leftPanelOpen ? 'active' : ''}`} onClick={onToggleLeftPanel}>
          <IconPanelLeft className="workspace-icon-svg" />
          Left
        </button>
        <button
          type="button"
          className={`workspace-icon-btn ${sceneEventTerminalOpen ? 'active' : ''}`}
          onClick={onToggleTerminal}
        >
          <IconTerminal className="workspace-icon-svg" />
          Term
        </button>
        <button type="button" className={`workspace-icon-btn ${rightPanelOpen ? 'active' : ''}`} onClick={onToggleRightPanel}>
          <IconPanelRight className="workspace-icon-svg" />
          Right
        </button>
        <button type="button" className="workspace-icon-btn" onClick={onRestoreLayoutDefaults}>
          Reset
        </button>
      </div>
    </header>
  )
}
