## 为什么

当前自定义模型配置仅支持 OpenAI 兼容的 API 格式（Bearer token + `/v1/models` 端点），无法正确连接 Anthropic 原生 API（使用 `x-api-key` 头部 + `/v1/messages` 端点）。此外，应用中存在 3 处原生 `alert()`/`confirm()` 调用，破坏了 UI 一致性。

## 变更内容

### 1. 自定义模型配置支持 OpenAI 和 Anthropic 两种规范

- **新增**：Provider 类型字段（`apiFormat: 'openai' | 'anthropic'`），区分 API 格式
- **修改**：连接测试逻辑根据 `apiFormat` 使用不同的端点和认证方式
  - OpenAI: `GET {baseUrl}/models` + `Authorization: Bearer {apiKey}`
  - Anthropic: `GET {baseUrl}/v1/models` + `x-api-key: {apiKey}`
- **修改**：ProviderForm 新增 API 格式选择下拉框
- **修改**：表单验证增加 URL 格式校验和 API Key 格式校验

### 2. 替换原生弹窗为自定义组件

- **新增**：`AlertDialog` 组件（基于 `@radix-ui/react-alert-dialog`）
- **新增**：`Dialog` 组件（基于 `@radix-ui/react-dialog`）
- **修改**：`ModelConfigPanel.tsx` 中 2 处 `confirm()` 替换为 `AlertDialog`
- **修改**：`WorkflowToolbar.tsx` 中 1 处 `alert()` 替换为 `AlertDialog`

## 功能 (Capabilities)

### 新增功能
- `custom-model-api-format`: 自定义模型配置支持 OpenAI 和 Anthropic 两种 API 规范，包括格式选择、差异化连接测试和表单验证
- `dialog-components`: 基于 shadcn/ui 的 Dialog 和 AlertDialog 组件，替换原生弹窗

### 修改功能
（无现有规范需要修改）

## 影响

- **依赖**：新增 `@radix-ui/react-dialog`、`@radix-ui/react-alert-dialog`
- **类型**：`ModelProvider` 类型新增 `apiFormat` 字段
- **后端**：`ModelConfigManager.testConnection()` 需支持双格式
- **前端**：ProviderForm、ModelConfigPanel、WorkflowToolbar 组件变更
- **存储**：现有 provider 数据需兼容（默认 `apiFormat: 'openai'`）
