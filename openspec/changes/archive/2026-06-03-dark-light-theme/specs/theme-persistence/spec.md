## ADDED Requirements

### Requirement: Theme preference persistence
系统 SHALL 将用户的主题选择持久化到本地存储。

#### Scenario: Save theme preference
- **WHEN** 用户切换主题
- **THEN** 主题选择保存到 electron-store

#### Scenario: Restore theme preference on startup
- **WHEN** 应用启动
- **THEN** 从 electron-store 读取并应用保存的主题

#### Scenario: Default theme when no preference
- **WHEN** 应用首次启动或没有保存的主题偏好
- **THEN** 使用 `system` 模式（跟随系统主题）

### Requirement: System theme following
系统 SHALL 支持跟随操作系统主题偏好。

#### Scenario: System theme mode
- **WHEN** 用户选择 `system` 主题模式
- **THEN** 应用主题跟随操作系统的暗色/亮色设置

#### Scenario: System theme change detection
- **WHEN** 操作系统主题发生变化
- **THEN** 应用立即切换到对应的主题

#### Scenario: System theme to light
- **WHEN** 系统主题模式为 `system` 且操作系统切换到亮色
- **THEN** 应用切换到亮色主题

#### Scenario: System theme to dark
- **WHEN** 系统主题模式为 `system` 且操作系统切换到暗色
- **THEN** 应用切换到暗色主题

### Requirement: Theme mode types
系统 SHALL 支持三种主题模式：`light`、`dark`、`system`。

#### Scenario: Light mode
- **WHEN** 用户选择 `light` 模式
- **THEN** 应用强制使用亮色主题，不受系统主题影响

#### Scenario: Dark mode
- **WHEN** 用户选择 `dark` 模式
- **THEN** 应用强制使用暗色主题，不受系统主题影响

#### Scenario: System mode
- **WHEN** 用户选择 `system` 模式
- **THEN** 应用跟随系统主题

### Requirement: IPC communication for theme
系统 SHALL 通过 IPC 在主进程和渲染进程之间同步主题状态。

#### Scenario: Renderer requests theme change
- **WHEN** 渲染进程调用 `theme:set` IPC
- **THEN** 主进程更新 nativeTheme 并保存偏好

#### Scenario: Main process notifies theme change
- **WHEN** 主进程检测到系统主题变化
- **THEN** 通过 `theme:changed` IPC 通知渲染进程

#### Scenario: Get current theme via IPC
- **WHEN** 渲染进程调用 `theme:get` IPC
- **THEN** 返回当前主题模式和实际主题

### Requirement: Electron nativeTheme integration
系统 SHALL 使用 Electron 的 nativeTheme API 检测和控制系统主题。

#### Scenario: Detect system theme
- **WHEN** 调用 `nativeTheme.shouldUseDarkColors`
- **THEN** 返回系统是否应使用暗色主题

#### Scenario: Set theme source
- **WHEN** 设置 `nativeTheme.themeSource`
- **THEN** Electron 使用指定的主题源（light/dark/system）
