## Context

P0/P1 已实现 Agent 对话、工具调用、代码沙箱、Monaco Editor。用户需要更高级的任务编排能力——通过可视化画布构建多步骤工作流，实现复杂任务自动化。

**现有架构**：
- 主进程：AgentSessionManager、ToolRegistry、SandboxExecutor
- 渲染进程：ChatPanel、EditorPanel、AppShell（Chat/Editor Tab）
- 通信：agent:*、tool:*、sandbox:*、window:* IPC 通道

**约束**：
- @xyflow/react 已安装
- WorkflowDefinition/WorkflowNode/WorkflowEdge 类型已定义在 shared-types/ipc.ts
- Electron 安全模型：contextIsolation: true

## Goals / Non-Goals

**Goals:**
- 实现可视化 DAG 工作流画布，支持节点拖拽和连线
- 实现 5 种节点类型（Start/End/Agent/Tool/Condition）
- 实现 DAG 拓扑排序执行引擎
- 实现节点配置面板
- 实现运行时状态高亮
- 实现工作流导入/导出

**Non-Goals:**
- 不实现并行执行节点（P2 只做顺序 + 条件分支）
- 不实现节点分组/子流程
- 不实现工作流版本管理
- 不实现工作流调度（定时执行）

## Decisions

### 1. 画布与引擎分离

**选择**：渲染进程负责画布交互，主进程负责执行引擎

**理由**：
- 画布是纯 UI 交互，不需要 Node.js 能力
- 执行引擎需要调用 Agent/Tool/Sandbox，必须在主进程
- 通过 IPC 通信，职责清晰

### 2. 拓扑排序算法

**选择**：Kahn's Algorithm（BFS 拓扑排序）

**理由**：
- 可以同时检测环（有向无环图验证）
- 实现简单，时间复杂度 O(V+E)
- 天然支持并行执行扩展（同一层级可并行）

### 3. 节点组件架构

**选择**：每种节点类型一个独立组件，通过 nodeTypes 注册到 ReactFlow

**理由**：
- @xyflow/react 推荐方式
- 节点类型之间互不影响，易于扩展
- 可以复用 shadcn/ui 组件

### 4. 状态管理

**选择**：Zustand workflow-store 管理画布状态（nodes、edges），执行状态通过 workflow:progress 事件更新

**理由**：
- 与现有 agent-store、editor-store 模式一致
- @xyflow/react 提供 useNodesState/useEdgesState hooks，但 Zustand 更统一
- 执行状态是异步的，适合事件驱动

### 5. 配置面板集成

**选择**：右侧面板，根据选中节点类型动态渲染

**理由**：
- 与 EditorPanel 的 FileTree 面板位置一致
- 选中节点时自动打开配置面板
- 未选中时显示工作流属性

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| @xyflow/react 学习曲线 | 开发效率 | 参考官方 examples，先实现基础功能 |
| 环检测 | 死循环 | 拓扑排序时检测环，报错提示 |
| 大规模工作流性能 | 画布卡顿 | 虚拟化渲染、节点懒加载 |
| 执行中断恢复 | 状态丢失 | 持久化执行上下文 |

## Open Questions

1. **条件表达式语法**：使用 JavaScript 表达式还是自定义 DSL？
2. **节点间数据格式**：统一使用 JSON 还是支持多种类型？
3. **执行历史**：是否需要保存每次执行的输入/输出？
