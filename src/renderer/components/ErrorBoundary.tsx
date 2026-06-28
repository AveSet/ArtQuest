import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  messages?: {
    title: string
    recoverTitle: string
    exhausted: string
    tryAgain: string
    reload: string
  }
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

const MAX_RETRIES = 4

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('%c[ErrorBoundary] Application Error:', 'color: #ef4444; font-weight: bold')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    this.setState({ hasError: true, error, errorInfo })
  }

  handleReset = (): void => {
    const newCount = this.state.retryCount + 1
    if (newCount > MAX_RETRIES) return
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: newCount })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const retriesExhausted = this.state.retryCount >= MAX_RETRIES
      const m = this.props.messages

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] p-4"
        >
          <div className="card-fantasy max-w-md w-full text-center p-8" role="dialog" aria-labelledby="error-title">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h2 id="error-title" className="heading-2 mb-4">
              {retriesExhausted ? (m?.recoverTitle ?? 'Unable to recover') : (m?.title ?? 'Something went wrong')}
            </h2>
            <p className="text-fantasy mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {!retriesExhausted ? (
              <button
                onClick={this.handleReset}
                className="btn-primary w-full py-3 mb-3"
                aria-label="Try to recover from error"
              >
                {m?.tryAgain ?? 'Try Again'}
              </button>
            ) : (
              <p className="text-gray-400 text-sm mb-3">
                {m?.exhausted ?? 'The application is unable to recover automatically.'}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="btn-secondary w-full py-3"
              aria-label="Reload the application"
            >
              {m?.reload ?? 'Reload App'}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary