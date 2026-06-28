import { create } from 'zustand'

export type XpFloatTier = 'bronze' | 'silver' | 'gold'

export function xpFloatTier(amount: number): XpFloatTier {
  if (amount >= 150) return 'gold'
  if (amount >= 50) return 'silver'
  return 'bronze'
}

export type XpFloatBurst = {
  id: number
  amount: number
}

type XpFloatState = {
  bursts: XpFloatBurst[]
  push: (amount: number) => void
  remove: (id: number) => void
}

let nextId = 0

export const useXpFloatStore = create<XpFloatState>((set) => ({
  bursts: [],
  push: (amount) => {
    if (amount <= 0) return
    const id = ++nextId
    set((s) => ({ bursts: [...s.bursts, { id, amount }] }))
  },
  remove: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),
}))
