## ADDED Requirements

### Requirement: GitHub Releases configuration
系统 SHALL 配置 GitHub Releases 发布。

#### Scenario: Publish to GitHub
- **WHEN** 执行发布命令
- **THEN** 将安装包上传到 GitHub Releases

#### Scenario: Release notes
- **WHEN** 发布新版本
- **THEN** 包含版本说明和更新日志

### Requirement: Version management
系统 SHALL 支持版本管理。

#### Scenario: Auto increment version
- **WHEN** 发布新版本
- **THEN** 自动递增版本号

#### Scenario: Version tagging
- **WHEN** 发布新版本
- **THEN** 在 Git 创建版本标签

### Requirement: Update integration
系统 SHALL 与自动更新集成。

#### Scenario: Update server URL
- **WHEN** 配置发布
- **THEN** 配置更新服务器 URL

#### Scenario: Update channel
- **WHEN** 发布应用
- **THEN** 支持稳定版和测试版渠道
