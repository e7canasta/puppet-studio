import { planToWorldPosition } from '../../../core/scene-domain'
import { degToRad } from '../../../planogram'

export type AvatarWorldTransform = {
  position: [number, number, number]
  yaw: number
}

export function buildAvatarWorldTransform(
  avatarPlanPositionM: [number, number],
  avatarRotationDeg: number,
): AvatarWorldTransform {
  return {
    position: planToWorldPosition([avatarPlanPositionM[0], avatarPlanPositionM[1]]),
    yaw: degToRad(avatarRotationDeg),
  }
}
