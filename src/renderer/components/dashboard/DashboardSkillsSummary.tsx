import { useMemo, useState, type ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { useSkillStore, getDefaultSkills } from '@/store/useSkillStore'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import type { Skill } from '@/store/models'

type Props = {
  /** Full skill bars renderer (legacy track XP). */
  renderSkillBar: (skill: Skill) => ReactNode
}

export default function DashboardSkillsSummary({ renderSkillBar }: Props) {
  const { t } = useI18n()
  const legacySkills = useSkillStore((s) => s.legacySkills)
  const visibleCategories = useVisibleCategories()
  const [expanded, setExpanded] = useState(true)

  const skills = useMemo(
    () => (legacySkills.length > 0 ? legacySkills : getDefaultSkills()),
    [legacySkills],
  )

  const visibleSkills = useMemo(
    () => skills.filter((s) => visibleCategories.includes(s.category)),
    [skills, visibleCategories],
  )

  if (!expanded) {
    return (
      <div className="dashboard-skills-summary" data-onboarding="dashboard-skills">
        <button
          type="button"
          className="text-xs text-[var(--accent)] hover:underline"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          {t.dashboard.showAll ?? 'Show all'}
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-skills-summary" data-onboarding="dashboard-skills">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="meta-fantasy mb-0">{t.skills.title.toUpperCase()}</h3>
        <button
          type="button"
          className="text-xs text-[var(--accent)] hover:underline"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          {t.dashboard.showLess ?? 'Show less'}
        </button>
      </div>
      <div className="space-y-3">
        {visibleSkills.map((skill) => (
          <div key={skill.category}>{renderSkillBar(skill)}</div>
        ))}
      </div>
    </div>
  )
}
