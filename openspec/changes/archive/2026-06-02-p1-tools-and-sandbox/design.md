## Context

P0 已实现基础对话功能，包括 Agent 会话管理、IPC 流式通信、聊天 UI。当前 Agent 只能进行文本对话，无法执行实际操作。

**现有架构**：
- 主进程：`AgentSessionManager`（pi-coding-agent）、IPC handlers
- 渲染进程：`ChatPanel`、`MessageList`、`MessageBubble`、`InputBar`
- 通信：`agent:create`（invoke）、`agent:prompt`（send→stream）、`agent:chunk/done/error`（事件）

**约束**：
- Electron 安全模型：`contextIsolation: true`、`nodeIntegration: false`
- pi-mono 内置 4 个原子工具（read/write/edit/bash）
- TDD 开发流程

## Goals / Non-Goals

**Goals:**
- 让 Agent 能调用工具（文件读写、Shell 执行）并在 UI 中展示调用过程
- 提供安全的代码执行环境（child_process + Docker 两种模式）
- 集成 Monaco Editor 支持代码编辑和预览

**Non-Goals:**
- 不实现自定义工具的动态注册（P1 只使用 pi-mono 内置工具）
- 不实现完整的文件系统浏览器（只支持 Agent 主动读写的文件）
- 不实现工作流画布（P2 范畴）
- 不实现多 Agent 协作（P3 范畴）

## Decisions

### 1. 工具调用事件传递机制

**选择**：复用现有 `agent:chunk` 事件，通过 `AgentChunk.type` 区分

**理由**：
- pi-mono 已支持 `tool_call` / `tool_result` 类型的 chunk
- 无需新增 IPC 通道，减少复杂度
- 渲染进程只需在 `appendChunk` 中处理不同类型

**替代方案**：
- 新增 `agent:tool-call` 独立通道 → 增加通道管理复杂度，且 pi-mono 事件模型不支持

### 2. 代码沙箱架构

**选择**：抽象 `SandboxExecutor` 接口，先实现 `ChildProcessSandbox`，后实现 `DockerSandbox`

**理由**：
- child_process 模式开发调试快，适合 P1 初期
- Docker 模式提供更高隔离，适合执行不受信代码
- 抽象接口允许未来扩展（如 E2B 云沙箱）

**接口定义**：
```typescript
interface SandboxExecutor {
  execute(req: SandboxExecuteRequest): Promise<SandboxResult>
  stop(executionId: string): void
}
```

### 3. Monaco Editor 集成方式

**选择**：使用 `@monaco-editor/react` 封装组件，独立于聊天面板

**理由**：
- 成熟的 React 封装，API 简洁
- 支持受控/非受控模式
- 可配置语言、主题、只读等

**替代方案**：
- 直接使用 monaco-editor → 需要手动处理生命周期和 DOM 绑定

### 4. 文件树实现

**选择**：基于 Agent 会话中读写的文件动态构建，非完整文件系统浏览器

**理由**：
- P1 阶段不需要完整文件系统集成
- Agent 工具调用已包含文件路径信息
- 减少安全风险（不暴露完整文件系统）

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| child_process 安全性 | 不受信代码可能执行恶意操作 | 超时控制、资源限制、用户确认 |
| Docker 依赖 | 用户可能未安装 Docker | 优雅降级到 child_process 模式 |
| Monaco Editor 包体积 | 首屏加载变慢 | 代码分割、懒加载 |
| pi-mono 工具 API 变化 | 内部 API 可能不稳定 | 封装适配层，隔离变化 |

## Open Questions

1. **工具调用确认机制**：敏感工具（如 bash）执行前是否需要用户确认？
2. **文件编辑同步**：Agent 编辑文件后，Monaco Editor 如何同步更新？
3. **沙箱工作目录**：临时文件存放在哪里？如何清理？
