import { NavLink, Outlet, Navigate, useLocation } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '@/i18n'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'

const ProgressLayout = () => {
  const { t } = useI18n()
  const location = useLocation()
  const reduceMotion = useUIStore((s) => s.settings.reduceMotion)
  const unseenAchievements = useSkillStore(
    useShallow((s) => s.achievements.filter((a) => a.unlocked && !a.seenAt).length),
  )

  const tabs = [
    { path: '/progress/stats', label: t.nav.statistics, panelId: 'progress-panel-stats' },
    { path: '/progress/goals', label: t.progress.goals, panelId: 'progress-panel-goals' },
    { path: '/progress/achievements', label: t.nav.achievements, panelId: 'progress-panel-achievements' },
  ]

  if (location.pathname === '/progress') {
    return <Navigate to="/progress/stats" replace />
  }

  const activeTab = tabs.find((tab) => location.pathname.startsWith(tab.path)) ?? tabs[0]
  const panelMotionClass = reduceMotion ? 'motion-page-instant' : 'motion-tab-panel-enter'

  return (
    <div className="container-fantasy pt-6 motion-page-enter">
      <div className="card-fantasy border border-[var(--border-primary)] p-4 sm:p-5 mb-6">
        <h1 className="heading-1 mb-4">{t.progress.title}</h1>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.progress.title}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              role="tab"
              id={`tab-${tab.panelId}`}
              aria-selected={activeTab.path === tab.path}
              aria-controls={tab.panelId}
              className={({ isActive }) =>
                `progress-tab ${isActive ? 'progress-tab--active btn-primary' : 'btn-secondary'} px-4 py-2 text-sm`
              }
            >
              {tab.label}
              {tab.path === '/progress/achievements' && unseenAchievements > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] h-5 px-1 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold leading-none">
                  {unseenAchievements > 9 ? '9+' : unseenAchievements}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>
      </div>
      <div
        key={location.pathname}
        id={activeTab.panelId}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.panelId}`}
        className={panelMotionClass}
      >
        <Outlet />
      </div>
    </div>
  )
}

export default ProgressLayout
