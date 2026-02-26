import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { createRagdoll } from '../../../createConfig'
import { RAGDOLL_SCALE } from '../../../core/planogram-domain'
import type { PartKey, PoseControls } from '../../../poseControls'

const { joints, shapes } = createRagdoll(RAGDOLL_SCALE, Math.PI / 16, Math.PI / 16, 0)

type ShapeName = keyof typeof shapes
type JointConfig = (typeof joints)[keyof typeof joints]

const shapeToPartKey: Partial<Record<ShapeName, PartKey>> = {
  head: 'head',
  lowerLeftArm: 'leftForearm',
  lowerLeftLeg: 'leftFoot',
  lowerRightArm: 'rightForearm',
  lowerRightLeg: 'rightFoot',
  upperBody: 'torsoBase',
  upperLeftArm: 'leftUpperArm',
  upperLeftLeg: 'leftThigh',
  upperRightArm: 'rightUpperArm',
  upperRightLeg: 'rightThigh',
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180
const unitScale = (x: number, y: number, z: number): [number, number, number] => [x * 2, y * 2, z * 2]

function rotationFromPose(name: ShapeName, pose: PoseControls): [number, number, number] {
  const part = shapeToPartKey[name]
  if (!part) return [0, 0, 0]
  const value = pose[part]
  return [toRad(value.x), toRad(value.y), toRad(value.z)]
}

function PartMesh({ name }: { name: ShapeName }) {
  const shape = shapes[name]
  return (
    <mesh castShadow receiveShadow scale={unitScale(shape.args[0], shape.args[1], shape.args[2])}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={shape.color} />
    </mesh>
  )
}

type JointNodeProps = {
  child: ShapeName
  children?: ReactNode
  joint: JointConfig
  pose: PoseControls
}

function JointNode({ child, children, joint, pose }: JointNodeProps) {
  const childRotation = rotationFromPose(child, pose)
  const pivotA = joint.pivotA
  const pivotB = joint.pivotB

  return (
    <group position={[pivotB[0], pivotB[1], pivotB[2]]} rotation={childRotation}>
      <group position={[-pivotA[0], -pivotA[1], -pivotA[2]]}>
        <PartMesh name={child} />
        {children}
      </group>
    </group>
  )
}

export function PuppetRig({ pose }: { pose: PoseControls }) {
  const rootRotation = rotationFromPose('upperBody', pose)
  const baseHeight = useMemo(() => {
    // Anchor correction: place feet contact point on world Y=0.
    // Our procedural rig centers the root on torso, while planogram/world origin
    // should reference floor contact for spatial calibration.
    return shapes.upperBody.position[1]
  }, [])

  return (
    <group position={[0, baseHeight, 0]} rotation={rootRotation}>
      <PartMesh name="upperBody" />

      <JointNode child="head" joint={joints.neckJoint} pose={pose} />

      <JointNode child="upperLeftArm" joint={joints.leftShoulder} pose={pose}>
        <JointNode child="lowerLeftArm" joint={joints.leftElbowJoint} pose={pose} />
      </JointNode>

      <JointNode child="upperRightArm" joint={joints.rightShoulder} pose={pose}>
        <JointNode child="lowerRightArm" joint={joints.rightElbowJoint} pose={pose} />
      </JointNode>

      <JointNode child="pelvis" joint={joints.spineJoint} pose={pose}>
        <JointNode child="upperLeftLeg" joint={joints.leftHipJoint} pose={pose}>
          <JointNode child="lowerLeftLeg" joint={joints.leftKneeJoint} pose={pose} />
        </JointNode>
        <JointNode child="upperRightLeg" joint={joints.rightHipJoint} pose={pose}>
          <JointNode child="lowerRightLeg" joint={joints.rightKneeJoint} pose={pose} />
        </JointNode>
      </JointNode>
    </group>
  )
}
