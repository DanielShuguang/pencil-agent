## Why

当前应用只能通过 `pnpm dev` 运行，无法分发给普通用户。实现应用打包可以：
- 生成可分发的安装包（Windows .exe, macOS .dmg）
- 用户无需安装 Node.js 环境即可运行
- 支持自动更新发布流程
- 提供专业的应用安装体验

## What Changes

- 配置 electron-builder 打包选项
- 生成 Windows 安装包（NSIS 安装程序）
- 生成 macOS 安装包（DMG）
- 配置应用图标和元数据
- 优化打包体积
- 配置发布渠道（GitHub Releases）

## Capabilities

### New Capabilities
- `app-builder`: electron-builder 打包配置，包括平台构建、图标、元数据
- `release-config`: 发布配置，包括 GitHub Releases、版本管理

### Modified Capabilities

## Impact

- **构建配置**：electron-builder.yml 需要完善
- **资源文件**：需要应用图标（.ico, .icns, .png）
- **CI/CD**：可能需要 GitHub Actions 自动发布
- **依赖**：electron-builder 已安装
