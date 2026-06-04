import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStorageItem, setStorageItem, removeStorageItem, clearStorage } from '../storage'

let store: Record<string, string> = {}

function createMockLocalStorage() {
  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() { return Object.keys(store).length },
  }
  return new Proxy(mock, {
    get(target, prop) {
      if (prop === Symbol.toStringTag) return 'Storage'
      if (prop in target) return (target as Record<string, unknown>)[prop]
      return undefined
    },
    ownKeys() {
      return Object.keys(store)
    },
    getOwnPropertyDescriptor() {
      return { configurable: true, enumerable: true, writable: true }
    },
  }) as unknown as Storage
}

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', createMockLocalStorage())
})

describe('storage', () => {
  describe('getStorageItem', () => {
    it('should return default value when key does not exist', () => {
      expect(getStorageItem('missing', 'default')).toBe('default')
    })

    it('should return parsed value when key exists', () => {
      store['pencil-agent:theme'] = JSON.stringify('dark')
      expect(getStorageItem('theme', 'light')).toBe('dark')
    })

    it('should return complex objects', () => {
      const obj = { a: 1, b: [2, 3] }
      store['pencil-agent:config'] = JSON.stringify(obj)
      expect(getStorageItem('config', {})).toEqual(obj)
    })

    it('should return default on invalid JSON', () => {
      store['pencil-agent:broken'] = 'not-json'
      expect(getStorageItem('broken', 'fallback')).toBe('fallback')
    })

    it('should use pencil-agent prefix', () => {
      store['pencil-agent:key'] = JSON.stringify('value')
      expect(getStorageItem('key', '')).toBe('value')
      expect(localStorage.getItem).toHaveBeenCalledWith('pencil-agent:key')
    })
  })

  describe('setStorageItem', () => {
    it('should store JSON-stringified value', () => {
      setStorageItem('theme', 'dark')
      expect(store['pencil-agent:theme']).toBe(JSON.stringify('dark'))
    })

    it('should store complex objects', () => {
      const obj = { x: 1 }
      setStorageItem('obj', obj)
      expect(store['pencil-agent:obj']).toBe(JSON.stringify(obj))
    })

    it('should use pencil-agent prefix', () => {
      setStorageItem('key', 'val')
      expect(localStorage.setItem).toHaveBeenCalledWith('pencil-agent:key', '"val"')
    })

    it('should handle QuotaExceededError by clearing old sessions', () => {
      store['pencil-agent:session:old'] = 'data'
      store['pencil-agent:session:new'] = 'data'

      let callCount = 0
      vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
        callCount++
        if (callCount === 1) {
          const error = new DOMException('quota exceeded', 'QuotaExceededError')
          throw error
        }
        store[key] = value
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      setStorageItem('key', 'value')

      expect(consoleSpy).toHaveBeenCalled()
      expect(store['pencil-agent:session:old']).toBeUndefined()
      consoleSpy.mockRestore()
    })

    it('should warn on non-quota errors', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('unknown error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      setStorageItem('key', 'value')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('removeStorageItem', () => {
    it('should remove item with prefix', () => {
      store['pencil-agent:key'] = 'value'
      removeStorageItem('key')
      expect(store['pencil-agent:key']).toBeUndefined()
    })

    it('should not throw if key does not exist', () => {
      expect(() => removeStorageItem('missing')).not.toThrow()
    })
  })

  describe('clearStorage', () => {
    it('should clear all pencil-agent prefixed keys', () => {
      store['pencil-agent:a'] = '1'
      store['pencil-agent:b'] = '2'
      store['other:key'] = '3'

      clearStorage()

      expect(store['pencil-agent:a']).toBeUndefined()
      expect(store['pencil-agent:b']).toBeUndefined()
      expect(store['other:key']).toBe('3')
    })

    it('should not clear non-prefixed keys', () => {
      store['theme'] = 'dark'
      store['pencil-agent:theme'] = 'light'

      clearStorage()

      expect(store['theme']).toBe('dark')
      expect(store['pencil-agent:theme']).toBeUndefined()
    })

    it('should handle empty storage', () => {
      expect(() => clearStorage()).not.toThrow()
    })
  })
})
