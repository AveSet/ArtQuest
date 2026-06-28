import { memo, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useI18n } from '@/i18n'
import { playUiClick } from '@/utils/sound'
import { useThemeStore } from '@/store/useThemeStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotkey } from '@/hooks/useHotkey'
import { RPG_NAV_ICONS } from '@/components/rpg/RpgIcons'
import artquestIcon from '@/assets/artquest-icon.png'
import QuestSessionWidget from '@/components/QuestSessionWidget'
import SkillPracticeWidget from '@/components/SkillPracticeWidget'
import { useSkillStore } from '@/store/useSkillStore'

const Navbar = memo(function Navbar({ hidden = false }: { hidden?: boolean }) {
  const location = useLocation()
  const { t } = useI18n()
  const theme = useThemeStore((s) => s.theme)
  const unseenAchievements = useSkillStore(
    (s) => s.achievements.filter((a) => a.unlocked && !a.seenAt).length,
  )
  const isRpg = theme === 'rpg'


  const links = [
    { path: '/', label: t.nav.home },
    { path: '/quests', label: t.nav.quests },
    { path: '/skills', label: t.nav.skills },
    { path: '/gallery', label: t.nav.gallery },
    { path: '/resources', label: t.nav.resources },
    { path: '/progress', label: t.nav.progress },
    { path: '/settings', label: t.nav.settings },
  ]

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null)

  const mobileTabs = [
    { path: '/', label: t.nav.home },
    { path: '/quests', label: t.nav.quests },
    { path: '/skills', label: t.nav.skills },
    { path: '/gallery', label: t.nav.gallery },
    { path: '/settings', label: t.nav.settings },
  ]

  const mobileMoreLinks = [
    { path: '/resources', label: t.nav.resources },
    { path: '/progress', label: t.nav.progress },
  ]

  useEffect(() => {
    setMobileMoreOpen(false)
  }, [location.pathname])

  useFocusTrap(mobileMoreOpen, mobileMoreMenuRef)
  useHotkey('Escape', () => setMobileMoreOpen(false), { enabled: mobileMoreOpen })

  if (hidden) return null

  return (
    <>
    <nav className="nav-fantasy" role="navigation" aria-label={t.a11y.mainNavigation} data-onboarding="main-nav">
      <div className="nav-fantasy-inner">
        <Link to="/" className="nav-brand" aria-label={t.a11y.appHome}>
          <img src={artquestIcon} alt="" className="nav-brand-icon" aria-hidden="true" />
          Art<span>Quest</span>
        </Link>
        <div className="nav-trailing">
          <div className="nav-session-widgets">
            <QuestSessionWidget />
            <SkillPracticeWidget />
          </div>
          <div className="nav-links">
          {links.map((link, index) => {
            const isActive =
              location.pathname === link.path ||
              (link.path === '/progress' && location.pathname.startsWith('/progress')) ||
              (link.path !== '/' && link.path !== '/progress' && location.pathname.startsWith(link.path + '/'))

            return (
              <div key={link.path} className="nav-link-group">
                {index > 0 && (
                  <span className="nav-ornament" aria-hidden="true">
                    ·
                  </span>
                )}
                <Link
                  to={link.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => playUiClick()}
                >
                  {isRpg && RPG_NAV_ICONS[link.path] && (() => {
                    const NavIcon = RPG_NAV_ICONS[link.path]!
                    return <NavIcon className="nav-rpg-icon" />
                  })()}
                  {link.label}
                  {link.path === '/progress' && unseenAchievements > 0 ? (
                    <span className="ml-1.5 inline-flex min-w-[1.25rem] h-5 px-1 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold leading-none">
                      {unseenAchievements > 9 ? '9+' : unseenAchievements}
                    </span>
                  ) : null}
                </Link>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </nav>
    <nav className="nav-bottom-tabs sm:hidden" aria-label={t.nav.primaryNav ?? t.nav.home ?? 'Main navigation'}>
      {mobileTabs.map((link) => {
        const isActive =
          location.pathname === link.path ||
          (link.path !== '/' && location.pathname.startsWith(link.path))
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-bottom-tab ${isActive ? 'nav-bottom-tab--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              setMobileMoreOpen(false)
              playUiClick()
            }}
          >
            {link.label}
          </Link>
        )
      })}
      <button
        type="button"
        id="nav-mobile-more-trigger"
        className={`nav-bottom-tab nav-bottom-tab--more ${mobileMoreOpen || mobileMoreLinks.some((l) => location.pathname.startsWith(l.path)) ? 'nav-bottom-tab--active' : ''}`}
        aria-expanded={mobileMoreOpen}
        aria-controls="nav-mobile-more-menu"
        aria-haspopup="true"
        aria-label={t.nav.more ?? 'More'}
        onClick={() => {
          setMobileMoreOpen((v) => !v)
          playUiClick()
        }}
      >
        <span className="relative inline-flex items-center">
          {t.nav.more ?? '···'}
          {unseenAchievements > 0 ? (
            <span className="absolute -top-1 -right-2 inline-flex min-w-[1rem] h-4 px-0.5 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[9px] font-bold leading-none">
              {unseenAchievements > 9 ? '9+' : unseenAchievements}
            </span>
          ) : null}
        </span>
      </button>
      {mobileMoreOpen ? (
        <>
          <button
            type="button"
            className="nav-bottom-backdrop sm:hidden"
            aria-label={t.common.close ?? 'Close'}
            onClick={() => setMobileMoreOpen(false)}
          />
          <div
            ref={mobileMoreMenuRef}
            id="nav-mobile-more-menu"
            role="menu"
            aria-labelledby="nav-mobile-more-trigger"
            className="nav-bottom-more fixed bottom-14 left-0 right-0 flex justify-center gap-4 py-2 px-4 bg-[var(--bg-primary)] border-t border-[var(--border-secondary)] shadow-lg sm:hidden"
            style={{ zIndex: 'calc(var(--z-nav) + 10)' }}
          >
            {mobileMoreLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path === '/progress' && location.pathname.startsWith('/progress'))
              return (
              <Link
                key={link.path}
                to={link.path}
                role="menuitem"
                className={`nav-bottom-tab ${isActive ? 'nav-bottom-tab--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setMobileMoreOpen(false)
                  playUiClick()
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {link.label}
                  {link.path === '/progress' && unseenAchievements > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] h-5 px-1 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold leading-none">
                      {unseenAchievements > 9 ? '9+' : unseenAchievements}
                    </span>
                  ) : null}
                </span>
              </Link>
              )
            })}
          </div>
        </>
      ) : null}
    </nav>
    </>
  )
})

export default Navbar
