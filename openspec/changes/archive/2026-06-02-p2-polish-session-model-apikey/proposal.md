## Why

P2 工作流引擎已完成，但核心用户体验仍存在关键缺失：无法切换模型、无法管理 API Key、会话关闭后丢失、无法管理多个会话。这些是桌面 AI Agent 应用的基础能力，直接影响用户能否正常使用产品。

## What Changes

- **模型选择器**: 用户可在聊天界面切换 Provider（OpenAI/Anthropic）和具体模型
- **API Key 管理**: 设置页面中安全输入和管理 API Key，持久化存储
- **会话持久化**: 会话列表和消息保存到 localStorage，启动时恢复
- **多会话管理**: 侧边栏显示会话列表，支持创建、切换、删除会话

## Capabilities

### New Capabilities

- `session-persistence`: 会话数据的本地持久化存储与恢复
- `multi-session`: 多会话管理（创建/切换/删除/列表展示）
- `model-selector`: 模型选择器 UI（Provider + Model 切换）
- `api-key-management`: API Key 的安全输入、存储和管理 UI

### Modified Capabilities

- `chat-ui`: 扩展 ChatPanel 集成模型选择器，侧边栏集成会话列表
- `agent-session`: 扩展支持多会话实例管理和会话持久化

## Impact

### 代码影响

- `src/renderer/src/stores/agent-store.ts` — 扩展多会话状态和持久化逻辑
- `src/renderer/src/components/chat/ChatPanel.tsx` — 集成模型选择器
- `src/renderer/src/components/layout/AppShell.tsx` — 添加侧边栏（会话列表）
- `src/preload/index.ts` — 添加 API Key 相关 IPC 方法
- `src/main/agent/ipc-handlers.ts` — 添加 API Key 存储/读取处理

### 依赖影响

- 无需新增依赖（localStorage 内置，UI 使用现有 shadcn/ui 组件）

### 安全影响

- API Key 存储需使用 safeStorage 加密（已有实现基础）
