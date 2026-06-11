## 1. 主进程实现

- [x] 1.1 在 `src/main/agent/ipc-handlers.ts` 中添加新的 IPC 处理程序 `settings:get-masked-key`
- [x] 1.2 实现加密逻辑：读取存储的 key，解密后调用 `maskApiKey` 函数返回

## 2. 预加载脚本

- [x] 2.1 在 `src/preload/index.ts` 的 `settingsAPI` 中添加 `getMaskedKey` 方法
- [x] 2.2 更新 `src/renderer/src/types/global.d.ts` 中的 `SettingsAPI` 接口定义

## 3. 工具函数

- [x] 3.1 创建 `src/renderer/src/lib/mask-api-key.ts` 工具函数
- [x] 3.2 实现 `maskApiKey(key: string): string` 函数，处理各种边界情况

## 4. ApiKeyForm 组件

- [x] 4.1 修改 `src/renderer/src/components/settings/ApiKeyForm.tsx`
- [x] 4.2 添加 `maskedKeys` 状态，存储每个 provider 的加密 key
- [x] 4.3 在 `useEffect` 中调用 `getMaskedKey` 获取加密 key
- [x] 4.4 修改显示逻辑，用加密 key 替代"已保存"文本

## 5. ProviderForm 组件

- [x] 5.1 修改 `src/renderer/src/components/settings/ProviderForm.tsx`
- [x] 5.2 添加 `maskedApiKey` 属性
- [x] 5.3 在编辑现有 provider 时，显示加密的 API key
- [x] 5.4 允许用户直接修改 API key

## 6. 测试

- [x] 6.1 为 `maskApiKey` 函数编写单元测试
- [x] 6.2 为 `settings:get-masked-key` IPC 处理程序编写测试
- [x] 6.3 为 `ApiKeyForm` 组件更新测试
- [x] 6.4 为 `ProviderForm` 组件更新测试