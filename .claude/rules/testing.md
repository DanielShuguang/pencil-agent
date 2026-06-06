# 测试知识

## TDD 流程

1. **Red** — 先编写测试，运行确认失败
2. **Green** — 编写最简实现使测试通过
3. **Refactor** — 测试保护下重构
4. 提交前 `pnpm test:run` 确保全部通过

## 测试策略

| 类型 | 工具 | 目标 |
|------|------|------|
| 单元测试 | vitest | Stores、工具函数、纯逻辑 |
| 组件测试 | vitest + testing-library | UI 组件交互 |
| E2E 测试 | Playwright Electron | 跨进程关键路径 |

- 测试文件 colocate 在 `__tests__/` 目录下
- E2E 集中在 `test/e2e/` 目录

## Mock 注意事项

### CJS 模块 mock
- `vi.mock` 工厂函数被 hoist 到文件顶部，引用外部变量必须用 `vi.hoisted()`
- Mock 构造函数用 `function() { return {...} }`（非箭头函数），确保 `new` 操作正常
- `electron-updater` 等 CJS 模块用 `default: { autoUpdater: mock }` 结构

### electron-store mock
```typescript
vi.mock('../../lib/store', () => ({
  appStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}))
```
注意 mock 路径相对于**测试文件**所在目录。

### Async Generator 测试
- async generator 函数体在 `generator.next()` 首次调用前不执行
- 用 `await vi.waitFor()` 等待订阅注册后再触发事件
- 消费模式：先用 async IIFE 启动 `for await` 循环，再触发事件

### 静态状态重置
- `vi.clearAllMocks()` 重置 spy 调用记录但不移除 `mockImplementation`
- TypeScript `private` 静态字段可通过 `(Class as any).field` 访问和重置

### Docker 多路复用流
- 格式：stream ID(1B) + padding(3B) + frame size(4B) + payload
- `data.slice(8)` 跳过 8 字节头部获取实际内容

### i18n mock
```typescript
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => translations[key] || key }),
}))
```

### Radix UI 组件 mock (如 Tooltip)
```typescript
import { TooltipProvider } from '../../ui/tooltip'
render(<TooltipProvider><Component /></TooltipProvider>)
```
