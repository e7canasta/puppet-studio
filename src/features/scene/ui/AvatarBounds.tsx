import {
  TARGET_AVATAR_FOOTPRINT_DEPTH_M,
  TARGET_AVATAR_FOOTPRINT_WIDTH_M,
  TARGET_AVATAR_HEIGHT_M,
} from '../../../core/planogram-domain'

export function AvatarBounds() {
  return (
    <group>
      <mesh position={[0, TARGET_AVATAR_HEIGHT_M / 2, 0]} renderOrder={2}>
        <boxGeometry args={[TARGET_AVATAR_FOOTPRINT_WIDTH_M, TARGET_AVATAR_HEIGHT_M, TARGET_AVATAR_FOOTPRINT_DEPTH_M]} />
        <meshBasicMaterial color="#2d2d2d" transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={2}>
        <ringGeometry args={[0.11, 0.13, 32]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}
