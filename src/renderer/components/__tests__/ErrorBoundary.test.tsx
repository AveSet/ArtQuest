import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message)
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeDefined()
  })

  it('renders fallback on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()
    expect(screen.getByText('Test error')).toBeDefined()
  })

  it('Try Again button resets the error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError message="First error" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Try Again')).toBeDefined()

    act(() => {
      fireEvent.click(screen.getByText('Try Again'))
      rerender(
        <ErrorBoundary>
          <div>Recovered</div>
        </ErrorBoundary>
      )
    })
    expect(screen.getByText('Recovered')).toBeDefined()
  })

  it('shows reload option after max retries', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError message="Error" />
      </ErrorBoundary>
    )

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Try Again'))
      rerender(
        <ErrorBoundary>
          <ThrowError message="Error" />
        </ErrorBoundary>
      )
    }

    expect(screen.getByText('Unable to recover')).toBeDefined()
    expect(screen.getByText('Reload App')).toBeDefined()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowError message="Error" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom Fallback')).toBeDefined()
  })
})
