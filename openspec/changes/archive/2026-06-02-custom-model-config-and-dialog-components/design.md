## 上下文

当前自定义模型配置系统（`ModelConfigManager`）仅支持 OpenAI 兼容的 API 格式：
- 连接测试：`GET {baseUrl}/models` + `Authorization: Bearer {apiKey}`
- 表单：无 API 格式选择，无 URL/API Key 格式验证

此外，应用中存在 3 处原生 `alert()`/`confirm()` 调用，需要替换为 shadcn/ui 风格的自定义组件。

## 目标 / 非目标

**目标：**
- 自定义模型配置支持 OpenAI 和 Anthropic 两种 API 规范
- 连接测试根据 API 格式使用正确的端点和认证方式
- 表单增加 URL 和 API Key 格式验证
- 提供可复用的 Dialog 和 AlertDialog 组件
- 替换所有原生 alert/confirm 调用

**非目标：**
- 支持其他 API 格式（如 Google Gemini、Cohere 等）
- 修改 pi-ai/pi-coding-agent 底层 SDK
- 实现完整的 API 兼容性测试

## 决策

### 1. API 格式区分方式

**决策**：在 `ModelProvider` 类型中新增 `apiFormat: 'openai' | 'anthropic'` 字段。

**替代方案**：
- A: 通过 URL 模式自动检测 → 不可靠，用户可能使用代理
- B: 每个 provider 独立配置端点和头部 → 过于复杂

**理由**：显式声明 API 格式简单可靠，用户在添加 provider 时选择即可。

### 2. Anthropic 连接测试端点

**决策**：使用 `GET {baseUrl}/v1/models` + `x-api-key: {apiKey}` 头部。

**替代方案**：
- A: 使用 `/v1/messages` 发送测试消息 → 消耗 token，成本高
- B: 仅验证 API Key 格式 → 无法确认连接可用性

**理由**：Anthropic 的 `/v1/models` 端点是最轻量的验证方式，不消耗 token。

### 3. 表单验证策略

**决策**：使用 HTML5 `pattern` 属性 + 自定义 `validate` 函数双重验证。

**理由**：HTML5 验证提供即时反馈，自定义验证提供更灵活的错误信息。

### 4. Dialog 组件实现

**决策**：使用 `@radix-ui/react-dialog` 和 `@radix-ui/react-alert-dialog`，遵循 shadcn/ui 模式。

**替代方案**：
- A: 使用 Electron 的 `dialog.showMessageBox()` → 不符合 Web UI 风格
- B: 自己实现 Modal → 不必要地复杂

**理由**：shadcn/ui 的 Dialog 组件与现有 UI 风格一致，Radix UI 提供良好的可访问性。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 现有 provider 数据缺少 `apiFormat` 字段 | 默认值设为 `'openai'`，保持向后兼容 |
| Anthropic `/v1/models` 端点可能不可用 | 提供清晰的错误信息，建议用户检查 API Key |
| Radix UI Dialog 增加包体积 | 按需引入，tree-shaking 会移除未使用代码 |
