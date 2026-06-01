# AI Agent Desktop — 架构与开发文档

> 版本：1.0.0 | 日期：2026-06-01

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 系统架构](#3-系统架构)
- [4. 核心模块设计](#4-核心模块设计)
- [5. IPC 通信协议](#5-ipc-通信协议)
- [6. 前端架构](#6-前端架构)
- [7. 工作流引擎](#7-工作流引擎)
- [8. 多 Agent 协作](#8-多-agent-协作)
- [9. 代码沙箱](#9-代码沙箱)
- [10. 数据持久化](#10-数据持久化)
- [11. 开发指南](#11-开发指南)
- [12. 构建与部署](#12-构建与部署)
- [13. 性能优化](#13-性能优化)
- [14. 安全模型](#14-安全模型)
- [15. 里程碑规划](#15-里程碑规划)

---

## 1. 项目概述

### 1.1 产品定位

基于 pi-mono Agent 引擎的桌面端 AI Agent 平台，支持对话、工具调用、可视化工作流编排、多 Agent 协作和代码生成执行。

### 1.2 核心能力

| 能力 | 说明 |
|------|------|
| 对话交互 | 多轮对话、流式输出、上下文管理 |
| 工具调用 | 文件读写、Shell 执行、HTTP 请求、自定义工具 |
| 工作流编排 | 可视化 DAG 画布、节点拖拽、条件分支 |
| 多 Agent 协作 | 角色定义、任务分发、结果汇聚 |
| 代码生成执行 | 代码编辑、沙箱执行、实时输出 |
| 记忆系统 | 短期会话记忆、长期向量存储 |

### 1.3 目标用户

- 开发者：代码生成、项目脚手架、自动化脚本
- 知识工作者：文档处理、数据分析、报告生成
- AI 爱好者：自定义 Agent、工作流实验

---

## 2. 技术栈

### 2.1 总览

```
┌─────────────────────────────────────────────────────┐
│                    桌面应用                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   前端 UI    │  │  Electron   │  │   pi-mono   │ │
│  │  React + TS  │  │   主进程    │  │  Agent 引擎 │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.2 技术选型明细

| 层级 | 技术 | 版本 | 职责 |
|------|------|------|------|
| 桌面壳 | Electron | ^35.x | 窗口管理、原生能力、IPC 桥接 |
| 前端框架 | React | ^19.x | UI 渲染 |
| 类型系统 | TypeScript | ^5.x | 全栈类型安全 |
| UI 组件 | shadcn/ui | latest | 可定制组件库 |
| CSS | Tailwind CSS | ^4.x | 原子化样式 |
| 工作流画布 | @xyflow/react | ^12.x | 节点式 DAG 编排 |
| 代码编辑器 | Monaco Editor | ^0.5x | 代码编辑、语法高亮 |
| 状态管理 | Zustand | ^5.x | 轻量响应式状态 |
| 动画 | Framer Motion | ^12.x | UI 过渡动画 |
| Agent 引擎 | @mariozechner/pi-coding-agent | ^0.49.x | Agent 运行时 |
| LLM 抽象 | @mariozechner/pi-ai | ^0.49.x | 20+ 模型提供商 |
| 代码沙箱 | Dockerode | ^4.x | Docker 容器管理 |
| 向量存储 | ChromaDB | ^2.x | 本地向量检索 |
| 构建工具 | Vite | ^7.x | 前端构建 |
| 打包 | electron-builder | ^26.x | 应用打包分发 |
| 包管理 | pnpm | ^10.x | Monorepo 管理 |

### 2.3 pi-mono 模块映射

| pi-mono 包 | 版本 | 在本项目中的职责 |
|------------|------|-----------------|
| `@mariozechner/pi-ai` | 0.49.x | 统一 LLM 调用层，对接 OpenAI/Claude/本地模型 |
| `@mariozechner/pi-agent-core` | 0.49.x | Agent 循环、工具执行引擎、消息类型 |
| `@mariozechner/pi-coding-agent` | 0.49.x | Session 管理、认证存储、模型注册 |
| `@mariozechner/pi-tui` | 0.49.x | 不使用（替换为自定义 React UI） |

---

## 3. 系统架构

### 3.1 分层架构

```
┌──────────────────────────────────────────────────────────────┐
│                        渲染进程 (Renderer)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ ChatPanel│ │ Workflow │ │CodeEditor│ │   MonitorPanel   ││
│  │          │ │  Canvas  │ │          │ │                  ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘│
│       └─────────────┴────────────┴────────────────┘          │
│                          Zustand Store                        │
│                            │ IPC Bridge                       │
├────────────────────────────┼─────────────────────────────────┤
│                        主进程 (Main)                           │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │                   IPC Router                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │  │
│  │  │ Agent    │ │ Workflow │ │ Sandbox  │ │  System   │  │  │
│  │  │ Handler  │ │ Handler  │ │ Handler  │ │  Handler  │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │  │
│  └───────┼─────────────┼────────────┼──────────────┼────────┘  │
│          │             │            │              │            │
│  ┌───────▼─────┐ ┌─────▼────┐ ┌────▼─────┐ ┌─────▼─────┐     │
│  │  pi-mono    │ │ Workflow │ │ Docker   │ │  Node.js  │     │
│  │  Agent      │ │ Engine   │ │ Sandbox  │ │  Native   │     │
│  │  Runtime    │ │ (DAG)    │ │          │ │  APIs     │     │
│  └─────────────┘ └──────────┘ └──────────┘ └───────────┘     │
├──────────────────────────────────────────────────────────────┤
│                      持久层                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ SQLite   │ │ ChromaDB │ │  File    │                      │
│  │ (会话/   │ │ (向量    │ │  System  │                      │
│  │  配置)   │ │  存储)   │ │ (项目)   │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 进程模型

```
Electron App
├── 主进程 (1个) — Node.js
│   ├── Agent 运行时 (pi-mono)
│   ├── 工作流引擎
│   ├── 代码沙箱管理
│   ├── 文件系统操作
│   └── IPC 路由
│
├── 渲染进程 (1-N个) — Chromium
│   ├── 主窗口 (聊天 + 工作流 + 编辑器)
│   └── 弹窗窗口 (设置、关于)
│
└── 沙箱进程 (按需) — Docker / child_process
    └── 代码执行环境
```

### 3.3 数据流

```
用户输入
  │
  ▼
React UI ──IPC──▶ Main Process ──▶ pi-mono Agent
  ▲                                    │
  │                                    ▼
  │                              LLM API (流式)
  │                                    │
  │                                    ▼
  └──────IPC (stream)──────── Agent 响应 / 工具调用
                                      │
                                      ▼
                                工具执行 (fs/bash/http)
                                      │
                                      ▼
                                结果返回 → 继续 Agent 循环
```

---

## 4. 核心模块设计

### 4.1 Agent 引擎层

Agent 引擎基于 pi-mono 的三层架构：

```
┌─────────────────────────────────────────┐
│  pi-coding-agent (高层 SDK)              │
│  ┌───────────────────────────────────┐  │
│  │  createAgentSession()             │  │
│  │  SessionManager                   │  │
│  │  AuthStorage                      │  │
│  │  ModelRegistry                    │  │
│  └───────────────────┬───────────────┘  │
├───────────────────────┼─────────────────┤
│  pi-agent-core (运行时)                  │
│  ┌───────────────────▼───────────────┐  │
│  │  Agent 循环                        │  │
│  │  ┌──────┐    ┌──────┐    ┌──────┐│  │
│  │  │Prompt│───▶│ LLM  │───▶│ Tool ││  │
│  │  │      │    │      │    │ Exec ││  │
│  │  └──────┘    └──────┘    └──────┘│  │
│  │      ▲                        │   │  │
│  │      └────────────────────────┘   │  │
│  │  Turn 循环 / 流式输出 / 消息类型   │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  pi-ai (LLM 抽象层)                     │
│  ┌───────────────────────────────────┐  │
│  │  统一 API: streamSimple()         │  │
│  │  Provider: OpenAI / Anthropic /   │  │
│  │           Google / xAI / Groq /   │  │
│  │           Ollama / ...            │  │
│  │  Token 追踪 / 成本计算             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 4.2 Session 管理

```typescript
// src/main/agent/session-manager.ts

interface AgentSessionConfig {
  id: string
  model: { id: string; provider: string }
  systemPrompt?: string
  tools?: Tool[]
  maxTokens?: number
  temperature?: number
}

class AgentSessionManager {
  private sessions: Map<string, AgentSession> = new Map()

  async create(config: AgentSessionConfig): Promise<string> {
    const session = await createAgentSession({
      model: config.model,
      authStorage: this.authStorage,
      modelRegistry: this.modelRegistry,
    })
    this.sessions.set(config.id, session)
    return config.id
  }

  async prompt(sessionId: string, message: string): AsyncGenerator<AgentChunk> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    yield* session.promptStream(message)
  }

  branch(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    const branched = session.branch()
    const newId = `${sessionId}-${Date.now()}`
    this.sessions.set(newId, branched)
    return newId
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
}
```

### 4.3 工具系统

pi-mono 内置 4 个原子工具，通过扩展机制添加自定义工具：

```
内置工具 (pi-mono)
├── read   — 读取文件（支持文本、图片、行范围）
├── write  — 创建/重写文件
├── edit   — 精确修改文件（diff 模式）
└── bash   — 执行 Shell 命令

扩展工具 (自定义)
├── web_search    — 网络搜索
├── http_request  — HTTP 请求
├── db_query      — 数据库查询
├── code_execute  — 沙箱代码执行
├── file_dialog   — 原生文件对话框 (Electron)
└── notification  — 系统通知 (Electron)
```

自定义工具注册方式：

```typescript
// src/main/agent/tools/web-search.ts

interface Tool {
  name: string
  description: string
  parameters: JSONSchema
  execute: (params: Record<string, unknown>) => Promise<ToolResult>
}

const webSearchTool: Tool = {
  name: 'web_search',
  description: '搜索互联网获取实时信息',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      count: { type: 'number', description: '返回结果数量', default: 5 }
    },
    required: ['query']
  },
  execute: async ({ query, count = 5 }) => {
    const results = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${query}&count=${count}`)
    return { type: 'text', content: await results.json() }
  }
}
```

---

## 5. IPC 通信协议

### 5.1 通道设计

所有 IPC 通信通过 Electron 的 `ipcMain` / `ipcRenderer` 实现，采用 `contextBridge` 暴露安全 API。

```
渲染进程                          主进程
   │                                │
   │── invoke('agent:create') ─────▶│  创建会话 (Request/Response)
   │── send('agent:prompt') ───────▶│  发送消息 (单向)
   │◀── on('agent:chunk') ──────────│  流式响应 (事件流)
   │◀── on('agent:tool-call') ──────│  工具调用通知
   │◀── on('agent:done') ───────────│  完成通知
   │◀── on('agent:error') ──────────│  错误通知
   │                                │
   │── invoke('workflow:create') ──▶│  创建工作流
   │── invoke('workflow:execute') ─▶│  执行工作流
   │◀── on('workflow:progress') ────│  执行进度
   │                                │
   │── invoke('sandbox:execute') ──▶│  沙箱执行代码
   │◀── on('sandbox:output') ───────│  实时输出
```

### 5.2 消息类型定义

```typescript
// packages/shared-types/ipc.ts

// Agent 相关
interface AgentCreateRequest {
  sessionId: string
  model: { id: string; provider: string }
  systemPrompt?: string
}

interface AgentChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'error'
  content: string
  metadata?: Record<string, unknown>
}

interface AgentToolCall {
  toolName: string
  parameters: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: unknown
}

// 工作流相关
interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowNode {
  id: string
  type: 'agent' | 'tool' | 'condition' | 'start' | 'end'
  data: Record<string, unknown>
  position: { x: number; y: number }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  condition?: string
}

// 沙箱相关
interface SandboxExecuteRequest {
  code: string
  language: 'javascript' | 'typescript' | 'python' | 'bash'
  timeout?: number
  env?: Record<string, string>
}

interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'exit'
  content: string
  exitCode?: number
}
```

### 5.3 Preload 脚本

```typescript
// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'

const agentAPI = {
  create: (config: AgentCreateRequest) =>
    ipcRenderer.invoke('agent:create', config),

  prompt: (sessionId: string, message: string) =>
    ipcRenderer.send('agent:prompt', { sessionId, message }),

  stop: (sessionId: string) =>
    ipcRenderer.send('agent:stop', sessionId),

  onChunk: (cb: (chunk: AgentChunk) => void) => {
    const handler = (_: unknown, chunk: AgentChunk) => cb(chunk)
    ipcRenderer.on('agent:chunk', handler)
    return () => ipcRenderer.removeListener('agent:chunk', handler)
  },

  onToolCall: (cb: (call: AgentToolCall) => void) => {
    const handler = (_: unknown, call: AgentToolCall) => cb(call)
    ipcRenderer.on('agent:tool-call', handler)
    return () => ipcRenderer.removeListener('agent:tool-call', handler)
  },

  onDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('agent:done', handler)
    return () => ipcRenderer.removeListener('agent:done', handler)
  },

  onError: (cb: (error: string) => void) => {
    const handler = (_: unknown, error: string) => cb(error)
    ipcRenderer.on('agent:error', handler)
    return () => ipcRenderer.removeListener('agent:error', handler)
  },
}

const workflowAPI = {
  create: (def: WorkflowDefinition) =>
    ipcRenderer.invoke('workflow:create', def),

  execute: (id: string, input: Record<string, unknown>) =>
    ipcRenderer.invoke('workflow:execute', id, input),

  onProgress: (cb: (progress: WorkflowProgress) => void) => {
    const handler = (_: unknown, p: WorkflowProgress) => cb(p)
    ipcRenderer.on('workflow:progress', handler)
    return () => ipcRenderer.removeListener('workflow:progress', handler)
  },
}

const sandboxAPI = {
  execute: (req: SandboxExecuteRequest) =>
    ipcRenderer.invoke('sandbox:execute', req),

  onOutput: (cb: (output: SandboxOutput) => void) => {
    const handler = (_: unknown, output: SandboxOutput) => cb(output)
    ipcRenderer.on('sandbox:output', handler)
    return () => ipcRenderer.removeListener('sandbox:output', handler)
  },
}

contextBridge.exposeInMainWorld('api', {
  agent: agentAPI,
  workflow: workflowAPI,
  sandbox: sandboxAPI,
})
```

---

## 6. 前端架构

### 6.1 组件结构

```
src/renderer/src/
├── App.tsx                          # 根组件 + 布局
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx             # 主布局壳
│   │   ├── Sidebar.tsx              # 侧边导航
│   │   ├── StatusBar.tsx            # 底部状态栏
│   │   └── TitleBar.tsx             # 自定义标题栏
│   │
│   ├── chat/
│   │   ├── ChatPanel.tsx            # 聊天主面板
│   │   ├── MessageList.tsx          # 消息列表
│   │   ├── MessageBubble.tsx        # 单条消息
│   │   ├── ToolCallCard.tsx         # 工具调用卡片
│   │   ├── CodeBlock.tsx            # 代码块渲染
│   │   ├── InputBar.tsx             # 输入框
│   │   └── ModelSelector.tsx        # 模型选择器
│   │
│   ├── workflow/
│   │   ├── WorkflowCanvas.tsx       # 工作流画布 (@xyflow/react)
│   │   ├── nodes/
│   │   │   ├── AgentNode.tsx        # Agent 节点
│   │   │   ├── ToolNode.tsx         # 工具节点
│   │   │   ├── ConditionNode.tsx    # 条件分支节点
│   │   │   ├── StartNode.tsx        # 起始节点
│   │   │   └── EndNode.tsx          # 终止节点
│   │   ├── edges/
│   │   │   └── ConditionalEdge.tsx  # 条件连线
│   │   ├── panels/
│   │   │   ├── NodeConfigPanel.tsx  # 节点配置面板
│   │   │   └── WorkflowToolbar.tsx  # 工作流工具栏
│   │   └── WorkflowRunner.tsx       # 运行时状态展示
│   │
│   ├── code-editor/
│   │   ├── EditorPanel.tsx          # 编辑器主面板
│   │   ├── FileTree.tsx             # 文件树
│   │   ├── TabBar.tsx               # 标签栏
│   │   └── TerminalPanel.tsx        # 终端输出
│   │
│   ├── agent-manager/
│   │   ├── AgentList.tsx            # Agent 列表
│   │   ├── AgentConfig.tsx          # Agent 配置
│   │   └── ToolRegistry.tsx         # 工具注册管理
│   │
│   └── monitor/
│       ├── AgentStatus.tsx          # Agent 运行状态
│       ├── TokenUsage.tsx           # Token 消耗统计
│       └── PerformancePanel.tsx     # 性能监控
│
├── stores/
│   ├── agent-store.ts               # Agent 会话状态
│   ├── workflow-store.ts            # 工作流状态
│   ├── editor-store.ts              # 编辑器状态
│   └── settings-store.ts            # 全局设置
│
├── hooks/
│   ├── use-agent.ts                 # Agent 交互 hook
│   ├── use-workflow.ts              # 工作流 hook
│   ├── use-stream.ts                # 流式数据 hook
│   └── use-ipc.ts                   # IPC 通信 hook
│
├── lib/
│   ├── ipc-client.ts                # IPC 客户端封装
│   ├── markdown.ts                  # Markdown 渲染
│   └── theme.ts                     # 主题配置
│
└── types/
    ├── agent.ts                     # Agent 类型
    ├── workflow.ts                  # 工作流类型
    └── global.d.ts                  # 全局类型声明 (window.api)
```

### 6.2 状态管理

使用 Zustand 的 setup store 模式：

```typescript
// src/renderer/src/stores/agent-store.ts

import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCall?: AgentToolCall
  timestamp: number
}

interface AgentState {
  // 会话
  sessions: Map<string, Message[]>
  activeSessionId: string | null
  isGenerating: boolean

  // 模型配置
  currentModel: { id: string; provider: string }

  // 操作
  createSession: () => Promise<string>
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  appendChunk: (chunk: AgentChunk) => void
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  isGenerating: false,
  currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },

  createSession: async () => {
    const id = `session-${Date.now()}`
    await window.api.agent.create({
      sessionId: id,
      model: get().currentModel,
    })
    set(state => {
      const sessions = new Map(state.sessions)
      sessions.set(id, [])
      return { sessions, activeSessionId: id }
    })
    return id
  },

  sendMessage: (content: string) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    // 添加用户消息
    set(state => {
      const sessions = new Map(state.sessions)
      const messages = sessions.get(activeSessionId) || []
      messages.push({
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      })
      sessions.set(activeSessionId, messages)
      return { sessions, isGenerating: true }
    })

    // 发送到主进程
    window.api.agent.prompt(activeSessionId, content)
  },

  appendChunk: (chunk: AgentChunk) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return

    set(state => {
      const sessions = new Map(state.sessions)
      const messages = sessions.get(activeSessionId) || []
      const last = messages[messages.length - 1]

      if (last?.role === 'assistant' && chunk.type === 'text') {
        last.content += chunk.content
      } else {
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: chunk.content,
          timestamp: Date.now(),
        })
      }
      sessions.set(activeSessionId, messages)
      return { sessions }
    })
  },

  stopGeneration: () => {
    const { activeSessionId } = get()
    if (activeSessionId) {
      window.api.agent.stop(activeSessionId)
    }
    set({ isGenerating: false })
  },

  switchSession: (id: string) => {
    set({ activeSessionId: id })
  },
}))
```

### 6.3 布局方案

采用可拖拽的多面板布局：

```
┌──────────────────────────────────────────────────────┐
│  TitleBar (自定义，无系统装饰)                          │
├────────┬─────────────────────────────┬───────────────┤
│        │                             │               │
│        │    主区域 (Tab 切换)         │   侧边面板    │
│ Side   │  ┌─────┬─────┬─────┐       │  (可折叠)     │
│ bar    │  │Chat │Flow │Code │       │               │
│        │  └─────┴─────┴─────┘       │  Agent 列表   │
│ 导航   │                             │  工具面板     │
│ 菜单   │    当前 Tab 内容             │  配置面板     │
│        │                             │               │
│        │                             │               │
├────────┴─────────────────────────────┴───────────────┤
│  StatusBar: 模型 | Token 消耗 | 连接状态 | 版本        │
└──────────────────────────────────────────────────────┘
```

---

## 7. 工作流引擎

### 7.1 节点类型定义

```typescript
// packages/shared-types/workflow.ts

type NodeType = 'start' | 'end' | 'agent' | 'tool' | 'condition' | 'parallel' | 'merge'

interface NodeDefinition {
  type: NodeType
  label: string
  icon: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  configSchema: JSONSchema  // 节点配置的 JSON Schema
}

interface PortDefinition {
  id: string
  name: string
  type: 'string' | 'object' | 'array' | 'any'
  required: boolean
}

// 节点类型注册表
const NODE_REGISTRY: Record<NodeType, NodeDefinition> = {
  start: {
    type: 'start',
    label: '开始',
    icon: 'Play',
    inputs: [],
    outputs: [{ id: 'output', name: '输出', type: 'any', required: true }],
    configSchema: { type: 'object', properties: { input: { type: 'object' } } },
  },
  agent: {
    type: 'agent',
    label: 'Agent',
    icon: 'Bot',
    inputs: [{ id: 'input', name: '输入', type: 'string', required: true }],
    outputs: [
      { id: 'output', name: '输出', type: 'string', required: true },
      { id: 'tool_calls', name: '工具调用', type: 'array', required: false },
    ],
    configSchema: {
      type: 'object',
      properties: {
        model: { type: 'string' },
        systemPrompt: { type: 'string' },
        maxTokens: { type: 'number' },
        temperature: { type: 'number' },
      },
    },
  },
  tool: {
    type: 'tool',
    label: '工具',
    icon: 'Wrench',
    inputs: [{ id: 'input', name: '输入', type: 'any', required: true }],
    outputs: [{ id: 'output', name: '输出', type: 'any', required: true }],
    configSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string' },
        parameters: { type: 'object' },
      },
    },
  },
  condition: {
    type: 'condition',
    label: '条件',
    icon: 'GitBranch',
    inputs: [{ id: 'input', name: '输入', type: 'any', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'any', required: true },
      { id: 'false', name: 'False', type: 'any', required: true },
    ],
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
    },
  },
  // ... parallel, merge, end
}
```

### 7.2 DAG 执行引擎

```typescript
// src/main/workflow/engine.ts

import topologicalSort from './topological-sort'

interface ExecutionContext {
  workflowId: string
  nodeOutputs: Map<string, unknown>
  variables: Map<string, unknown>
  status: Map<string, 'pending' | 'running' | 'success' | 'error'>
}

class WorkflowEngine {
  private agents: AgentSessionManager

  async execute(
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
    onProgress: (progress: WorkflowProgress) => void
  ): Promise<Record<string, unknown>> {
    const context: ExecutionContext = {
      workflowId: workflow.id,
      nodeOutputs: new Map([['start', input]]),
      variables: new Map(Object.entries(input)),
      status: new Map(workflow.nodes.map(n => [n.id, 'pending'])),
    }

    // 拓扑排序确定执行顺序
    const executionOrder = topologicalSort(workflow.nodes, workflow.edges)

    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId)!
      context.status.set(nodeId, 'running')
      onProgress({ nodeId, status: 'running', context })

      try {
        const result = await this.executeNode(node, context)
        context.nodeOutputs.set(nodeId, result)
        context.status.set(nodeId, 'success')
        onProgress({ nodeId, status: 'success', result })
      } catch (error) {
        context.status.set(nodeId, 'error')
        onProgress({ nodeId, status: 'error', error: String(error) })
        throw error
      }
    }

    // 返回终止节点的输出
    const endNode = workflow.nodes.find(n => n.type === 'end')
    return endNode ? context.nodeOutputs.get(endNode.id) as Record<string, unknown> : {}
  }

  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<unknown> {
    // 收集输入：从所有入边的源节点获取输出
    const inputEdges = edges.filter(e => e.target === node.id)
    const inputs = inputEdges.map(e => context.nodeOutputs.get(e.source))

    switch (node.data.type) {
      case 'agent':
        return this.executeAgentNode(node, inputs, context)
      case 'tool':
        return this.executeToolNode(node, inputs, context)
      case 'condition':
        return this.evaluateCondition(node, inputs, context)
      // ...
    }
  }

  private async executeAgentNode(
    node: WorkflowNode,
    inputs: unknown[],
    context: ExecutionContext
  ): Promise<string> {
    const { model, systemPrompt } = node.data.config
    const sessionId = `${context.workflowId}-${node.id}`

    await this.agents.create({
      sessionId,
      model,
      systemPrompt,
    })

    let result = ''
    for await (const chunk of this.agents.prompt(sessionId, String(inputs[0]))) {
      if (chunk.type === 'text') result += chunk.content
    }
    return result
  }
}
```

### 7.3 React Flow 画布集成

```typescript
// src/renderer/src/components/workflow/WorkflowCanvas.tsx

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  start: StartNode,
  end: EndNode,
}

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore()

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

---

## 8. 多 Agent 协作

### 8.1 协作模式

```
模式 1: 顺序管道 (Sequential Pipeline)
┌────────┐    ┌────────┐    ┌────────┐
│ Agent A │───▶│ Agent B │───▶│ Agent C │
│ 研究员  │    │ 分析师  │    │ 写作者  │
└────────┘    └────────┘    └────────┘

模式 2: 并行分发 (Fan-out / Fan-in)
              ┌────────┐
         ┌───▶│ Agent A │───┐
         │    └────────┘    │
┌────────┤    ┌────────┐    ├────▶┌────────┐
│ Router │───▶│ Agent B │───┤     │ Merger │
         │    └────────┘    │     └────────┘
         └───▶│ Agent C │───┘
              └────────┘

模式 3: 辩论式 (Debate)
┌────────┐    ┌────────┐    ┌────────┐
│ Agent A │◀──▶│ Agent B │◀──▶│ Judge  │
│ 正方    │    │ 反方    │    │ 裁判   │
└────────┘    └────────┘    └────────┘

模式 4: 层级委托 (Hierarchical Delegation)
              ┌────────┐
              │ Manager │
              └────┬───┘
         ┌────────┼────────┐
    ┌────▼───┐ ┌──▼────┐ ┌─▼──────┐
    │Worker A│ │Worker B│ │Worker C│
    └────────┘ └───────┘ └────────┘
```

### 8.2 实现方式

多 Agent 协作通过工作流引擎实现，每个 Agent 是工作流中的一个节点：

```typescript
// src/main/agent/multi-agent.ts

interface AgentRole {
  id: string
  name: string
  systemPrompt: string
  model: { id: string; provider: string }
  tools?: string[]  // 允许使用的工具列表
}

class MultiAgentOrchestrator {
  private agents: Map<string, AgentRole> = new Map()

  async sequential(
    roles: AgentRole[],
    initialInput: string,
    onProgress: (agentId: string, output: string) => void
  ): Promise<string> {
    let currentInput = initialInput
    for (const role of roles) {
      const session = await this.createAgent(role)
      let output = ''
      for await (const chunk of session.promptStream(currentInput)) {
        if (chunk.type === 'text') output += chunk.content
      }
      onProgress(role.id, output)
      currentInput = output
    }
    return currentInput
  }

  async parallel(
    roles: AgentRole[],
    input: string,
    merger: AgentRole
  ): Promise<string> {
    // 并行执行所有 Agent
    const results = await Promise.all(
      roles.map(async role => {
        const session = await this.createAgent(role)
        let output = ''
        for await (const chunk of session.promptStream(input)) {
          if (chunk.type === 'text') output += chunk.content
        }
        return { id: role.id, output }
      })
    )

    // 合并结果
    const mergerSession = await this.createAgent(merger)
    const mergedInput = results.map(r => `## ${r.id}\n${r.output}`).join('\n\n')
    let finalOutput = ''
    for await (const chunk of mergerSession.promptStream(mergedInput)) {
      if (chunk.type === 'text') finalOutput += chunk.content
    }
    return finalOutput
  }
}
```

---

## 9. 代码沙箱

### 9.1 执行模式

| 模式 | 隔离级别 | 适用场景 |
|------|---------|---------|
| **child_process** | 低 | 可信脚本、快速执行 |
| **VM2 / isolated-vm** | 中 | 不受信 JS 代码 |
| **Docker 容器** | 高 | 不受信代码、需要特定环境 |
| **E2B 云沙箱** | 最高 | 无需本地 Docker |

### 9.2 Docker 沙箱实现

```typescript
// src/main/sandbox/docker.ts

import Docker from 'dockerode'

class DockerSandbox {
  private docker = new Docker()

  async execute(req: SandboxExecuteRequest): Promise<SandboxResult> {
    const imageMap = {
      javascript: 'node:22-slim',
      typescript: 'node:22-slim',
      python: 'python:3.12-slim',
      bash: 'ubuntu:24.04',
    }

    const container = await this.docker.createContainer({
      Image: imageMap[req.language],
      Cmd: this.buildCommand(req),
      HostConfig: {
        Memory: 256 * 1024 * 1024,     // 256MB 内存限制
        CpuQuota: 50000,                 // 50% CPU 限制
        NetworkMode: 'none',             // 禁用网络
        AutoRemove: true,
        ReadonlyRootfs: true,
        Binds: [`${workDir}:/workspace:ro`],
      },
      Env: Object.entries(req.env || {}).map(([k, v]) => `${k}=${v}`),
      WorkingDir: '/workspace',
      StopTimeout: req.timeout || 30,
    })

    await container.start()

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    })

    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''

      stream.on('data', (chunk: Buffer) => {
        const data = chunk.toString()
        if (data.includes('\x01')) {
          stdout += data.replace(/\x01/g, '')
          this.emit('output', { type: 'stdout', content: data })
        } else {
          stderr += data
          this.emit('output', { type: 'stderr', content: data })
        }
      })

      container.wait().then((result) => {
        resolve({
          stdout,
          stderr,
          exitCode: result.StatusCode,
        })
      })
    })
  }

  private buildCommand(req: SandboxExecuteRequest): string[] {
    switch (req.language) {
      case 'javascript':
        return ['node', '-e', req.code]
      case 'typescript':
        return ['npx', 'tsx', '-e', req.code]
      case 'python':
        return ['python3', '-c', req.code]
      case 'bash':
        return ['bash', '-c', req.code]
    }
  }
}
```

---

## 10. 数据持久化

### 10.1 存储方案

| 数据类型 | 存储方案 | 说明 |
|---------|---------|------|
| 会话记录 | SQLite (better-sqlite3) | 结构化查询、事务支持 |
| Agent 配置 | JSON 文件 (electron-store) | 简单配置项 |
| 向量记忆 | ChromaDB / LanceDB | 本地向量数据库 |
| 工作流定义 | JSON 文件 | 导入/导出友好 |
| 代码文件 | 文件系统 | 直接读写 |

### 10.2 会话存储 Schema

```sql
-- SQLite Schema

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_call JSON,
  token_usage JSON,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_messages_session ON messages(session_id, created_at);

CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition JSON NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 10.3 向量记忆

```typescript
// src/main/memory/vector-store.ts

import { ChromaClient } from 'chromadb'

class MemoryStore {
  private client = new ChromaClient({ path: './data/chroma' })
  private collection: Collection

  async init() {
    this.collection = await this.client.getOrCreateCollection({
      name: 'agent_memory',
      embeddingFunction: new OpenAIEmbeddingFunction({
        modelName: 'text-embedding-3-small',
      }),
    })
  }

  async remember(text: string, metadata: Record<string, unknown>) {
    await this.collection.add({
      ids: [`mem-${Date.now()}`],
      documents: [text],
      metadatas: [metadata],
    })
  }

  async recall(query: string, topK: number = 5): Promise<string[]> {
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: topK,
    })
    return results.documents[0] || []
  }
}
```

---

## 11. 开发指南

### 11.1 项目初始化

```bash
# 使用 pnpm workspace 初始化
mkdir ai-agent && cd ai-agent
pnpm init

# 创建目录结构
mkdir -p src/{main,renderer,preload}
mkdir -p src/renderer/src/{components,stores,hooks,lib,types}
mkdir -p packages/shared-types

# 安装核心依赖
pnpm add react react-dom @xyflow/react @monaco-editor/react zustand framer-motion
pnpm add -D typescript vite @vitejs/plugin-react electron electron-builder

# 安装 pi-mono
pnpm add @mariozechner/pi-ai @mariozechner/pi-agent-core @mariozechner/pi-coding-agent

# 安装 shadcn/ui
pnpm dlx shadcn@latest init
```

### 11.2 package.json

```json
{
  "name": "ai-agent",
  "version": "0.1.0",
  "private": true,
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "dev:renderer": "vite",
    "dev:main": "tsc -p tsconfig.main.json && electron .",
    "build": "vite build && tsc -p tsconfig.main.json",
    "build:app": "electron-builder",
    "lint": "oxlint --fix src",
    "fmt": "oxfmt src",
    "check": "vue-tsc --noEmit",
    "test": "vitest"
  },
  "dependencies": {
    "@mariozechner/pi-ai": "^0.49.0",
    "@mariozechner/pi-agent-core": "^0.49.0",
    "@mariozechner/pi-coding-agent": "^0.49.0",
    "@xyflow/react": "^12.0.0",
    "@monaco-editor/react": "^4.7.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^12.0.0",
    "dockerode": "^4.0.0",
    "better-sqlite3": "^11.0.0",
    "chromadb": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/dockerode": "^3.3.0",
    "electron": "^35.0.0",
    "electron-builder": "^26.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "concurrently": "^9.0.0",
    "oxlint": "^1.0.0",
    "oxfmt": "^0.43.0",
    "vitest": "^4.0.0"
  }
}
```

### 11.3 目录规范

```
命名规则：
├── 组件文件：PascalCase.tsx     (AgentNode.tsx)
├── 工具/库文件：camelCase.ts    (ipcClient.ts)
├── 类型文件：camelCase.ts       (agentTypes.ts)
├── Store 文件：kebab-case.ts    (agent-store.ts)
├── 常量：UPPER_SNAKE_CASE
├── 变量/函数：camelCase
```

### 11.4 开发工作流

```
1. 启动开发环境
   pnpm dev

2. 代码检查
   pnpm lint     # 静态分析
   pnpm fmt      # 格式化
   pnpm check    # 类型检查

3. 运行测试
   pnpm test

4. 构建验证
   pnpm build

5. 打包应用
   pnpm build:app
```

### 11.5 tsconfig 配置

```json
// tsconfig.json (渲染进程)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/renderer/src/*"],
      "@shared/*": ["./packages/shared-types/*"]
    }
  },
  "include": ["src/renderer/src/**/*", "packages/shared-types/**/*"]
}
```

```json
// tsconfig.main.json (主进程)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist/main",
    "rootDir": "src/main",
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/main/**/*", "packages/shared-types/**/*"]
}
```

---

## 12. 构建与部署

### 12.1 electron-builder 配置

```yaml
# electron-builder.yml

appId: com.yourname.ai-agent
productName: AI Agent
directories:
  output: release
  buildResources: build

files:
  - dist/**/*
  - node_modules/**/*
  - '!node_modules/**/{test,tests,__tests__}/**'
  - '!node_modules/**/*.{md,ts,map}'

extraResources:
  - from: data/
    to: data/

mac:
  category: public.app-category.developer-tools
  target:
    - dmg
    - zip
  artifactName: ${name}-${version}-${arch}.${ext}

win:
  target:
    - nsis
    - portable
  artifactName: ${name}-${version}-${arch}.${ext}

linux:
  target:
    - AppImage
    - deb
  category: Development
  artifactName: ${name}-${version}-${arch}.${ext}

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
```

### 12.2 目标平台

| 平台 | 格式 | 说明 |
|------|------|------|
| Windows | NSIS / Portable | 安装包 / 绿色版 |
| macOS | DMG / ZIP | 标准分发 |
| Linux | AppImage / DEB | 通用包 |

### 12.3 自动更新

```typescript
// src/main/updater.ts

import { autoUpdater } from 'electron-updater'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('update-available', (info) => {
  // 通知渲染进程
  mainWindow.webContents.send('update:available', info)
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow.webContents.send('update:progress', progress)
})

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})
```

---

## 13. 性能优化

### 13.1 启动优化

| 手段 | 效果 |
|------|------|
| 延迟加载渲染进程 | 主进程先就绪，再加载 UI |
| 代码分割 (Code Splitting) | 首屏只加载必要代码 |
| Vite 预构建 | 减少开发时冷启动 |
| ASAR 打包 | 减少文件 I/O |

### 13.2 运行时优化

| 手段 | 效果 |
|------|------|
| 流式输出 | 用户立即看到响应，无需等待完整结果 |
| 虚拟滚动 (Virtual Scroll) | 长对话列表性能恒定 |
| Web Worker | Markdown 渲染等重计算移出主线程 |
| 状态最小化 | Zustand selector 精确订阅，避免无关重渲染 |

### 13.3 内存优化

| 手段 | 效果 |
|------|------|
| 会话分页加载 | 历史消息按需加载 |
| 模型懒加载 | Agent 按需创建，用完销毁 |
| 沙箱自动回收 | 执行完立即清理容器 |
| GC 友好 | 避免闭包持有大对象引用 |

---

## 14. 安全模型

### 14.1 Electron 安全最佳实践

```typescript
// src/main/index.ts

// 1. 禁用 nodeIntegration
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, '../preload/index.js'),
  },
})

// 2. 限制 IPC 暴露面
// 只通过 contextBridge 暴露必要的 API
// 不暴露 fs / child_process / net 等原生模块

// 3. CSP 策略
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://api.anthropic.com"
      ],
    },
  })
})
```

### 14.2 代码沙箱安全

| 措施 | 说明 |
|------|------|
| 网络隔离 | Docker 容器 `NetworkMode: 'none'` |
| 内存限制 | 256MB 上限 |
| CPU 限制 | 50% 配额 |
| 只读文件系统 | `ReadonlyRootfs: true` |
| 执行超时 | 默认 30 秒自动终止 |
| 用户确认 | 敏感工具调用前请求用户授权 |

### 14.3 API Key 管理

```typescript
// src/main/secrets.ts

import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store()

export function saveApiKey(provider: string, key: string) {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key)
    store.set(`api-keys.${provider}`, encrypted.toString('base64'))
  } else {
    // 降级：明文存储（不推荐）
    store.set(`api-keys.${provider}`, key)
  }
}

export function getApiKey(provider: string): string | null {
  const stored = store.get(`api-keys.${provider}`) as string
  if (!stored) return null

  if (safeStorage.isEncryptionAvailable()) {
    const buffer = Buffer.from(stored, 'base64')
    return safeStorage.decryptString(buffer)
  }
  return stored
}
```

---

## 15. 里程碑规划

### P0 — 基础可运行 (2 周)

- [ ] Electron + React 项目脚手架
- [ ] pi-mono 集成，单 Agent 对话
- [ ] 流式聊天 UI（消息列表 + 输入框）
- [ ] 模型配置（Provider 切换、API Key 管理）
- [ ] 基础 IPC 通信

### P1 — 工具与代码 (2 周)

- [ ] 工具调用 UI 展示（ToolCallCard）
- [ ] 自定义工具注册系统
- [ ] 代码编辑器集成 (Monaco)
- [ ] 代码沙箱（child_process 模式）
- [ ] Docker 沙箱支持

### P2 — 工作流 (3 周)

- [ ] 工作流画布 (@xyflow/react)
- [ ] 节点类型实现（Agent / Tool / Condition / Start / End）
- [ ] DAG 拓扑排序执行引擎
- [ ] 节点配置面板
- [ ] 运行时状态高亮
- [ ] 工作流导入/导出 (JSON)

### P3 — 多 Agent (2 周)

- [ ] 多 Agent 协作编排（顺序 / 并行 / 辩论 / 层级）
- [ ] Agent 角色管理器
- [ ] 会话分支 (Tree of Thoughts)
- [ ] 向量记忆系统 (ChromaDB)

### P4 — 打磨与发布 (持续)

- [ ] 自定义标题栏 + 侧边导航
- [ ] 暗色/亮色主题
- [ ] 性能优化（虚拟滚动、代码分割）
- [ ] 自动更新
- [ ] 应用打包 (Win / macOS / Linux)
- [ ] 用户文档

---

## 附录

### A. 关键依赖版本锁定

| 依赖 | 版本 | 理由 |
|------|------|------|
| pi-mono | 0.49.x | Agent 核心，锁定主版本 |
| Electron | 35.x | 桌面壳，锁定主版本 |
| React | 19.x | UI 框架，锁定主版本 |
| @xyflow/react | 12.x | 画布，锁定主版本 |
| TypeScript | 5.x | 类型系统 |

### B. 参考项目

| 项目 | 参考价值 |
|------|---------|
| [pi-mono](https://github.com/badlogic/pi-mono) | Agent 引擎实现 |
| [OpenClaw](https://github.com/openclaw) | pi-mono 生产级应用 |
| [VSCode](https://github.com/microsoft/vscode) | Electron 架构最佳实践 |
| [React Flow Examples](https://reactflow.dev/examples) | 工作流画布参考 |
| [ChatGPT-Next-Web](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web) | 聊天 UI 参考 |

### C. 术语表

| 术语 | 定义 |
|------|------|
| Agent | 具备自主决策和工具调用能力的 AI 实体 |
| Turn | Agent 循环中的单次 LLM 调用 + 工具执行 |
| Tool | Agent 可调用的外部能力（文件、Shell、HTTP 等） |
| DAG | 有向无环图，工作流的拓扑结构 |
| Sandbox | 隔离的代码执行环境 |
| Session | 一次连续的 Agent 交互上下文 |
| Sidecar | 伴随主进程运行的辅助进程 |
