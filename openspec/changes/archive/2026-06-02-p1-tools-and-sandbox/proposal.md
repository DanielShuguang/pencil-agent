## Why

P0 已实现基础对话功能，但 Agent 无法执行实际操作（读写文件、运行代码）。P1 让 Agent 具备"动手能力"——通过工具调用与外部世界交互，并提供安全的代码执行环境。这是从"聊天机器人"到"AI 助手"的关键跃迁。

## What Changes

- **工具调用 UI**：在消息气泡中展示工具调用卡片（ToolCallCard），显示工具名、参数、执行状态和结果，支持代码高亮
- **工具注册系统**：主进程 ToolRegistry 管理内置和自定义工具，暴露 IPC 通道供渲染进程查询和配置
- **代码编辑器**：集成 Monaco Editor，支持文件树浏览、多标签编辑、语法高亮
- **代码沙箱**：实现 child_process 模式（低隔离快速执行）和 Docker 模式（高隔离安全执行），支持 JS/TS/Python/Bash
- **终端面板**：实时展示沙箱执行输出，支持流式 stdout/stderr

## Capabilities

### New Capabilities
- `tool-system`: 工具注册、查询、配置系统（ToolRegistry + IPC + UI）
- `code-sandbox`: 代码执行沙箱（child_process + Docker），支持多语言、资源限制、实时输出
- `code-editor`: Monaco Editor 集成，文件树、多标签编辑、终端面板

### Modified Capabilities
- `chat-ui`: 消息气泡需集成 ToolCallCard 和 CodeBlock 组件，展示工具调用过程和代码块
- `agent-session`: Agent 创建时需关联可用工具列表，工具调用事件需正确传递到渲染进程

## Impact

- **新增依赖**：`@monaco-editor/react`、`dockerode`、`@types/dockerode`
- **主进程新增模块**：`src/main/agent/tool-registry.ts`、`src/main/sandbox/child-process.ts`、`src/main/sandbox/docker.ts`
- **渲染进程新增组件**：`ToolCallCard`、`CodeBlock`、`EditorPanel`、`FileTree`、`TabBar`、`TerminalPanel`
- **IPC 新增通道**：`tool:list`、`tool:register`、`sandbox:execute`、`sandbox:output`、`sandbox:stop`
- **Preload 新增 API**：`toolAPI`、`sandboxAPI`
- **安全影响**：Docker 沙箱需网络隔离、内存限制、只读文件系统；child_process 需超时控制
