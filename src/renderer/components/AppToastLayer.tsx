import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ToastStackContext } from './toastStackContext'

type Props = { children: ReactNode }

/** Renders notifications in a viewport-sized layer on document.body (not clipped by scroll/layout). */
export default function AppToastLayer({ children }: Props) {
  const [xpReserve, setXpReserve] = useState(0)

  const stackValue = useMemo(() => ({ setXpReserve }), [])

  const layerStyle = {
    '--toast-xp-reserve': `${xpReserve}px`,
  } as CSSProperties

  if (typeof document === 'undefined') {
    return <ToastStackContext.Provider value={stackValue}>{children}</ToastStackContext.Provider>
  }

  return createPortal(
    <div className="app-toast-layer" data-testid="app-toast-layer" style={layerStyle}>
      <ToastStackContext.Provider value={stackValue}>{children}</ToastStackContext.Provider>
    </div>,
    document.body,
  )
}
