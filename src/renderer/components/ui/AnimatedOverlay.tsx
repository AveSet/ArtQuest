import type { MouseEvent, ReactNode } from 'react'
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence'

type AnimatedOverlayProps = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  zClassName?: string
}

export function AnimatedOverlay({
  open,
  onClose,
  children,
  className = '',
  zClassName = 'z-[var(--z-overlay-modal)]',
}: AnimatedOverlayProps) {
  const { mounted, visible } = useAnimatedPresence(open)

  if (!mounted) return null

  return (
    <div
      className={`motion-overlay fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 ${zClassName} ${visible ? 'motion-overlay--visible' : ''} ${className}`.trim()}
      role="presentation"
      onMouseDown={
        onClose
          ? (e: MouseEvent) => {
              if (e.target === e.currentTarget) onClose()
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

type AnimatedModalPanelProps = {
  visible: boolean
  children: ReactNode
  className?: string
  panelRef?: React.RefObject<HTMLDivElement | null>
  role?: 'dialog' | 'alertdialog'
  'aria-modal'?: boolean
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-label'?: string
  onMouseDown?: (e: MouseEvent) => void
}

export function AnimatedModalPanel({
  visible,
  children,
  className = '',
  panelRef,
  role = 'dialog',
  onMouseDown,
  ...aria
}: AnimatedModalPanelProps) {
  return (
    <div
      ref={panelRef}
      role={role}
      aria-modal
      className={`motion-panel card-fantasy shadow-2xl border border-[var(--border-primary)] ${visible ? 'motion-panel--visible' : ''} ${className}`.trim()}
      onMouseDown={onMouseDown ?? ((e: MouseEvent) => e.stopPropagation())}
      {...aria}
    >
      {children}
    </div>
  )
}

type AnimatedModalProps = AnimatedOverlayProps & {
  panelClassName?: string
  panelRef?: React.RefObject<HTMLDivElement | null>
  role?: 'dialog' | 'alertdialog'
  overlayClassName?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-label'?: string
}

/** Overlay + panel with shared open/close motion (use inside modal components). */
export function AnimatedModal({
  open,
  onClose,
  children,
  panelClassName = 'max-w-md w-full',
  zClassName = 'z-[var(--z-overlay-modal)]',
  overlayClassName = '',
  panelRef,
  role = 'dialog',
  ...aria
}: AnimatedModalProps) {
  const { mounted, visible } = useAnimatedPresence(open)

  if (!mounted) return null

  return (
    <div
      className={`motion-overlay fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 ${zClassName} ${visible ? 'motion-overlay--visible' : ''} ${overlayClassName}`.trim()}
      role="presentation"
      onMouseDown={
        onClose
          ? (e: MouseEvent) => {
              if (e.target === e.currentTarget) onClose()
            }
          : undefined
      }
    >
      <AnimatedModalPanel
        visible={visible}
        className={panelClassName}
        panelRef={panelRef}
        role={role}
        {...aria}
      >
        {children}
      </AnimatedModalPanel>
    </div>
  )
}
