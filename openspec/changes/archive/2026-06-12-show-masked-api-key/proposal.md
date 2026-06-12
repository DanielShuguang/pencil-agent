## Why

当前 API Key 管理界面在保存密钥后只显示"已保存"文本，用户无法确认已保存的密钥是否正确。这可能导致用户在配置多个 provider 时混淆，或在需要验证时无法快速识别已保存的密钥。改进此功能可以提升用户体验和配置准确性。

## What Changes

- 修改 API Key 显示逻辑，从显示"已保存"改为显示加密格式（前4字符 + `***` + 后4字符）
- 在 ApiKeyForm 组件中显示加密的 API Key，但不允许直接编辑
- 在 ProviderForm 组件中显示加密的 API Key，并允许用户直接修改
- 添加新的 IPC 处理程序 `settings:get-masked-key`，在主进程中返回加密的 API Key
- 前端不再接收实际 API Key，只接收加密版本，提升安全性

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `api-key-management`: 修改 API Key 显示需求，从显示"已保存"文本改为显示加密格式的 API Key（前4字符 + `***` + 后4字符），并在 ProviderForm 中支持直接修改

## Impact

- **代码影响**：
  - `src/main/agent/ipc-handlers.ts`：添加新的 IPC 处理程序
  - `src/preload/index.ts`：添加新的 API 方法
  - `src/renderer/src/components/settings/ApiKeyForm.tsx`：修改显示逻辑
  - `src/renderer/src/components/settings/ProviderForm.tsx`：添加加密 key 显示和修改功能
  - `src/renderer/src/lib/`：新增 `mask-api-key.ts` 工具函数

- **API 影响**：
  - 新增 IPC 通道 `settings:get-masked-key`
  - 扩展 `window.api.settings` 接口

- **安全性提升**：
  - 前端不再接触实际 API Key，只接收加密版本
  - 减少敏感数据在渲染进程中的暴露

- **依赖影响**：
  - 无新增依赖，复用现有的 `safeStorage` 加密机制