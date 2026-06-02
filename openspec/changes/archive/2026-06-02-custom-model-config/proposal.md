## Why

当前模型配置硬编码在 `ModelSelector.tsx` 中，仅支持 OpenAI 和 Anthropic 两家厂商。用户无法添加其他模型厂商（如 Google Gemini、DeepSeek、智谱 AI、Ollama 本地模型等），限制了应用的适用性。

## What Changes

- 新增自定义模型配置管理界面，支持添加/编辑/删除模型厂商和模型
- 将硬编码的模型列表改为从配置文件动态加载
- 支持配置自定义 API 端点（兼容 OpenAI API 格式的第三方服务）
- 支持配置模型参数（temperature、maxTokens 等）
- 保留内置的 OpenAI 和 Anthropic 作为默认配置

## Capabilities

### New Capabilities
- `custom-model-config`: 自定义模型配置管理，支持添加/编辑/删除模型厂商和模型列表
- `custom-api-endpoint`: 自定义 API 端点配置，支持兼容 OpenAI API 格式的第三方服务

### Modified Capabilities
- `model-selector`: 从硬编码改为动态加载自定义模型配置

## Impact

**代码影响**:
- `src/renderer/src/components/chat/ModelSelector.tsx` — 改为动态加载模型列表
- `src/renderer/src/components/settings/` — 新增模型配置管理组件
- `src/renderer/src/stores/settings-store.ts` — 扩展支持模型配置存储
- `src/main/agent/ipc-handlers.ts` — 新增模型配置 IPC 处理器
- `packages/shared-types/ipc.ts` — 新增模型配置相关类型定义

**依赖影响**: 无新增依赖

**API 影响**: 新增 IPC 接口
- `model-config:list` — 获取所有模型配置
- `model-config:save` — 保存模型配置
- `model-config:delete` — 删除模型配置
