## Context

项目已完成基础脚手架搭建（Electron + React + TypeScript + electron-vite），所有核心依赖已安装（pi-mono、@xyflow/react、Monaco、Zustand 等）。当前状态：

- 主进程：仅包含基础窗口创建代码
- 预加载：空 API 对象 `api = {}`
- 渲染进程：默认 electron-vite 模板
- 共享类型：IPC 类型定义已完成（`packages/shared-types/ipc.ts`）
- Store：Agent store 已实现完整状态管理逻辑

**约束：**
- 必须遵循 Electron 安全最佳实践（contextIsolation: true, nodeIntegration: false）
- 使用 electron-vite 构建工具链
- 遵循项目命名约定

## Goals / Non-Goals

**Goals:**
- 实现端到端的 Agent 对话功能
- 支持 OpenAI 和 Anthropic 两个 LLM Provider
- 流式输出实时显示
- 使用 shadcn/ui + Tailwind CSS 构建 UI

**Non-Goals:**
- 模型配置 UI（硬编码默认模型）
- API Key 管理 UI（从环境变量读取）
- 工具调用展示
- 会话持久化
- 多会话管理
- 代码沙箱

## Decisions

### 1. Agent 引擎集成方式

**决策：** 使用 `@earendil-works/pi-coding-agent` 的 `createAgentSession` 创建会话，通过 `session.promptStream()` 获取流式响应。

**理由：**
- pi-coding-agent 提供高层 SDK，封装了认证、模型注册等细节
- promptStream() 返回 AsyncGenerator，天然支持流式处理
- 与 pi-ai 抽象层无缝集成，支持多 Provider

**替代方案：**
- 直接使用 pi-agent-core：需要手动处理认证和模型注册，复杂度高
- 自建 LLM 调用层：重复造轮子，无法利用 pi-ai 的 20+ Provider 支持

### 2. IPC 通信模式

**决策：** 使用 `ipcMain.handle` + `ipcMain.on` + `webContents.send` 组合。

**理由：**
- `agent:create` 使用 handle（Request/Response 模式）
- `agent:prompt` 使用 on（单向发送，流式响应通过事件返回）
- 符合 Electron IPC 最佳实践

**替代方案：**
- 全部使用 invoke/handle：流式数据需要多次返回，不适合
- 使用 MessagePort：增加复杂度，对 P0 阶段过度设计

### 3. UI 组件库

**决策：** 使用 shadcn/ui + Tailwind CSS。

**理由：**
- shadcn/ui 组件可定制性强，源码直接复制到项目
- Tailwind CSS 原子化样式，开发效率高
- 与 React 生态完美集成

**替代方案：**
- Ant Design：包体积大，定制性受限
- 纯 Tailwind：需要手写所有组件，工作量大

### 4. 状态管理

**决策：** 使用已有的 Zustand store 实现。

**理由：**
- agent-store.ts 已实现完整的状态管理逻辑
- Zustand 轻量、响应式，符合项目技术栈
- 已定义好 AgentState 接口和所有操作方法

### 5. API Key 管理

**决策：** P0 阶段从环境变量读取。

**理由：**
- 简单快速，无需额外 UI 开发
- 符合安全最佳实践（不暴露到渲染进程）
- 后续可通过 electron-store + safeStorage 升级

**替代方案：**
- 配置文件：需要额外的文件读写逻辑
- UI 管理：增加开发工作量，P0 阶段不必要

## Risks / Trade-offs

### 风险 1：pi-mono API 不稳定

**风险：** pi-mono 版本迭代可能导致 API 变化。

**缓解：** 锁定主版本号（^0.78.x），关注 changelog，做好升级准备。

### 风险 2：流式 IPC 性能

**风险：** 高频 chunk 可能导致 IPC 消息堆积。

**缓解：** 实现 chunk 合并逻辑，控制发送频率；后续可优化为 MessagePort。

### 风险 3：LLM API 网络延迟

**风险：** 网络不稳定可能导致流式中断。

**缓解：** 实现错误处理和重试逻辑；UI 显示连接状态。

### 权衡 1：功能完整性 vs 开发速度

**权衡：** P0 阶段跳过模型配置 UI、API Key 管理等功能，优先验证核心链路。

**影响：** 用户需要手动设置环境变量，使用门槛略高。

### 权衡 2：单会话 vs 多会话

**权衡：** P0 阶段仅支持单会话，简化状态管理。

**影响：** 用户无法同时进行多个对话，但降低了实现复杂度。
