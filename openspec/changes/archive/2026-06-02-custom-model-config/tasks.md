## 1. 类型定义和 IPC 接口

- [x] 1.1 在 `packages/shared-types/ipc.ts` 添加 `ModelProvider` 和 `ModelConfig` 类型定义
- [x] 1.2 在 `packages/shared-types/ipc.ts` 添加 `ModelConfigAPI` 接口定义
- [x] 1.3 在 `src/preload/index.ts` 添加 `modelConfigAPI` 桥接方法
- [x] 1.4 在 `src/renderer/src/types/global.d.ts` 更新类型定义

## 2. 主进程实现

- [x] 2.1 在 `src/main/agent/ipc-handlers.ts` 实现 `model-config:list` 处理器
- [x] 2.2 在 `src/main/agent/ipc-handlers.ts` 实现 `model-config:save` 处理器
- [x] 2.3 在 `src/main/agent/ipc-handlers.ts` 实现 `model-config:delete` 处理器
- [x] 2.4 在 `src/main/agent/ipc-handlers.ts` 实现 `model-config:test-connection` 处理器
- [x] 2.5 在 `src/main/agent/model-config.ts` 创建 `ModelConfigManager` 类

## 3. 前端 Store

- [x] 3.1 创建 `src/renderer/src/stores/model-config-store.ts`
- [x] 3.2 实现 `fetchProviders` 方法
- [x] 3.3 实现 `saveProvider` 方法
- [x] 3.4 实现 `deleteProvider` 方法
- [x] 3.5 实现 `saveModel` 方法
- [x] 3.6 实现 `deleteModel` 方法

## 4. 前端组件

- [x] 4.1 创建 `src/renderer/src/components/settings/ModelConfigPanel.tsx`
- [x] 4.2 创建 `src/renderer/src/components/settings/ProviderForm.tsx`
- [x] 4.3 创建 `src/renderer/src/components/settings/ModelForm.tsx`
- [x] 4.4 更新 `src/renderer/src/components/settings/SettingsDialog.tsx` 添加模型配置标签
- [x] 4.5 更新 `src/renderer/src/components/chat/ModelSelector.tsx` 动态加载模型列表

## 5. 测试

- [x] 5.1 创建 `src/main/agent/__tests__/model-config.test.ts`
- [x] 5.2 创建 `src/renderer/src/stores/__tests__/model-config-store.test.ts`
- [x] 5.3 创建 `src/renderer/src/components/settings/__tests__/ModelConfigPanel.test.tsx`

## 6. 集成测试和收尾

- [x] 6.1 运行 `pnpm test:run` 确保所有测试通过
- [x] 6.2 运行 `pnpm typecheck` 确保类型正确
- [x] 6.3 运行 `pnpm lint` 确保代码规范
