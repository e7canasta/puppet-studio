import type { SceneConstraintZone } from '../scene-domain/sceneCommands'
import type { SceneDeferredApplyMode } from '../scene-domain/sceneDeferred'

type EngineCapabilityProfile = 'demo' | 'dev' | 'ops'
type TerminalCommandInputRenderer = 'classic' | 'cmdk_ready'

function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (normalized === '') return defaultValue
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return defaultValue
}

function parsePositiveInteger(value: unknown, defaultValue: number): number {
  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric <= 0) return defaultValue
  return numeric
}

function parseDeferredApplyMode(value: unknown, defaultValue: SceneDeferredApplyMode): SceneDeferredApplyMode {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (normalized === 'latest_only' || normalized === 'latest') return 'latest_only'
  if (normalized === 'apply_all' || normalized === 'all') return 'apply_all'
  return defaultValue
}

function parseTerminalCommandInputRenderer(
  value: unknown,
  defaultValue: TerminalCommandInputRenderer,
): TerminalCommandInputRenderer {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (normalized === 'classic') return 'classic'
  if (normalized === 'cmdk_ready' || normalized === 'cmdk') return 'cmdk_ready'
  return defaultValue
}

function parseEngineCapabilityProfile(
  value: unknown,
  defaultValue: EngineCapabilityProfile,
): EngineCapabilityProfile {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (normalized === 'dev') return 'dev'
  if (normalized === 'ops') return 'ops'
  if (normalized === 'demo') return 'demo'
  return defaultValue
}

function parseCapabilityIdList(value: unknown): string[] {
  if (typeof value !== 'string' || value.trim().length === 0) return []
  const normalized = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  return Array.from(new Set(normalized))
}

function parseConstraintZones(value: unknown): SceneConstraintZone[] {
  if (typeof value !== 'string' || value.trim().length === 0) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const zones: SceneConstraintZone[] = []
  for (let index = 0; index < parsed.length; index += 1) {
    const raw = parsed[index]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const record = raw as Record<string, unknown>
    const minX = Number(record.minX)
    const maxX = Number(record.maxX)
    const minZ = Number(record.minZ)
    const maxZ = Number(record.maxZ)
    if (![minX, maxX, minZ, maxZ].every(Number.isFinite)) continue
    const id = typeof record.id === 'string' && record.id.trim().length > 0 ? record.id.trim() : `zone-${index + 1}`
    const rawAssetIds = Array.isArray(record.assetIds) ? record.assetIds : []
    const assetIds = rawAssetIds
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => entry.trim())
    zones.push({
      assetIds: assetIds.length > 0 ? assetIds : undefined,
      id,
      maxX,
      maxZ,
      minX,
      minZ,
    })
  }
  return zones
}

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env ?? {}

const ENGINE_CAPABILITY_PROFILE_PRESETS: Record<EngineCapabilityProfile, { disable: string[]; enable: string[] }> = {
  demo: {
    disable: [],
    enable: ['engine.sim.preview'],
  },
  dev: {
    disable: [],
    enable: ['engine.stats', 'engine.sim.preview'],
  },
  ops: {
    disable: ['engine.sim.preview'],
    enable: ['engine.stats'],
  },
}

export const runtimeConfig = {
  defaultSceneEditEnabled: parseBoolean(runtimeEnv.VITE_FRONTEND_SCENE_EDIT_ENABLED, true),
  defaultSceneEventTerminalOpen: parseBoolean(runtimeEnv.VITE_FRONTEND_SCENE_EVENT_TERMINAL_OPEN, false),
  engineCapabilityProfile: parseEngineCapabilityProfile(runtimeEnv.VITE_FRONTEND_ENGINE_CAPABILITY_PROFILE, 'dev'),
  engineCapabilitiesDisabled: parseCapabilityIdList(runtimeEnv.VITE_FRONTEND_ENGINE_CAPABILITIES_DISABLED),
  engineCapabilitiesEnabled: parseCapabilityIdList(runtimeEnv.VITE_FRONTEND_ENGINE_CAPABILITIES_ENABLED),
  sceneConstraintZones: parseConstraintZones(runtimeEnv.VITE_FRONTEND_SCENE_CONSTRAINT_ZONES),
  sceneEventLogLimit: parsePositiveInteger(runtimeEnv.VITE_FRONTEND_SCENE_EVENT_LOG_LIMIT, 300),
  sceneDeferredAutoApplyOnRelease: parseBoolean(runtimeEnv.VITE_FRONTEND_SCENE_DEFERRED_AUTO_APPLY_ON_RELEASE, true),
  publishLocalSceneCommands: parseBoolean(runtimeEnv.VITE_FRONTEND_PUBLISH_LOCAL_SCENE_COMMANDS, false),
  sceneDeferredApplyMode: parseDeferredApplyMode(runtimeEnv.VITE_FRONTEND_SCENE_DEFERRED_APPLY_MODE, 'latest_only'),
  sceneDeferredQueueLimit: parsePositiveInteger(runtimeEnv.VITE_FRONTEND_SCENE_DEFERRED_QUEUE_LIMIT, 120),
  sceneDeferredRequireConfirmOnRelease: parseBoolean(runtimeEnv.VITE_FRONTEND_SCENE_DEFERRED_REQUIRE_CONFIRM_ON_RELEASE, false),
  terminalCommandInputRenderer: parseTerminalCommandInputRenderer(
    runtimeEnv.VITE_FRONTEND_TERMINAL_COMMAND_INPUT_RENDERER,
    'cmdk_ready',
  ),
  sceneUndoLimit: parsePositiveInteger(runtimeEnv.VITE_FRONTEND_SCENE_UNDO_LIMIT, 80),
}

export function resolveEngineCapabilityDefaultEnabled(capabilityId: string, fallbackDefaultEnabled: boolean): boolean {
  const normalizedCapabilityId = capabilityId.trim()
  if (!normalizedCapabilityId) return fallbackDefaultEnabled

  if (runtimeConfig.engineCapabilitiesDisabled.includes(normalizedCapabilityId)) return false
  if (runtimeConfig.engineCapabilitiesEnabled.includes(normalizedCapabilityId)) return true

  const preset = ENGINE_CAPABILITY_PROFILE_PRESETS[runtimeConfig.engineCapabilityProfile]
  if (preset.disable.includes(normalizedCapabilityId)) return false
  if (preset.enable.includes(normalizedCapabilityId)) return true
  return fallbackDefaultEnabled
}
