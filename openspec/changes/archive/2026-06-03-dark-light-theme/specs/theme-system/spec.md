## ADDED Requirements

### Requirement: Theme definition schema
系统 SHALL 定义一个标准的主题接口 `Theme`，包含所有必要的设计令牌。

#### Scenario: Theme interface structure
- **WHEN** 开发者创建新主题
- **THEN** 必须实现 `Theme` 接口，包含 `id`、`name`、`colors` 等必要字段

### Requirement: Theme registration mechanism
系统 SHALL 提供主题注册机制，允许注册和获取主题。

#### Scenario: Register a new theme
- **WHEN** 调用 `registerTheme(theme)` 注册新主题
- **THEN** 主题被添加到可用主题列表中

#### Scenario: Get registered theme
- **WHEN** 调用 `getTheme(themeId)` 获取主题
- **THEN** 返回对应的主题对象，如果不存在则返回 null

#### Scenario: Get all registered themes
- **WHEN** 调用 `getAllThemes()` 获取所有主题
- **THEN** 返回所有已注册主题的数组

### Requirement: Built-in themes
系统 SHALL 内置暗色和亮色两种主题。

#### Scenario: Dark theme available
- **WHEN** 应用启动
- **THEN** 暗色主题已注册且可用

#### Scenario: Light theme available
- **WHEN** 应用启动
- **THEN** 亮色主题已注册且可用

### Requirement: CSS variables generation
系统 SHALL 将主题设计令牌转换为 CSS 变量并注入到页面。

#### Scenario: Apply theme CSS variables
- **WHEN** 切换到新主题
- **THEN** `:root` 元素的 CSS 变量更新为新主题的值

#### Scenario: CSS variable naming convention
- **WHEN** 主题定义颜色 `colors.background`
- **THEN** 生成 CSS 变量 `--background`

### Requirement: Theme switching
系统 SHALL 支持运行时切换主题，切换后立即生效。

#### Scenario: Switch theme
- **WHEN** 用户选择新主题
- **THEN** 应用立即切换到新主题，所有组件使用新主题样式

#### Scenario: Invalid theme ID
- **WHEN** 尝试切换到不存在的主题 ID
- **THEN** 保持当前主题不变，输出警告日志

### Requirement: Theme store
系统 SHALL 使用 Zustand store 管理主题状态。

#### Scenario: Theme store contains current theme
- **WHEN** 访问 theme store
- **THEN** 可以获取当前激活的主题 ID 和主题对象

#### Scenario: Theme store exposes switch function
- **WHEN** 组件需要切换主题
- **THEN** 可以调用 store 的 `setTheme(themeId)` 方法

### Requirement: Theme toggle UI
系统 SHALL 在设置页面提供主题切换 UI。

#### Scenario: Display theme options
- **WHEN** 用户打开设置页面的主题标签
- **THEN** 显示所有可用主题的列表

#### Scenario: Select theme
- **WHEN** 用户点击某个主题选项
- **THEN** 应用切换到选中的主题
