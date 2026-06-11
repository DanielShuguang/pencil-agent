import { describe, it, expect } from 'vitest'
import { maskApiKey } from '@renderer/lib/mask-api-key'

describe('maskApiKey', () => {
  it('should mask a normal API key', () => {
    const key = 'sk-1234567890abcdef'
    const masked = maskApiKey(key)
    expect(masked).toBe('sk-1***cdef')
  })

  it('should mask a short key (length <= 8)', () => {
    const key = 'sk-1234'
    const masked = maskApiKey(key)
    expect(masked).toBe('*******')
  })

  it('should mask a key with exactly 8 characters', () => {
    const key = '12345678'
    const masked = maskApiKey(key)
    expect(masked).toBe('********')
  })

  it('should return empty string for empty key', () => {
    const key = ''
    const masked = maskApiKey(key)
    expect(masked).toBe('')
  })

  it('should handle key with 9 characters', () => {
    const key = '123456789'
    const masked = maskApiKey(key)
    expect(masked).toBe('1234***6789')
  })

  it('should handle anthropic key format', () => {
    const key = 'sk-ant-api1234567890abcdef'
    const masked = maskApiKey(key)
    expect(masked).toBe('sk-a***cdef')
  })
})