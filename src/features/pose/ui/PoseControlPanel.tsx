import { PART_LIMITS, PART_ORDER } from '../../../poseControls'
import { runtimeConfig } from '../../../core/config'
import { usePoseControlPanelState } from '../hooks'
import { POSE_AXES } from '../model'

function formatNullable(value: number | string | null): string {
  if (value === null || value === '') return '-'
  return String(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function PoseControlPanel() {
  const {
    bridgeEnabled,
    bridgeError,
    bridgeLastPoseAt,
    bridgeNonZeroAxes,
    bridgeSequence,
    bridgeStatus,
    bridgeUrl,
    dispatchFromControlPanel,
    pose,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneDraft,
    sceneEditEnabled,
    sceneEventTerminalOpen,
    sceneError,
    sceneId,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneSpecialistGeneratedAt,
    sceneSpecialistSource,
    sceneSpatialAgeS,
    sceneSpatialFresh,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
    setAxis,
    setBridgeUrl,
    setSceneDraft,
  } = usePoseControlPanelState()

  return (
    <div className="control-panel">
      <div className="panel-head">
        <h1>Puppet Controls</h1>
        <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'reset_pose' })}>
          Reset
        </button>
      </div>

      <section className="part-card bridge-card">
        <h2>Bridge</h2>
        <label className="bridge-url">
          <span>WebSocket URL</span>
          <input value={bridgeUrl} onChange={(event) => setBridgeUrl(event.currentTarget.value)} />
        </label>
        <div className="bridge-row">
          <label className="bridge-url bridge-scene">
            <span>Scene ID</span>
            <input value={sceneDraft} onChange={(event) => setSceneDraft(event.currentTarget.value)} />
          </label>
          <button
            type="button"
            onClick={() =>
              dispatchFromControlPanel({
                kind: 'set_scene_id',
                sceneId: sceneDraft,
              })
            }
          >
            Subscribe
          </button>
        </div>
        <div className="bridge-row">
          <button
            type="button"
            onClick={() =>
              dispatchFromControlPanel({
                kind: 'set_bridge_enabled',
                enabled: !bridgeEnabled,
              })
            }
          >
            {bridgeEnabled ? 'Disconnect' : 'Connect'}
          </button>
          <span className={`status-pill status-${bridgeStatus}`}>{bridgeStatus}</span>
        </div>
        <div className="bridge-row bridge-row-wrap">
          <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'toggle_scene_edit' })}>
            {sceneEditEnabled ? 'Edit ON' : 'Edit OFF'}
          </button>
          <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'toggle_scene_remote_hold' })}>
            {sceneRemoteHoldEnabled ? 'Hold ON' : 'Hold OFF'}
          </button>
          <button
            type="button"
            onClick={() =>
              dispatchFromControlPanel({ kind: 'clear_scene' })
            }
            disabled={!sceneEditEnabled}
          >
            Cleanup
          </button>
        </div>
        {sceneDeferredRemoteCount > 0 ? (
          <div className="bridge-row bridge-row-wrap">
            <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'apply_deferred_scene_remote' })}>
              {sceneDeferredApplyPendingConfirm ? 'Confirm + Apply deferred' : 'Apply deferred'}
            </button>
            <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'clear_scene_deferred_remote' })}>
              Clear deferred
            </button>
          </div>
        ) : null}
        {sceneRemoteOverrideAt ? (
          <div className="bridge-row bridge-row-wrap">
            <button type="button" onClick={() => dispatchFromControlPanel({ kind: 'clear_scene_remote_override' })}>
              Clear overwrite flag
            </button>
          </div>
        ) : null}
        <div className="bridge-inline-stats">
          <span>scene:{sceneId}</span>
          <span>rev:{formatNullable(sceneRevision)}</span>
          <span>seq:{formatNullable(sceneSequence)}</span>
          <span>entities:{scenePlacements.length}</span>
          <span>deferred:{sceneDeferredRemoteCount}</span>
          <span>undo/redo:{sceneUndoDepth}/{sceneRedoDepth}</span>
        </div>
        <details className="bridge-details">
          <summary>Diagnostics</summary>
          <div className="bridge-details-body">
            <p className="bridge-meta">bridge seq: {formatNullable(bridgeSequence)}</p>
            <p className="bridge-meta">bridge nonZeroAxes: {formatNullable(bridgeNonZeroAxes)}</p>
            <p className="bridge-meta">last pose: {bridgeLastPoseAt ?? '-'}</p>
            <p className="bridge-meta">scene source: {sceneSource}</p>
            <p className="bridge-meta">scene last event: {sceneLastEventAt ?? '-'}</p>
            <p className="bridge-meta">publish local-&gt;bridge: {runtimeConfig.publishLocalSceneCommands ? 'on' : 'off'}</p>
            <p className="bridge-meta">deferred apply mode: {runtimeConfig.sceneDeferredApplyMode}</p>
            <p className="bridge-meta">deferred queue limit: {runtimeConfig.sceneDeferredQueueLimit}</p>
            <p className="bridge-meta">event log limit: {runtimeConfig.sceneEventLogLimit}</p>
            <p className="bridge-meta">
              hold release auto-apply: {runtimeConfig.sceneDeferredAutoApplyOnRelease ? 'on' : 'off'}
            </p>
            <p className="bridge-meta">
              hold release confirm: {runtimeConfig.sceneDeferredRequireConfirmOnRelease ? 'on' : 'off'}
            </p>
            <p className="bridge-meta">
              remote overwrite: {sceneRemoteOverrideAt ? `${sceneRemoteOverrideKind ?? 'scene'} @ ${sceneRemoteOverrideAt}` : '-'}
            </p>
            <p className="bridge-meta">
              deferred latest: {sceneDeferredRemoteLastAt ? `${sceneDeferredRemoteLastKind ?? 'scene'} @ ${sceneDeferredRemoteLastAt}` : '-'}
            </p>
            {sceneDeferredApplyPendingConfirm ? <p className="bridge-meta">deferred apply pending confirm: yes</p> : null}
            <p className="bridge-meta">constraints: {runtimeConfig.sceneConstraintZones.length}</p>
            <p className="bridge-meta">scene edit default: {runtimeConfig.defaultSceneEditEnabled ? 'on' : 'off'}</p>
            <p className="bridge-meta">specialist source: {sceneSpecialistSource ?? '-'}</p>
            <p className="bridge-meta">specialist generated: {sceneSpecialistGeneratedAt ?? '-'}</p>
            <p className="bridge-meta">
              specialist fresh: {sceneSpatialFresh === null ? '-' : sceneSpatialFresh ? 'yes' : 'no'}
            </p>
            <p className="bridge-meta">
              specialist age(s): {sceneSpatialAgeS === null ? '-' : sceneSpatialAgeS.toFixed(2)}
            </p>
            <p className="bridge-meta">specialist staleAfter(s): {sceneSpatialStaleAfterS ?? '-'}</p>
            <p className="bridge-meta">specialist stalePolicy: {sceneSpatialStalePolicy ?? '-'}</p>
          </div>
        </details>
        <div className="bridge-row bridge-row-wrap">
          <button
            type="button"
            className={sceneEventTerminalOpen ? 'active' : ''}
            onClick={() => dispatchFromControlPanel({ kind: 'toggle_scene_event_terminal' })}
          >
            {sceneEventTerminalOpen ? 'Hide Shell' : 'Open Shell'}
          </button>
          <span className="bridge-meta">UI actions are mirrored in shell</span>
        </div>
        {bridgeError ? <p className="bridge-error">{bridgeError}</p> : null}
        {sceneError ? <p className="bridge-error">{sceneError}</p> : null}
      </section>

      {PART_ORDER.map((part) => (
        <section className="part-card" key={part.key}>
          <h2>{part.label}</h2>
          <div className="pose-axis-triplet">
            {POSE_AXES.map((axis) => {
              const value = pose[part.key][axis]
              const [min, max] = PART_LIMITS[part.key][axis]
              return (
                <label key={`${part.key}-${axis}`} className={`pose-axis-field axis-${axis}`}>
                  <span>{axis.toUpperCase()}</span>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={1}
                    value={value.toFixed(1)}
                    onChange={(event) => {
                      const parsed = Number(event.currentTarget.value)
                      if (!Number.isFinite(parsed)) return
                      setAxis(part.key, axis, clamp(parsed, min, max))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault()
                        setAxis(part.key, axis, clamp(value + 1, min, max))
                      }
                      if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        setAxis(part.key, axis, clamp(value - 1, min, max))
                      }
                    }}
                    onWheel={(event) => {
                      event.preventDefault()
                      setAxis(part.key, axis, clamp(value + (event.deltaY < 0 ? 1 : -1), min, max))
                    }}
                  />
                </label>
              )
            })}
            <span className="pose-axis-unit">deg</span>
          </div>
        </section>
      ))}
    </div>
  )
}
