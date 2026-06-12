## 1. 类型定义与 IPC 接口

- [x] 1.1 在 `packages/shared-types/ipc.ts` 中新增 `SelectDirectoryRequest`/`SelectDirectoryResponse` 类型，修改 `SessionConfig` 加 `cwd: string` 必填字段
- [x] 1.2 在 `src/preload/index.ts` 中新增 `window.api.dialog.selectDirectory()` 和 `window.api.session.getCwd(sessionId)` bridge 方法

## 2. 主进程：目录选择与会话管理

- [x] 2.1 在 `ipc-handlers.ts` 中注册 `dialog:selectDirectory` handler，调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })`
- [x] 2.2 修改 `session-manager.ts` 的 `create()` 方法，使用 `config.cwd` 替代 `process.cwd()` 传给 `DefaultResourceLoader`
- [x] 2.3 修改 `permission-extension.ts`，从 session 配置获取 `cwd` 替代 `process.cwd()`
- [x] 2.4 修改 `child-process.ts` 的 `spawn` 调用，传入 `{ cwd }` 选项
- [x] 2.5 修改 `ipc-handlers.ts` 的 `agent:create` handler，将 `cwd` 写入 electron-store 会话记录

## 3. 主进程：路径校验与兼容性

- [x] 3.1 创建会话前校验目录存在且可读，不可用时返回错误
- [x] 3.2 加载旧会话数据时检测 `cwd` 字段缺失，标记为需要重新选择

## 4. 渲染进程：Store 层

- [x] 4.1 修改 `agent-store.ts` 的 `createSession` 方法，必须传入 `cwd`
- [x] 4.2 修改会话列表 store，`SessionItem` 类型新增 `cwd` 字段

## 5. 渲染进程：UI 层

- [x] 5.1 修改 `Sidebar.tsx` 的"新建会话"按钮，点击后先调用目录选择，再创建会话
- [x] 5.2 修改 `SessionItem.tsx`，显示 📁 项目名（路径最后一级），长文本截断 + tooltip
- [x] 5.3 修改 `StatusBar.tsx`，显示当前会话的完整工作空间路径
- [x] 5.4 点击旧会话时校验路径存在，不存在则弹 toast 错误提示

## 6. 测试

- [x] 6.1 为 `dialog:selectDirectory` handler 编写单元测试
- [x] 6.2 为 `session-manager.ts` 的 `cwd` 传播编写单元测试
- [x] 6.3 为路径校验逻辑编写单元测试
- [x] 6.4 为 `SessionItem` 项目名显示编写组件测试
- [x] 6.5 运行 `pnpm test:run` 确保全部通过
