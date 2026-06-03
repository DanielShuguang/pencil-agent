## ADDED Requirements

### Requirement: Windows NSIS installer
系统 SHALL 生成 Windows NSIS 安装程序。

#### Scenario: Build Windows installer
- **WHEN** 执行 Windows 打包命令
- **THEN** 生成 .exe 安装程序

#### Scenario: Custom install path
- **WHEN** 用户安装应用
- **THEN** 可以选择安装路径

#### Scenario: Uninstaller
- **WHEN** 用户卸载应用
- **THEN** 生成卸载程序，清理所有文件

### Requirement: macOS DMG installer
系统 SHALL 生成 macOS DMG 安装包。

#### Scenario: Build macOS DMG
- **WHEN** 执行 macOS 打包命令
- **THEN** 生成 .dmg 安装包

#### Scenario: Drag to install
- **WHEN** 用户打开 DMG
- **THEN** 可以拖拽到 Applications 文件夹安装

### Requirement: Application icon
系统 SHALL 配置应用图标。

#### Scenario: Windows icon
- **WHEN** 打包 Windows 应用
- **THEN** 使用 .ico 格式图标

#### Scenario: macOS icon
- **WHEN** 打包 macOS 应用
- **THEN** 使用 .icns 格式图标

### Requirement: Application metadata
系统 SHALL 配置应用元数据。

#### Scenario: App name and version
- **WHEN** 打包应用
- **THEN** 包含应用名称、版本号、描述

#### Scenario: App id
- **WHEN** 打包应用
- **THEN** 包含唯一应用标识符
