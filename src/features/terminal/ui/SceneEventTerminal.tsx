import { runtimeConfig } from '../../../core/config'
import { STUDIO_SHORTCUTS } from '../../../shared/shortcuts'
import { IconDebug, IconError, IconInfo, IconWarning } from '../../../shared/ui'
import { formatSceneEventTime } from '../model'
import { useSceneEventTerminalState } from '../hooks'
import { TerminalCommandInput } from './TerminalCommandInput'

type SceneEventTerminalLayout = 'docked' | 'overlay'

type SceneEventTerminalProps = {
  layout?: SceneEventTerminalLayout
}

function EventLevelIcon({ level }: { level: 'debug' | 'error' | 'info' | 'warn' }) {
  if (level === 'error') return <IconError className="event-level-icon" />
  if (level === 'warn') return <IconWarning className="event-level-icon" />
  if (level === 'debug') return <IconDebug className="event-level-icon" />
  return <IconInfo className="event-level-icon" />
}

export function SceneEventTerminal({ layout = 'overlay' }: SceneEventTerminalProps) {
  const {
    bodyRef,
    commandHistory,
    commandHistoryExpanded,
    commandInput,
    commandInputRef,
    commandPaletteInputRef,
    commandPaletteItems,
    commandPaletteOpen,
    commandPaletteQuery,
    commandPaletteSelectedIndex,
    commandSuggestions,
    dynamicInputEnabled,
    dispatchFromTerminal,
    executePaletteCommand,
    executeTerminalCommand,
    filteredEvents,
    filterOptions,
    handleCommandPaletteKeyDown,
    handleCommandInputKeyDown,
    kindFilter,
    levelFilter,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
    sceneFilter,
    searchFilter,
    selectedEvent,
    selectedEventPayload,
    setKindFilter,
    setLevelFilter,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setSceneFilter,
    setSearchFilter,
    setSelectedEventId,
    setSourceFilter,
    setCommandHistoryExpanded,
    setCommandInput,
    sourceFilter,
  } = useSceneEventTerminalState()

  return (
    <section
      className={`event-terminal ${layout} ${sceneEventTerminalOpen ? 'open' : 'closed'} ${
        commandHistoryExpanded ? 'history-expanded' : ''
      }`}
    >
      <div className="event-terminal-head">
        <button
          type="button"
          className="event-terminal-toggle"
          onClick={() => dispatchFromTerminal({ kind: 'toggle_scene_event_terminal' })}
        >
          {sceneEventTerminalOpen ? 'Terminal ▾' : 'Terminal ▸'}
        </button>
        <span className="event-terminal-count">events: {sceneEventLog.length}</span>
        {sceneEventDroppedWhilePaused > 0 ? (
          <span className="event-terminal-count">dropped: {sceneEventDroppedWhilePaused}</span>
        ) : null}
        <button
          type="button"
          className="event-terminal-head-button"
          onClick={() => setCommandHistoryExpanded(!commandHistoryExpanded)}
          title={`Toggle command history (${STUDIO_SHORTCUTS.terminal.transcript})`}
        >
          History {commandHistoryExpanded ? '▾' : '▸'}
        </button>
        <span className="event-terminal-count">
          dynamic: {dynamicInputEnabled ? 'on' : 'off'} ({STUDIO_SHORTCUTS.terminal.dynamicInput})
        </span>
        <button
          type="button"
          className="event-terminal-head-button"
          onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
          title={`Quick command palette (${STUDIO_SHORTCUTS.terminal.palette})`}
        >
          Cmd {commandPaletteOpen ? '▾' : '▸'}
        </button>
      </div>
      {commandPaletteOpen ? (
        <div className="event-terminal-command-palette">
          <div className="event-terminal-command-palette-head">
            <span>Quick Command</span>
            <span>{STUDIO_SHORTCUTS.terminal.palette}</span>
          </div>
          <input
            ref={commandPaletteInputRef}
            value={commandPaletteQuery}
            onChange={(event) => setCommandPaletteQuery(event.currentTarget.value)}
            onKeyDown={handleCommandPaletteKeyDown}
            placeholder="Type command name or alias..."
          />
          <div className="event-terminal-command-palette-list">
            {commandPaletteItems.length === 0 ? (
              <div className="event-empty">no commands</div>
            ) : (
              commandPaletteItems.map((command, index) => (
                <button
                  key={command.name}
                  type="button"
                  className={`event-terminal-command-palette-item ${index === commandPaletteSelectedIndex ? 'selected' : ''}`}
                  onMouseEnter={() => setCommandPaletteSelectedIndex(index)}
                  onClick={() => executePaletteCommand(command.name)}
                >
                  <span>{command.name}</span>
                  <span>{command.usage}</span>
                  <span>{command.description}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
      {sceneEventTerminalOpen ? (
        <>
          <div className="event-terminal-toolbar">
            <label>
              source
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.currentTarget.value)}>
                <option value="all">all</option>
                {filterOptions.sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label>
              kind
              <select value={kindFilter} onChange={(event) => setKindFilter(event.currentTarget.value)}>
                <option value="all">all</option>
                {filterOptions.kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label>
              scene
              <select value={sceneFilter} onChange={(event) => setSceneFilter(event.currentTarget.value)}>
                <option value="all">all</option>
                {filterOptions.scenes.map((sceneId) => (
                  <option key={sceneId} value={sceneId}>
                    {sceneId}
                  </option>
                ))}
              </select>
            </label>
            <label>
              level
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.currentTarget.value as typeof levelFilter)}>
                <option value="all">all</option>
                <option value="error">error</option>
                <option value="warn">warn</option>
                <option value="info">info</option>
                <option value="debug">debug</option>
              </select>
            </label>
            <label className="event-terminal-search">
              find
              <input
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.currentTarget.value)}
                placeholder="scene, source, kind..."
              />
            </label>
            <button
              type="button"
              onClick={() =>
                dispatchFromTerminal({
                  kind: 'set_scene_event_log_paused',
                  enabled: !sceneEventLogPaused,
                })
              }
            >
              {sceneEventLogPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() =>
                dispatchFromTerminal({
                  kind: 'set_scene_event_auto_scroll',
                  enabled: !sceneEventAutoScroll,
                })
              }
            >
              Auto {sceneEventAutoScroll ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={() => dispatchFromTerminal({ kind: 'clear_scene_event_log' })}>
              Clear
            </button>
          </div>
          <TerminalCommandInput
            commandInput={commandInput}
            commandSuggestions={commandSuggestions}
            inputRef={commandInputRef}
            mode={runtimeConfig.terminalCommandInputRenderer}
            onExecute={() => executeTerminalCommand(commandInput)}
            onHelp={() => setCommandInput('help')}
            onInputChange={setCommandInput}
            onInputKeyDown={handleCommandInputKeyDown}
            onSuggestionSelect={(suggestion) => setCommandInput(`${suggestion} `)}
          />
          <div className="event-terminal-content">
            <div className="event-terminal-body" ref={bodyRef}>
              {filteredEvents.length === 0 ? (
                <div className="event-empty">sin eventos con filtros actuales</div>
              ) : (
                filteredEvents.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`event-row level-${entry.level} ${entry.id === selectedEvent?.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEventId(entry.id)}
                  >
                    <span className={`event-level level-${entry.level}`} title={entry.level}>
                      <EventLevelIcon level={entry.level} />
                    </span>
                    <span className="event-time">{formatSceneEventTime(entry.at)}</span>
                    <span className="event-source">{entry.source}</span>
                    <span className="event-kind">{entry.kind}</span>
                    <span className="event-summary">{entry.summary}</span>
                    <span className="event-meta">
                      scene:{entry.sceneId ?? '-'} seq:{entry.sequence ?? '-'} rev:{entry.revision ?? '-'}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="event-terminal-detail">
              {selectedEvent ? (
                <>
                  <div className="event-detail-head">
                    <span className={`event-level level-${selectedEvent.level}`} title={selectedEvent.level}>
                      <EventLevelIcon level={selectedEvent.level} />
                    </span>
                    <span>{formatSceneEventTime(selectedEvent.at)}</span>
                    <span>{selectedEvent.source}</span>
                    <span>{selectedEvent.kind}</span>
                    <span>
                      scene:{selectedEvent.sceneId ?? '-'} seq:{selectedEvent.sequence ?? '-'} rev:{selectedEvent.revision ?? '-'}
                    </span>
                  </div>
                  <p className="event-detail-summary">{selectedEvent.summary}</p>
                  <pre className="event-detail-payload">{selectedEventPayload || '(sin payload)'}</pre>
                </>
              ) : (
                <div className="event-empty">selecciona un evento para ver payload</div>
              )}
            </div>
          </div>
          {commandHistoryExpanded ? (
            <div className="event-terminal-command-history">
              {commandHistory.length === 0 ? (
                <div className="event-empty">sin comandos ejecutados</div>
              ) : (
                commandHistory
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={`${entry.at}-${entry.input}`} className={`command-history-row ${entry.status}`}>
                      <span>{formatSceneEventTime(entry.at)}</span>
                      <span>{entry.input}</span>
                      <span>{entry.message}</span>
                      <span>dispatch:{entry.commandsCount}</span>
                    </div>
                  ))
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
