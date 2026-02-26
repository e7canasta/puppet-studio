type QuaternionTuple = [number, number, number, number]

type WorkspaceAxisGizmoProps = {
  cameraQuaternion: QuaternionTuple
}

type AxisSpec = {
  color: string
  label: 'X' | 'Y' | 'Z'
  vector: [number, number, number]
}

function normalizeQuaternion([x, y, z, w]: QuaternionTuple): QuaternionTuple {
  const magnitude = Math.sqrt(x * x + y * y + z * z + w * w)
  if (magnitude <= 0.000001) return [0, 0, 0, 1]
  return [x / magnitude, y / magnitude, z / magnitude, w / magnitude]
}

function inverseQuaternion([x, y, z, w]: QuaternionTuple): QuaternionTuple {
  return [-x, -y, -z, w]
}

function rotateVectorByQuaternion(
  [vx, vy, vz]: [number, number, number],
  [qx, qy, qz, qw]: QuaternionTuple,
): [number, number, number] {
  const tx = 2 * (qy * vz - qz * vy)
  const ty = 2 * (qz * vx - qx * vz)
  const tz = 2 * (qx * vy - qy * vx)

  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ]
}

export function WorkspaceAxisGizmo({ cameraQuaternion }: WorkspaceAxisGizmoProps) {
  const center = 24
  const baseLength = 18
  const viewQuaternion = inverseQuaternion(normalizeQuaternion(cameraQuaternion))
  const axes: AxisSpec[] = [
    { color: 'var(--axis-x, #e85a6a)', label: 'X', vector: [1, 0, 0] },
    { color: 'var(--axis-y, #63c87a)', label: 'Y', vector: [0, 1, 0] },
    { color: 'var(--axis-z, #58a3ef)', label: 'Z', vector: [0, 0, 1] },
  ]
  const projectedAxes = axes
    .map((axis) => {
      const [rx, ry, rz] = rotateVectorByQuaternion(axis.vector, viewQuaternion)
      const depthScale = 0.6 + ((rz + 1) * 0.4) / 2
      const length = baseLength * depthScale
      return {
        color: axis.color,
        depth: rz,
        endX: center + rx * length,
        endY: center - ry * length,
        label: axis.label,
        labelX: center + rx * (length + 4),
        labelY: center - ry * (length + 4),
      }
    })
    .sort((left, right) => left.depth - right.depth)

  return (
    <div className="workspace-axis-gizmo" aria-label="Viewport axis gizmo">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" role="img" aria-label="Scene axis">
        {projectedAxes.map((axis) => (
          <g key={axis.label}>
            <line
              x1={center}
              y1={center}
              x2={axis.endX}
              y2={axis.endY}
              stroke={axis.color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x={axis.labelX}
              y={axis.labelY}
              fill={axis.color}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
          </g>
        ))}
        <circle cx={center} cy={center} r="2.5" fill="#8fa4c2" />
      </svg>
    </div>
  )
}
