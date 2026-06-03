## Why

当前应用没有自动更新机制，用户需要手动下载新版本安装。实现自动更新可以：
- 提供无缝的更新体验，用户无需手动下载
- 确保用户始终使用最新版本，获得最新功能和安全修复
- 减少版本碎片化，降低维护成本

## What Changes

- 集成 electron-updater，支持应用内检查更新
- 实现更新检查、下载、安装的完整流程
- 添加更新 UI（检查更新对话框、下载进度、更新提示）
- 支持自动检查和手动检查两种模式
- 支持更新通知和静默下载

## Capabilities

### New Capabilities
- `auto-updater`: 自动更新核心功能，包括检查更新、下载、安装
- `update-ui`: 更新相关 UI 组件，包括更新对话框、进度条、通知

### Modified Capabilities

## Impact

- **主进程**：需要添加更新服务（updater.ts）
- **渲染进程**：需要添加更新 UI 组件
- **IPC 通信**：需要添加更新相关的 IPC 通道
- **构建配置**：需要配置 electron-builder 的发布选项
- **依赖**：electron-updater 已在 package.json 中
