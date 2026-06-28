import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import XPFloat from '../XPFloat'
import { useXpFloatStore } from '@/store/xpFloatStore'

describe('XPFloat', () => {
  beforeEach(() => {
    useXpFloatStore.setState({ bursts: [] })
  })

  it('shows floating label when burst is pushed', () => {
    render(<XPFloat />)
    act(() => {
      useXpFloatStore.getState().push(42)
    })
    expect(screen.getByText('+42 XP')).toBeDefined()
    expect(document.querySelector('.xp-float-burst--bronze')).toBeTruthy()
  })

  it('uses gold tier styling for large XP amounts', () => {
    render(<XPFloat />)
    act(() => {
      useXpFloatStore.getState().push(200)
    })
    expect(document.querySelector('.xp-float-burst--gold')).toBeTruthy()
  })
})
