import {
  createAppCommandEnvelope,
  dispatchAppCommandEnvelope,
  type AppCommand,
  type AppCommandEnvelope,
  type AppCommandPort,
} from './appCommandBus'
import { reflectAppCommandToTerminalLine } from './commandReflection'
import { usePoseStore } from '../../app/state/poseStore'
import { createEngineRuntime, type EngineCapability } from '../engine'
import { createEngineSimPreviewCapability, createEngineStatsCapability } from './capabilities'
import { resolveEngineCapabilityDefaultEnabled, runtimeConfig } from '../config'
import { dispatchWorkspaceShellCommand } from '../workspace-shell'

type PoseStoreState = ReturnType<typeof usePoseStore.getState>

export type PoseStoreEngineCapabilityEvent = {
  [key: string]: unknown
}

export type PoseStoreEngineCapability = EngineCapability<AppCommand, PoseStoreEngineCapabilityEvent, PoseStoreState>

type PoseStoreEngineCapabilityDefinition = {
  create: () => PoseStoreEngineCapability
  defaultEnabled: boolean
  description: string
  id: string
}

type PoseStoreEngineCapabilityStatus = {
  defaultEnabled: boolean
  description: string
  enabled: boolean
  id: string
}

const poseStoreEngineCapabilityDefinitions = new Map<string, PoseStoreEngineCapabilityDefinition>()

function getPoseStoreCommandPort(): AppCommandPort {
  const state = usePoseStore.getState()
  const toSceneEngineMeta = (envelope?: AppCommandEnvelope) => {
    if (!envelope) return undefined
    return {
      at: envelope.at,
      commandId: envelope.id,
      correlationId: envelope.correlationId,
      source: envelope.source,
    }
  }
  return {
    applyDeferredSceneRemote: state.applyDeferredSceneRemote,
    applyWorkspaceLayoutPreset: (preset) => {
      dispatchWorkspaceShellCommand({
        kind: 'apply_layout_preset',
        preset,
      })
    },
    clearScene: (envelope) => state.clearScene(toSceneEngineMeta(envelope)),
    clearSceneDeferredRemote: state.clearSceneDeferredRemote,
    clearSceneEventLog: state.clearSceneEventLog,
    clearSceneRemoteOverride: state.clearSceneRemoteOverride,
    redoSceneEdit: (envelope) => state.redoSceneEdit(toSceneEngineMeta(envelope)),
    requestEngineSimPreview: () => {
      const current = usePoseStore.getState()
      current.appendSceneEvent({
        kind: 'engine_sim_preview_unavailable',
        level: 'warn',
        message: {
          reason: "capability 'engine.sim.preview' is disabled",
        },
        revision: current.sceneRevision,
        sceneId: current.sceneId,
        sequence: current.sceneSequence,
        source: 'frontend.engine_runtime',
        summary: "engine sim preview unavailable (enable capability 'engine.sim.preview')",
      })
    },
    requestEngineStats: () => {
      const current = usePoseStore.getState()
      current.appendSceneEvent({
        kind: 'engine_stats_unavailable',
        level: 'warn',
        message: {
          reason: "capability 'engine.stats' is disabled",
        },
        revision: current.sceneRevision,
        sceneId: current.sceneId,
        sequence: current.sceneSequence,
        source: 'frontend.engine_runtime',
        summary: "engine stats unavailable (enable capability 'engine.stats')",
      })
    },
    resetPose: state.resetPose,
    resetCameraOverlayFlip: state.resetCameraOverlayFlip,
    rotateTopView: state.rotateTopView,
    runSceneCommand: (command, envelope) => state.runSceneCommand(command, toSceneEngineMeta(envelope)),
    setBridgeEnabled: state.setBridgeEnabled,
    setCameraOverlayFlip: state.setCameraOverlayFlip,
    setEngineCapabilityEnabled: (capabilityId, enabled) => {
      const outcome = setPoseStoreEngineCapabilityEnabled(capabilityId, enabled)
      const current = usePoseStore.getState()
      current.appendSceneEvent({
        kind: outcome === 'not_found' ? 'engine_capability_unknown' : 'engine_capability_toggle',
        level: outcome === 'not_found' ? 'warn' : 'info',
        message: {
          capabilityId,
          enabled,
          outcome,
        },
        revision: current.sceneRevision,
        sceneId: current.sceneId,
        sequence: current.sceneSequence,
        source: 'frontend.engine_runtime',
        summary:
          outcome === 'not_found'
            ? `capability ${capabilityId} not found`
            : `capability ${capabilityId} ${enabled ? 'enabled' : 'disabled'} (${outcome})`,
      })
    },
    setCameraView: state.setCameraView,
    setProjectionMode: state.setProjectionMode,
    setSceneId: state.setSceneId,
    setActiveToolMode: state.setActiveToolMode,
    setSceneEventAutoScroll: state.setSceneEventAutoScroll,
    setSceneEventLogPaused: state.setSceneEventLogPaused,
    setSelectedMonitoringCameraId: state.setSelectedMonitoringCameraId,
    setSelectedPlacementId: state.setSelectedPlacementId,
    setShowDimensions: state.setShowDimensions,
    toggleSceneEdit: state.toggleSceneEdit,
    toggleSceneEventTerminal: state.toggleSceneEventTerminal,
    toggleSceneRemoteHold: state.toggleSceneRemoteHold,
    toggleWorkspaceLeftPanel: () => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_left_panel' })
    },
    toggleWorkspaceRightPanel: () => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_right_panel' })
    },
    setWorkspaceWidgetVisible: (widget, visible) => {
      dispatchWorkspaceShellCommand({ kind: 'set_widget_visible', visible, widget })
    },
    toggleWorkspaceWidgetCollapsed: (widget) => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_widget_collapsed', widget })
    },
    toggleWorkspaceWidgetPinned: (widget) => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_widget_pinned', widget })
    },
    undoSceneEdit: (envelope) => state.undoSceneEdit(toSceneEngineMeta(envelope)),
    restoreWorkspaceLayoutDefaults: () => {
      dispatchWorkspaceShellCommand({ kind: 'restore_layout_defaults' })
    },
  }
}

const poseStoreEngineRuntime = createEngineRuntime<AppCommand, PoseStoreEngineCapabilityEvent, PoseStoreState>({
  dispatchCommand: (envelope) => {
    dispatchAppCommandEnvelope(getPoseStoreCommandPort(), envelope)
  },
  emitEvent: (event) => {
    const state = usePoseStore.getState()
    state.appendSceneEvent({
      kind: 'engine_runtime_event',
      level: 'debug',
      message: event,
      revision: state.sceneRevision,
      sceneId: state.sceneId,
      sequence: state.sceneSequence,
      source: 'frontend.engine_runtime',
      summary: `engine ${event.kind} (${event.source})`,
    })
  },
  getState: () => usePoseStore.getState(),
  onCapabilityError: ({ capabilityId, command, error }) => {
    const state = usePoseStore.getState()
    state.appendSceneEvent({
      kind: 'engine_capability_error',
      level: 'warn',
      message: {
        capabilityId,
        commandKind: command.kind,
        error: error instanceof Error ? error.message : String(error),
      },
      revision: state.sceneRevision,
      sceneId: state.sceneId,
      sequence: state.sceneSequence,
      source: 'frontend.engine_runtime',
      summary: `capability ${capabilityId} failed on ${command.kind}`,
    })
  },
})

function registerDefaultPoseStoreEngineCapabilities() {
  const defaultEnabled = resolveEngineCapabilityDefaultEnabled('engine.stats', true)
  registerPoseStoreEngineCapabilityDefinition({
    create: createEngineStatsCapability,
    defaultEnabled,
    description: 'Aggregated command counters by kind/source.',
    id: 'engine.stats',
  })
  const simPreviewDefaultEnabled = resolveEngineCapabilityDefaultEnabled('engine.sim.preview', false)
  registerPoseStoreEngineCapabilityDefinition({
    create: createEngineSimPreviewCapability,
    defaultEnabled: simPreviewDefaultEnabled,
    description: 'Snapshot preview of current scene state for local simulation workflows.',
    id: 'engine.sim.preview',
  })

  const state = usePoseStore.getState()
  state.appendSceneEvent({
    kind: 'engine_capability_policy',
    level: 'info',
    message: {
      engineCapabilityProfile: runtimeConfig.engineCapabilityProfile,
      engineCapabilitiesDisabled: runtimeConfig.engineCapabilitiesDisabled,
      engineCapabilitiesEnabled: runtimeConfig.engineCapabilitiesEnabled,
    },
    revision: state.sceneRevision,
    sceneId: state.sceneId,
    sequence: state.sceneSequence,
    source: 'frontend.engine_runtime',
    summary: `cap profile=${runtimeConfig.engineCapabilityProfile}`,
  })
}

function registerDefaultEnabledCapabilities() {
  for (const definition of poseStoreEngineCapabilityDefinitions.values()) {
    if (!definition.defaultEnabled) continue
    setPoseStoreEngineCapabilityEnabled(definition.id, true)
  }
}

function isPoseStoreEngineCapabilityEnabled(capabilityId: string): boolean {
  return poseStoreEngineRuntime.listCapabilities().some((capability) => capability.id === capabilityId)
}

registerDefaultPoseStoreEngineCapabilities()
registerDefaultEnabledCapabilities()

export function registerPoseStoreEngineCapabilityDefinition(definition: PoseStoreEngineCapabilityDefinition) {
  if (poseStoreEngineCapabilityDefinitions.has(definition.id)) {
    throw new Error(`Pose store capability definition '${definition.id}' is already registered.`)
  }
  poseStoreEngineCapabilityDefinitions.set(definition.id, definition)
}

export function registerPoseStoreEngineCapability(capability: PoseStoreEngineCapability) {
  poseStoreEngineRuntime.registerCapability(capability)
}

export function setPoseStoreEngineCapabilityEnabled(capabilityId: string, enabled: boolean): 'changed' | 'noop' | 'not_found' {
  const definition = poseStoreEngineCapabilityDefinitions.get(capabilityId)
  if (!definition) return 'not_found'
  const alreadyEnabled = isPoseStoreEngineCapabilityEnabled(capabilityId)
  if (enabled && alreadyEnabled) return 'noop'
  if (!enabled && !alreadyEnabled) return 'noop'

  if (enabled) {
    poseStoreEngineRuntime.registerCapability(definition.create())
    return 'changed'
  }

  poseStoreEngineRuntime.unregisterCapability(capabilityId)
  return 'changed'
}

export function unregisterPoseStoreEngineCapability(capabilityId: string) {
  poseStoreEngineRuntime.unregisterCapability(capabilityId)
}

export function listPoseStoreEngineCapabilities() {
  const statuses: PoseStoreEngineCapabilityStatus[] = []
  for (const definition of poseStoreEngineCapabilityDefinitions.values()) {
    statuses.push({
      defaultEnabled: definition.defaultEnabled,
      description: definition.description,
      enabled: isPoseStoreEngineCapabilityEnabled(definition.id),
      id: definition.id,
    })
  }
  return statuses.sort((left, right) => left.id.localeCompare(right.id))
}

export function dispatchPoseStoreCommand(
  command: AppCommand,
  options?: { correlationId?: string | null; source?: string },
): AppCommandEnvelope {
  const source = options?.source ?? 'ui.unknown'
  const envelope = createAppCommandEnvelope(command, {
    correlationId: options?.correlationId ?? null,
    source,
  })
  const state = usePoseStore.getState()
  state.appendSceneEvent({
    kind: 'app_command',
    level: 'debug',
    message: envelope,
    revision: state.sceneRevision,
    sceneId: state.sceneId,
    sequence: state.sceneSequence,
    source: 'frontend.command_bus',
    summary: `cmd ${command.kind} from ${envelope.source}`,
  })
  const reflectedCommand = reflectAppCommandToTerminalLine(command)
  if (reflectedCommand && !source.startsWith('ui.event_terminal')) {
    state.appendSceneEvent({
      kind: 'command_line_reflection',
      level: 'info',
      message: {
        command,
        line: reflectedCommand,
        source,
      },
      revision: state.sceneRevision,
      sceneId: state.sceneId,
      sequence: state.sceneSequence,
      source: 'frontend.command_line',
      summary: `ui> ${reflectedCommand}`,
    })
  }
  poseStoreEngineRuntime.dispatchEnvelope(envelope)
  return envelope
}
