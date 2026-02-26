import { useMemo, useState } from 'react'
import type { ReactNode, SVGProps } from 'react'

import { usePoseStore } from '../../../../app/state'
import { selectSelectedPlacementView } from '../../../../core/scene-domain'
import {
  createPoseStoreCommandDispatcher,
  IconCamera,
  IconChevronDown,
  IconChevronRight,
  IconCommand,
  IconCube,
  IconEye,
} from '../../../../shared/ui'

type OutlinerSectionKey = 'cameras' | 'detections' | 'experts' | 'placements'

type OutlinerSection = {
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode
  key: OutlinerSectionKey
  label: string
}

type DetectionRow = {
  cameraId: string
  id: string
  trackLabel: string
}

const OUTLINER_SECTIONS: OutlinerSection[] = [
  { icon: IconCommand, key: 'experts', label: 'Expert Mesh' },
  { icon: IconCube, key: 'placements', label: 'Entities' },
  { icon: IconCamera, key: 'cameras', label: 'Cameras' },
  { icon: IconEye, key: 'detections', label: 'Detections' },
]

const EXPERT_TAGS = ['bridge', 'inference', 'spatial_projector', 'scene_compositor', 'strategy_projector']
const INSPECTOR_PALETTE = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#ef4444', '#06b6d4', '#ffffff', '#94a3b8']

function toLower(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

function matchesQuery(tokens: Array<string | null | undefined>, query: string): boolean {
  if (!query) return true
  return tokens.some((token) => toLower(token).includes(query))
}

function sectionCountLabel(total: number, filtered: number, query: string): string {
  if (!query) return `${total}`
  if (total === filtered) return `${total}`
  return `${filtered}/${total}`
}

function formatFixed(value: number): string {
  return Number(value).toFixed(1)
}

export function WorkspaceSceneOutliner() {
  const sceneId = usePoseStore((state) => state.sceneId)
  const sceneRevision = usePoseStore((state) => state.sceneRevision)
  const sceneSequence = usePoseStore((state) => state.sceneSequence)
  const scenePlacements = usePoseStore((state) => state.scenePlacements)
  const selectedPlacementId = usePoseStore((state) => state.selectedPlacementId)
  const monitoringCameras = usePoseStore((state) => state.monitoringCameras)
  const selectedMonitoringCameraId = usePoseStore((state) => state.selectedMonitoringCameraId)
  const cameraDetectionOverlays = usePoseStore((state) => state.cameraDetectionOverlays)
  const sceneEventLog = usePoseStore((state) => state.sceneEventLog)
  const dispatchFromOutliner = createPoseStoreCommandDispatcher('ui.workspace_outliner')

  const [openSections, setOpenSections] = useState<Record<OutlinerSectionKey, boolean>>({
    cameras: true,
    detections: false,
    experts: true,
    placements: true,
  })
  const [filterQuery, setFilterQuery] = useState('')
  const normalizedQuery = filterQuery.trim().toLowerCase()

  const sourceHeat = useMemo(() => {
    const recent = sceneEventLog.slice(Math.max(0, sceneEventLog.length - 220))
    return EXPERT_TAGS.map((tag) => ({
      count: recent.filter((entry) => entry.source.includes(tag)).length,
      id: tag,
    }))
  }, [sceneEventLog])

  const detectionRows = useMemo<DetectionRow[]>(
    () =>
      cameraDetectionOverlays.flatMap((overlay) =>
        overlay.boxes.map((box) => ({
          cameraId: overlay.cameraId,
          id: box.id,
          trackLabel: box.trackId ?? box.label ?? box.id,
        })),
      ),
    [cameraDetectionOverlays],
  )

  const filteredSourceHeat = useMemo(
    () => sourceHeat.filter((entry) => matchesQuery([entry.id], normalizedQuery)),
    [normalizedQuery, sourceHeat],
  )

  const filteredPlacements = useMemo(
    () =>
      scenePlacements.filter((placement) =>
        matchesQuery([placement.assetId, placement.id, placement.objectId, placement.trackId], normalizedQuery),
      ),
    [normalizedQuery, scenePlacements],
  )

  const filteredCameras = useMemo(
    () =>
      monitoringCameras.filter((camera) => matchesQuery([camera.label, camera.id], normalizedQuery)),
    [monitoringCameras, normalizedQuery],
  )

  const filteredDetections = useMemo(
    () =>
      detectionRows.filter((detection) => matchesQuery([detection.trackLabel, detection.id, detection.cameraId], normalizedQuery)),
    [detectionRows, normalizedQuery],
  )

  const detectionsByCamera = useMemo(() => {
    const groups = new Map<string, DetectionRow[]>()
    for (const detection of filteredDetections) {
      const existing = groups.get(detection.cameraId)
      if (existing) {
        existing.push(detection)
        continue
      }
      groups.set(detection.cameraId, [detection])
    }
    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]))
  }, [filteredDetections])

  const activeExperts = sourceHeat.filter((entry) => entry.count > 0).length
  const selectedPlacementView = useMemo(
    () => selectSelectedPlacementView(scenePlacements, selectedPlacementId),
    [scenePlacements, selectedPlacementId],
  )
  const selectedPlacement = selectedPlacementView.placement
  const selectedPlacementAsset = selectedPlacementView.asset

  return (
    <section className="workspace-outliner">
      <header className="workspace-outliner-head">
        <span>Scene Outliner</span>
        <span>{sceneId}</span>
      </header>
      <div className="workspace-outliner-toolbar">
        <input
          value={filterQuery}
          onChange={(event) => setFilterQuery(event.currentTarget.value)}
          placeholder="Filter entities, cameras, detections..."
        />
        <span>
          rev:{sceneRevision ?? '-'} seq:{sceneSequence ?? '-'}
        </span>
      </div>
      <div className="workspace-outliner-body">
        <div className="workspace-tree-root">
          <span className="workspace-tree-root-name">{sceneId}</span>
          <span className="workspace-tree-root-meta">entities:{scenePlacements.length}</span>
        </div>

        {OUTLINER_SECTIONS.map((section) => {
          const Icon = section.icon
          const isOpen = openSections[section.key]
          const count =
            section.key === 'experts'
              ? sectionCountLabel(sourceHeat.length, filteredSourceHeat.length, normalizedQuery)
              : section.key === 'placements'
                ? sectionCountLabel(scenePlacements.length, filteredPlacements.length, normalizedQuery)
                : section.key === 'cameras'
                  ? sectionCountLabel(monitoringCameras.length, filteredCameras.length, normalizedQuery)
                  : sectionCountLabel(detectionRows.length, filteredDetections.length, normalizedQuery)
          return (
            <div key={section.key} className="workspace-tree-section">
              <button
                type="button"
                className={`workspace-tree-toggle ${isOpen ? 'open' : 'closed'}`}
                onClick={() => setOpenSections((state) => ({ ...state, [section.key]: !state[section.key] }))}
              >
                <span className="workspace-tree-toggle-main">
                  {isOpen ? (
                    <IconChevronDown className="workspace-tree-toggle-icon workspace-tree-disclosure" />
                  ) : (
                    <IconChevronRight className="workspace-tree-toggle-icon workspace-tree-disclosure" />
                  )}
                  <Icon className="workspace-tree-toggle-icon" />
                  <span>{section.label}</span>
                </span>
                <span className="workspace-tree-count">
                  {section.key === 'experts' ? `${activeExperts} active` : count}
                </span>
              </button>

              {isOpen ? (
                <div className="workspace-tree-items">
                  {section.key === 'experts' ? (
                    filteredSourceHeat.length > 0 ? (
                      filteredSourceHeat.map((entry) => (
                        <div key={entry.id} className="workspace-tree-item">
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${entry.count > 0 ? 'active' : 'idle'}`} />
                            <span>{entry.id}</span>
                          </span>
                          <span className={`workspace-tree-tag ${entry.count > 0 ? 'active' : 'inactive'}`}>
                            {entry.count > 0 ? `${entry.count} ev` : 'idle'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No experts match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'placements' ? (
                    filteredPlacements.length > 0 ? (
                      filteredPlacements.map((placement) => (
                        <button
                          key={placement.id}
                          type="button"
                          className={`workspace-tree-item selectable ${placement.id === selectedPlacementId ? 'selected' : ''}`}
                          onClick={() =>
                            dispatchFromOutliner({
                              kind: 'set_selected_placement',
                              placementId: placement.id,
                            })
                          }
                        >
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${placement.id === selectedPlacementId ? 'selected' : 'entity'}`} />
                            <span>{placement.assetId}</span>
                          </span>
                          <span className="workspace-tree-item-meta">{placement.id}</span>
                        </button>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No entities match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'cameras' ? (
                    filteredCameras.length > 0 ? (
                      filteredCameras.map((camera) => (
                        <button
                          key={camera.id}
                          type="button"
                          className={`workspace-tree-item selectable ${camera.id === selectedMonitoringCameraId ? 'selected' : ''}`}
                          onClick={() =>
                            dispatchFromOutliner({
                              kind: 'set_selected_monitoring_camera',
                              cameraId: camera.id,
                            })
                          }
                        >
                          <span className="workspace-tree-item-main">
                            <span className={`workspace-tree-dot ${camera.id === selectedMonitoringCameraId ? 'selected' : 'camera'}`} />
                            <span>{camera.label ?? camera.id}</span>
                          </span>
                          <span className="workspace-tree-item-meta">{camera.id}</span>
                        </button>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No cameras match current filter.</div>
                    )
                  ) : null}

                  {section.key === 'detections' ? (
                    detectionsByCamera.length > 0 ? (
                      detectionsByCamera.map(([cameraId, detections]) => (
                        <div key={cameraId} className="workspace-tree-group">
                          <div className="workspace-tree-group-head">
                            <span>{cameraId}</span>
                            <span>{detections.length}</span>
                          </div>
                          <div className="workspace-tree-group-body">
                            {detections.map((detection) => (
                              <div key={`${detection.cameraId}:${detection.id}`} className="workspace-tree-item">
                                <span className="workspace-tree-item-main">
                                  <span className="workspace-tree-dot detection" />
                                  <span>{detection.trackLabel}</span>
                                </span>
                                <span className="workspace-tree-item-meta">{detection.id}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="workspace-tree-empty">No detections match current filter.</div>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}

        {selectedPlacement ? (
          <div className="workspace-outliner-inspector">
            <div className="workspace-inspector-head">
              <span className="workspace-inspector-title">{selectedPlacement.id}</span>
              <span className="workspace-inspector-subtitle">
                {selectedPlacement.assetId}
                {selectedPlacement.objectId ? ` | ${selectedPlacement.objectId}` : ''}
              </span>
            </div>
            <div className="workspace-inspector-body">
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label position">Position</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(selectedPlacement.planPositionM[0])}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selectedPlacement.elevationM ?? 0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(selectedPlacement.planPositionM[1])}</span>
                  </span>
                </div>
              </div>
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label rotation">Rotation</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selectedPlacement.rotationDeg ?? 0)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(0)}</span>
                  </span>
                </div>
              </div>
              <div className="workspace-inspector-row">
                <span className="workspace-inspector-row-label scale">Scale</span>
                <div className="workspace-inspector-axis-grid">
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-x">x</span>
                    <span>{formatFixed(selectedPlacementView.size?.width ?? 1)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-y">y</span>
                    <span>{formatFixed(selectedPlacementView.size?.height ?? 1)}</span>
                  </span>
                  <span className="workspace-inspector-axis-value">
                    <span className="axis axis-z">z</span>
                    <span>{formatFixed(selectedPlacementView.size?.depth ?? 1)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="workspace-inspector-colors">
              {INSPECTOR_PALETTE.map((color) => (
                <span
                  key={color}
                  className={`workspace-inspector-color ${selectedPlacementAsset?.miniMapColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
