import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  )
}

export function IconPanelLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M6 9l-1.5 3L6 15" />
    </IconBase>
  )
}

export function IconPanelRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
      <path d="M18 9l1.5 3L18 15" />
    </IconBase>
  )
}

export function IconTerminal(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10l2.5 2L7 14" />
      <path d="M12 14h5" />
    </IconBase>
  )
}

export function IconCommand(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 8a2 2 0 1 1 0 4H6a2 2 0 1 1 0-4h2Z" />
      <path d="M18 8a2 2 0 1 1 0 4h-2a2 2 0 1 1 0-4h2Z" />
      <path d="M8 16a2 2 0 1 1 0-4h2a2 2 0 1 1 0 4H8Z" />
      <path d="M18 16a2 2 0 1 1 0-4h-2a2 2 0 1 1 0 4h2Z" />
    </IconBase>
  )
}

export function IconSelect(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 4 6 12 1-5 5-1L6 4Z" />
    </IconBase>
  )
}

export function IconMove(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18" />
      <path d="m8 7 4-4 4 4" />
      <path d="m8 17 4 4 4-4" />
      <path d="M3 12h18" />
      <path d="m7 8-4 4 4 4" />
      <path d="m17 8 4 4-4 4" />
    </IconBase>
  )
}

export function IconRotate(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.5 8A7 7 0 1 1 5 13" />
      <path d="M8 4v4h4" />
    </IconBase>
  )
}

export function IconCube(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Z" />
      <path d="M12 12 4.5 8" />
      <path d="M12 12V21" />
      <path d="m12 12 7.5-4" />
    </IconBase>
  )
}

export function IconDock(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M10 4v16" />
      <path d="M16 10v6" />
      <path d="M13 7h6" />
      <path d="M13 17h6" />
    </IconBase>
  )
}

export function IconOutliner(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7" cy="7" r="1.7" />
      <circle cx="7" cy="17" r="1.7" />
      <circle cx="17" cy="12" r="1.7" />
      <path d="M8.7 7h6.6" />
      <path d="M8.7 17h6.6" />
      <path d="M15.3 12h-6.6" />
      <path d="M7 8.7V15.3" />
    </IconBase>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7 10.5 4h3L15 7" />
      <circle cx="12" cy="13" r="3" />
    </IconBase>
  )
}

export function IconPlanogram(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M10 4v16" />
      <path d="M14 4v16" />
      <path d="M4 10h16" />
      <path d="M4 14h16" />
    </IconBase>
  )
}

export function IconSliders(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h14" />
      <circle cx="9" cy="6" r="1.8" />
      <circle cx="15" cy="12" r="1.8" />
      <circle cx="11" cy="18" r="1.8" />
    </IconBase>
  )
}

export function IconEye(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconBase>
  )
}

export function IconStats(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect x="7" y="12" width="2.5" height="5" rx="0.6" />
      <rect x="11" y="9" width="2.5" height="8" rx="0.6" />
      <rect x="15" y="7" width="2.5" height="10" rx="0.6" />
    </IconBase>
  )
}

export function IconSimulate(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m10 8 6 4-6 4V8Z" />
    </IconBase>
  )
}

export function IconSnap(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 7h5v3H9.5v4H7V7Z" />
      <path d="M17 17h-5v-3h2.5v-4H17v7Z" />
      <path d="M3.5 12h4" />
      <path d="M16.5 12h4" />
    </IconBase>
  )
}

export function IconMeasure(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 16 16 4l4 4-12 12H4v-4Z" />
      <path d="m11 9 4 4" />
      <path d="M7.5 12.5 9 14" />
    </IconBase>
  )
}

export function IconInfo(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10v5" />
      <circle cx="12" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function IconWarning(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5 20 19.5H4L12 4.5Z" />
      <path d="M12 9v4.8" />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function IconError(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3.5h8l4.5 4.5v8L16 20.5H8L3.5 16V8L8 3.5Z" />
      <path d="m9.5 9.5 5 5" />
      <path d="m14.5 9.5-5 5" />
    </IconBase>
  )
}

export function IconDebug(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 5V3" />
      <path d="M12 21v-2" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function IconPin(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 4h6l-1.5 5 2.5 2.5-1 1-2.5-2.5L9 11V4Z" />
      <path d="M12 11v9" />
    </IconBase>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  )
}

export function IconEyeOff(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3 21 21" />
      <path d="M9.2 6.9A11.4 11.4 0 0 1 12 6.5C18 6.5 21.5 12 21.5 12a17 17 0 0 1-3.7 4.3" />
      <path d="M6.2 8.3A16 16 0 0 0 2.5 12S6 17.5 12 17.5a10 10 0 0 0 2.8-.4" />
      <path d="M10.7 10.8a2.5 2.5 0 0 0 3.4 3.4" />
    </IconBase>
  )
}
