# AI Agent Desktop

基于 pi-mono Agent 引擎的桌面端 AI Agent 平台。

## 技术栈

- **桌面框架**: Electron ^39.x
- **前端**: React ^19.x + TypeScript ^6.x
- **状态管理**: Zustand ^5.x
- **UI**: shadcn/ui + Tailwind CSS ^4.x
- **画布**: @xyflow/react ^12.x
- **编辑器**: Monaco Editor ^0.5x
- **Agent 引擎**: @earendil-works/pi-coding-agent ^0.78.x
- **LLM**: @earendil-works/pi-ai ^0.78.x
- **沙箱**: Dockerode ^5.x
- **向量存储**: ChromaDB ^3.x
- **构建**: Vite ^7.x + electron-builder ^26.x
- **包管理**: pnpm ^10.x

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
        ├── stores/      # Zustand 状态管理
        ├── hooks/       # 自定义 hooks
        └── lib/         # 工具函数
packages/
└── shared-types/   # IPC 和工作流类型定义
```

## 开发命令

```bash
pnpm dev          # 启动开发环境 (Vite + Electron)
pnpm build        # 构建前端 + 主进程
pnpm build:app    # 打包应用 (electron-builder)
pnpm lint         # 代码检查 (oxlint --fix)
pnpm fmt          # 代码格式化 (oxfmt)
pnpm test         # 运行测试 (vitest)
pnpm typecheck    # 类型检查
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

## 里程碑

- **P0**: 基础脚手架 + 单 Agent 对话
- **P1**: 工具调用 + 代码编辑器 + 沙箱
- **P2**: 工作流画布 + DAG 引擎
- **P3**: 多 Agent 协作 + 向量记忆
- **P4**: 打磨与发布
