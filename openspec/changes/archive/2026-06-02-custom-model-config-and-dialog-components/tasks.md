## 1. 类型定义和依赖

- [x] 1.1 在 `packages/shared-types/ipc.ts` 的 `ModelProvider` 类型中添加 `apiFormat: 'openai' | 'anthropic'` 字段
- [x] 1.2 安装 `@radix-ui/react-dialog` 和 `@radix-ui/react-alert-dialog` 依赖

## 2. UI 组件

- [x] 2.1 创建 `src/renderer/src/components/ui/dialog.tsx` 组件（基于 shadcn/ui 模式）
- [x] 2.2 创建 `src/renderer/src/components/ui/alert-dialog.tsx` 组件（基于 shadcn/ui 模式）
- [x] 2.3 为 Dialog 和 AlertDialog 组件编写单元测试

## 3. 后端连接测试

- [x] 3.1 修改 `src/main/agent/model-config.ts` 的 `testConnection()` 方法，根据 `apiFormat` 使用不同的端点和认证方式
- [x] 3.2 编写 OpenAI 格式连接测试的单元测试
- [x] 3.3 编写 Anthropic 格式连接测试的单元测试

## 4. 表单验证

- [x] 4.1 修改 `ProviderForm.tsx`，添加 API 格式选择下拉框
- [x] 4.2 添加 URL 格式验证（必须以 `http://` 或 `https://` 开头）
- [x] 4.3 添加 API Key 格式验证（OpenAI: `sk-*`，Anthropic: `sk-ant-*`）
- [x] 4.4 编写表单验证的单元测试

## 5. 替换原生弹窗

- [x] 5.1 修改 `ModelConfigPanel.tsx`，将 2 处 `confirm()` 替换为 AlertDialog 组件
- [x] 5.2 修改 `WorkflowToolbar.tsx`，将 1 处 `alert()` 替换为 AlertDialog 组件
- [x] 5.3 编写弹窗替换后的交互测试

## 6. 集成和验证

- [x] 6.1 运行完整测试套件，确保所有测试通过
- [x] 6.2 运行类型检查和 lint 检查
