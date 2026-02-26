import { dispatchPoseStoreCommand } from '../../core/app-commanding'

type PoseStoreCommand = Parameters<typeof dispatchPoseStoreCommand>[0]

export function createPoseStoreCommandDispatcher(source: string) {
  return (command: PoseStoreCommand) => {
    dispatchPoseStoreCommand(command, { source })
  }
}
