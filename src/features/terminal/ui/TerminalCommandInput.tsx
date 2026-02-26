import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'

type TerminalCommandInputMode = 'classic' | 'cmdk_ready'

type TerminalCommandInputProps = {
  commandInput: string
  commandSuggestions: string[]
  inputRef: RefObject<HTMLInputElement | null>
  mode: TerminalCommandInputMode
  onExecute: () => void
  onHelp: () => void
  onInputChange: (value: string) => void
  onInputKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  onSuggestionSelect: (suggestion: string) => void
}

export function TerminalCommandInput({
  commandInput,
  commandSuggestions,
  inputRef,
  mode,
  onExecute,
  onHelp,
  onInputChange,
  onInputKeyDown,
  onSuggestionSelect,
}: TerminalCommandInputProps) {
  if (mode === 'cmdk_ready') {
    return (
      <>
        <div className="event-terminal-commandbar cmdk-ready">
          <label className="event-terminal-command-input">
            cmd
            <input
              ref={inputRef}
              value={commandInput}
              onChange={(event) => onInputChange(event.currentTarget.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type command..."
            />
          </label>
          <button type="button" onClick={onExecute} disabled={!commandInput.trim()}>
            Run
          </button>
          <button type="button" onClick={onHelp}>
            Help
          </button>
          <span className="event-terminal-command-hint">cmdk-ready adapter</span>
        </div>
        {commandSuggestions.length > 0 ? (
          <div className="event-terminal-suggestions cmdk-ready">
            {commandSuggestions.slice(0, 8).map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => onSuggestionSelect(suggestion)}>
                <span className="event-terminal-cmdk-item-label">{suggestion}</span>
              </button>
            ))}
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="event-terminal-commandbar">
        <label className="event-terminal-command-input">
          cmd
          <input
            ref={inputRef}
            value={commandInput}
            onChange={(event) => onInputChange(event.currentTarget.value)}
            onKeyDown={onInputKeyDown}
            placeholder="help | scene scene-1 | view top | hold on"
          />
        </label>
        <button type="button" onClick={onExecute} disabled={!commandInput.trim()}>
          Run
        </button>
        <button type="button" onClick={onHelp}>
          Help
        </button>
        <span className="event-terminal-command-hint">Ctrl+9 toggle | F2 history | ↑↓ history</span>
      </div>
      {commandSuggestions.length > 0 ? (
        <div className="event-terminal-suggestions">
          {commandSuggestions.slice(0, 6).map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => onSuggestionSelect(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
