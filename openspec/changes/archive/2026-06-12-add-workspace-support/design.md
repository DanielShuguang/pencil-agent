## 上下文

当前应用没有工作空间概念。所有 Agent 会话共享 `process.cwd()`（Electron 安装目录）作为文件操作根目录。`AgentSessionManager.create()` 将 `process.cwd()` 传给 `DefaultResourceLoader`，权限系统也用它解析相对路径。子进程沙箱的 `spawn` 未指定 `cwd`，隐式继承主进程的 `cwd`。

用户的核心场景——让 Agent 在自己的项目目录中读写代码——完全不可用。

## 目标 / 非目标

**目标：**
- 用户创建会话时必须选择一个目录作为工作空间
- 工作空间路径（`cwd`）持久化到 electron-store，重启后可恢复
- `cwd` 传播到所有文件操作相关子系统（ResourceLoader、权限检查、子进程沙箱）
- 侧边栏和 StatusBar 展示工作空间信息
- 路径不存在时给出明确提示

**非目标：**
- 不支持会话创建后切换工作空间
- 不支持 Docker 沙箱挂载宿主机目录（后续独立变更）
- 不支持多目录工作空间（单会话单目录）
- 不实现文件树浏览器（当前文件树由 Agent 工具调用结果驱动）

## 决策

### 1. `cwd` 必填而非可选

**选择**：`SessionConfig.cwd` 为必填字段，不选目录不能创建会话。

**理由**：Agent 的 read/write/edit/bash 工具都依赖 `cwd` 解析路径。如果允许无 `cwd` 的会话，这些工具会操作错误的目录（安装目录），比强制选目录更让人困惑。

**替代方案**：允许无 `cwd` 的纯聊天会话——灵活但容易误用。

### 2. `cwd` 存储在会话数据中

**选择**：`cwd` 写入 electron-store 的会话记录，与 `sessionId`、`model` 同级。

**理由**：会话列表是持久化的，重启后用户能看到历史会话。如果 `cwd` 不持久化，点击旧会话时 Agent 不知道该操作哪个目录。

**替代方案**：`cwd` 只在内存中——简单但重启后会话失效。

### 3. 通过 IPC 调用 `dialog.showOpenDialog`

**选择**：在 `ipc-handlers.ts` 中注册 `dialog:selectDirectory` handler，Renderer 通过 preload bridge 调用。

**理由**：`dialog.showOpenDialog` 是 Electron 主进程 API，需要 `BrowserWindow` 引用。通过 IPC 调用是标准模式。`mainWindow` 已在 `main/index.ts` 中创建，传入 handler 即可。

**替代方案**：在 preload 中直接暴露——preload 运行在渲染进程，无法调用 `dialog`。

### 4. 路径展示取最后一级目录名

**选择**：侧边栏显示路径最后一级目录名（如 `frontend`），StatusBar 显示完整路径。

**理由**：侧边栏空间有限，项目名足够区分不同会话。StatusBar 空间充裕，完整路径提供精确定位。

**替代方案**：完整路径 everywhere——侧边栏会被撑爆。智能截断——实现复杂，效果不稳定。

### 5. 路径校验时机

**选择**：创建会话时校验目录存在，点击旧会话时如果目录失效弹 toast 提示。

**理由**：创建时校验防止用户选错。点击时校验处理目录被删除/移动的边缘情况。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 用户选了一个权限不足的目录（如系统目录） | 创建时校验目录可读，不可读则提示 |
| `mainWindow` 在 handler 注册时未就绪 | 用函数式获取（`BrowserWindow.getFocusedWindow()` 或传入 getter） |
| 旧会话数据没有 `cwd` 字段 | 加载时检测，缺失 `cwd` 的会话标记为"需要重新选择工作空间" |
| 长路径在 UI 中溢出 | CSS `text-overflow: ellipsis` + `title` 属性显示完整路径 |
