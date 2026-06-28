import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg {...base} aria-hidden {...props}>
      {children}
    </svg>
  )
}

export function RpgIconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      <path d="M9 21v-7h6v7" strokeWidth={1.2} />
    </Icon>
  )
}

export function RpgIconQuests(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
      <path d="M8 4V3M16 4V3" strokeWidth={1.2} />
    </Icon>
  )
}

export function RpgIconGallery(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 16l4.5-4 3 2.5L15 10l5 6" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function RpgIconSkills(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v18" />
      <path d="M6 8h12M8 14h8M10 20h4" />
      <circle cx="12" cy="6" r="2" />
    </Icon>
  )
}

export function RpgIconAchievements(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8l1 4 3 1-2 3.5V20H6v-7.5L4 9l3-1 1-4Z" />
      <path d="M9 20h6" />
    </Icon>
  )
}

export function RpgIconSettings(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
    </Icon>
  )
}

export function RpgIconStatistics(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19h4V9H4v10zM10 19h4V5h-4v14zM16 19h4v-7h-4v7z" />
    </Icon>
  )
}

export function RpgIconResources(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h11a2 2 0 0 1 2 2v13l-4-3-4 3-4-3-4 3V5a2 2 0 0 1 2-2z" />
      <path d="M7 8h8M7 12h5" strokeWidth={1.2} />
    </Icon>
  )
}

export const RPG_NAV_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  '/': RpgIconHome,
  '/quests': RpgIconQuests,
  '/gallery': RpgIconGallery,
  '/skills': RpgIconSkills,
  '/progress': RpgIconStatistics,
  '/statistics': RpgIconStatistics,
  '/resources': RpgIconResources,
  '/achievements': RpgIconAchievements,
  '/settings': RpgIconSettings,
}
