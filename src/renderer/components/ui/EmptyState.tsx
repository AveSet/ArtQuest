import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`card-fantasy text-center py-12 px-4 max-w-lg mx-auto ${className}`.trim()}
      role="status"
    >
      {icon ? (
        <div className="text-6xl mb-4" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-fantasy text-lg">{title}</p>
      {description ? (
        <p className="text-fantasy text-sm mt-2 max-w-md mx-auto text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  )
}
