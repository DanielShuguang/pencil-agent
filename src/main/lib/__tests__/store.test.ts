import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStoreData = vi.hoisted(() => ({}) as Record<string, unknown>)

const { mockGet, mockSet, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn((key: string) => mockStoreData[key]),
  mockSet: vi.fn((key: string, value: unknown) => {
    mockStoreData[key] = value
  }),
  mockDelete: vi.fn((key: string) => {
    delete mockStoreData[key]
  }),
}))

vi.mock('electron-store', () => ({
  default: function () {
    return { get: mockGet, set: mockSet, delete: mockDelete }
  },
}))

import { appStore } from '../store'

describe('appStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStoreData).forEach((k) => delete mockStoreData[k])
  })

  it('should be defined with store methods', () => {
    expect(appStore).toBeDefined()
    expect(appStore.set).toBeDefined()
    expect(appStore.get).toBeDefined()
    expect(appStore.delete).toBeDefined()
  })

  it('should delegate get calls to electron-store', () => {
    mockStoreData['some.key'] = 'test-value'
    const result = appStore.get('some.key')
    expect(result).toBe('test-value')
  })

  it('should delegate set calls to electron-store', () => {
    appStore.set('some.key', { nested: true })
    expect(mockStoreData['some.key']).toEqual({ nested: true })
  })

  it('should delegate delete calls to electron-store', () => {
    mockStoreData['some.key'] = 'value'
    appStore.delete('some.key')
    expect(mockStoreData['some.key']).toBeUndefined()
  })
})
