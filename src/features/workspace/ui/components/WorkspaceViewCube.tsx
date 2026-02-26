type WorkspaceViewCubeProps = {
  cameraView: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor'
  cameraQuaternion: [number, number, number, number]
  onSetCameraView: (view: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sensor') => void
  onToggleProjectionMode: () => void
  projectionMode: 'orthographic' | 'perspective'
}

const VIEW_CUBE_SIZE_PX = 44

function normalizeQuaternion([x, y, z, w]: [number, number, number, number]): [number, number, number, number] {
  const magnitude = Math.sqrt(x * x + y * y + z * z + w * w)
  if (magnitude <= 0.000001) return [0, 0, 0, 1]
  return [x / magnitude, y / magnitude, z / magnitude, w / magnitude]
}

function cubeTransformFromQuaternion(cameraQuaternion: [number, number, number, number]): string {
  const [x, y, z, w] = normalizeQuaternion(cameraQuaternion)
  const ix = -x
  const iy = -y
  const iz = -z
  const iw = w

  const xx = ix * ix
  const yy = iy * iy
  const zz = iz * iz
  const xy = ix * iy
  const xz = ix * iz
  const yz = iy * iz
  const wx = iw * ix
  const wy = iw * iy
  const wz = iw * iz

  const r00 = 1 - 2 * (yy + zz)
  const r01 = 2 * (xy - wz)
  const r02 = 2 * (xz + wy)
  const r10 = 2 * (xy + wz)
  const r11 = 1 - 2 * (xx + zz)
  const r12 = 2 * (yz - wx)
  const r20 = 2 * (xz - wy)
  const r21 = 2 * (yz + wx)
  const r22 = 1 - 2 * (xx + yy)

  return `matrix3d(${r00}, ${r10}, ${r20}, 0, ${r01}, ${r11}, ${r21}, 0, ${r02}, ${r12}, ${r22}, 0, 0, 0, 0, 1)`
}

export function WorkspaceViewCube({
  cameraView,
  cameraQuaternion,
  onSetCameraView,
  onToggleProjectionMode,
  projectionMode,
}: WorkspaceViewCubeProps) {
  const half = VIEW_CUBE_SIZE_PX / 2
  const frontFaceActive = cameraView === 'front' || cameraView === 'sensor'
  const cubeTransform = cubeTransformFromQuaternion(cameraQuaternion)
  return (
    <div className="workspace-viewcube">
      <div
        className="workspace-viewcube-stage"
        style={{
          height: VIEW_CUBE_SIZE_PX,
          width: VIEW_CUBE_SIZE_PX,
        }}
      >
        <div
          className="workspace-viewcube-cube"
          style={{
            height: VIEW_CUBE_SIZE_PX,
            transform: cubeTransform,
            width: VIEW_CUBE_SIZE_PX,
          }}
        >
          <button
            type="button"
            className={`workspace-viewcube-face ${frontFaceActive ? 'active' : ''}`}
            onClick={() => onSetCameraView('front')}
            style={{ transform: `translateZ(${half}px)` }}
            title="Front view"
          >
            F
          </button>
          <button
            type="button"
            className={`workspace-viewcube-face ${cameraView === 'back' ? 'active' : ''}`}
            onClick={() => onSetCameraView('back')}
            style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
            title="Back view"
          >
            B
          </button>
          <button
            type="button"
            className={`workspace-viewcube-face ${cameraView === 'right' ? 'active' : ''}`}
            onClick={() => onSetCameraView('right')}
            style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
            title="Right view"
          >
            R
          </button>
          <button
            type="button"
            className={`workspace-viewcube-face ${cameraView === 'left' ? 'active' : ''}`}
            onClick={() => onSetCameraView('left')}
            style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
            title="Left view"
          >
            L
          </button>
          <button
            type="button"
            className={`workspace-viewcube-face ${cameraView === 'top' ? 'active' : ''}`}
            onClick={() => onSetCameraView('top')}
            style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
            title="Top view"
          >
            T
          </button>
          <div className="workspace-viewcube-face" style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}>
            Bt
          </div>
        </div>
      </div>
      <div className="workspace-viewcube-quick">
        <button type="button" className={cameraView === 'iso' ? 'active' : ''} onClick={() => onSetCameraView('iso')}>
          Iso View
        </button>
        <button type="button" className={frontFaceActive ? 'active' : ''} onClick={() => onSetCameraView('front')}>
          Front
        </button>
        <button type="button" className={cameraView === 'right' ? 'active' : ''} onClick={() => onSetCameraView('right')}>
          Right
        </button>
        <button type="button" className={cameraView === 'top' ? 'active' : ''} onClick={() => onSetCameraView('top')}>
          Top
        </button>
        <button type="button" className={cameraView === 'sensor' ? 'active' : ''} onClick={() => onSetCameraView('sensor')}>
          Cam
        </button>
      </div>
      <button
        type="button"
        className={`workspace-viewcube-projection ${projectionMode === 'orthographic' ? 'mode-orthographic' : 'mode-perspective'}`}
        onClick={onToggleProjectionMode}
        title="Toggle projection mode"
      >
        {projectionMode === 'orthographic' ? 'ORTHO' : 'PERSP'}
      </button>
    </div>
  )
}
