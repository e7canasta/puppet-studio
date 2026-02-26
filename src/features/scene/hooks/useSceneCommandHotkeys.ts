import { useEffect } from 'react'

import { useSceneStore, useViewportStore } from '../../../app/state'
import { SCENE_COMMAND_MOVE_STEP_M, SCENE_COMMAND_ROTATE_STEP_DEG, SCENE_COMMAND_SNAP_STEP_M } from '../../../core/config'
import { isPrimaryShortcut } from '../../../shared/shortcuts'
import { createAppCommandDispatcher } from '../../../shared/ui'
import { isEditableTarget } from '../model'

export function useSceneCommandHotkeys() {
  useEffect(() => {
    const dispatchFromHotkeys = createAppCommandDispatcher('ui.hotkeys')

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      const key = event.key.toLowerCase()
      const sceneState = useSceneStore.getState()
      const viewportState = useViewportStore.getState()

      if (isPrimaryShortcut(event, '9')) {
        event.preventDefault()
        dispatchFromHotkeys({ kind: 'toggle_scene_event_terminal' })
        return
      }

      if (key === '`') {
        event.preventDefault()
        dispatchFromHotkeys({ kind: 'toggle_scene_event_terminal' })
        return
      }

      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        if (!sceneState.sceneEditEnabled) return
        if (!event.shiftKey && isPrimaryShortcut(event, 'z')) {
          event.preventDefault()
          dispatchFromHotkeys({ kind: 'undo_scene_edit' })
          return
        }
        if (isPrimaryShortcut(event, 'y') || (event.shiftKey && isPrimaryShortcut(event, 'z'))) {
          event.preventDefault()
          dispatchFromHotkeys({ kind: 'redo_scene_edit' })
          return
        }
        return
      }

      if (event.altKey) return

      if (key === '1') {
        event.preventDefault()
        dispatchFromHotkeys({ kind: 'set_active_tool', mode: 'select' })
        return
      }

      if (key === '2') {
        event.preventDefault()
        dispatchFromHotkeys({ kind: 'set_active_tool', mode: 'move' })
        return
      }

      if (key === '3') {
        event.preventDefault()
        dispatchFromHotkeys({ kind: 'set_active_tool', mode: 'rotate' })
        return
      }

      if (key === 'm') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'set_show_dimensions',
          show: !viewportState.showDimensions,
        })
        return
      }

      if (!sceneState.sceneEditEnabled) return
      if (!sceneState.selectedPlacementId) return

      const moveStep = event.shiftKey ? SCENE_COMMAND_MOVE_STEP_M * 5 : SCENE_COMMAND_MOVE_STEP_M
      const rotateStep = event.shiftKey ? SCENE_COMMAND_ROTATE_STEP_DEG * 3 : SCENE_COMMAND_ROTATE_STEP_DEG

      if (key === 'w') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'move_selected_by', deltaM: [0, moveStep] },
        })
        return
      }
      if (key === 'a') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'move_selected_by', deltaM: [-moveStep, 0] },
        })
        return
      }
      if (key === 's') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'move_selected_by', deltaM: [0, -moveStep] },
        })
        return
      }
      if (key === 'd') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'move_selected_by', deltaM: [moveStep, 0] },
        })
        return
      }
      if (key === 'q') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'rotate_selected_by', deltaDeg: -rotateStep },
        })
        return
      }
      if (key === 'e') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'rotate_selected_by', deltaDeg: rotateStep },
        })
        return
      }
      if (key === 'g') {
        event.preventDefault()
        dispatchFromHotkeys({
          kind: 'run_scene_command',
          command: { kind: 'snap_selected_to_grid', stepM: SCENE_COMMAND_SNAP_STEP_M },
        })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
