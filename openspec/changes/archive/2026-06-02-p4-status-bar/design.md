## Context

当前 Pencil Agent 应用缺少底部状态栏，用户无法直观获取关键运行时信息。根据架构文档 §6.1，StatusBar 应显示模型名称、Token 消耗、连接状态和版本号。现有代码结构中，这些数据分散在不同 store 和 IPC 接口中。

## Goals / Non-Goals

**Goals:**
- 提供统一的状态栏组件，显示关键运行时信息
- 支持点击交互（模型切换、Token 详情、连接重检）
- 通过专用 status-store 聚合多维度状态数据
- Token 使用量实时追踪
- LLM API 连接状态定期检测

**Non-Goals:**
- 不实现复杂的 Token 成本计算
- 不实现网络代理状态检测
- 不实现多语言国际化
- 不实现状态栏自定义配置

## Decisions

### 1. 使用专用 status-store 聚合数据

**决策**: 创建 `status-store.ts` 聚合来自 agent-store、settings-store 和 IPC 的数据。

**替代方案**:
- 方案 A: StatusBar 直接读取多个 store → 数据流混乱，难以维护
- 方案 C: 主进程追踪 Token → 改动大，需修改 session-manager

**理由**: 专用 store 职责清晰，易于测试和扩展，符合 Zustand 最佳实践。

### 2. Token 追踪在渲染进程完成

**决策**: 在 agent-store 的 `appendChunk` 中，从 chunk 元数据提取 tokenUsage 并调用 status-store 更新。

**替代方案**:
- 主进程追踪 → 需要修改 pi-mono 集成层
- 定期轮询 → 延迟高，不实时

**理由**: pi-mono 的 chunk 已包含 tokenUsage 元数据，渲染进程直接读取最简单。

### 3. 连接检测使用轻量级 API 请求

**决策**: 调用 `settings:checkConnection` 发送轻量级请求测试 API 连通性。

**替代方案**:
- WebSocket 长连接 → 实现复杂
- ping 服务器 → 无法检测 API 级别连通性

**理由**: 直接测试 LLM API 端点最准确，5 秒超时避免阻塞。

### 4. 版本号从 package.json 读取

**决策**: 通过 IPC 调用 `app:getVersion` 从主进程获取版本号。

**替代方案**:
- 渲染进程直接读取文件 → 安全限制
- 硬编码版本号 → 维护成本高

**理由**: Electron 的 `app.getVersion()` 是标准做法，安全可靠。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Token 元数据格式变化 | 添加类型检查，缺失时跳过更新 |
| 连接检测频繁导致性能问题 | 60 秒间隔，可配置 |
| 多会话并行生成时 Token 统计不准确 | 按会话累计，切换时重置 |
| API 端点不可达导致检测失败 | 5 秒超时，显示 'disconnected'，不阻塞 UI |
