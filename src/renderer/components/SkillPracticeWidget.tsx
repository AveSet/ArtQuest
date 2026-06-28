import { memo } from 'react'
import { Link, useLocation } from 'react-router'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useSkillStore } from '@/store/useSkillStore'
import { useI18n, getLocalizedTitle } from '@/i18n'

function formatPracticeElapsed(activeElapsedSec: number): string {
  const sec = Math.max(0, Math.floor(activeElapsedSec))
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

const SkillPracticeWidget = memo(function SkillPracticeWidget() {
  const location = useLocation()
  const session = useSkillPracticeStore((s) => s.session)
  const panelMinimized = useSkillPracticeStore((s) => s.panelMinimized)
  const setPanelMinimized = useSkillPracticeStore((s) => s.setPanelMinimized)
  const skillNodes = useSkillStore((s) => s.skillNodes)
  const { t, language } = useI18n()

  if (!session) return null
  if (location.pathname === '/skills' && !panelMinimized) return null

  const node = skillNodes.find((n) => n.id === session.nodeId)
  if (!node) return null

  const lang = language
  const title = getLocalizedTitle(node.title, lang)
  const elapsed = formatPracticeElapsed(session.activeElapsedSec)

  return (
    <div className="quest-session-widget quest-session-widget--skill">
      <Link
        to="/skills"
        onClick={() => setPanelMinimized(false)}
        className="quest-session-widget__link"
        title={title}
        aria-label={`${t.skills.activePractice ?? t.skills.start_practice}: ${title}`}
      >
        <span className="quest-session-widget__label">{t.skills.activePractice ?? t.skills.start_practice}</span>
        <span className="quest-session-widget__time font-mono text-sm">{elapsed}</span>
      </Link>
    </div>
  )
})

export default SkillPracticeWidget
