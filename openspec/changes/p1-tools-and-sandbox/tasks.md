## 1. 依赖安装与环境准备

- [x] 1.1 安装 `@monaco-editor/react` 依赖
- [x] 1.2 安装 `dockerode` 和 `@types/dockerode` 依赖
- [x] 1.3 更新 `packages/shared-types/ipc.ts`，添加工具和沙箱相关类型定义

## 2. 工具注册系统（ToolRegistry）

- [x] 2.1 创建 `src/main/agent/tool-registry.ts`，实现 ToolRegistry 类
- [x] 2.2 实现 `register` 方法，注册工具定义
- [x] 2.3 实现 `list` 方法，返回所有已注册工具
- [x] 2.4 实现 `get` 方法，按名称获取工具
- [x] 2.5 预注册 pi-mono 内置工具（read, write, edit, bash）
- [x] 2.6 创建 `src/main/agent/ipc-handlers.ts` 中的工具相关 IPC handlers（tool:list）
- [x] 2.7 更新 `src/preload/index.ts`，暴露 `toolAPI`
- [x] 2.8 更新 `src/preload/index.d.ts`，添加 toolAPI 类型声明

## 3. 工具调用 UI 组件

- [x] 3.1 创建 `src/renderer/src/components/chat/ToolCallCard.tsx` 组件
- [x] 3.2 实现 pending 状态显示（工具名、参数、加载指示器）
- [x] 3.3 实现 success 状态显示（结果内容、成功样式）
- [x] 3.4 实现 error 状态显示（错误信息、错误样式）
- [x] 3.5 创建 `src/renderer/src/components/chat/CodeBlock.tsx` 组件
- [x] 3.6 实现代码语法高亮（使用 highlight.js）
- [x] 3.7 更新 `MessageBubble.tsx`，集成 ToolCallCard 和 CodeBlock
- [x] 3.8 更新 `agent-store.ts`，处理 tool_call 和 tool_result 类型的 chunk

## 4. 代码沙箱 - child_process 模式

- [x] 4.1 创建 `src/main/sandbox/child-process.ts`，实现 ChildProcessSandbox 类
- [x] 4.2 实现 `execute` 方法，执行 JavaScript 代码
- [x] 4.3 实现 `execute` 方法，执行 TypeScript 代码（使用 tsx）
- [x] 4.4 实现 `execute` 方法，执行 Python 代码
- [x] 4.5 实现 `execute` 方法，执行 Bash 脚本
- [x] 4.6 实现执行超时控制（默认 30 秒）
- [x] 4.7 实现实时 stdout/stderr 流式输出
- [x] 4.8 实现 `stop` 方法，终止运行中的进程
- [x] 4.9 创建 `src/main/sandbox/ipc-handlers.ts`，注册沙箱相关 IPC handlers
- [x] 4.10 更新 `src/preload/index.ts`，暴露 `sandboxAPI`
- [x] 4.11 更新 `src/preload/index.d.ts`，添加 sandboxAPI 类型声明

## 5. 代码沙箱 - Docker 模式

- [x] 5.1 创建 `src/main/sandbox/docker.ts`，实现 DockerSandbox 类
- [x] 5.2 实现容器创建（网络隔离、内存限制、只读文件系统）
- [x] 5.3 实现多语言代码执行（JS/TS/Python/Bash）
- [x] 5.4 实现实时输出流（stdout/stderr 分离）
- [x] 5.5 实现容器生命周期管理（启动、停止、销毁）
- [x] 5.6 实现 Docker 不可用时优雅降级到 child_process 模式
- [x] 5.7 创建 SandboxExecutor 接口，统一两种沙箱实现

## 6. 终端面板组件

- [x] 6.1 创建 `src/renderer/src/components/code-editor/TerminalPanel.tsx` 组件
- [x] 6.2 实现实时输出显示（stdout/stderr 样式区分）
- [x] 6.3 实现退出码显示（绿色 0 / 红色非 0）
- [x] 6.4 创建 `src/renderer/src/stores/sandbox-store.ts`，管理沙箱状态
- [x] 6.5 实现 sandbox:output 事件监听和状态更新

## 7. Monaco Editor 集成

- [x] 7.1 创建 `src/renderer/src/components/code-editor/EditorPanel.tsx` 组件
- [x] 7.2 实现 Monaco Editor 基础配置（主题、只读模式）
- [x] 7.3 实现 JavaScript/TypeScript 语法高亮
- [x] 7.4 实现 Python 语法高亮
- [x] 7.5 创建 `src/renderer/src/components/code-editor/FileTree.tsx` 组件
- [x] 7.6 实现文件树层级展示
- [x] 7.7 实现文件点击打开功能
- [x] 7.8 创建 `src/renderer/src/components/code-editor/TabBar.tsx` 组件
- [x] 7.9 实现多标签管理（打开、切换、关闭）
- [x] 7.10 创建 `src/renderer/src/stores/editor-store.ts`，管理编辑器状态
- [x] 7.11 实现文件内容与 Agent 工具调用的同步更新

## 8. 布局集成

- [x] 8.1 更新 `AppShell.tsx`，添加代码编辑器面板
- [x] 8.2 实现 Chat/Editor 面板切换（Tab 或分屏）
- [x] 8.3 实现终端面板可折叠/展开
- [x] 8.4 更新主布局，支持多面板拖拽调整大小

## 9. 集成测试

- [x] 9.1 测试 ToolRegistry 工具注册和查询
- [x] 9.2 测试工具调用 UI 渲染（ToolCallCard 各状态）
- [x] 9.3 测试 child_process 沙箱执行各语言代码
- [x] 9.4 测试沙箱超时控制
- [x] 9.5 测试沙箱实时输出流
- [x] 9.6 测试 Monaco Editor 文件打开和编辑
- [x] 9.7 测试文件树与 Agent 工具调用的同步
- [x] 9.8 测试 Docker 沙箱（如果 Docker 可用）
- [x] 9.9 测试 Docker 不可用时的降级行为

## 10. 文档和清理

- [x] 10.1 更新 README.md，添加工具和沙箱使用说明
- [x] 10.2 添加 Monaco Editor 配置说明
- [x] 10.3 添加 Docker 沙箱配置说明
- [x] 10.4 清理未使用的代码和文件
