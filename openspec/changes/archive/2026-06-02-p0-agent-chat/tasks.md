## 1. 环境准备

- [x] 1.1 安装 shadcn/ui 初始化
- [x] 1.2 安装 Tailwind CSS 及相关依赖
- [x] 1.3 安装 shadcn/ui 组件（Button, Input, ScrollArea）
- [x] 1.4 配置 Tailwind CSS 和 shadcn/ui

## 2. 主进程 Agent 引擎集成

- [x] 2.1 创建 `src/main/agent/session-manager.ts`，实现 AgentSessionManager 类
- [x] 2.2 实现 `create` 方法，使用 `createAgentSession` 创建会话
- [x] 2.3 实现 `prompt` 方法，使用 `session.promptStream()` 流式返回响应
- [x] 2.4 实现 `stop` 方法，中止正在进行的生成
- [x] 2.5 实现 `destroy` 方法，销毁会话并释放资源
- [x] 2.6 创建 `src/main/agent/ipc-handlers.ts`，注册 IPC handlers
- [x] 2.7 更新 `src/main/index.ts`，导入并注册 IPC handlers

## 3. 预加载脚本更新

- [x] 3.1 更新 `src/preload/index.ts`，暴露 agent API
- [x] 3.2 实现 `create` 方法（invoke/handle）
- [x] 3.3 实现 `prompt` 方法（send/on）
- [x] 3.4 实现 `stop` 方法（send/on）
- [x] 3.5 实现 `onChunk`、`onDone`、`onError` 事件监听
- [x] 3.6 更新 `src/preload/index.d.ts`，添加类型声明

## 4. 渲染进程 Store 更新

- [x] 4.1 确认 `src/renderer/src/stores/agent-store.ts` 实现正确
- [x] 4.2 更新 `src/renderer/src/lib/ipc-client.ts`，实现完整的 listener 注册
- [x] 4.3 在 `src/renderer/src/main.tsx` 中初始化 IPC listeners

## 5. 聊天 UI 组件实现

- [x] 5.1 创建 `src/renderer/src/components/layout/AppShell.tsx`，实现主布局
- [x] 5.2 创建 `src/renderer/src/components/chat/ChatPanel.tsx`，实现聊天主面板
- [x] 5.3 创建 `src/renderer/src/components/chat/MessageList.tsx`，实现消息列表
- [x] 5.4 创建 `src/renderer/src/components/chat/MessageBubble.tsx`，实现消息气泡
- [x] 5.5 创建 `src/renderer/src/components/chat/InputBar.tsx`，实现输入框
- [x] 5.6 更新 `src/renderer/src/App.tsx`，使用 AppShell 布局

## 6. 样式和主题

- [x] 6.1 配置 Tailwind CSS 暗色主题
- [x] 6.2 实现消息气泡样式（用户右对齐，助手左对齐）
- [x] 6.3 实现输入框样式和交互状态
- [x] 6.4 实现自动滚动到底部

## 7. 集成测试

- [x] 7.1 测试 Agent 会话创建
- [x] 7.2 测试消息发送和流式响应
- [x] 7.3 测试停止生成功能
- [x] 7.4 测试多轮对话
- [x] 7.5 测试错误处理（无效 API Key、网络错误等）

## 8. 文档和清理

- [x] 8.1 更新 README.md，添加使用说明
- [x] 8.2 添加环境变量配置说明
- [x] 8.3 清理未使用的代码和文件
