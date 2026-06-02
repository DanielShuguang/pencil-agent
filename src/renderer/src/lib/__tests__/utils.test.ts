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
})
