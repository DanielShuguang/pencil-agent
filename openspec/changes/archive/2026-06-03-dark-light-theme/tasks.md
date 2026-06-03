## 1. 基础设施

- [x] 1.1 定义主题 TypeScript 类型（`Theme` 接口、`ThemeMode` 类型）
- [x] 1.2 创建暗色主题定义（`themes/dark.ts`）
- [x] 1.3 创建亮色主题定义（`themes/light.ts`）
- [x] 1.4 实现主题注册机制（`theme-registry.ts`）
- [x] 1.5 编写主题注册机制的单元测试

## 2. 主题状态管理

- [x] 2.1 创建 `theme-store.ts`，管理当前主题模式和主题对象
- [x] 2.2 实现 `setTheme(themeId)` 方法
- [x] 2.3 实现 `setThemeMode(mode)` 方法（light/dark/system）
- [x] 2.4 编写 theme-store 的单元测试

## 3. IPC 通信

- [x] 3.1 在 `packages/shared-types/ipc.ts` 中添加主题相关类型
- [x] 3.2 在 `src/preload/index.ts` 中暴露 `themeAPI`
- [x] 3.3 在 `src/renderer/src/types/global.d.ts` 中添加 `themeAPI` 类型
- [x] 3.4 在主进程实现主题 IPC 处理器（`theme-handlers.ts`）
- [x] 3.5 使用 `nativeTheme` API 实现系统主题检测
- [x] 3.6 编写 IPC 处理器的单元测试

## 4. CSS 变量注入

- [x] 4.1 实现 `applyTheme(theme)` 函数，将主题令牌转换为 CSS 变量
- [x] 4.2 在 `index.html` 中添加初始化脚本，避免 FOUC
- [x] 4.3 编写 CSS 变量生成的单元测试

## 5. UI 组件

- [x] 5.1 在 SettingsDialog 中添加主题切换 UI
- [x] 5.2 实现主题选择组件（Radio 或 Select）
- [x] 5.3 编写主题切换 UI 的组件测试

## 6. 集成与测试

- [x] 6.1 在 App.tsx 中初始化主题（从 electron-store 加载）
- [x] 6.2 更新 AppShell 组件使用主题 CSS 变量
- [x] 6.3 更新 StatusBar 组件使用主题 CSS 变量
- [x] 6.4 运行全量测试确保无回归
- [x] 6.5 手动测试主题切换功能
