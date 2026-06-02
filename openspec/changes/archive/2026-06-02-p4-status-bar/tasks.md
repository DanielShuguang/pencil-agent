## 1. IPC 接口扩展

- [x] 1.1 在 `packages/shared-types/ipc.ts` 添加 `AppAPI` 和 `SettingsAPI.checkConnection` 类型定义
- [x] 1.2 在 `src/preload/index.ts` 添加 `appAPI` 和扩展 `settingsAPI`
- [x] 1.3 在 `src/main/index.ts` 实现 `app:getVersion` 处理器
- [x] 1.4 在 `src/main/agent/ipc-handlers.ts` 实现 `settings:checkConnection` 处理器

## 2. status-store 实现

- [x] 2.1 创建 `src/renderer/src/stores/status-store.ts`，定义 TokenUsage 和 StatusState 接口
- [x] 2.2 实现 `incrementTokenUsage` 和 `resetTokenUsage` 方法
- [x] 2.3 实现 `checkConnection` 方法，调用 IPC 检测 API 连通性
- [x] 2.4 实现 `syncFromAgentStore` 方法，同步 currentModel 和 isGenerating
- [x] 2.5 实现 `init` 方法，获取版本号并启动定期检测

## 3. status-store 测试

- [x] 3.1 创建 `src/renderer/src/stores/__tests__/status-store.test.ts`
- [x] 3.2 测试 Token 累加和重置逻辑
- [x] 3.3 测试连接状态更新逻辑
- [x] 3.4 测试从 agent-store 同步数据

## 4. StatusBar 组件实现

- [x] 4.1 创建 `src/renderer/src/components/layout/StatusBar.tsx` 基础结构
- [x] 4.2 实现 ModelIndicator 子组件，点击打开模型选择器
- [x] 4.3 实现 TokenIndicator 子组件，显示 Token 使用量和详情浮层
- [x] 4.4 实现 ConnectionStatus 子组件，显示连接状态和点击重检
- [x] 4.5 实现 VersionIndicator 子组件，显示版本号

## 5. StatusBar 集成

- [x] 5.1 在 `src/renderer/src/components/layout/AppShell.tsx` 底部添加 StatusBar
- [x] 5.2 在 `agent-store.ts` 的 `appendChunk` 中集成 Token 追踪调用
- [x] 5.3 在应用启动时初始化 status-store

## 6. StatusBar 组件测试

- [x] 6.1 创建 `src/renderer/src/components/layout/__tests__/StatusBar.test.tsx`
- [x] 6.2 测试 StatusBar 渲染所有子组件
- [x] 6.3 测试模型指示器点击交互
- [x] 6.4 测试 Token 指示器显示和详情
- [x] 6.5 测试连接状态显示和点击重检
- [x] 6.6 测试版本号显示

## 7. 集成测试和收尾

- [x] 7.1 运行 `pnpm test:run` 确保所有测试通过
- [x] 7.2 运行 `pnpm typecheck` 确保类型正确
- [x] 7.3 运行 `pnpm lint` 确保代码规范
