import { describe, it, expect } from 'vitest'
import { cn } from '@renderer/lib/utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles tailwind conflict resolution', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('filters falsy values', () => {
    expect(cn('px-4', false, undefined, null, 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes with objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('handles array inputs', () => {
    expect(cn(['px-4', 'py-2'], 'mt-1')).toBe('px-4 py-2 mt-1')
  })

  it('resolves multiple conflicting utilities', () => {
    expect(cn('p-4', 'px-2', 'py-3')).toBe('p-4 px-2 py-3')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('deduplicates identical classes', () => {
    expect(cn('px-4', 'px-4')).toBe('px-4')
  })
})
