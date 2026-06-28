import { describe, it, expect } from 'vitest'
import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from '../useFocusTrap'

function FocusTrapHarness() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef)

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open trigger
      </button>
      {open ? (
        <div ref={panelRef} role="dialog" aria-label="Demo">
          <button type="button" onClick={() => setOpen(false)}>
            Close panel
          </button>
        </div>
      ) : null}
    </div>
  )
}

describe('useFocusTrap', () => {
  it('returns focus to the trigger after the trap closes', async () => {
    const user = userEvent.setup()
    render(<FocusTrapHarness />)

    const trigger = screen.getByRole('button', { name: 'Open trigger' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Close panel' }))

    expect(document.activeElement).toBe(trigger)
  })
})
