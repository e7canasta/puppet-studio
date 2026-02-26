import { GRID_MAJOR_STEP_M, GRID_MINOR_STEP_M } from '../../../core/planogram-domain'
import type { RoomDefinition } from '../../../core/planogram-domain'

export function SceneGridHelpers({ room }: { room: RoomDefinition }) {
  const baseSpan = Math.max(room.widthM, room.depthM) + 4
  const gridSize = Math.ceil(baseSpan / GRID_MINOR_STEP_M) * GRID_MINOR_STEP_M
  const minorDivisions = Math.round(gridSize / GRID_MINOR_STEP_M)
  const majorDivisions = Math.round(gridSize / GRID_MAJOR_STEP_M)
  return (
    <group>
      <gridHelper args={[gridSize, majorDivisions, '#687790', '#b8c3d3']} position={[0, 0.002, 0]} />
      <gridHelper args={[gridSize, minorDivisions, '#b9c2d1', '#d9e0eb']} position={[0, 0.001, 0]} />
      <axesHelper args={[2]} />
    </group>
  )
}
