## ADDED Requirements

### Requirement: Route-level code splitting
系统 SHALL 使用代码分割按路由懒加载功能模块。

#### Scenario: Lazy load workflow page
- **WHEN** 用户导航到工作流页面
- **THEN** 动态加载工作流模块，显示加载状态

#### Scenario: Lazy load settings page
- **WHEN** 用户打开设置对话框
- **THEN** 动态加载设置模块，显示加载状态

### Requirement: Loading state for lazy components
系统 SHALL 为懒加载组件显示加载状态。

#### Scenario: Show loading spinner
- **WHEN** 懒加载组件正在加载
- **THEN** 显示加载指示器

#### Scenario: Handle loading error
- **WHEN** 懒加载组件加载失败
- **THEN** 显示错误信息和重试按钮

### Requirement: Bundle size optimization
系统 SHALL 优化打包体积，减少首屏加载时间。

#### Scenario: First load under 500KB
- **WHEN** 用户首次打开应用
- **THEN** 首屏 JavaScript 体积小于 500KB（gzipped）

#### Scenario: Lazy load large dependencies
- **WHEN** 使用 Monaco Editor 或 @xyflow/react
- **THEN** 这些依赖按需加载，不阻塞首屏
