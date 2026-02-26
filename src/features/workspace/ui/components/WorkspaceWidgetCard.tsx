import type { ReactNode } from 'react'

import { IconChevronDown, IconChevronRight, IconEyeOff, IconPin } from '../../../../shared/ui'

type WorkspaceWidgetCardProps = {
  children?: ReactNode
  collapsed: boolean
  icon?: ReactNode
  label: string
  onToggleCollapsed: () => void
  onTogglePinned: () => void
  onHide: () => void
  pinned: boolean
}

export function WorkspaceWidgetCard({
  children,
  collapsed,
  icon,
  label,
  onToggleCollapsed,
  onTogglePinned,
  onHide,
  pinned,
}: WorkspaceWidgetCardProps) {
  return (
    <section className={`workspace-widget-card ${collapsed ? 'collapsed' : 'expanded'}`}>
      <header className="workspace-widget-card-head">
        <button type="button" className="workspace-widget-head-main" onClick={onToggleCollapsed}>
          {collapsed ? <IconChevronRight className="workspace-widget-head-icon" /> : <IconChevronDown className="workspace-widget-head-icon" />}
          {icon ? <span className="workspace-widget-head-label-icon">{icon}</span> : null}
          <span>{label}</span>
        </button>
        <div className="workspace-widget-head-actions">
          <button
            type="button"
            className={`workspace-widget-mini-btn ${pinned ? 'active' : ''}`}
            onClick={onTogglePinned}
            title={pinned ? 'Unpin widget' : 'Pin widget'}
          >
            <IconPin className="workspace-widget-mini-icon" />
          </button>
          <button type="button" className="workspace-widget-mini-btn" onClick={onHide} title="Hide widget">
            <IconEyeOff className="workspace-widget-mini-icon" />
          </button>
        </div>
      </header>
      {collapsed ? null : <div className="workspace-widget-card-body">{children}</div>}
    </section>
  )
}
