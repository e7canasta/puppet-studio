import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Mesh, Object3D } from 'three'
import {
  ASSET_CATALOG,
  computeUniformScale,
  degToRad,
  getPlacementTargetSizeM,
  measureObject,
} from '../../../core/planogram-domain'
import type { Placement, RoomDefinition } from '../../../core/planogram-domain'
import { placementYawDeg, planToWorldPosition } from '../../../core/scene-domain'

function prepareShadows(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if ('isMesh' in mesh && mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
  return root
}

function RoomItem({ placement }: { placement: Placement }) {
  const assetDefinition = ASSET_CATALOG[placement.assetId]
  const { scene } = useGLTF(assetDefinition.url)

  const targetSize = useMemo(
    () => getPlacementTargetSizeM(placement),
    [
      placement.assetId,
      placement.targetSizeM?.width,
      placement.targetSizeM?.height,
      placement.targetSizeM?.depth,
    ],
  )
  const measuredBase = useMemo(() => measureObject(scene), [scene])
  const baseScene = useMemo(() => {
    return prepareShadows(scene.clone(true))
  }, [scene])

  const calibrated = useMemo(() => {
    const uniformScale = computeUniformScale(measuredBase.size, targetSize, assetDefinition.fitAxis)
    const floorOffset = -measuredBase.minY * uniformScale + (placement.elevationM ?? 0)
    return { floorOffset, measured: measuredBase, uniformScale }
  }, [assetDefinition.fitAxis, measuredBase, placement.elevationM, targetSize])

  const basePosition = planToWorldPosition([placement.planPositionM[0], placement.planPositionM[1]])
  const rotationY = degToRad(placementYawDeg(placement))

  return (
    <group
      position={[basePosition[0], basePosition[1] + calibrated.floorOffset, basePosition[2]]}
      rotation={[0, rotationY, 0]}
      scale={calibrated.uniformScale}
    >
      <primitive object={baseScene} />
      <mesh
        position={[calibrated.measured.center.x, calibrated.measured.center.y, calibrated.measured.center.z]}
        renderOrder={2}
      >
        <boxGeometry args={[calibrated.measured.size.width, calibrated.measured.size.height, calibrated.measured.size.depth]} />
        <meshBasicMaterial color={assetDefinition.miniMapColor} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh
        position={[calibrated.measured.center.x, calibrated.measured.center.y, calibrated.measured.center.z]}
        renderOrder={3}
      >
        <boxGeometry args={[calibrated.measured.size.width, calibrated.measured.size.height, calibrated.measured.size.depth]} />
        <meshBasicMaterial color={assetDefinition.miniMapColor} transparent opacity={0.55} wireframe depthWrite={false} />
      </mesh>
    </group>
  )
}

export function RoomEnvironment({ placements, room }: { placements: Placement[]; room: RoomDefinition }) {
  const roomWidth = room.widthM
  const roomDepth = room.depthM
  const roomHeight = room.heightM
  const wallThickness = room.wallThicknessM
  return (
    <group>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[roomWidth, 0.1, roomDepth]} />
        <meshStandardMaterial color="#d9dee8" />
      </mesh>

      <mesh receiveShadow position={[0, roomHeight / 2, -roomDepth / 2]}>
        <boxGeometry args={[roomWidth, roomHeight, wallThickness]} />
        <meshStandardMaterial color="#f2f4f7" transparent opacity={0.28} />
      </mesh>
      <mesh receiveShadow position={[-roomWidth / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
        <meshStandardMaterial color="#edf1f6" transparent opacity={0.22} />
      </mesh>
      <mesh receiveShadow position={[roomWidth / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
        <meshStandardMaterial color="#edf1f6" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, roomHeight / 2, 0]} renderOrder={1}>
        <boxGeometry args={[roomWidth, roomHeight, roomDepth]} />
        <meshBasicMaterial color="#9ba9bf" transparent opacity={0.12} wireframe depthWrite={false} />
      </mesh>

      {placements.map((placement) => (
        <RoomItem key={placement.id} placement={placement} />
      ))}
    </group>
  )
}
