## 为什么

当前应用没有工作空间概念——所有 Agent 会话共享 `process.cwd()`（Electron 安装目录）作为文件操作的根目录。用户让 Agent 读写代码时，操作的是错误的目录，导致这个 AI 编码助手的核心场景（在用户项目中改代码）完全不可用。

## 变更内容

引入**每会话独立工作空间**：用户创建会话时必须选择一个目录，该目录作为该会话的 `cwd` 持久化存储，并传播到 Agent 的所有文件操作（ResourceLoader、权限检查、子进程沙箱）。

具体变更：
- **新增**：目录选择器（调用 Electron `dialog.showOpenDialog`）
- **新增**：`SessionConfig.cwd` 必填字段，会话与工作空间绑定
- **新增**：侧边栏会话项显示项目名（路径最后一级目录名）
- **新增**：StatusBar 显示当前会话的完整工作空间路径
- **修改**：`AgentSessionManager.create()` 使用会话级 `cwd` 替代 `process.cwd()`
- **修改**：权限系统路径检查使用会话级 `cwd`
- **修改**：子进程沙箱 `spawn` 传入会话级 `cwd`
- **修改**：会话持久化存储包含 `cwd` 字段

## 功能 (Capabilities)

### 新增功能
- `workspace-selection`: 创建会话时的目录选择流程，包括 Electron dialog 调用、路径校验、IPC 通信
- `workspace-display`: 侧边栏和 StatusBar 中的工作空间路径展示，包括项目名提取和长路径处理

### 修改功能

## 影响

- **主进程**：`session-manager.ts`、`permission-extension.ts`、`ipc-handlers.ts`、`child-process.ts`
- **Preload**：`index.ts` 新增 dialog 和 session 相关 API
- **渲染进程**：`Sidebar.tsx`、`SessionItem.tsx`、`StatusBar.tsx`、`agent-store.ts`、会话列表 store
- **共享类型**：`ipc.ts` 新增/修改接口定义
- **数据**：electron-store 中会话数据结构新增 `cwd` 字段
