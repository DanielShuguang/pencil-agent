# AI Agent Desktop

基于 pi-mono Agent 引擎的桌面端 AI Agent 平台。

## 技术栈

- **桌面框架**: Electron ^39.x
- **前端**: React ^19.x + TypeScript ^6.x
- **状态管理**: Zustand ^5.x
- **UI**: shadcn/ui + Radix UI + Tailwind CSS ^4.x
- **画布**: @xyflow/react ^12.x
- **编辑器**: Monaco Editor ^0.5x
- **Agent 引擎**: @earendil-works/pi-coding-agent ^0.78.x
- **LLM**: @earendil-works/pi-ai ^0.78.x
- **沙箱**: Dockerode ^5.x
- **向量存储**: ChromaDB ^3.x
- **国际化**: react-i18next ^17.x + i18next ^26.x
- **构建**: Vite ^7.x + electron-builder ^26.x
- **包管理**: pnpm ^10.x
- **测试**: vitest ^4.x + testing-library + Playwright ^1.x

## 项目结构

```
src/
├── main/           # Electron 主进程
│   ├── agent/      # Agent 会话管理、工具注册
│   ├── workflow/   # 工作流引擎 (DAG)
│   ├── sandbox/    # Docker 代码沙箱
│   └── memory/     # 向量记忆存储
├── preload/        # contextBridge 预加载脚本
└── renderer/       # React 渲染进程
    └── src/
        ├── components/  # UI 组件
        │   └── __tests__/  # 组件测试
        ├── stores/      # Zustand 状态管理
        │   └── __tests__/  # Store 测试
        ├── hooks/       # 自定义 hooks
        ├── lib/         # 工具函数
        │   └── __tests__/  # 单元测试
        ├── locales/     # 国际化翻译文件
        │   ├── zh.json  # 中文翻译
        │   └── en.json  # 英文翻译
        ├── i18n.ts      # i18n 配置
        └── test-setup.ts   # 测试环境初始化
packages/
└── shared-types/   # IPC 和工作流类型定义
test/
└── e2e/            # Playwright E2E 测试
```

## 开发命令

```bash
pnpm dev           # 启动开发环境 (Vite + Electron)
pnpm build         # 构建前端 + 主进程
pnpm build:app     # 打包应用 (electron-builder)
pnpm lint          # 代码检查 (oxlint --fix)
pnpm fmt           # 代码格式化 (oxfmt)
pnpm test          # 监视模式运行 vitest（单元 + 组件测试）
pnpm test:run      # 单次运行所有 vitest 测试（CI 使用）
pnpm test:e2e      # 运行 Playwright E2E 测试 (需先 build)
pnpm typecheck     # 类型检查
```

## 命名约定

- 组件: `PascalCase.tsx` (如 `AgentNode.tsx`)
- 工具/库: `camelCase.ts` (如 `ipcClient.ts`)
- Store: `kebab-case.ts` (如 `agent-store.ts`)
- 变量/函数: `camelCase`
- 常量: `UPPER_SNAKE_CASE`

## 架构要点

### IPC 通信

渲染进程通过 `contextBridge` 暴露的 `window.api` 与主进程通信：

```typescript
// 渲染进程
window.api.agent.prompt(sessionId, message)
window.api.agent.onChunk(callback)

// 主进程 (ipcMain.handle / ipcMain.on)
ipcMain.handle('agent:create', handler)
ipcMain.on('agent:prompt', handler)
```

### Agent 会话

基于 pi-mono 的三层架构：
1. `pi-coding-agent` - 高层 SDK (createAgentSession)
2. `pi-agent-core` - Agent 循环、工具执行
3. `pi-ai` - LLM 抽象层 (streamSimple)

### 工作流引擎

使用拓扑排序执行 DAG：
- 节点类型: start, end, agent, tool, condition, parallel, merge
- 画布: @xyflow/react
- 执行: WorkflowEngine.execute()

### 安全模型

- `nodeIntegration: false`, `contextIsolation: true`
- API Key 使用 `safeStorage` 加密
- Docker 沙箱: 网络隔离、内存限制、只读文件系统

### UI 组件规范

项目使用 Radix UI 作为基础组件库，优先使用已封装的组件：

**可用组件 (`src/renderer/src/components/ui/`)：**
- `button.tsx` - 按钮组件
- `input.tsx` - 输入框组件
- `label.tsx` - 标签组件
- `dialog.tsx` - 模态对话框
- `alert-dialog.tsx` - 确认对话框
- `select.tsx` - 下拉选择器
- `popover.tsx` - 弹出层
- `scroll-area.tsx` - 滚动区域

**开发规范：**
1. **禁止使用原生 HTML 组件**：不使用 `<select>`、`<dialog>`、`<input type="dialog">` 等原生组件
2. **禁止使用浏览器弹窗**：不使用 `alert()`、`confirm()`、`prompt()` 等原生弹窗
3. **优先使用 Radix UI**：所有交互式 UI 组件必须使用 Radix UI 封装的组件
4. **组件封装位置**：新组件统一放在 `src/renderer/src/components/ui/` 目录
5. **样式规范**：使用 Tailwind CSS + `cn()` 工具函数进行样式合并

**示例：**
```tsx
// ❌ 错误：使用原生 select
<select className="..." value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="a">A</option>
</select>

// ✅ 正确：使用 Radix UI Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">A</SelectItem>
  </SelectContent>
</Select>
```

### 国际化 (i18n)

使用 react-i18next 实现多语言支持：

```typescript
// 翻译文件结构
src/renderer/src/locales/
├── zh.json    # 中文翻译
└── en.json    # 英文翻译

// 组件中使用
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <button>{t('common.save')}</button>
}

// 语言切换
import { useAgentStore } from '../stores/agent-store'
const { setLanguage } = useAgentStore()
setLanguage('en') // 切换到英文
```

翻译键按模块组织：
- `common.*` - 通用文本（保存、取消、删除等）
- `chat.*` - 聊天界面相关
- `settings.*` - 设置界面相关
- `workflow.*` - 工作流相关
- `role.*` - 角色管理相关

### 开发流程 (TDD)

严格遵守测试驱动开发：

1. **Red** — 先编写测试，描述期望行为，运行确认失败
2. **Green** — 编写最简实现代码使测试通过
3. **Refactor** — 在测试保护下重构，保持测试通过
4. 提交前运行 `pnpm test:run` 确保全部通过

### 测试策略

- **单元测试** (vitest): Stores、工具函数、纯逻辑
- **组件测试** (vitest + testing-library): UI 组件交互
- **E2E 测试** (Playwright Electron): 跨进程关键路径
- 测试文件与源码 colocate，放在 `__tests__/` 目录下
- E2E 测试集中在 `test/e2e/` 目录

### Vitest Mocking Notes

**CJS 模块 mock：**
- `vi.mock` 工厂函数被 hoist 到文件顶部，引用外部变量必须用 `vi.hoisted()`
- Mock 构造函数用 `function() { return {...} }`（非箭头函数），确保 `new` 操作正常
- `electron-updater` 等 CJS 模块用 `default: { autoUpdater: mock }` 结构 mock

**Async Generator 测试：**
- async generator 函数体在 `generator.next()` 首次调用前不执行
- 用 `await null` 让微任务队列执行，配合 `await vi.waitFor()` 等待订阅注册
- 消费事件 + 生成数据的协调模式：先用 async IIFE 启动 `for await` 循环，再用 `vi.waitFor` 确认 subscribe 注册后触发事件

**静态状态重置：**
- `vi.clearAllMocks()` 重置 spy 调用记录但不移除 `mockImplementation`
- TypeScript `private` 静态字段在运行时可通过 `(Class as any).field` 访问和重置

**Docker multiplexed stream：**
- Docker 多路复用流格式：stream ID(1B) + padding(3B) + frame size(4B) + payload
- `data.slice(8)` 跳过 8 字节头部获取实际内容
- 测试构造数据：`Buffer.concat([Buffer.from([1]), Buffer.alloc(7, 0), Buffer.from('output')])`

**Electron 测试：**
- CJS 模块的 named exports 需用 `default` 属性访问：`vi.mock('electron', () => ({ default: { ... } }))`
- `contextIsolation: true` 时需设置 `process.contextIsolated = true` 才能在 preload 测试中模拟 `contextBridge`

## 里程碑

- **P0**: 基础脚手架 + 单 Agent 对话
- **P1**: 工具调用 + 代码编辑器 + 沙箱
- **P2**: 工作流画布 + DAG 引擎
- **P3**: 多 Agent 协作 + 向量记忆
- **P4**: 打磨与发布
