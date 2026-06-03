## Why

随着应用功能增加（多会话、工作流、模型配置、主题系统），渲染性能和内存占用成为瓶颈：
- 长对话场景下消息列表渲染卡顿（50+ 消息时明显）
- 工作流画布节点数量多时交互延迟
- 首次加载体积过大，启动时间长
- 内存占用随使用时间增长，长时间使用后卡顿

## What Changes

- **虚拟滚动**：消息列表使用虚拟滚动，只渲染可见区域，支持万级消息流畅滚动
- **代码分割**：按功能模块懒加载，减少首屏加载时间 50%+
- **内存优化**：会话数据清理、组件卸载时释放资源、限制历史消息数量
- **渲染优化**：React.memo、useMemo、useCallback 减少不必要重渲染
- **构建优化**：Tree-shaking、压缩、资源优化

## Capabilities

### New Capabilities
- `virtual-scrolling`: 消息列表虚拟滚动，支持长对话流畅渲染
- `code-splitting`: 按功能模块懒加载，优化首屏加载时间
- `memory-management`: 会话数据生命周期管理，防止内存泄漏

### Modified Capabilities
- `chat-ui`: 消息列表使用虚拟滚动，滚动行为变更

## Impact

- **前端组件**：ChatPanel、MessageList、WorkflowCanvas 需要优化
- **构建配置**：Vite 配置需要添加代码分割策略
- **状态管理**：会话数据存储策略优化
- **测试**：需要添加性能基准测试
