## Context

electron-builder 已经在 devDependencies 中，electron.vite.config.ts 已配置。需要完善打包配置。

**当前状态：**
- electron-builder 已安装
- 有基本的 electron-builder.yml
- 缺少应用图标和详细配置

**约束：**
- 需要支持 Windows 和 macOS
- 需要合理的打包体积
- 需要支持代码签名（可选）

## Goals / Non-Goals

**Goals:**
- 生成 Windows NSIS 安装程序
- 生成 macOS DMG 安装包
- 配置应用图标和元数据
- 优化打包体积
- 配置 GitHub Releases 发布

**Non-Goals:**
- 不实现 Linux 打包（可后续添加）
- 不实现代码签名（需要证书）
- 不实现 CI/CD 自动发布（可后续添加）

## Decisions

### 1. 打包工具：electron-builder

**决策**：使用 electron-builder 进行打包

**理由**：
- 已经在项目中安装
- 支持多平台打包
- 与 electron-vite 集成良好
- 社区活跃，文档完善

### 2. Windows 安装程序：NSIS

**决策**：使用 NSIS 生成 Windows 安装程序

**理由**：
- 支持自定义安装路径
- 支持卸载程序
- 体积小，安装快
- Windows 用户熟悉

### 3. macOS 安装程序：DMG

**决策**：使用 DMG 格式

**理由**：
- macOS 标准安装方式
- 支持拖拽安装
- 支持自定义背景和图标

### 4. 发布渠道：GitHub Releases

**决策**：使用 GitHub Releases 作为发布渠道

**理由**：
- 免费、可靠
- 与代码仓库集成
- 支持版本管理和发布说明
- 与自动更新集成

## Risks / Trade-offs

**[风险] 打包体积过大** → 优化依赖，排除不必要的文件

**[风险] 平台兼容性问题** → 测试目标平台

**[权衡] 安装包大小 vs 功能完整性** → 优先保证功能完整，后续优化体积

## Migration Plan

1. **Phase 1：配置**
   - 完善 electron-builder.yml
   - 准备应用图标

2. **Phase 2：打包**
   - 测试 Windows 打包
   - 测试 macOS 打包

3. **Phase 3：发布**
   - 配置 GitHub Releases
   - 测试发布流程

## Open Questions

- 应用图标设计？
- 是否需要代码签名？
- 安装包自定义选项？
