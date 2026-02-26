export const STUDIO_SHORTCUTS = {
  scene: {
    measure: 'M',
    redo: 'Ctrl/Cmd+Y',
    snap: 'G',
    toolMove: '2',
    toolRotate: '3',
    toolSelect: '1',
    toggleTerminal: '`',
    undo: 'Ctrl/Cmd+Z',
  },
  terminal: {
    dynamicInput: 'F12',
    palette: 'Ctrl/Cmd+J',
    toggle: 'Ctrl/Cmd+9',
    transcript: 'F2',
  },
  workspace: {
    palette: 'Ctrl/Cmd+K',
  },
} as const

type PrimaryShortcutKey = 'j' | 'k' | 'y' | 'z' | '9'

export function isPrimaryShortcut(event: KeyboardEvent, key: PrimaryShortcutKey): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === key
}
