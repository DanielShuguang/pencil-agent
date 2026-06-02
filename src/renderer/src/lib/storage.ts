const STORAGE_PREFIX = 'pencil-agent'

function getKey(key: string): string {
  return `${STORAGE_PREFIX}:${key}`
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(getKey(key))
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value))
  } catch {
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(getKey(key))
  } catch {
  }
}

export function clearStorage(): void {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
  } catch {
  }
}
