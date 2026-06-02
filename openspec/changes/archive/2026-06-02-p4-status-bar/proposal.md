## Why

当前应用缺少底部状态栏，用户无法直观看到当前使用的模型、Token 消耗情况、API 连接状态和应用版本。这些信息对于用户体验和调试至关重要，特别是 Token 消耗直接影响成本控制。

## What Changes

- 新增底部状态栏组件 StatusBar，固定在窗口底部
- 新增 status-store 聚合多维度状态数据
- 新增 Token 使用量追踪机制
- 新增 LLM API 连接状态检测
- 新增版本号显示（从 package.json 读取）
- 扩展 IPC 接口支持版本获取和连接检测

## Capabilities

### New Capabilities
- `status-bar`: 底部状态栏，显示模型名称、Token 使用量、连接状态、版本号，支持点击交互
- `token-tracking`: Token 使用量追踪，在 Agent 响应时累计 prompt/completion token
- `connection-health`: LLM API 连接健康检测，定期检查 API 可达性

### Modified Capabilities
- `agent-session`: 扩展支持 Token 使用量元数据传递
- `settings-management`: 新增连接检测 IPC 接口

## Impact

**代码影响**:
- `src/renderer/src/components/layout/` — 新增 StatusBar.tsx
- `src/renderer/src/stores/` — 新增 status-store.ts
- `src/renderer/src/stores/agent-store.ts` — 集成 Token 追踪
- `src/preload/index.ts` — 扩展 appAPI 和 settingsAPI
- `src/main/index.ts` — 新增 app:getVersion 处理
- `src/main/agent/ipc-handlers.ts` — 新增 settings:checkConnection 处理

**依赖影响**: 无新增依赖

**API 影响**: 新增 2 个 IPC 接口
- `app:getVersion` — 获取应用版本
- `settings:checkConnection` — 检测 API 连通性
