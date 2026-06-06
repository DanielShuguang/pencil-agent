## 1. 类型定义与基础设施

- [x] 1.1 在 `packages/shared-types/` 新增权限相关类型：`PermissionMode`、`ToolPermission`、`DangerousPattern`、`AuditLog`、`ConfirmRequest`/`ConfirmResponse`
- [x] 1.2 在 `src/main/agent/` 创建 `permission-manager.ts`，实现 `PermissionManager` 类（确认模式、工具启用/禁用、路径规则管理）
- [x] 1.3 在 `src/main/agent/` 创建 `dangerous-patterns.ts`，定义危险命令正则规则列表
- [x] 1.4 在 `src/main/agent/` 创建 `audit-logger.ts`，实现 `AuditLogger` 类（日志写入、查询、清理）

## 2. 权限检查核心

- [x] 2.1 实现路径访问控制：`checkPathAccess(path, cwd)` — 工作目录白名单 + 敏感路径黑名单
- [x] 2.2 实现危险命令检测：`checkDangerousCommand(command)` — 正则匹配危险模式
- [x] 2.3 实现工具权限装饰器：`wrapToolWithPermission(tool, permissionManager)` — 包装原始工具，注入权限检查
- [x] 2.4 修改 `ToolRegistry`，支持注册带权限的工具

## 3. IPC 通道

- [x] 3.1 在 `packages/shared-types/` 新增 IPC 类型定义：`permission:confirm`、`permission:getConfig`、`permission:setConfig`、`audit:getLogs`
- [x] 3.2 在 `src/preload/index.ts` 新增 `permissionAPI` 和 `auditAPI`
- [x] 3.3 在 `src/main/agent/ipc-handlers.ts` 注册权限和审计相关的 IPC handlers
- [x] 3.4 实现主进程确认请求：通过 IPC 发送确认请求到渲染进程，等待用户响应

## 4. 渲染进程 UI

- [x] 4.1 创建 `PermissionConfirmDialog` 组件：显示工具名称、参数、风险等级、允许/拒绝按钮
- [x] 4.2 创建 `permission-store.ts`：管理确认模式、工具权限配置、确认队列
- [x] 4.3 在设置页面新增"权限管理"标签页：确认模式选择、工具启用/禁用、路径规则配置
- [x] 4.4 创建 `AuditLogPanel` 组件：展示工具调用历史列表，支持展开详情

## 5. 集成与串联

- [x] 5.1 在 `src/main/index.ts` 初始化 `PermissionManager` 和 `AuditLogger`，传入 `registerAgentHandlers`
- [x] 5.2 修改 `AgentSessionManager.create()`，使用权限扩展注入工具拦截（通过 `DefaultResourceLoader` + `extensionFactories`）
- [x] 5.3 在权限检查中集成审计日志记录（成功/失败/拒绝）
- [x] 5.4 在 `AppShell` 中集成确认弹窗的全局监听

## 6. 测试

- [x] 6.1 `permission-manager.ts` 单元测试：确认模式、工具启用/禁用、路径检查
- [x] 6.2 `dangerous-patterns.ts` 单元测试：各危险命令模式匹配
- [x] 6.3 `audit-logger.ts` 单元测试：日志写入、查询、清理
- [x] 6.4 `PermissionConfirmDialog` 组件测试：渲染、按钮点击、记住选择
- [x] 6.5 `permission-store.ts` 测试：状态管理、确认队列
