import { STUDIO_SHORTCUTS } from '../../../../shared/shortcuts'

type WorkspaceStatusBarProps = {
  activeToolMode: 'move' | 'rotate' | 'select'
  bridgeUrl: string
  cameraView: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
  projectionMode: 'orthographic' | 'perspective'
  detectionCount: number
  monitoringCameraCount: number
  placementCount: number
  sceneEditEnabled: boolean
  sceneEventTerminalOpen: boolean
  sceneId: string
  sceneRemoteHoldEnabled: boolean
  sceneRevision: number | null
  sceneSequence: number | null
}

function formatCameraView(view: WorkspaceStatusBarProps['cameraView']): string {
  if (view === 'iso') return 'iso_view'
  if (view === 'sensor') return 'cam'
  return view
}

export function WorkspaceStatusBar({
  activeToolMode,
  bridgeUrl,
  cameraView,
  projectionMode,
  detectionCount,
  monitoringCameraCount,
  placementCount,
  sceneEditEnabled,
  sceneEventTerminalOpen,
  sceneId,
  sceneRemoteHoldEnabled,
  sceneRevision,
  sceneSequence,
}: WorkspaceStatusBarProps) {
  return (
    <footer className="workspace-statusbar">
      <div className="workspace-status-left">
        <span>{bridgeUrl}</span>
        <span className="workspace-divider">|</span>
        <span>{sceneId}</span>
      </div>
      <div className="workspace-status-center">
        <span>seq:{sceneSequence ?? '-'}</span>
        <span>rev:{sceneRevision ?? '-'}</span>
        <span>entities:{placementCount}</span>
        <span>cams:{monitoringCameraCount}</span>
        <span>det:{detectionCount}</span>
      </div>
      <div className="workspace-status-right">
        <span>tool:{activeToolMode}</span>
        <span>view:{formatCameraView(cameraView)}</span>
        <span>proj:{projectionMode === 'orthographic' ? 'ortho' : 'persp'}</span>
        <span>edit:{sceneEditEnabled ? 'on' : 'off'}</span>
        <span>hold:{sceneRemoteHoldEnabled ? 'on' : 'off'}</span>
        <span>term:{sceneEventTerminalOpen ? 'on' : 'off'}</span>
        <span className="workspace-divider">|</span>
        <span className="workspace-status-shortcut">tool:{STUDIO_SHORTCUTS.scene.toolSelect}/{STUDIO_SHORTCUTS.scene.toolMove}/{STUDIO_SHORTCUTS.scene.toolRotate}</span>
        <span className="workspace-status-shortcut">snap:{STUDIO_SHORTCUTS.scene.snap}</span>
        <span className="workspace-status-shortcut">dims:{STUDIO_SHORTCUTS.scene.measure}</span>
        <span className="workspace-status-shortcut">{STUDIO_SHORTCUTS.workspace.palette}</span>
        <span className="workspace-status-shortcut">{STUDIO_SHORTCUTS.terminal.palette}</span>
        <span className="workspace-status-shortcut">{STUDIO_SHORTCUTS.terminal.toggle}</span>
      </div>
    </footer>
  )
}
