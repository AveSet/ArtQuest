import type { ReactNode } from 'react'
import { playUiClick } from '@/utils/sound'

export type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
}

type Props<T extends string> = {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
  'aria-label': ariaLabel,
}: Props<T>) {
  return (
    <div
      className={`segmented-control ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`segmented-control__btn ${selected ? 'segmented-control__btn--active' : ''}`}
            onClick={() => {
              if (selected) return
              playUiClick()
              onChange(opt.value)
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
