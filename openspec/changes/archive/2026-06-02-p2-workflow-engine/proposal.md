## Why

P0 和 P1 已实现单 Agent 对话和工具调用，但用户只能通过聊天界面与 Agent 交互。P2 引入可视化工作流编排，让用户可以通过拖拽节点、连线的方式构建复杂的多步骤任务流程，实现"一次设计，重复执行"的自动化能力。

## What Changes

- **工作流画布**：基于 @xyflow/react 的可视化 DAG 画布，支持节点拖拽、连线、缩放、平移
- **节点类型**：5 种节点（Start、End、Agent、Tool、Condition），每种节点有独立的输入/输出端口和配置
- **DAG 执行引擎**：主进程拓扑排序执行，支持顺序执行、条件分支、上下文传递
- **节点配置面板**：侧边面板，根据节点类型动态渲染配置表单
- **运行时状态高亮**：节点执行状态实时显示（pending/running/success/error）
- **导入/导出**：工作流定义 JSON 导入/导出，支持文件对话框

## Capabilities

### New Capabilities
- `workflow-canvas`: 工作流画布组件，节点拖拽、连线、缩放、背景网格、小地图
- `workflow-engine`: DAG 执行引擎，拓扑排序、节点执行调度、上下文传递
- `workflow-nodes`: 5 种节点类型实现（Start/End/Agent/Tool/Condition），独立组件和配置
- `workflow-panels`: 节点配置面板，动态表单、工具选择、表达式编辑

### Modified Capabilities
- `chat-ui`: AppShell 需添加 Workflow Tab 切换（Chat/Editor/Workflow 三 Tab）

## Impact

- **新增依赖**：`@xyflow/react`（已安装）
- **主进程新增模块**：`src/main/workflow/engine.ts`、`src/main/workflow/topological-sort.ts`、`src/main/workflow/ipc-handlers.ts`
- **渲染进程新增组件**：`WorkflowCanvas`、5 种节点组件、`NodeConfigPanel`、`WorkflowToolbar`
- **渲染进程新增 Store**：`workflow-store.ts`（节点/边状态管理）
- **IPC 新增通道**：`workflow:create`、`workflow:execute`、`workflow:progress`、`workflow:save`、`workflow:load`
- **Preload 新增 API**：`workflowAPI`
- **布局变更**：AppShell 标题栏添加 Workflow Tab
