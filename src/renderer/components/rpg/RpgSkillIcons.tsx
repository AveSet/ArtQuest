import type { ReactNode, SVGProps } from 'react'
import type { QuestCategory } from '@/data/skillTree'
import { CATEGORY_INFO } from '@/data/skillTree'
import {
  CATEGORY_FALLBACK_ICON,
  NODE_SKILL_ICON_KEYS,
  type SkillIconKey,
} from './skillNodeIconKeys'

type IconProps = SVGProps<SVGSVGElement>

function SkillIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

const ICONS: Record<SkillIconKey, ReactNode> = {
  brush: (
    <>
      <path d="M5 19c2-4 6-8 11-9 2 1 3 4 3 7 0 2-1 3-3 3" />
      <path d="M14 6l4 4" />
    </>
  ),
  grid: (
    <>
      <path d="M4 8h16M4 16h16M8 4v16M16 4v16" />
      <path d="M6 12h12" strokeWidth={1} />
    </>
  ),
  cube: (
    <>
      <path d="M12 4l7 4v8l-7 4-7-4V8l7-4z" />
      <path d="M12 4v8M5 8l7 4 7-4" />
    </>
  ),
  frame: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="1" />
      <path d="M5 9h14M9 5v14" strokeWidth={1} />
    </>
  ),
  pencil: (
    <>
      <path d="M5 19l9-9 4 4-9 9H5v-5z" />
      <path d="M15 7l3 3" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 10-12h-7l0-8z" />,
  wave: <path d="M4 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
  contrast: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16" fill="currentColor" fillOpacity={0.35} stroke="none" />
    </>
  ),
  laurel: (
    <>
      <path d="M8 4c-2 3-2 6 0 9M16 4c2 3 2 6 0 9" />
      <path d="M10 20h4" />
    </>
  ),
  tablet: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 18h6" strokeWidth={1.2} />
    </>
  ),
  palette: (
    <>
      <path d="M12 3c-4 0-7 2.5-7 6 0 3 2.5 4 5 4 1 0 2-1 2-2h1c1 0 2-1 2-2 0-3-2-5-5-6z" />
      <circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  gesture: <path d="M8 20V8l3 3 2-6 3 8 4-2" />,
  nib: (
    <>
      <path d="M6 20l8-14 4 4-8 14H6z" />
      <path d="M14 6l4 4" />
    </>
  ),
  blueprint: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M8 8h8M8 12h5M8 16h8" strokeWidth={1} />
    </>
  ),
  layers: (
    <>
      <path d="M12 4 4 8l8 4 8-4-8-4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </>
  ),
  weave: (
    <>
      <path d="M4 4h16v16H4z" strokeWidth={1} />
      <path d="M4 8h16M4 12h16M4 16h16M8 4v16M16 4v16" strokeWidth={0.9} />
    </>
  ),
  speed: (
    <>
      <path d="M4 14h6l-2 6 10-14h-6l2-6z" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h10a3 3 0 0 1 0 6H6a3 3 0 0 0 0 6h10" />
      <path d="M6 7v10" />
    </>
  ),
  bone: (
    <>
      <path d="M8 8a3 3 0 1 0 0-4 3 3 0 0 0 0 4zM16 16a3 3 0 1 0 0-4 3 3 0 0 0 0 4z" />
      <path d="M10 6l4 4M10 18l4-4" />
    </>
  ),
  skull: (
    <>
      <circle cx="12" cy="10" r="6" />
      <path d="M9 9h.01M15 9h.01M10 14h4" />
      <path d="M8 18h8" />
    </>
  ),
  muscle: (
    <>
      <path d="M6 14c0-4 3-8 6-8s6 4 6 8" />
      <path d="M8 14h8" />
      <path d="M10 10c1 2 3 2 4 0" />
    </>
  ),
  ruler: (
    <>
      <path d="M5 17 17 5" />
      <path d="M8 14l1-1M11 11l1-1M14 8l1-1" strokeWidth={1} />
    </>
  ),
  figure: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M12 9v5M9 20l3-6 3 6" />
      <path d="M9 12h6" />
    </>
  ),
  hand: (
    <>
      <path d="M8 10V6a1 1 0 0 1 2 0v4M11 6v8a1 1 0 0 0 2 0V8a1 1 0 0 1 2 0v6a4 4 0 0 1-8 0v-4z" />
    </>
  ),
  foot: <path d="M6 14c0-3 2-6 6-6s6 3 6 6-2 4-6 4-6-1-6-4z" />,
  head: (
    <>
      <circle cx="12" cy="10" r="5" />
      <path d="M8 18c1-2 6-2 8 0" />
    </>
  ),
  lens: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </>
  ),
  motion: <path d="M5 16l4-8 3 4 3-6 4 10" />,
  foreshort: (
    <>
      <path d="M6 18 12 6l6 12" />
      <path d="M8 14h8" strokeWidth={1} />
    </>
  ),
  face: (
    <>
      <ellipse cx="12" cy="11" rx="6" ry="7" />
      <path d="M9 10h.01M15 10h.01M9 14c1 1 4 1 6 0" />
    </>
  ),
  eye: (
    <>
      <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </>
  ),
  hair: <path d="M8 10c0-4 4-6 8-4 2 4 0 8-2 8 4-2 2-8 2-12 0" />,
  robe: (
    <>
      <path d="M8 6h8l2 4v10H6V10l2-4z" />
      <path d="M10 6V4h4v2" />
    </>
  ),
  shirt: (
    <>
      <path d="M9 6l3-2 3 2v2H9V6z" />
      <path d="M7 8h10v12H7z" />
    </>
  ),
  clapper: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M8 4v4M12 4v4M16 4v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  spacing: (
    <>
      <path d="M5 12h3M11 12h3M17 12h3" />
      <path d="M8 8v8M14 6v12" strokeWidth={1} />
    </>
  ),
  arc: <path d="M6 16c4-8 8-8 12 0" />,
  walk: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M9 20l3-7 3 7M8 12h8" />
    </>
  ),
  run: (
    <>
      <circle cx="14" cy="6" r="2" />
      <path d="M14 8l-4 10M10 12l6 2M8 18h6" />
    </>
  ),
  idle: (
    <>
      <circle cx="12" cy="6" r="2" />
      <path d="M12 8v5M9 20l3-5 3 5" />
    </>
  ),
  blend: (
    <>
      <path d="M8 8h8v8H8z" />
      <path d="M12 4v16M4 12h16" strokeWidth={1} />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 13c1 2 6 2 8 0" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  ),
  drama: (
    <>
      <path d="M8 6h8v6c0 3-2 5-4 5s-4-2-4-5V6z" />
      <path d="M10 18h4" />
    </>
  ),
  squash: (
    <>
      <ellipse cx="12" cy="14" rx="6" ry="3" />
      <ellipse cx="12" cy="8" rx="4" ry="6" />
    </>
  ),
  anticipate: <path d="M6 12h12M12 6v12M8 8l8 8M16 8 8 16" strokeWidth={1.2} />,
  puppet: (
    <>
      <path d="M12 4v3M8 9h8M10 9v8M14 9v8" />
      <path d="M8 17h8" />
    </>
  ),
  follow: <path d="M5 12h14M14 8l5 4-5 4" />,
  solid: <path d="M12 4l7 4v8l-7 4-7-4V8l7-4z" fill="currentColor" fillOpacity={0.15} />,
  stage: (
    <>
      <path d="M4 18h16" />
      <path d="M6 18V8l6-4 6 4v10" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" />
    </>
  ),
  particles: (
    <>
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="6" r="1" fill="currentColor" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
      <circle cx="6" cy="15" r="1" fill="currentColor" />
    </>
  ),
  energy: <path d="M13 3 5 13h6l-1 8 9-11h-6l0-7z" />,
  rain: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0" />
      <path d="M8 14l-1 3M12 13l-1 4M16 14l-1 3" />
    </>
  ),
  impact: (
    <>
      <path d="M12 3l2 5h5l-4 3 2 5-5-3-5 3 2-4-5h5l2-5z" />
    </>
  ),
  orb: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity={0.35} />
    </>
  ),
  flame: <path d="M12 3c-2 4-4 5-4 8a4 4 0 0 0 8 0c0-3-2-4-4-8z" fill="currentColor" fillOpacity={0.2} />,
  star: <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />,
  smoke: (
    <>
      <path d="M8 16c0-3 2-5 4-5s4 2 4 5" />
      <path d="M12 10c0-2 1-3 2-3s2 1 2 3" />
    </>
  ),
  water: <path d="M12 3c-3 5-6 7-6 10a6 6 0 0 0 12 0c0-3-3-5-6-10z" />,
  lens_fx: (
    <>
      <circle cx="10" cy="10" r="5" />
      <path d="M14 14l6 6" />
      <path d="M8 8l4 4" strokeWidth={1} />
    </>
  ),
  book: (
    <>
      <path d="M6 4h9a3 3 0 0 1 3 3v13H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
      <path d="M6 7h12" />
    </>
  ),
  scene: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 10h16" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V9M10 19V5M15 19v-6M20 19V11" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />,
  panels: (
    <>
      <rect x="4" y="5" width="6" height="8" />
      <rect x="14" y="5" width="6" height="14" />
      <rect x="4" y="15" width="6" height="4" />
    </>
  ),
  books: (
    <>
      <path d="M5 6h6v14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M13 4h6v16h-6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </>
  ),
  arc_story: <path d="M6 16c3-6 9-6 12 0M8 12h8" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c3 2 3 12 0 16M12 4c-3 2-3 12 0 16" />
    </>
  ),
  magnifier: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </>
  ),
  camera: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <circle cx="12" cy="13" r="3" />
      <path d="M9 7V5h6v2" />
    </>
  ),
  storyboard: (
    <>
      <rect x="3" y="5" width="7" height="6" />
      <rect x="14" y="5" width="7" height="6" />
      <rect x="3" y="14" width="18" height="6" />
    </>
  ),
  filmstrip: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 9h16M4 15h16M8 5v14M16 5v14" strokeWidth={1} />
    </>
  ),
  chain: (
    <>
      <path d="M9 9a3 3 0 1 0 0-4 3 3 0 0 0 0 4zM15 15a3 3 0 1 0 0-4 3 3 0 0 0 0 4z" />
      <path d="M11 7l2 2M11 17l2-2" />
    </>
  ),
  mask: (
    <>
      <path d="M6 10c0-3 3-5 6-5s6 2 6 5c0 4-2 7-6 7s-6-3-6-7z" />
      <path d="M9 10h.01M15 10h.01" />
    </>
  ),
  silhouette: <rect x="7" y="5" width="10" height="14" rx="2" fill="currentColor" fillOpacity={0.25} />,
  triangle: <path d="M12 5l7 14H5L12 5z" />,
  thought: (
    <>
      <path d="M10 10a4 4 0 1 0 0-6 4 4 0 0 0 0 6z" />
      <path d="M8 14c-2 1-3 3-3 5h10c0-2-1-4-3-5" />
    </>
  ),
  crowd: (
    <>
      <circle cx="8" cy="9" r="2" />
      <circle cx="16" cy="9" r="2" />
      <path d="M5 18c0-2 2-3 3-3s3 1 3 3M14 18c0-2 2-3 3-3s3 1 3 3" />
    </>
  ),
  costume: (
    <>
      <path d="M9 6l3-2 3 2" />
      <path d="M7 8h10l-1 12H8L7 8z" />
    </>
  ),
  turn: (
    <>
      <path d="M12 4v4M12 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M16 8l2-2M8 16l-2 2" strokeWidth={1} />
    </>
  ),
  sheet: (
    <>
      <path d="M7 4h7l4 4v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M14 4v4h4" />
    </>
  ),
  dragon: (
    <>
      <path d="M6 14c0-4 3-7 6-7 4 0 6 3 7 6 7" />
      <path d="M16 10l4-2-1 4" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.5 1.5M16.5 16.5 18 18M6 18l1.5-1.5M16.5 7.5 18 6" />
    </>
  ),
  landscape: (
    <>
      <path d="M4 18h16" />
      <path d="M6 18 12 8l6 10" />
      <circle cx="17" cy="7" r="2" />
    </>
  ),
  mountain: (
    <>
      <path d="M4 18h16" />
      <path d="M4 18 12 6l4 6 3-4 5 10" />
    </>
  ),
  temple: (
    <>
      <path d="M6 18h12" />
      <path d="M8 18V10l4-4 4 4v8" />
      <path d="M6 10h12" />
    </>
  ),
  tree: (
    <>
      <path d="M12 5c-3 0-5 3-5 5s2 4 5 4 5-1 5-4-2-5-5-5z" />
      <path d="M12 14v5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M7 11v8h10v-8" />
    </>
  ),
  props: (
    <>
      <rect x="6" y="10" width="5" height="8" />
      <path d="M14 8l4 10H12l2-10z" />
    </>
  ),
  lamp: (
    <>
      <path d="M9 18h6" />
      <path d="M12 4v8" />
      <path d="M8 12h8a4 4 0 0 1-8 0z" />
    </>
  ),
  city: (
    <>
      <path d="M4 18V10h4v8M10 18V6h4v12M16 18v-6h4v6" />
    </>
  ),
  matte: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M7 14l4-5 3 4 3-6 3 7" />
    </>
  ),
  default: <path d="M12 3l2.4 7.2H22l-6 4.8 2.4 7.2L12 17.4 5.6 22.2 8 15 2 10.8h7.6L12 3z" />,
}

function resolveIconKey(nodeId: string, category: QuestCategory): SkillIconKey {
  return NODE_SKILL_ICON_KEYS[nodeId] ?? CATEGORY_FALLBACK_ICON[category] ?? 'default'
}

export function RpgSkillNodeIcon({
  nodeId,
  category,
  className,
  ...props
}: {
  nodeId: string
  category: QuestCategory
} & IconProps) {
  const key = resolveIconKey(nodeId, category)
  const color = CATEGORY_INFO[category]?.color ?? 'var(--accent)'

  return (
    <SkillIcon
      className={className}
      style={{ color, ...props.style }}
      {...props}
    >
      {ICONS[key] ?? ICONS.default}
    </SkillIcon>
  )
}
