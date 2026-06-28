import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  recordClientError,
  getClientErrorLog,
  clearClientErrorLog,
  resetErrorReportingForTests,
} from '../errorReporting'

describe('errorReporting', () => {
  beforeEach(() => {
    resetErrorReportingForTests()
    localStorage.clear()
  })

  afterEach(() => {
    resetErrorReportingForTests()
    localStorage.clear()
  })

  it('stores errors in a ring buffer', () => {
    recordClientError('test', 'first')
    recordClientError('test', 'second')
    const log = getClientErrorLog()
    expect(log).toHaveLength(2)
    expect(log[0]?.message).toBe('first')
    expect(log[1]?.message).toBe('second')
  })

  it('clears stored errors', () => {
    recordClientError('test', 'oops')
    clearClientErrorLog()
    expect(getClientErrorLog()).toHaveLength(0)
  })
})
