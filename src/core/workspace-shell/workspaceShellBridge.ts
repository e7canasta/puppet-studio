export type WorkspaceLayoutPreset = 'authoring' | 'focus' | 'observability'
export type WorkspaceWidgetId = 'camera' | 'outliner' | 'planogram' | 'properties'

export type WorkspaceShellCommand =
  | {
      kind: 'apply_layout_preset'
      preset: WorkspaceLayoutPreset
    }
  | {
      kind: 'restore_layout_defaults'
    }
  | {
      kind: 'toggle_left_panel'
    }
  | {
      kind: 'toggle_right_panel'
    }
  | {
      kind: 'set_widget_visible'
      visible: boolean
      widget: WorkspaceWidgetId
    }
  | {
      kind: 'toggle_widget_collapsed'
      widget: WorkspaceWidgetId
    }
  | {
      kind: 'toggle_widget_pinned'
      widget: WorkspaceWidgetId
    }

type WorkspaceShellCommandListener = (command: WorkspaceShellCommand) => void

const WORKSPACE_SHELL_COMMAND_EVENT = 'simula.workspace.shell.command'

export function dispatchWorkspaceShellCommand(command: WorkspaceShellCommand) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<WorkspaceShellCommand>(WORKSPACE_SHELL_COMMAND_EVENT, {
      detail: command,
    }),
  )
}

export function subscribeWorkspaceShellCommands(listener: WorkspaceShellCommandListener) {
  if (typeof window === 'undefined') return () => {}

  const onCommand = (event: Event) => {
    const commandEvent = event as CustomEvent<WorkspaceShellCommand>
    if (!commandEvent.detail) return
    listener(commandEvent.detail)
  }

  window.addEventListener(WORKSPACE_SHELL_COMMAND_EVENT, onCommand as EventListener)
  return () => {
    window.removeEventListener(WORKSPACE_SHELL_COMMAND_EVENT, onCommand as EventListener)
  }
}
