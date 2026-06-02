## Why

P2 工作流引擎已完成单 Agent 执行，但缺乏多 Agent 协作能力和长期记忆。用户需要多个 Agent 分工协作（如研究员+分析师+写作者），以及跨会话的知识记忆，才能完成复杂任务。

## What Changes

- **多 Agent 协作编排**: 支持顺序管道、并行分发、辩论式、层级委托 4 种协作模式
- **Agent 角色管理器**: 定义不同角色（系统提示、模型、工具限制），保存为角色模板
- **会话分支 (Tree of Thoughts)**: 从任意节点分叉对话，探索多条推理路径
- **向量记忆系统 (ChromaDB)**: 长期记忆存储与检索，支持语义搜索

## Capabilities

### New Capabilities

- `multi-agent-orchestrator`: 多 Agent 协作编排引擎（顺序/并行/辩论/层级）
- `agent-role-manager`: Agent 角色定义与管理（角色模板 CRUD）
- `session-branching`: 会话分支功能（Tree of Thoughts）
- `vector-memory`: 向量记忆系统（ChromaDB 集成，记忆存储/检索）

### Modified Capabilities

- `workflow-engine`: 扩展支持多 Agent 节点并行执行和结果汇聚
- `agent-session`: 扩展支持角色配置和会话分支

## Impact

### 代码影响

- `src/main/agent/` — 新增 multi-agent.ts（编排器）、role-manager.ts（角色管理）
- `src/main/memory/` — 新增 vector-store.ts（ChromaDB 集成）
- `src/main/workflow/engine.ts` — 扩展支持并行执行
- `src/renderer/src/stores/` — 新增 role-store.ts、memory-store.ts
- `src/renderer/src/components/` — 新增角色管理 UI、记忆面板
- `src/preload/index.ts` — 添加角色和记忆相关 IPC

### 依赖影响

- `chromadb` — 向量数据库（已安装）
- `@xenova/transformers` — 本地嵌入模型（可选，替代 OpenAI embeddings）

### 安全影响

- ChromaDB 本地运行，无外部网络依赖
- 角色模板存储在本地
