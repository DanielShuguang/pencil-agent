## ADDED Requirements

### Requirement: Update dialog
系统 SHALL 显示更新对话框，展示更新信息和操作。

#### Scenario: Show update available dialog
- **WHEN** 发现新版本
- **THEN** 显示更新对话框，包含版本号、更新说明、下载按钮

#### Scenario: Show download progress
- **WHEN** 更新正在下载
- **THEN** 显示下载进度条

#### Scenario: Show update ready dialog
- **WHEN** 更新下载完成
- **THEN** 显示安装提示对话框

### Requirement: Update notification
系统 SHALL 在状态栏显示更新通知。

#### Scenario: Show update notification
- **WHEN** 发现新版本
- **THEN** 在状态栏显示更新通知图标

#### Scenario: Show download status
- **WHEN** 更新正在下载
- **THEN** 在状态栏显示下载进度

### Requirement: Update settings
系统 SHALL 在设置中提供更新相关选项。

#### Scenario: Auto check toggle
- **WHEN** 用户打开设置
- **THEN** 显示自动检查更新开关

#### Scenario: Check now button
- **WHEN** 用户打开设置
- **THEN** 显示手动检查更新按钮
