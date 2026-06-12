---
name: component-test
description: 为 React 组件生成 vitest + testing-library 测试文件脚手架。自动生成 mock store、i18n 导入和基础测试用例结构。
metadata:
  author: pencil-agent
  version: "1.0"
---

# 组件测试脚手架生成

为项目中的 React 组件快速生成标准化测试文件。

## 输入

用户提供：
- 组件文件路径（相对于 `src/renderer/src/components/`）
- 或组件名称（自动推断路径）

## 步骤

### 1. 分析组件依赖

读取目标组件文件，识别：
- 使用的 Zustand stores（`useXxxStore`）
- 是否使用 `useTranslation`（i18n）
- 子组件导入
- Props 接口

```bash
# 示例：分析组件
cat src/renderer/src/components/chat/ChatPanel.tsx
```

### 2. 确定 Mock 需求

基于分析结果，确定需要 mock 的模块：

| 组件使用 | Mock 方式 |
|----------|-----------|
| `useXxxStore` | `vi.mock('../../../stores/xxx-store', () => ({ useXxxStore: vi.fn() }))` |
| 子组件 | `vi.mock('../ChildComponent', () => ({ ChildComponent: () => <div data-testid='child' /> }))` |
| `useTranslation` | 自动通过 `import '../../../i18n'` 处理 |
| `window.api` | `vi.stubGlobal('window', { ...window, api: {...} })` |

### 3. 生成测试文件

在组件同级 `__tests__/` 目录创建 `<ComponentName>.test.tsx`。

**模板结构：**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from '../ComponentName'
import '../../../i18n'  // 始终包含

// Mock stores
vi.mock('../../../stores/xxx-store', () => ({
  useXxxStore: vi.fn(),
}))

// Mock 子组件（如需要）
vi.mock('../ChildComponent', () => ({
  ChildComponent: () => <div data-testid='child-component'>ChildComponent</div>,
}))

// 导入并创建 mock 引用
const { useXxxStore } = await import('../../../stores/xxx-store')
const mockUseXxxStore = vi.mocked(useXxxStore)

beforeEach(() => {
  mockUseXxxStore.mockReturnValue({
    // 默认返回值
  } as unknown as ReturnType<typeof useXxxStore>)
})

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('预期文本')).toBeInTheDocument()
  })

  // 根据组件功能添加更多测试用例
})
```

### 4. Mock Store 模式速查

**单 store 组件：**
```tsx
vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))
const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)
```

**多 store 组件：**
```tsx
vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))
vi.mock('../../../stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const { useThemeStore } = await import('../../../stores/theme-store')
const mockUseAgentStore = vi.mocked(useAgentStore)
const mockUseThemeStore = vi.mocked(useThemeStore)
```

**带 Dialog 的组件：**
```tsx
it('renders when open', () => {
  render(<Component isOpen={true} onClose={vi.fn()} />)
  expect(screen.getByText('标题')).toBeInTheDocument()
})

it('does not render when closed', () => {
  render(<Component isOpen={false} onClose={vi.fn()} />)
  expect(screen.queryByText('标题')).not.toBeInTheDocument()
})
```

### 5. 验证测试

```bash
pnpm test:run -- --reporter=verbose src/renderer/src/components/xxx/__tests__/ComponentName.test.tsx
```

## 护栏

- 测试文件必须放在组件同级 `__tests__/` 目录
- 始终 `import '../../../i18n'`（路径根据组件深度调整）
- Mock store 使用 `vi.mock` + `await import` + `vi.mocked` 模式
- Mock 子组件使用 `data-testid` 便于断言
- 不要 mock UI 原语（button、input 等）
- 遵循 testing.md 中的 Mock 注意事项（CJS 模块、async generator 等）

## 示例：生成 SessionList 测试

输入：`SessionList` 组件

输出：`src/renderer/src/components/sidebar/__tests__/SessionList.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionList } from '../SessionList'
import { useAgentStore } from '../../../stores/agent-store'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

const mockUseAgentStore = vi.mocked(useAgentStore)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})

describe('SessionList', () => {
  it('shows empty message when no sessions', () => {
    mockUseAgentStore.mockReturnValue({
      sessionMetas: new Map(),
      activeSessionId: null,
      switchSession: vi.fn(),
      deleteSession: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStore>)

    render(<SessionList />)
    expect(screen.getByText('暂无会话')).toBeInTheDocument()
  })

  it('renders session items', () => {
    // ... test implementation
  })
})
```
