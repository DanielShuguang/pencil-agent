## Why

项目已完成基础脚手架搭建（Electron + React + TypeScript），但尚无法进行任何实际的 Agent 对话。需要打通从 UI 到 LLM 的完整链路，验证 pi-mono Agent 引擎的集成可行性，为后续功能迭代奠定基础。

## What Changes

- 集成 `@earendil-works/pi-coding-agent` 到主进程，实现 Agent 会话管理
- 实现 IPC 通信桥接，支持流式消息传输
- 构建基础聊天 UI（消息列表 + 输入框），使用 shadcn/ui + Tailwind CSS
- 支持 OpenAI 和 Anthropic 两个 LLM Provider
- 实现流式打字机效果和自动滚动

## Capabilities

### New Capabilities

- `agent-session`: Agent 会话生命周期管理（创建、对话、中止、销毁）
- `ipc-bridge`: 主进程与渲染进程间的 IPC 通信桥接，支持流式数据传输
- `chat-ui`: 聊天界面组件（消息列表、输入框、消息气泡）
- `llm-provider`: LLM Provider 集成（OpenAI + Anthropic）

### Modified Capabilities

（无，此为全新功能）

## Impact

### 代码影响

| 模块 | 影响 |
|------|------|
| `src/main/index.ts` | 注册 IPC handlers |
| `src/main/agent/` | 新增 Agent 会话管理模块 |
| `src/preload/index.ts` | 暴露 agent API |
| `src/renderer/src/components/` | 新增聊天 UI 组件 |
| `src/renderer/src/stores/agent-store.ts` | 已有实现，需确认兼容性 |
| `src/renderer/src/lib/ipc-client.ts` | 更新 listener 注册 |

### 依赖影响

| 依赖 | 操作 |
|------|------|
| `shadcn/ui` | 新增安装 |
| `tailwindcss` | 新增安装 |
| `@tailwindcss/typography` | 新增安装 |

### 安全影响

- API Key 从环境变量读取，不暴露到渲染进程
- 通过 contextBridge 隔离主进程与渲染进程
- 遵循 Electron 安全最佳实践（nodeIntegration: false, contextIsolation: true）
