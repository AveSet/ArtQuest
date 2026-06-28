import { useEffect, useMemo } from 'react'
import { useSkillStore } from '@/store/useSkillStore'
import { useI18n, getLocalizedTitle, getLocalizedDescription } from '@/i18n'
import type { Achievement } from '@/store/models'
import { isEndgameAchievement } from '@/utils/achievementTiers'

const Achievements = () => {
  const achievements = useSkillStore(s => s.achievements)
  const markAllNewAchievementsSeen = useSkillStore(s => s.markAllNewAchievementsSeen)
  const { t, language } = useI18n()

  useEffect(() => {
    markAllNewAchievementsSeen()
  }, [markAllNewAchievementsSeen])

  const visible = useMemo(() => achievements.filter(a => !a.hidden || a.unlocked), [achievements])
  const hiddenCount = useMemo(() => achievements.filter(a => a.hidden && !a.unlocked).length, [achievements])
  const unlockedCount = useMemo(() => achievements.filter(a => a.unlocked).length, [achievements])
  const progressLabel = t.achievements.unlockProgress
    .replace('{unlocked}', String(unlockedCount))
    .replace('{total}', String(achievements.length))

  const getTitle = (ach: Achievement) => getLocalizedTitle(ach.title, language)

  const getDescription = (ach: Achievement) => getLocalizedDescription(ach.description, language)

  const cardClass = (ach: Achievement) => {
    if (!ach.unlocked) return 'achievement-card--locked'
    if (ach.unlockedAt && !ach.seenAt) return 'achievement-card--new'
    return 'achievement-card--seen'
  }

  return (
    <div data-onboarding="page-achievements">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="heading-2 mb-0">{t.achievements.title}</h2>
        <p className="text-sm font-semibold text-[var(--text-secondary)]">🏆 {progressLabel}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((ach, index) => {
          const isNew = ach.unlocked && ach.unlockedAt && !ach.seenAt
          return (
            <div
              key={ach.id}
              className={`achievement-card card-fantasy ${cardClass(ach)}${isNew ? ' achievement-card--new-animate' : ''}`}
              style={isNew ? { animationDelay: `${Math.min(index, 8) * 0.08}s` } : undefined}
            >
              <div className="text-4xl mb-3">{ach.unlocked ? ach.icon : '🔒'}</div>
              <h3 className="quest-card-title flex flex-wrap items-center gap-2">
                {getTitle(ach)}
                {isEndgameAchievement(ach.id) && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)]">
                    {t.achievements.endgameBadge}
                  </span>
                )}
              </h3>
              <p className="quest-card-description mb-3">{getDescription(ach)}</p>
              {isNew && <div className="achievement-status achievement-status--new">{t.achievements.unlocked}</div>}
            </div>
          )
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-4 text-center text-sm text-[var(--text-muted)]">
          {hiddenCount === 1
            ? t.achievements.secretRemainingOne
            : t.achievements.secretsRemaining.replace('{n}', String(hiddenCount))}
        </div>
      )}

      {visible.every((a) => a.unlocked) && visible.length > 0 && (
        <div className="mt-8 card-fantasy text-center py-8 glow-gold">
          <p className="text-2xl">🎉 {t.achievements.allUnlocked}</p>
        </div>
      )}
    </div>
  )
}

export default Achievements
