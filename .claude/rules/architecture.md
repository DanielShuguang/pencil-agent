# 架构知识

## IPC 通信

渲染进程通过 `contextBridge` 暴露的 `window.api` 与主进程通信：

```typescript
// 渲染进程
window.api.agent.prompt(sessionId, message)
window.api.agent.onChunk(callback)

// 主进程 (ipcMain.handle / ipcMain.on)
ipcMain.handle('agent:create', handler)
ipcMain.on('agent:prompt', handler)
```

## Agent 会话

基于 pi-mono 三层架构：
1. `pi-coding-agent` - 高层 SDK (createAgentSession)
2. `pi-agent-core` - Agent 循环、工具执行
3. `pi-ai` - LLM 抽象层

会话通过 `AgentSessionManager` 管理：
- `create(config)` - 创建会话，注入 API Key 和扩展
- `prompt(sessionId, message)` - 发送消息，返回 AsyncGenerator
- 自动重建：会话不存在时（如应用重启），prompt 自动调用 create

## 工具系统与权限控制

工具注册 `ToolRegistry`，默认工具：read, write, edit, bash, grep, find, ls。

权限控制系统通过 SDK 的 `tool_call` 扩展事件拦截工具执行：
- `PermissionManager` - 确认模式（auto/prompt/smart）、工具禁用、路径控制
- `DangerousPatterns` - 危险命令正则拦截（rm -rf、sudo、chmod 777 等）
- `AuditLogger` - JSON Lines 审计日志（30 天自动清理）
- 确认弹窗通过 IPC 请求-响应机制实现

## 工作流引擎

使用拓扑排序执行 DAG：
- 节点类型: start, end, agent, tool, condition, parallel, merge
- 画布: @xyflow/react
- 执行: WorkflowEngine.execute()

## 安全模型

- `nodeIntegration: false`, `contextIsolation: true`
- API Key 使用 `safeStorage` 加密
- Docker 沙箱: 网络隔离(`NetworkMode: none`)、256MB 内存、50% CPU、只读文件系统
- Docker 不可用时降级为 ChildProcess
