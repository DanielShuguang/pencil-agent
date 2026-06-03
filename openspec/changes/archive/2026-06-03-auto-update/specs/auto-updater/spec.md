## ADDED Requirements

### Requirement: Check for updates on startup
系统 SHALL 在应用启动时自动检查更新。

#### Scenario: Auto check on startup
- **WHEN** 应用启动
- **THEN** 自动检查是否有新版本可用

### Requirement: Manual check for updates
系统 SHALL 支持用户手动检查更新。

#### Scenario: User triggers update check
- **WHEN** 用户点击"检查更新"按钮
- **THEN** 检查是否有新版本可用

### Requirement: Download update in background
系统 SHALL 在发现新版本后后台下载更新。

#### Scenario: Background download
- **WHEN** 发现新版本
- **THEN** 自动开始后台下载，不打断用户工作

### Requirement: Notify user when download complete
系统 SHALL 在更新下载完成后通知用户。

#### Scenario: Download complete notification
- **WHEN** 更新下载完成
- **THEN** 通知用户并提示安装

### Requirement: Handle update errors
系统 SHALL 处理更新过程中的错误。

#### Scenario: Network error during check
- **WHEN** 检查更新时网络错误
- **THEN** 显示错误信息，允许重试

#### Scenario: Download error
- **WHEN** 下载更新时错误
- **THEN** 显示错误信息，允许重试

### Requirement: Skip version
系统 SHALL 支持用户跳过特定版本。

#### Scenario: User skips version
- **WHEN** 用户选择跳过当前版本
- **THEN** 不再提示该版本更新
