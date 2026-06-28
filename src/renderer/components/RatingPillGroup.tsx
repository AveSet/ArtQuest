type RatingValue = 1 | 2 | 3 | 4 | 5

const RATINGS: RatingValue[] = [1, 2, 3, 4, 5]

type Props = {
  value: RatingValue | undefined
  onChange: (n: RatingValue) => void
  size?: 'md' | 'sm'
  className?: string
}

export default function RatingPillGroup({
  value,
  onChange,
  size = 'md',
  className = '',
}: Props) {
  const pillClass =
    size === 'sm'
      ? 'session-difficulty-pill w-8 py-1 rounded border text-xs'
      : 'session-difficulty-pill flex-1 py-2 rounded-lg border text-sm'
  const gapClass = size === 'sm' ? 'gap-1' : 'gap-2'

  return (
    <div className={`flex ${gapClass} ${className}`.trim()}>
      {RATINGS.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
          className={`${pillClass} ${value === n ? 'session-difficulty-pill--active' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
