import '@testing-library/jest-dom/vitest'

// jsdom 缺少 @xyflow/react 等画布组件依赖的浏览器 API，这里提供最小实现
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
    configurable: true,
  })
}

if (!('DOMMatrixReadOnly' in globalThis)) {
  class DOMMatrixReadOnlyStub {
    a = 1
    b = 0
    c = 0
    d = 1
    e = 0
    f = 0
    m22 = 1
    inverse(): DOMMatrixReadOnlyStub {
      return this
    }
    multiply(): DOMMatrixReadOnlyStub {
      return this
    }
    translate(): DOMMatrixReadOnlyStub {
      return this
    }
    scale(): DOMMatrixReadOnlyStub {
      return this
    }
  }
  Object.defineProperty(globalThis, 'DOMMatrixReadOnly', {
    value: DOMMatrixReadOnlyStub,
    writable: true,
    configurable: true,
  })
}

// jsdom 没有实现 matchMedia，动画库与系统主题检测都会用到
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (!('MutationObserver' in globalThis)) {
  class MutationObserverStub {
    observe(): void {}
    disconnect(): void {}
    takeRecords(): unknown[] {
      return []
    }
  }
  Object.defineProperty(globalThis, 'MutationObserver', {
    value: MutationObserverStub,
    writable: true,
    configurable: true,
  })
}
