import { useMemo, useId } from 'react'
import { useSkillStore } from '@/store/useSkillStore'
import { useI18n, getCategoryLabel } from '@/i18n'
import { ALL_CATEGORIES } from '@/data/skillTree'
import { computeCategoryMastery } from '@/utils/categoryMastery'
import { skillCategoryColor } from '@/utils/skillCategoryColors'

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 78

function polarPoint(angleRad: number, r: number): [number, number] {
  return [
    CENTER + r * Math.sin(angleRad),
    CENTER - r * Math.cos(angleRad),
  ]
}

export default function SkillRadarChart() {
  const { t, language } = useI18n()
  const skillNodes = useSkillStore((s) => s.skillNodes)
  const titleId = useId()

  const points = useMemo(() => computeCategoryMastery(skillNodes), [skillNodes])
  const hasData = points.some((p) => p.percent > 0)
  const n = ALL_CATEGORIES.length

  const angles = useMemo(
    () => ALL_CATEGORIES.map((_, i) => (i / n) * Math.PI * 2),
    [n],
  )

  const wedges = useMemo(() => {
    return points.map((p, i) => {
      const angle = angles[i]!
      const nextAngle = angles[(i + 1) % n]!
      const r = (p.percent / 100) * RADIUS
      const [x1, y1] = polarPoint(angle, r)
      const [x2, y2] = polarPoint(nextAngle, (points[(i + 1) % n]!.percent / 100) * RADIUS)
      const [ox1, oy1] = polarPoint(angle, RADIUS)
      const [ox2, oy2] = polarPoint(nextAngle, RADIUS)
      const largeArc = nextAngle - angle > Math.PI ? 1 : 0
      const d =
        r <= 0
          ? ''
          : `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
      const outline = `M ${CENTER} ${CENTER} L ${ox1} ${oy1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${ox2} ${oy2} Z`
      return { category: p.category, d, outline, x: x1, y: y1, color: skillCategoryColor(p.category) }
    })
  }, [points, angles, n])

  const gridLevels = [0.25, 0.5, 0.75, 1]

  if (!hasData) return null

  return (
    <section className="card-fantasy p-6" aria-labelledby={titleId}>
      <h2 id={titleId} className="heading-2 mb-4">
        {t.stats.skillRadar}
      </h2>
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="skill-radar-chart w-full max-w-[240px] shrink-0"
          role="img"
          aria-label={t.stats.skillRadar}
        >
          {gridLevels.map((level) => {
            const ring = angles
              .map((a) => {
                const [x, y] = polarPoint(a, RADIUS * level)
                return `${x},${y}`
              })
              .join(' ')
            return (
              <polygon
                key={level}
                points={ring}
                fill="none"
                stroke="var(--border-secondary)"
                strokeWidth={1}
                opacity={0.6}
              />
            )
          })}
          {angles.map((a, i) => {
            const [x, y] = polarPoint(a, RADIUS)
            return (
              <line
                key={ALL_CATEGORIES[i]}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="var(--border-secondary)"
                strokeWidth={1}
                opacity={0.5}
              />
            )
          })}
          {wedges.map((w) =>
            w.d ? (
              <path key={w.category} d={w.d} fill={w.color} fillOpacity={0.35} stroke={w.color} strokeWidth={1.5} />
            ) : null,
          )}
          {wedges.map((w) => (
            <circle key={`${w.category}-dot`} cx={w.x} cy={w.y} r={3.5} fill={w.color} />
          ))}
        </svg>
        <ul className="flex-1 space-y-2 text-xs w-full">
          {points.map((p) => (
            <li key={p.category} className="flex justify-between gap-2 text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: skillCategoryColor(p.category) }}
                  aria-hidden
                />
                {getCategoryLabel(p.category, language)}
              </span>
              <span className="tabular-nums font-medium text-[var(--text-heading)]">
                {p.percent}%
                <span className="text-[var(--text-muted)] font-normal ml-1">
                  ({t.stats.skillRadarLevel.replace('{level}', String(p.displayLevel))})
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
