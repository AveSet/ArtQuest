export type PageSkeletonVariant = 'dashboard' | 'quests' | 'generic'

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[var(--bg-tertiary)] animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === 'dashboard') {
    return (
      <div className="container-fantasy py-4 space-y-6" data-testid="page-skeleton-dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <SkeletonBlock className="h-48 w-full" />
            <SkeletonBlock className="h-32 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <SkeletonBlock className="h-36 w-full" />
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'quests') {
    return (
      <div className="container-fantasy py-4 space-y-4" data-testid="page-skeleton-quests">
        <SkeletonBlock className="h-10 w-full max-w-xl" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-28" />
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container-fantasy py-16 space-y-3" data-testid="page-skeleton-generic">
      <SkeletonBlock className="h-8 w-48 mx-auto" />
      <SkeletonBlock className="h-4 w-64 mx-auto" />
      <SkeletonBlock className="h-32 w-full max-w-lg mx-auto mt-6" />
    </div>
  )
}

export function skeletonVariantForPath(pathname: string): PageSkeletonVariant {
  if (pathname === '/' || pathname.startsWith('/progress')) return 'dashboard'
  if (pathname.startsWith('/quests')) return 'quests'
  return 'generic'
}
