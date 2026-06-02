## Context

当前模型配置硬编码在 `ModelSelector.tsx` 中，仅支持 OpenAI 和 Anthropic。pi-mono 的 `@earendil-works/pi-ai` 已支持 20+ 模型提供商，但用户无法在 UI 中配置和使用这些提供商。

## Goals / Non-Goals

**Goals:**
- 支持用户自定义模型厂商和模型列表
- 支持配置自定义 API 端点（兼容 OpenAI API 格式）
- 保留内置的 OpenAI 和 Anthropic 作为默认配置
- 配置持久化到本地文件

**Non-Goals:**
- 不实现模型自动发现
- 不实现模型性能基准测试
- 不支持非 OpenAI API 格式的提供商（如 Anthropic 原生格式）

## Decisions

### 1. 配置存储方案

**决策**: 使用 electron-store 存储模型配置

**替代方案**:
- JSON 文件手动管理 → 需要额外的文件读写逻辑
- SQLite → 对简单配置来说过度设计

**理由**: electron-store 已在项目中使用（存储 API Key），复用现有方案最简单。

### 2. 配置数据结构

```typescript
interface ModelProvider {
  id: string
  name: string
  baseUrl: string
  apiKey: string // 加密存储
  models: ModelConfig[]
}

interface ModelConfig {
  id: string
  name: string
  providerId: string
  maxTokens?: number
  temperature?: number
}
```

### 3. API 端点兼容性

**决策**: 仅支持 OpenAI API 格式的端点

**理由**: 大多数模型厂商（DeepSeek、智谱 AI、Ollama 等）都提供 OpenAI 兼容的 API，统一格式简化实现。

### 4. UI 集成方式

**决策**: 在 Settings 对话框中新增 "模型配置" 标签页

**替代方案**: 独立的模型配置窗口 → 增加窗口管理复杂度
- 在 ModelSelector 中直接编辑 → 空间有限，体验差

**理由**: 复用现有的 Settings 对话框，用户熟悉且空间充足。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 用户配置错误的 API 端点 | 提供 "测试连接" 按钮验证配置 |
| API Key 安全存储 | 复用 safeStorage 加密机制 |
| 配置文件损坏 | 保留内置默认配置作为兜底 |
| 模型列表过长 | 支持分组和搜索功能 |
