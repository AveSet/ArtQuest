import { useState, useMemo, useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createPortal } from 'react-dom'
import { useSkillStore } from '@/store/useSkillStore'
import { useI18n, getLocalizedTitle, getLocalizedDescription } from '@/i18n'
import { useSearchParams, useNavigate } from 'react-router'
import { CATEGORY_INFO, type QuestCategory } from '@/data/skillTree'
import { NODE_MAX_LEVEL, computePracticeOnlyXp } from '@/utils/progressionBalance'
import { MAX_PRESTIGE } from '@/store/models'
import { NODE_ROWS } from '@/utils/skillUnlocks'
import { playSound, playUiClick } from '@/utils/sound'
import { SkillNodeIcon } from '@/components/SkillNodeIcon'
import type { SkillNode } from '@/store/models'
import { useSkillPracticeStore } from '@/store/useSkillPracticeStore'
import { useVisibleCategories } from '@/utils/useVisibleCategories'
import ReferenceSourceChoices from '@/components/Quest/ReferenceSourceChoices'
import { openReferenceWindow } from '@/utils/openReferenceWindow'
import {
  collapseSessionToOverlay,
  expandSessionToMainWindow,
  isSessionWidgetModeEnabled,
} from '@/utils/sessionOverlayActions'
import { getNodesDueForReview } from '@/utils/skillReview'
import { useActivityStore } from '@/store/useActivityStore'
import { finishSkillPracticeSession } from '@/utils/skillPracticeFinish'
import { cancelSkillPracticeSession } from '@/utils/skillPracticeCancel'
import ConfirmDialog from '@/components/ConfirmDialog'
import { getLocalDateStr } from '@/utils/dailyQuests'
import { getReferenceYoutubeButtonLabels } from '@/utils/referenceYtLabels'

/** Bottom tier of the drawing track (row 0 in layout) — for onboarding demo panel. */
function pickDrawingTutorialNodeId(nodes: SkillNode[]): string | null {
  const drawing = nodes.filter((n) => n.category === 'drawing')
  if (drawing.length === 0) return null
  const fundamentals = drawing.find((n) => n.id === 'drawing_fundamentals')
  if (fundamentals) return fundamentals.id
  const row0 = drawing.filter((n) => (NODE_ROWS[n.id] ?? 0) === 0)
  if (row0.length > 0) return [...row0].sort((a, b) => a.order - b.order)[0]!.id
  return [...drawing].sort((a, b) => a.order - b.order)[0]!.id
}

const BRANCHES = {
  drawing: [
    { id: 'fundamentals', title: { en: 'Fundamentals', ru: 'Основы' }, color: 'var(--color-drawing)' },
    { id: 'perspective', title: { en: 'Perspective', ru: 'Перспектива' }, color: 'var(--color-drawing)' },
    { id: 'rendering', title: { en: 'Rendering', ru: 'Рендеринг' }, color: 'var(--color-drawing)' },
  ],
  anatomy: [
    { id: 'basics', title: { en: 'Basics', ru: 'Основы' }, color: 'var(--color-anatomy)' },
    { id: 'structure', title: { en: 'Structure', ru: 'Структура' }, color: 'var(--color-anatomy)' },
    { id: 'advanced', title: { en: 'Advanced', ru: 'Продвинутый' }, color: 'var(--color-anatomy)' },
  ],
  animation: [
    { id: 'principles', title: { en: 'Principles', ru: 'Принципы' }, color: 'var(--color-animation)' },
    { id: 'cycles', title: { en: 'Cycles', ru: 'Циклы' }, color: 'var(--color-animation)' },
    { id: 'advanced', title: { en: 'Advanced', ru: 'Продвинутый' }, color: 'var(--color-animation)' },
  ],
  effects: [
    { id: 'basics', title: { en: 'Basics', ru: 'Основы' }, color: 'var(--color-effects)' },
    { id: 'combat', title: { en: 'Combat FX', ru: 'Боевые эффекты' }, color: 'var(--color-effects)' },
    { id: 'advanced', title: { en: 'Advanced', ru: 'Продвинутый' }, color: 'var(--color-effects)' },
  ],
  storytelling: [
    { id: 'basics', title: { en: 'Basics', ru: 'Основы' }, color: 'var(--color-storytelling)' },
    { id: 'panels', title: { en: 'Panels', ru: 'Панели' }, color: 'var(--color-storytelling)' },
    { id: 'advanced', title: { en: 'Advanced', ru: 'Продвинутый' }, color: 'var(--color-storytelling)' },
  ],
  character_design: [
    { id: 'fundamentals', title: { en: 'Fundamentals', ru: 'Основы' }, color: 'var(--color-character-design)' },
    { id: 'silhouette', title: { en: 'Silhouette', ru: 'Силуэт' }, color: 'var(--color-character-design)' },
    { id: 'advanced', title: { en: 'Advanced', ru: 'Продвинутый' }, color: 'var(--color-character-design)' },
  ],
  environment: [
    { id: 'fundamentals', title: { en: 'Fundamentals', ru: 'Основы' }, color: 'var(--color-environment)' },
    { id: 'perspective', title: { en: 'Perspective', ru: 'Перспектива' }, color: 'var(--color-environment)' },
    { id: 'lighting', title: { en: 'Lighting', ru: 'Освещение' }, color: 'var(--color-environment)' },
  ],
} as const

const Skills = () => {
  const navigate = useNavigate()
  const skillNodes = useSkillStore(s => s.skillNodes)
  const { t, language } = useI18n()
  const ytLabels = getReferenceYoutubeButtonLabels(language)
  const [searchParams] = useSearchParams()

  const [activeCategory, setActiveCategory] = useState<QuestCategory>('drawing')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showReferenceChoices, setShowReferenceChoices] = useState(false)
  const [pendingRefMode, setPendingRefMode] = useState<'long' | 'short' | 'pinterest' | 'clipTips' | 'sketchfab' | null>(null)
  const [resultXp, setResultXp] = useState(0)
  const { session: practiceSession, startSession: startSkillPracticeSession, setPanelMinimized: setPracticePanelMinimized, panelMinimized: practicePanelMinimized } =
    useSkillPracticeStore(
      useShallow((s) => ({
        session: s.session,
        startSession: s.startSession,
        setPanelMinimized: s.setPanelMinimized,
        panelMinimized: s.panelMinimized,
      })),
    )

  const lang = language
  const visibleCategories = useVisibleCategories()
  const branches = BRANCHES[activeCategory] || []
  const categoryColor = branches[0]?.color ?? 'var(--color-drawing)'

  const categoryNodes = useMemo(() => {
    return [...skillNodes]
      .filter((n) => n.category === activeCategory)
      .sort((a, b) => a.order - b.order)
  }, [activeCategory, skillNodes])

  const selectedNode = selectedNodeId ? categoryNodes.find((n) => n.id === selectedNodeId) : null
  const shouldCountTime = useActivityStore((s) => s.shouldCountTime)
  const activePracticeElapsedSec =
    selectedNode && practiceSession?.nodeId === selectedNode.id
      ? practiceSession.activeElapsedSec
      : 0
  const activePracticeDisplay = `${String(Math.floor(activePracticeElapsedSec / 60)).padStart(2, '0')}:${String(activePracticeElapsedSec % 60).padStart(2, '0')}`
  const isSelectedNodePracticeActive = Boolean(selectedNode && practiceSession?.nodeId === selectedNode.id)

  useEffect(() => {
    if (!visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0] ?? 'drawing')
      setSelectedNodeId(null)
    }
  }, [activeCategory, visibleCategories])

  useEffect(() => {
    if (searchParams.get('onboarding') !== 'skill-detail') return
    setActiveCategory('drawing')
    const id = pickDrawingTutorialNodeId(skillNodes)
    if (id) setSelectedNodeId(id)
  }, [searchParams, skillNodes])

  useEffect(() => {
    if (!practiceSession) return
    const node = skillNodes.find((n) => n.id === practiceSession.nodeId)
    if (!node) return
    setActiveCategory(node.category)
    if (!practicePanelMinimized) {
      setSelectedNodeId(node.id)
    }
  }, [practiceSession, skillNodes, practicePanelMinimized])

  useEffect(() => {
    setShowReferenceChoices(false)
  }, [selectedNodeId])

  const nodesByRow = useMemo(() => {
    const map = new Map<number, typeof categoryNodes>()
    for (const node of categoryNodes) {
      const row = NODE_ROWS[node.id] ?? 0
      const list = map.get(row) ?? []
      list.push(node)
      map.set(row, list)
    }
    return map
  }, [categoryNodes])

  const getNodesByRow = (row: number) => nodesByRow.get(row) ?? []

  const getPrestigeBorder = (prestige: number): string => {
    if (prestige >= 10) return 'prestige-border prestige-border--10'
    if (prestige >= 7) return 'prestige-border prestige-border--7'
    if (prestige >= 5) return 'prestige-border prestige-border--5'
    if (prestige >= 3) return 'prestige-border prestige-border--3'
    if (prestige >= 1) return 'prestige-border prestige-border--1'
    return ''
  }

  const getNodeStatus = (node: (typeof categoryNodes)[0]) => {
    if (!node.isUnlocked) return 'locked'
    if (node.prestige > 0 && node.level === 0 && node.xp === 0) return 'prestiged'
    if (node.level >= NODE_MAX_LEVEL) return 'mastered'
    if (node.level > 0 || node.xp > 0) return 'in-progress'
    return 'available'
  }

  const getNodeStyle = (status: string, isSelected: boolean, prestige: number) => {
    const prestClass = getPrestigeBorder(prestige)
    const classes = ['node-skill']

    if (isSelected) {
      classes.push('node-skill--selected')
      if (prestClass) classes.push(prestClass)
      return classes.join(' ')
    }

    if (prestClass) {
      classes.push(prestClass, 'bg-[var(--bg-secondary)]')
      return classes.join(' ')
    }

    switch (status) {
      case 'locked':
        classes.push('node-skill--locked')
        break
      case 'available':
        classes.push('node-skill--available')
        break
      case 'in-progress':
        classes.push('node-skill--in-progress')
        break
      case 'mastered':
        classes.push('node-skill--mastered')
        break
    }
    return classes.join(' ')
  }

  const statusLabel = (status: string, prestige: number) => {
    if (prestige > 0) return `✨ P${prestige}`
    if (status === 'mastered') return t.skills.mastered
    if (status === 'in-progress') return t.skills.in_progress
    if (status === 'locked') return '🔒'
    return t.skills.available
  }

  const ensurePracticeStarted = useCallback(() => {
    if (!selectedNode?.isUnlocked) return
    if (practiceSession?.nodeId === selectedNode.id) return
    setShowResult(false)
    startSkillPracticeSession(selectedNode.id, selectedNode.category)
    playSound('questStart', selectedNode.category)
  }, [selectedNode, practiceSession?.nodeId, startSkillPracticeSession])

  const startPracticeTimer = useCallback(() => {
    ensurePracticeStarted()
  }, [ensurePracticeStarted])

  const openNodeRefs = useCallback(
    (mode: 'long' | 'short' | 'pinterest' | 'clipTips' | 'sketchfab') => {
      if (!selectedNode) return
      if (practiceSession?.nodeId !== selectedNode.id) {
        setPendingRefMode(mode)
        return
      }
      setShowReferenceChoices(false)
      openReferenceWindow({
        mode,
        nodeId: selectedNode.id,
        category: selectedNode.category,
        tags: selectedNode.tags,
        lang,
      })
    },
    [selectedNode, practiceSession?.nodeId, lang],
  )

  const confirmStartPracticeForRefs = useCallback(() => {
    if (!selectedNode || !pendingRefMode) return
    ensurePracticeStarted()
    setShowReferenceChoices(false)
    openReferenceWindow({
      mode: pendingRefMode,
      nodeId: selectedNode.id,
      category: selectedNode.category,
      tags: selectedNode.tags,
      lang,
    })
    setPendingRefMode(null)
  }, [selectedNode, pendingRefMode, ensurePracticeStarted, lang])

  const openMaterialsLong = useCallback(() => openNodeRefs('long'), [openNodeRefs])
  const openMaterialsShort = useCallback(() => openNodeRefs('short'), [openNodeRefs])
  const openPinterest = useCallback(() => openNodeRefs('pinterest'), [openNodeRefs])
  const openClipTips = useCallback(() => openNodeRefs('clipTips'), [openNodeRefs])
  const openSketchfab = useCallback(() => openNodeRefs('sketchfab'), [openNodeRefs])

  const practiceReadyToFinish = activePracticeElapsedSec >= 60

  const finishPractice = useCallback(() => {
    if (!selectedNode || practiceSession?.nodeId !== selectedNode.id) return
    if (window.electronAPI) expandSessionToMainWindow()
    const result = finishSkillPracticeSession()
    if (!result) return
    setResultXp(result.xp)
    setShowResult(true)
    setTimeout(() => setShowResult(false), 3000)
  }, [selectedNode, practiceSession?.nodeId])

  const cancelPractice = useCallback(() => {
    if (!selectedNode || practiceSession?.nodeId !== selectedNode.id) return
    if (window.electronAPI) expandSessionToMainWindow()
    cancelSkillPracticeSession()
    setShowReferenceChoices(false)
  }, [selectedNode, practiceSession?.nodeId])

  const dismissPanel = useCallback(() => {
    setSelectedNodeId(null)
    setShowReferenceChoices(false)
    if (practiceSession) setPracticePanelMinimized(true)
  }, [practiceSession, setPracticePanelMinimized])

  const hasAnySkillProgress = useMemo(
    () => skillNodes.some((n) => n.level > 0 || n.xp > 0 || n.prestige > 0),
    [skillNodes],
  )

  const nextUnlockNode = useMemo(() => {
    const unlocked = categoryNodes.filter((n) => n.isUnlocked)
    const fresh = unlocked.find((n) => n.level === 0 && n.xp === 0 && n.prestige === 0)
    return fresh ?? unlocked[0] ?? null
  }, [categoryNodes])

  const categoryProgressSummary = useMemo(() => {
    const total = categoryNodes.length
    const unlocked = categoryNodes.filter((n) => n.isUnlocked).length
    const mastered = categoryNodes.filter((n) => n.level >= NODE_MAX_LEVEL).length
    return { total, unlocked, mastered }
  }, [categoryNodes])

  const nextPracticeNodeId = useMemo(() => {
    const today = getLocalDateStr()
    const due = getNodesDueForReview(skillNodes, today).find((n) => n.nodeId.startsWith(activeCategory))
    if (due) return due.nodeId
    return nextUnlockNode?.id ?? null
  }, [skillNodes, activeCategory, nextUnlockNode])

  const quickActionLabel = nextPracticeNodeId
    ? (t.skills.nextPracticeHint ?? 'Recommended practice')
    : (t.skills.start_practice ?? 'Start practice')

  return (
    <div className="min-h-screen" data-onboarding="page-skills">
      <div className="container-fantasy pt-6">
        <div className="rpg-category-tabs flex gap-2 overflow-x-auto pb-4 mb-4 -mx-2 px-2">
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat)
                if (practiceSession?.category !== cat) {
                  setSelectedNodeId(null)
                }
              }}
              className={`${activeCategory === cat ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 px-4 py-2 whitespace-nowrap shrink-0`}
            >
              <span>{CATEGORY_INFO[cat].icon}</span>
              <span>{t.categories[cat]}</span>
            </button>
          ))}
        </div>

        {!hasAnySkillProgress && t.skills.emptyHint ? (
          <div className="mb-4 card-fantasy p-4 text-center" role="status">
            <p className="text-sm text-[var(--text-secondary)]">{t.skills.emptyHint}</p>
            {t.skills.emptyCta ? (
              <button type="button" className="btn-primary text-sm mt-3 px-4 py-2" onClick={() => navigate('/quests')}>
                {t.skills.emptyCta}
              </button>
            ) : null}
          </div>
        ) : null}

        <section className="card-fantasy mb-4 p-4 border border-[var(--border-secondary)]" aria-label="Skill branch summary">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t.skills.nextPracticeHint ?? 'Recommended practice'}
              </p>
              <h2 className="heading-4 text-[var(--text-heading)]">
                {quickActionLabel}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {categoryProgressSummary.unlocked}/{categoryProgressSummary.total} unlocked · {categoryProgressSummary.mastered} mastered
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {nextPracticeNodeId ? (
                <button
                  type="button"
                  className="btn-primary text-sm px-4 py-2"
                  onClick={() => {
                    const target = categoryNodes.find((node) => node.id === nextPracticeNodeId)
                    if (!target) return
                    playUiClick()
                    setSelectedNodeId(target.id)
                    setPracticePanelMinimized(false)
                    setShowResult(false)
                  }}
                >
                  {t.skills.start_practice}
                </button>
              ) : null}
              <button
                type="button"
                className="btn-secondary text-sm px-4 py-2"
                onClick={() => {
                  playUiClick()
                  navigate('/resources?view=learn')
                }}
              >
                {t.quests.needReferences}
              </button>
            </div>
          </div>
        </section>

        <div
          className="skills-tree-canvas flex flex-col-reverse items-center justify-center w-full min-h-[480px] p-6 sm:p-10 rounded-2xl relative overflow-visible border border-[var(--border-secondary)]"
          style={{
            background: `radial-gradient(circle at center, color-mix(in srgb, ${categoryColor} var(--skills-tree-glow, 7%), transparent) 0%, var(--bg-primary) 72%)`,
          }}
        >
          {[0, 1, 2, 3].map((row) => (
            <div key={row}>
              <div className="tree-row flex flex-wrap justify-center gap-4 sm:gap-6 mb-2">
                {getNodesByRow(row).map((node) => {
                  const status = getNodeStatus(node)
                  const isSelected = selectedNodeId === node.id
                  const practiceBlocksSelect =
                    Boolean(practiceSession && practiceSession.nodeId !== node.id)
                  const nodeTitle = getLocalizedTitle(node.title, lang)
                  return (
                    <button
                      key={node.id}
                      type="button"
                      disabled={practiceBlocksSelect}
                      aria-label={`${nodeTitle}, ${statusLabel(status, node.prestige)}`}
                      aria-disabled={practiceBlocksSelect}
                      title={nodeTitle}
                      onClick={() => {
                        if (practiceBlocksSelect) return
                        setSelectedNodeId(node.id)
                        setPracticePanelMinimized(false)
                        setShowResult(false)
                      }}
                      className={`${getNodeStyle(status, isSelected, node.prestige)}${practiceBlocksSelect ? ' opacity-50 cursor-not-allowed' : ''}${!hasAnySkillProgress && nextUnlockNode?.id === node.id ? ' ring-2 ring-[var(--gold-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}`}
                    >
                      <span className="relative inline-flex">
                        <SkillNodeIcon nodeId={node.id} category={node.category} size="tree" />
                        {status !== 'locked' && (
                          <span
                            className={`node-level-badge ${
                              node.prestige > 0
                                ? 'node-level-badge--prestige'
                                : status === 'mastered'
                                  ? 'node-level-badge--mastered'
                                  : 'node-level-badge--default'
                            }`}
                          >
                            {node.prestige > 0 ? `P${node.prestige}` : node.level}
                          </span>
                        )}
                      </span>
                      <span className="node-skill-label" title={nodeTitle}>
                        {nodeTitle}
                      </span>
                      <span className="node-skill-progress" aria-hidden>
                        <span
                          className="node-skill-progress__fill"
                          style={{
                            width: `${Math.min(100, (node.xp / Math.max(1, node.maxXp)) * 100)}%`,
                            backgroundColor: categoryColor,
                          }}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
              {row < 3 && (
                <div
                  className="connection-line w-1 h-8 mx-auto rounded-full mb-2"
                  style={{
                    background: `linear-gradient(to top, color-mix(in srgb, ${categoryColor} 45%, var(--border-secondary)), var(--border-secondary))`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

      </div>

      {selectedNode &&
        createPortal(
          <>
            <button
              type="button"
              className="skill-detail-backdrop fixed inset-0 bg-black/60 z-[140] cursor-default"
              aria-label={t.common.close}
              onClick={dismissPanel}
            />
            <div
              className="skill-detail-panel card-fantasy fixed left-1/2 top-1/2 w-[min(100vw-2rem,32rem)] max-h-[min(88vh,760px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5 border border-[var(--border-primary)] shadow-2xl"
              data-onboarding="skills-node-panel"
              style={{ zIndex: 'var(--z-overlay-drawer)', borderColor: categoryColor }}
            >
            <div className="flex justify-between items-start mb-3 gap-2">
              <h3 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                {getLocalizedTitle(selectedNode.title, lang)}
              </h3>
              <button
                type="button"
                onClick={dismissPanel}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] shrink-0"
                aria-label={t.common.close}
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center rpg-skill-icon-slot"
                style={{ boxShadow: `0 0 0 1px color-mix(in srgb, ${categoryColor} 27%, transparent)` }}
              >
                <SkillNodeIcon nodeId={selectedNode.id} category={selectedNode.category} size="panel" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">{t.skills.level}</div>
                <div className="text-lg font-bold text-[var(--text-heading)]">
                  {selectedNode.level}/{NODE_MAX_LEVEL}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] mt-1 inline-block ${
                      selectedNode.prestige > 0
                        ? 'chip-prestige'
                        : getNodeStatus(selectedNode) === 'mastered'
                          ? 'chip-success'
                          : getNodeStatus(selectedNode) === 'in-progress'
                            ? 'chip-info'
                            : 'bg-[var(--accent-muted)] text-[var(--accent-hover)]'
                    }`}
                  >
                    {statusLabel(getNodeStatus(selectedNode), selectedNode.prestige)}
                  </span>
                  {selectedNode.prestige > 0 && (
                    <span className="text-[10px] text-status-prestige font-bold">P{selectedNode.prestige}/{MAX_PRESTIGE}</span>
                  )}
                </div>
              </div>
            </div>

            {nextPracticeNodeId === selectedNode.id && (
              <p className="text-xs text-[var(--accent-hover)] mb-2 font-medium" role="status">
                {t.skills.nextPracticeHint ??
                  (lang === 'ru'
                    ? 'Рекомендуемая тренировка для этой ветки сейчас.'
                    : 'Recommended practice for this branch right now.')}
              </p>
            )}
            <p className="text-fantasy text-sm mb-2">{getLocalizedDescription(selectedNode.description, lang)}</p>

            <div className="mb-1">
              <div className="h-2 bg-[var(--bg-deep)] rounded-full overflow-hidden border border-[var(--border-secondary)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (selectedNode.xp / Math.max(1, selectedNode.maxXp)) * 100)}%`,
                    backgroundColor: categoryColor,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-3">
              <span>
                {selectedNode.xp} / {selectedNode.maxXp} XP
              </span>
            </div>

            <div className="flex gap-1 flex-wrap mb-3">
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/80 p-3 mb-3">
              <div className="text-xs font-semibold text-[var(--text-heading)] mb-1">
                {t.skills.start_practice}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mb-3">{t.skills.practiceHint}</p>
              {selectedNode.level >= NODE_MAX_LEVEL && selectedNode.prestige < MAX_PRESTIGE && (
                <p className="text-[11px] text-status-prestige mb-2">
                  {t.skills.nodeMasteredHint}
                </p>
              )}
              {selectedNode.prestige >= MAX_PRESTIGE && (
                <p className="text-[11px] text-status-prestige mb-2">
                  {t.skills.maxPrestigeReached}
                </p>
              )}

              {!selectedNode.isUnlocked ? (
                (() => {
                  const nodeRow = NODE_ROWS[selectedNode.id] ?? 0
                  const needLevel = nodeRow <= 1 ? 1 : nodeRow === 2 ? 5 : 10
                  return (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[var(--text-muted)]">{t.skills.requires}</div>
                      {selectedNode.prerequisites.map(prereqId => {
                        const prereq = skillNodes.find(n => n.id === prereqId)
                        if (!prereq) return null
                        const met = prereq.level >= needLevel
                        return (
                          <div
                            key={prereqId}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs ${met ? 'prereq-met' : 'prereq-unmet'}`}
                          >
                            <SkillNodeIcon nodeId={prereq.id} category={prereq.category} size="inline" />
                            <span className="flex-1 truncate">{getLocalizedTitle(prereq.title, lang)}</span>
                            <span className="font-mono shrink-0">{prereq.level}/{needLevel}</span>
                            <span>{met ? '✅' : '❌'}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              ) : (
                <>
                  {showResult ? (
                    <div className="text-center py-4">
                      <div className="text-lg font-bold text-status-success mb-1">{t.skills.practiceComplete}</div>
                      <div className="text-sm text-[var(--text-secondary)]">+{resultXp} XP</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-mono text-center text-[var(--accent-hover)] mb-2">
                        {activePracticeDisplay}
                      </div>
                      {!showReferenceChoices ? (
                        <button
                          type="button"
                          onClick={() => setShowReferenceChoices(true)}
                          className="btn-secondary w-full py-2 text-sm mb-2"
                        >
                          🖼 {t.quests.needReferences}
                        </button>
                      ) : (
                        <div className="mb-2">
                          <ReferenceSourceChoices
                            youtubeLongLabel={ytLabels.long}
                            youtubeShortLabel={ytLabels.short}
                            pinterestLabel={t.quests.referencePinterest ?? 'Pinterest'}
                            clipTipsLabel={t.quests.referenceClipTips ?? 'CSP Tips'}
                            sketchfabLabel={t.quests.referenceSketchfab ?? 'Sketchfab'}
                            onYoutubeLong={openMaterialsLong}
                            onYoutubeShort={openMaterialsShort}
                            onPinterest={openPinterest}
                            onClipTips={openClipTips}
                            onSketchfab={openSketchfab}
                          />
                        </div>
                      )}
                      {isSelectedNodePracticeActive && !shouldCountTime ? (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-2">
                          {t.skills.practiceArtAppPausedHint}
                        </p>
                      ) : null}
                      <div className="flex flex-col gap-2">
                        {!isSelectedNodePracticeActive ? (
                          <button type="button" onClick={startPracticeTimer} className="btn-primary w-full py-2 text-sm">
                            ▶ {t.skills.start_practice}
                          </button>
                        ) : (
                          <>
                          {window.electronAPI && isSessionWidgetModeEnabled() ? (
                            <button
                              type="button"
                              onClick={() => void collapseSessionToOverlay()}
                              className="btn-secondary w-full py-2 text-sm"
                            >
                              {t.skills.collapseToWidget}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={practiceReadyToFinish ? finishPractice : cancelPractice}
                            className={`w-full py-2 text-sm ${
                              practiceReadyToFinish ? 'btn-primary' : 'btn-secondary'
                            }`}
                          >
                            {practiceReadyToFinish ? t.skills.endPractice : t.skills.cancelPractice}
                            {practiceReadyToFinish ? (
                              <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                +{computePracticeOnlyXp(activePracticeElapsedSec / 60)} XP
                              </span>
                            ) : null}
                          </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            </div>
          </>,
          document.body,
        )}
      <ConfirmDialog
        open={pendingRefMode != null}
        title={t.skills.practiceConfirmTitle ?? ''}
        message={t.skills.practiceConfirmMessage ?? ''}
        confirmLabel={t.skills.start_practice}
        cancelLabel={t.common.cancel}
        onConfirm={confirmStartPracticeForRefs}
        onCancel={() => setPendingRefMode(null)}
      />
    </div>
  )
}

export default Skills