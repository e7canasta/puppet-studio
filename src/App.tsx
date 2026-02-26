import { BridgePoseListener } from './features/bridge/ui/BridgePoseListener'
import { SceneCommandHotkeys } from './features/scene/ui/SceneCommandHotkeys'
import { CadWorkspacePage } from './features/workspace'

export default function App() {
  return (
    <>
      <BridgePoseListener />
      <SceneCommandHotkeys />
      <CadWorkspacePage />
    </>
  )
}
