## 1. 共享类型定义

- [x] 1.1 更新 `packages/shared-types/ipc.ts`，补充 `NodeDefinition`、`PortDefinition` 类型
- [x] 1.2 更新 `packages/shared-types/ipc.ts`，补充 `NODE_REGISTRY` 常量
- [x] 1.3 添加 `packages/shared-types/workflow.ts`，定义工作流专用类型

## 2. DAG 执行引擎

- [x] 2.1 创建 `src/main/workflow/topological-sort.ts`，实现 Kahn's Algorithm
- [x] 2.2 实现环检测，有向图存在环时抛出错误
- [x] 2.3 创建 `src/main/workflow/engine.ts`，实现 WorkflowEngine 类
- [x] 2.4 实现 `execute` 方法，按拓扑顺序执行节点
- [x] 2.5 实现 `executeAgentNode`，调用 AgentSessionManager
- [x] 2.6 实现 `executeToolNode`，调用 ToolRegistry
- [x] 2.7 实现 `evaluateCondition`，执行条件表达式
- [x] 2.8 实现上下文传递（nodeOutputs、variables）
- [x] 2.9 创建 `src/main/workflow/ipc-handlers.ts`，注册工作流 IPC handlers
- [x] 2.10 更新 `src/main/index.ts`，导入并注册工作流 handlers

## 3. Preload 桥接

- [x] 3.1 更新 `src/preload/index.ts`，暴露 `workflowAPI`
- [x] 3.2 实现 `execute` 方法（invoke）
- [x] 3.3 实现 `save` 方法（invoke）
- [x] 3.4 实现 `load` 方法（invoke）
- [x] 3.5 实现 `onProgress` 事件监听
- [x] 3.6 更新 `src/preload/index.d.ts`，添加 workflowAPI 类型声明

## 4. 工作流 Store

- [x] 4.1 创建 `src/renderer/src/stores/workflow-store.ts`
- [x] 4.2 实现 nodes 和 edges 状态管理
- [x] 4.3 实现 `onNodesChange` 和 `onEdgesChange` 回调
- [x] 4.4 实现 `onConnect` 回调（新连线）
- [x] 4.5 实现 `addNode` 和 `removeNode` 方法
- [x] 4.6 实现 `selectedNodeId` 状态
- [x] 4.7 实现执行状态跟踪（nodeStatus Map）

## 5. 工作流节点组件

- [x] 5.1 创建 `src/renderer/src/components/workflow/nodes/StartNode.tsx`
- [x] 5.2 创建 `src/renderer/src/components/workflow/nodes/EndNode.tsx`
- [x] 5.3 创建 `src/renderer/src/components/workflow/nodes/AgentNode.tsx`
- [x] 5.4 创建 `src/renderer/src/components/workflow/nodes/ToolNode.tsx`
- [x] 5.5 创建 `src/renderer/src/components/workflow/nodes/ConditionNode.tsx`
- [x] 5.6 实现节点状态样式（pending/running/success/error）
- [x] 5.7 实现节点选中高亮

## 6. 工作流画布

- [x] 6.1 创建 `src/renderer/src/components/workflow/WorkflowCanvas.tsx`
- [x] 6.2 集成 ReactFlow 组件，配置 nodeTypes
- [x] 6.3 实现 Background 网格
- [x] 6.4 实现 MiniMap
- [x] 6.5 实现 Controls 控制按钮
- [x] 6.6 实现节点拖拽添加
- [x] 6.7 实现连线交互
- [x] 6.8 实现节点/边删除（Delete 键）

## 7. 节点配置面板

- [x] 7.1 创建 `src/renderer/src/components/workflow/panels/NodeConfigPanel.tsx`
- [x] 7.2 实现 Agent 节点配置表单（模型、systemPrompt、temperature）
- [x] 7.3 实现 Tool 节点配置表单（工具选择、参数）
- [x] 7.4 实现 Condition 节点配置表单（表达式）
- [x] 7.5 实现配置变更同步到 workflow-store

## 8. 工作流工具栏

- [x] 8.1 创建 `src/renderer/src/components/workflow/WorkflowToolbar.tsx`
- [x] 8.2 实现执行按钮（验证 + 触发执行）
- [x] 8.3 实现保存按钮（文件对话框导出 JSON）
- [x] 8.4 实现加载按钮（文件对话框导入 JSON）
- [x] 8.5 实现清空画布按钮

## 9. 布局集成

- [x] 9.1 更新 `AppShell.tsx`，添加 Workflow Tab
- [x] 9.2 实现 Chat/Editor/Workflow 三 Tab 切换
- [x] 9.3 更新标题栏 Tab 样式

## 10. 集成测试

- [x] 10.1 测试拓扑排序算法（正常图、环检测）
- [x] 10.2 测试 WorkflowEngine 执行简单工作流
- [x] 10.3 测试 WorkflowEngine 条件分支
- [x] 10.4 测试 workflow-store 状态管理
- [x] 10.5 测试节点组件渲染
- [x] 10.6 测试配置面板交互
- [x] 10.7 测试导入/导出功能

## 11. 文档和清理

- [x] 11.1 更新 README.md，添加工作流使用说明
- [x] 11.2 清理未使用的代码和文件
