import type { MaterialVideoMode } from '@/utils/materialExternalCatalog'

export type MaterialSourceModeLabels = {
  long: string
  short: string
  clipTips: string
  sketchfab: string
  pinterest: string
}

type Props = {
  value: MaterialVideoMode
  onChange: (mode: MaterialVideoMode) => void
  labels: MaterialSourceModeLabels
  ariaLabel: string
}

const MODES: MaterialVideoMode[] = ['long', 'short', 'clipTips', 'sketchfab', 'pinterest']

const MODE_TITLES: Record<MaterialVideoMode, string> = {
  long: 'YouTube',
  short: 'YouTube Shorts',
  clipTips: 'tips.clip-studio.com',
  sketchfab: 'sketchfab.com',
  pinterest: 'pinterest.com',
}

export default function MaterialSourceModeButtons({ value, onChange, labels, ariaLabel }: Props) {
  const labelFor = (mode: MaterialVideoMode) => {
    switch (mode) {
      case 'long':
        return labels.long
      case 'short':
        return labels.short
      case 'clipTips':
        return labels.clipTips
      case 'sketchfab':
        return labels.sketchfab
      case 'pinterest':
        return labels.pinterest
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={ariaLabel}>
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`material-source-btn ${value === mode ? 'is-active' : ''}`}
          aria-pressed={value === mode}
          title={MODE_TITLES[mode]}
          onClick={() => onChange(mode)}
        >
          {labelFor(mode)}
        </button>
      ))}
    </div>
  )
}
