import type { ReactNode, SVGProps } from 'react'

import type { WorkspaceWidgetId } from '../../../../core/workspace-shell'
import {
  IconCamera,
  IconChevronDown,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconOutliner,
  IconPlanogram,
  IconPin,
  IconSliders,
} from '../../../../shared/ui'
import type { WorkspaceWidgetHudState } from '../../model'

type WorkspaceDockManagerProps = {
  onClose: () => void
  onSetWidgetVisible: (widget: WorkspaceWidgetId, visible: boolean) => void
  onToggleWidgetCollapsed: (widget: WorkspaceWidgetId) => void
  onToggleWidgetPinned: (widget: WorkspaceWidgetId) => void
  widgets: WorkspaceWidgetHudState
}

type DockWidgetDescriptor = {
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode
  id: WorkspaceWidgetId
  label: string
}

const DOCK_WIDGETS: DockWidgetDescriptor[] = [
  { icon: IconSliders, id: 'properties', label: 'Properties' },
  { icon: IconOutliner, id: 'outliner', label: 'Outliner' },
  { icon: IconCamera, id: 'camera', label: 'Camera Map' },
  { icon: IconPlanogram, id: 'planogram', label: 'Planogram' },
]

export function WorkspaceDockManager({
  onClose,
  onSetWidgetVisible,
  onToggleWidgetCollapsed,
  onToggleWidgetPinned,
  widgets,
}: WorkspaceDockManagerProps) {
  return (
    <aside className="workspace-dock-manager">
      <header className="workspace-dock-manager-head">
        <span>Dock Manager</span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="workspace-dock-manager-body">
        {DOCK_WIDGETS.map((entry) => {
          const Icon = entry.icon
          const widget = widgets[entry.id]
          return (
            <div key={entry.id} className="workspace-dock-row">
              <div className="workspace-dock-row-main">
                <Icon className="workspace-dock-row-icon" />
                <span>{entry.label}</span>
              </div>
              <div className="workspace-dock-row-actions">
                <button
                  type="button"
                  className={widget.visible ? 'active' : ''}
                  onClick={() => onSetWidgetVisible(entry.id, !widget.visible)}
                  aria-label={widget.visible ? 'Hide widget' : 'Show widget'}
                  title={widget.visible ? 'Hide widget' : 'Show widget'}
                >
                  {widget.visible ? <IconEye className="workspace-dock-action-icon" /> : <IconEyeOff className="workspace-dock-action-icon" />}
                </button>
                <button
                  type="button"
                  className={widget.collapsed ? '' : 'active'}
                  onClick={() => onToggleWidgetCollapsed(entry.id)}
                  aria-label={widget.collapsed ? 'Expand widget' : 'Collapse widget'}
                  title={widget.collapsed ? 'Expand widget' : 'Collapse widget'}
                >
                  {widget.collapsed ? (
                    <IconChevronRight className="workspace-dock-action-icon" />
                  ) : (
                    <IconChevronDown className="workspace-dock-action-icon" />
                  )}
                </button>
                <button
                  type="button"
                  className={widget.pinned ? 'active' : ''}
                  onClick={() => onToggleWidgetPinned(entry.id)}
                  aria-label={widget.pinned ? 'Unpin widget' : 'Pin widget'}
                  title={widget.pinned ? 'Unpin widget' : 'Pin widget'}
                >
                  <IconPin className="workspace-dock-action-icon" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
