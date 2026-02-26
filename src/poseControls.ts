export type AxisKey = 'x' | 'y' | 'z'

export type PartKey =
  | 'torsoBase'
  | 'head'
  | 'leftUpperArm'
  | 'leftForearm'
  | 'rightUpperArm'
  | 'rightForearm'
  | 'leftThigh'
  | 'leftFoot'
  | 'rightThigh'
  | 'rightFoot'

export type RotationDeg = Record<AxisKey, number>
export type PoseControls = Record<PartKey, RotationDeg>
export type AxisLimits = Record<AxisKey, [number, number]>

export const PART_ORDER: Array<{ key: PartKey; label: string }> = [
  { key: 'torsoBase', label: 'Torso Base' },
  { key: 'head', label: 'Head' },
  { key: 'leftUpperArm', label: 'L Upper Arm' },
  { key: 'leftForearm', label: 'L Forearm' },
  { key: 'rightUpperArm', label: 'R Upper Arm' },
  { key: 'rightForearm', label: 'R Forearm' },
  { key: 'leftThigh', label: 'L Thigh' },
  { key: 'leftFoot', label: 'L Foot' },
  { key: 'rightThigh', label: 'R Thigh' },
  { key: 'rightFoot', label: 'R Foot' },
]

export const PART_LIMITS: Record<PartKey, AxisLimits> = {
  torsoBase: { x: [-100, 100], y: [-70, 70], z: [-70, 70] },
  head: { x: [-60, 60], y: [-75, 75], z: [-45, 45] },
  leftUpperArm: { x: [-100, 85], y: [-95, 95], z: [-95, 95] },
  leftForearm: { x: [-10, 140], y: [-40, 40], z: [-55, 55] },
  rightUpperArm: { x: [-100, 85], y: [-95, 95], z: [-95, 95] },
  rightForearm: { x: [-10, 140], y: [-40, 40], z: [-55, 55] },
  leftThigh: { x: [-120, 70], y: [-60, 60], z: [-60, 60] },
  leftFoot: { x: [-60, 60], y: [-35, 35], z: [-35, 35] },
  rightThigh: { x: [-120, 70], y: [-60, 60], z: [-60, 60] },
  rightFoot: { x: [-60, 60], y: [-35, 35], z: [-35, 35] },
}

const zero = (): RotationDeg => ({ x: 0, y: 0, z: 0 })

export const createDefaultPose = (): PoseControls => ({
  torsoBase: zero(),
  head: zero(),
  leftUpperArm: zero(),
  leftForearm: zero(),
  rightUpperArm: zero(),
  rightForearm: zero(),
  leftThigh: zero(),
  leftFoot: zero(),
  rightThigh: zero(),
  rightFoot: zero(),
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampAxis(part: PartKey, axis: AxisKey, rawValue: number) {
  const [min, max] = PART_LIMITS[part][axis]
  if (!Number.isFinite(rawValue)) {
    return 0
  }
  return clamp(rawValue, min, max)
}
