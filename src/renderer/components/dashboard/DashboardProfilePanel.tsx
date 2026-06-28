import DashboardPortrait from '@/components/portrait/DashboardPortrait'
import DailyRewardStars from '@/components/portrait/DailyRewardStars'
import DashboardSkillsSummary from '@/components/dashboard/DashboardSkillsSummary'
import type { Skill } from '@/store/models'
import type { ReactNode } from 'react'

type Props = {
  variant: 'sidebar' | 'mobile'
  portraitGender: 'male' | 'female'
  idle: boolean
  profileRoleLabel: string
  characterLevel: number
  characterTitle: string
  characterColor: string
  levelLabel: string
  dailyChestStreak: number
  streakDays: number
  chestHint: string
  renderSkillBar: (skill: Skill) => ReactNode
  showShareProgress?: boolean
  shareProgressLabel?: string
  onShareProgress?: () => void
}

export default function DashboardProfilePanel({
  variant,
  portraitGender,
  idle,
  profileRoleLabel,
  characterLevel,
  characterTitle,
  characterColor,
  levelLabel,
  dailyChestStreak,
  streakDays,
  chestHint,
  renderSkillBar,
  showShareProgress,
  shareProgressLabel,
  onShareProgress,
}: Props) {
  const isSidebar = variant === 'sidebar'

  const portraitBlock = (
    <div className="relative dashboard-portrait-panel">
      <DashboardPortrait gender={portraitGender} idle={idle} />
      <div className="dashboard-hero__caption text-center space-y-0.5">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{profileRoleLabel}</div>
        <div className="text-xs text-[var(--text-muted)]">
          <span style={{ color: characterColor }}>{levelLabel} {characterLevel}</span>
          <span className="mx-1" aria-hidden>·</span>
          <span style={{ color: characterColor }}>{characterTitle}</span>
        </div>
      </div>
      {isSidebar && <DashboardSkillsSummary renderSkillBar={renderSkillBar} />}
      <div className="dashboard-reward-stars--compact mt-2" data-onboarding="dashboard-reward-stars">
        <DailyRewardStars filledCount={dailyChestStreak} streakDays={streakDays} hint={chestHint} />
      </div>
      {showShareProgress && shareProgressLabel && onShareProgress && (
        <button type="button" className="btn-secondary w-full mt-3 text-sm" onClick={onShareProgress}>
          {shareProgressLabel}
        </button>
      )}
    </div>
  )

  if (isSidebar) {
    return (
      <div className="panel-fantasy relative">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none rounded-[inherit]"
          style={{ background: `radial-gradient(circle at 50% 20%, ${characterColor}, transparent 70%)` }}
        />
        {portraitBlock}
      </div>
    )
  }

  return (
    <>
      <div className="panel-fantasy relative">{portraitBlock}</div>
      <div className="panel-fantasy">
        <DashboardSkillsSummary renderSkillBar={renderSkillBar} />
      </div>
    </>
  )
}
