import { createContext, useContext } from 'react'

type ToastStackContextValue = {
  setXpReserve: (heightPx: number) => void
}

export const ToastStackContext = createContext<ToastStackContextValue | null>(null)

export function useToastStack(): ToastStackContextValue | null {
  return useContext(ToastStackContext)
}
