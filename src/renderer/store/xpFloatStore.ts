import { create } from 'zustand'
import {
  REWARD_XP_FLOAT_MIN,
  XP_FLOAT_TIER_GOLD,
  XP_FLOAT_TIER_SILVER,
} from '@/utils/rewardLoopConstants'

export type XpFloatTier = 'bronze' | 'silver' | 'gold'

export function xpFloatTier(amount: number): XpFloatTier {
  if (amount >= XP_FLOAT_TIER_GOLD) return 'gold'
  if (amount >= XP_FLOAT_TIER_SILVER) return 'silver'
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
    if (amount < REWARD_XP_FLOAT_MIN) return
    const id = ++nextId
    set((s) => ({ bursts: [...s.bursts, { id, amount }] }))
  },
  remove: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),
}))
