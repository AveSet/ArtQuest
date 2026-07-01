import type { ReactNode, SVGProps } from 'react'
import type { QuestCategory } from '@/data/skillTree'
import { CATEGORY_INFO } from '@/data/skillTree'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Icon({ children, className, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg {...base} className={['settings-icon', className].filter(Boolean).join(' ')} aria-hidden {...props}>
      {children}
    </svg>
  )
}

export function SettingsSectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="settings-section-title-row">
      <span className="settings-section-title__icon">{icon}</span>
      <span className="settings-section-title__text">{children}</span>
    </span>
  )
}

export function SettingsInlineIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="settings-inline-icon-row">
      <span className="settings-inline-icon-row__icon">{icon}</span>
      <span>{children}</span>
    </span>
  )
}

export function SettingsIconProfile(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </Icon>
  )
}

export function SettingsIconChart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19V9M12 19V5M19 19v-7" />
    </Icon>
  )
}

export function SettingsIconTarget(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </Icon>
  )
}

export function SettingsIconGlobe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
    </Icon>
  )
}

export function SettingsIconPortrait(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 18c.8-2 2.2-3 4-3s3.2 1 4 3" />
    </Icon>
  )
}

export function SettingsIconStorage(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7h14v12H5z" />
      <path d="M8 7V5h8v2M9 12h6" />
    </Icon>
  )
}

export function SettingsIconSound(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 10H4v4h2l4 3V7L6 10z" />
      <path d="M16 9a4 4 0 0 1 0 6M18 7a7 7 0 0 1 0 10" />
    </Icon>
  )
}

export function SettingsIconCompass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14 10-4 4-2-2 4-4 2 2z" />
    </Icon>
  )
}

export function SettingsIconDesktop(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="12" rx="1" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  )
}

export function SettingsIconAccessibility(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M7 8h10M12 8v8M9 20l3-4 3 4" />
    </Icon>
  )
}

export function SettingsIconArtApps(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19c2-4 6-8 11-9 2 1 3 4 3 7 0 2-1 3-3 3" />
      <path d="M14 6l4 4" />
    </Icon>
  )
}

export function SettingsIconKeyboard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="18" height="10" rx="1" />
      <path d="M7 11h2M11 11h2M15 11h2M7 14h10" strokeWidth={1.2} />
    </Icon>
  )
}

export function SettingsIconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </Icon>
  )
}

export function SettingsIconBackup(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v10M8 10l4 4 4-4" />
      <path d="M5 18h14" />
    </Icon>
  )
}

export function SettingsIconDrawing(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19l9-9 4 4-9 9H5v-5z" />
      <path d="M15 7l3 3" />
    </Icon>
  )
}

export function SettingsIconAnimation(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function SettingsIconMale(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="14" r="4" />
      <path d="M14 10l6-6M16 4h4v4" />
    </Icon>
  )
}

export function SettingsIconFemale(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="4" />
      <path d="M12 13v7M9 17h6" />
    </Icon>
  )
}

export function SettingsIconThemeModern(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
      <path d="M12 3v14" fill="currentColor" fillOpacity={0.35} stroke="none" />
    </Icon>
  )
}

export function SettingsIconThemeLight(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6l-1.4-1.4M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4" />
    </Icon>
  )
}

export function SettingsIconThemeRpg(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8l1 4 3 1-2 3.5V20H6v-7.5L4 9l3-1 1-4Z" />
    </Icon>
  )
}

export function SettingsIconThemeStudio(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19c2-4 6-8 11-9 2 1 3 4 3 7 0 2-1 3-3 3" />
    </Icon>
  )
}

const CATEGORY_ICON_NODES: Record<QuestCategory, ReactNode> = {
  drawing: (
    <>
      <path d="M5 19l9-9 4 4-9 9H5v-5z" />
      <path d="M15 7l3 3" />
    </>
  ),
  anatomy: (
    <>
      <path d="M12 4v16" />
      <path d="M8 8h8M9 14h6" />
    </>
  ),
  animation: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </>
  ),
  effects: <path d="M13 2 4 14h7l-1 8 10-12h-7l0-8z" />,
  storytelling: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  character_design: (
    <>
      <circle cx="12" cy="9" r="3" />
      <path d="M7 20c0-3 2.2-5 5-5s5 2 5 5" />
    </>
  ),
  environment: (
    <>
      <path d="M4 18h16" />
      <path d="M6 18l4-10 4 6 4-8 4 12" />
    </>
  ),
}

export function SettingsCategoryIcon({ category, className }: { category: QuestCategory; className?: string }) {
  const accent = CATEGORY_INFO[category]?.color ?? 'var(--accent)'
  return (
    <Icon className={className} style={{ color: accent }}>
      {CATEGORY_ICON_NODES[category]}
    </Icon>
  )
}

export function SettingsIconBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4a4 4 0 0 0-4 4v3l-2 2h12l-2-2V8a4 4 0 0 0-4-4z" />
      <path d="M10 20h4" />
    </Icon>
  )
}

export function SettingsIconWarning(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4 3 20h18L12 4z" />
      <path d="M12 10v4M12 17h.01" strokeWidth={1.6} />
    </Icon>
  )
}

export function SettingsThemeIcon({ theme }: { theme: 'modern' | 'light' | 'rpg' | 'studio' }) {
  switch (theme) {
    case 'modern':
      return <SettingsIconThemeModern className="settings-inline-icon-row__icon" />
    case 'light':
      return <SettingsIconThemeLight className="settings-inline-icon-row__icon" />
    case 'rpg':
      return <SettingsIconThemeRpg className="settings-inline-icon-row__icon" />
    case 'studio':
      return <SettingsIconThemeStudio className="settings-inline-icon-row__icon" />
  }
}
