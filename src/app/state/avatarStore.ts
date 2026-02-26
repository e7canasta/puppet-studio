import { create } from 'zustand'
import { clampAxis, createDefaultPose } from '../../poseControls'
import type { AxisKey, PartKey, PoseControls } from '../../poseControls'

export type AvatarState = {
  // Avatar identity and position
  avatarObjectId: string | null
  avatarPlanPositionM: [number, number]
  avatarRotationDeg: number
  avatarTrackId: string | null

  // Pose controls (joint angles)
  pose: PoseControls

  // Actions
  setAvatarIdentity: (identity: { objectId?: string | null; trackId?: string | null }) => void
  setAvatarPosition: (position: [number, number]) => void
  setAvatarRotation: (rotationDeg: number) => void
  setAxis: (part: PartKey, axis: AxisKey, value: number) => void
  setPose: (pose: PoseControls) => void
  resetPose: () => void
  applyPoseSnapshot: (payload: unknown) => void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function parseIdentity(payload: Record<string, unknown>): { objectId: string | null; trackId: string | null } {
  const trackCandidate = payload.trackId ?? payload.track_id ?? payload.characterTrackId ?? payload.character_track_id
  const objectCandidate = payload.objectId ?? payload.object_id ?? payload.characterObjectId ?? payload.character_object_id
  const trackId = typeof trackCandidate === 'string' ? trackCandidate : null
  const objectId = typeof objectCandidate === 'string' ? objectCandidate : null
  return { objectId, trackId }
}

export const useAvatarStore = create<AvatarState>((set) => ({
  // Initial state
  avatarObjectId: null,
  avatarPlanPositionM: [0, 0],
  avatarRotationDeg: 0,
  avatarTrackId: null,
  pose: createDefaultPose(),

  // Actions
  setAvatarIdentity: (identity) =>
    set((state) => ({
      avatarObjectId: identity.objectId !== undefined ? identity.objectId : state.avatarObjectId,
      avatarTrackId: identity.trackId !== undefined ? identity.trackId : state.avatarTrackId,
    })),
  setAvatarPosition: (position) => set({ avatarPlanPositionM: position }),
  setAvatarRotation: (rotationDeg) => set({ avatarRotationDeg: rotationDeg }),
  setAxis: (part, axis, value) =>
    set((state) => ({
      pose: {
        ...state.pose,
        [part]: {
          ...state.pose[part],
          [axis]: clampAxis(part, axis, value),
        },
      },
    })),
  setPose: (pose) => set({ pose }),
  resetPose: () => set({ pose: createDefaultPose() }),

  applyPoseSnapshot: (payload) => {
    const packet = asRecord(payload)
    const joints = packet ? packet.joints ?? payload : payload
    if (!joints || typeof joints !== 'object') return

    const { objectId: packetObjectId, trackId: packetTrackId } = packet ? parseIdentity(packet) : { objectId: null, trackId: null }

    set((state) => {
      // Skip if trackId doesn't match
      if (packetTrackId && state.avatarTrackId && packetTrackId !== state.avatarTrackId) {
        return state
      }

      const nextPose: PoseControls = { ...state.pose }
      let changed = false

      for (const part of Object.keys(state.pose) as PartKey[]) {
        const joint = (joints as Record<string, unknown>)[part]
        if (!joint || typeof joint !== 'object') continue

        const x = clampAxis(part, 'x', Number((joint as { x?: number }).x ?? state.pose[part].x))
        const y = clampAxis(part, 'y', Number((joint as { y?: number }).y ?? state.pose[part].y))
        const z = clampAxis(part, 'z', Number((joint as { z?: number }).z ?? state.pose[part].z))

        if (x === state.pose[part].x && y === state.pose[part].y && z === state.pose[part].z) continue
        nextPose[part] = { x, y, z }
        changed = true
      }

      const identityChanged =
        (packetTrackId && packetTrackId !== state.avatarTrackId) || (packetObjectId && packetObjectId !== state.avatarObjectId)

      if (!changed && !identityChanged) return state

      return {
        avatarObjectId: packetObjectId ?? state.avatarObjectId,
        avatarTrackId: packetTrackId ?? state.avatarTrackId,
        pose: nextPose,
      }
    })
  },
}))
