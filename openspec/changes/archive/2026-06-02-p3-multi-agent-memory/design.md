## Context

P2 完成了单 Agent 工作流引擎，但用户需要更复杂的多 Agent 协作场景：
- 研究员 Agent 搜索信息 → 分析师 Agent 处理数据 → 写作者 Agent 生成报告
- 多个 Agent 并行处理不同子任务，最后合并结果
- Agent 之间辩论式交互，最终达成共识

当前架构：
- WorkflowEngine 按拓扑顺序串行执行节点
- AgentSessionManager 管理单个 Agent 会话
- 无长期记忆能力

## Goals / Non-Goals

**Goals:**
- 实现 4 种多 Agent 协作模式（顺序/并行/辩论/层级）
- 提供 Agent 角色管理 UI（创建/编辑/删除角色模板）
- 支持会话分支（从任意消息分叉，探索多条路径）
- 集成 ChromaDB 向量记忆（存储/检索/语义搜索）

**Non-Goals:**
- 不做 Agent 自动调度（用户手动编排）
- 不做跨机器协作
- 不做实时语音/视频交互
- 不做 Agent 市场/共享平台

## Decisions

### 1. 多 Agent 编排基于 WorkflowEngine 扩展

**选择**: 扩展现有 WorkflowEngine，添加并行执行和结果汇聚

**替代方案**:
- 新建独立的 MultiAgentEngine：增加代码复杂度
- 使用外部编排框架（如 LangGraph）：增加依赖

**理由**: WorkflowEngine 已有 DAG 执行基础，扩展而非重建

### 2. ChromaDB 本地部署

**选择**: ChromaDB 本地运行，使用默认嵌入函数

**替代方案**:
- OpenAI Embeddings API：需要网络和 API Key
- @xenova/transformers 本地嵌入：增加包体积

**理由**: ChromaDB 默认嵌入足够用，无需额外依赖

### 3. 角色模板存储在 JSON 文件

**选择**: 角色模板存储在 app data 目录的 JSON 文件

**替代方案**:
- SQLite：过度设计
- localStorage：不适合主进程访问

**理由**: 角色模板数据量小，JSON 文件足够，便于导入导出

### 4. 会话分支使用 Git-like 模型

**选择**: 每个分支是独立的消息链，共享分支点之前的消息

**替代方案**:
- 复制整个会话：浪费存储
- 使用树形结构：复杂度高

**理由**: Git-like 模型直观，用户熟悉，实现简单

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 并行执行资源消耗大 | 限制最大并行数（默认 3） |
| ChromaDB 启动慢 | 延迟初始化，首次使用时启动 |
| 会话分支导致数据膨胀 | 限制分支深度（默认 10 层） |
| 辩论模式可能无限循环 | 设置最大轮次（默认 5 轮） |

## Architecture Changes

### 新增模块

```
src/main/
├── agent/
│   ├── multi-agent.ts        # 多 Agent 编排器
│   └── role-manager.ts       # 角色模板管理
├── memory/
│   └── vector-store.ts       # ChromaDB 向量存储

src/renderer/src/
├── stores/
│   ├── role-store.ts         # 角色模板状态
│   └── memory-store.ts       # 记忆状态
├── components/
│   ├── role-manager/
│   │   ├── RoleList.tsx      # 角色列表
│   │   ├── RoleEditor.tsx    # 角色编辑器
│   │   └── RoleSelector.tsx  # 角色选择器
│   └── memory/
│       ├── MemoryPanel.tsx   # 记忆面板
│       └── MemorySearch.tsx  # 记忆搜索
```

### IPC 通道变更

```
新增:
  role:list          — 获取角色列表
  role:create        — 创建角色
  role:update        — 更新角色
  role:delete        — 删除角色
  
  memory:store       — 存储记忆
  memory:recall      — 检索记忆
  memory:search      — 语义搜索
  
  agent:branch       — 创建会话分支
  agent:merge-branches — 合并分支结果
```

### 数据模型

```typescript
// Agent 角色
interface AgentRole {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: { id: string; provider: string }
  tools: string[]  // 允许使用的工具列表
  createdAt: number
  updatedAt: number
}

// 记忆条目
interface MemoryEntry {
  id: string
  content: string
  metadata: {
    sessionId: string
    role: string
    timestamp: number
    tags: string[]
  }
  score?: number  // 相似度分数
}

// 会话分支
interface SessionBranch {
  id: string
  parentSessionId: string
  branchPointMessageId: string
  messages: Message[]
  createdAt: number
}
```
