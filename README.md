# Pencil Agent

基于 Electron + React + TypeScript 的桌面端 AI Agent 平台。

## 技术栈

- **桌面框架**: Electron ^39.x
- **前端**: React ^19.x + TypeScript ^6.x
- **状态管理**: Zustand ^5.x
- **UI**: shadcn/ui + Tailwind CSS ^4.x
- **画布**: @xyflow/react ^12.x
- **编辑器**: Monaco Editor
- **Agent 引擎**: @earendil-works/pi-coding-agent ^0.78.x
- **LLM**: @earendil-works/pi-ai ^0.78.x
- **沙箱**: Dockerode ^5.x
- **向量存储**: ChromaDB ^3.x
- **国际化**: react-i18next ^17.x + i18next ^26.x
- **构建**: Vite ^7.x + electron-builder ^26.x
- **包管理**: pnpm ^10.x
- **代码检查**: oxlint
- **代码格式化**: oxfmt
- **测试**: vitest ^4.x + @testing-library/react + Playwright ^1.x

## 项目结构

```
src/
├── main/           # Electron 主进程
│   ├── agent/      # Agent 会话管理、工具注册
│   ├── workflow/   # 工作流引擎 (DAG)
│   ├── sandbox/    # Docker 代码沙箱
│   └── memory/     # 向量记忆存储
├── preload/        # contextBridge 预加载脚本
└── renderer/       # React 渲染进程
    └── src/
        ├── components/  # UI 组件
        │   └── __tests__/  # 组件测试
        ├── stores/      # Zustand 状态管理
        │   └── __tests__/  # Store 测试
        ├── hooks/       # 自定义 hooks
        ├── lib/         # 工具函数
        │   └── __tests__/  # 单元测试
        ├── locales/     # 国际化翻译文件
        │   ├── zh.json  # 中文翻译
        │   └── en.json  # 英文翻译
        ├── i18n.ts      # i18n 配置
        └── test-setup.ts   # 测试环境初始化
packages/
└── shared-types/   # IPC 和工作流类型定义
test/
└── e2e/            # Playwright E2E 测试
```

## 开发

### 环境要求

- Node.js >= 20
- pnpm >= 10

### 安装

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 代码检查

```bash
pnpm lint    # oxlint 检查
pnpm fmt     # oxfmt 格式化
pnpm typecheck  # TypeScript 类型检查
```

### 测试

```bash
pnpm test          # 监视模式运行单元/组件测试
pnpm test:run      # 单次运行所有 vitest 测试
pnpm test:e2e      # 运行 Playwright E2E 测试 (需先 build)
```

### 构建

```bash
pnpm build         # 构建前端 + 主进程

# 打包分发
pnpm build:win     # Windows
pnpm build:mac     # macOS
pnpm build:linux   # Linux
```

## 核心功能

### 对话交互
- 多轮对话、流式输出
- 消息列表、自动滚动
- 停止生成功能

### 工具调用
- **内置工具**: read（文件读取）、write（文件写入）、edit（精确编辑）、bash（Shell 执行）
- **工具注册**: ToolRegistry 管理工具定义，支持动态注册
- **UI 展示**: ToolCallCard 组件展示工具调用过程（参数、状态、结果）
- **代码高亮**: CodeBlock 组件使用 highlight.js 实现语法高亮

### 代码编辑器
- **Monaco Editor**: 集成 VS Code 编辑器，支持 30+ 语言语法高亮
- **文件树**: 层级展示打开的文件，支持目录展开/折叠
- **多标签**: TabBar 管理多个打开的文件，支持切换和关闭
- **脏标记**: 指示未保存的修改

### 代码沙箱
- **child_process 模式**: 低隔离快速执行，支持 JS/TS/Python/Bash
- **Docker 模式**: 高隔离安全执行，网络隔离、内存限制、只读文件系统
- **自动降级**: Docker 不可用时自动降级到 child_process 模式
- **实时输出**: TerminalPanel 实时展示 stdout/stderr 输出
- **超时控制**: 默认 30 秒超时，防止长时间运行

### 工作流编排
- **可视化画布**: 基于 @xyflow/react 的 DAG 画布，支持节点拖拽、连线、缩放
- **节点类型**: Start（开始）、End（结束）、Agent（LLM 调用）、Tool（工具调用）、Condition（条件分支）
- **执行引擎**: DAG 拓扑排序执行，支持顺序执行和条件分支
- **节点配置**: 右侧配置面板，根据节点类型动态渲染表单
- **运行时状态**: 节点执行状态实时高亮（pending/running/success/error）
- **导入/导出**: 工作流定义 JSON 导入/导出
- **工具栏**: 快速添加节点、执行、保存、加载、清空

### 多 Agent 协作
- 顺序/并行/辩论/层级模式
- Agent 角色管理器
- 会话分支 (Tree of Thoughts)

### 向量记忆
- ChromaDB 本地向量检索
- 短期会话记忆、长期向量存储

### 国际化 (i18n)
- **多语言支持**: 支持中文和英文双语切换
- **翻译文件**: 按模块组织翻译键 (common, chat, settings, workflow, role)
- **语言切换**: 设置界面中可即时切换语言，无需重启
- **持久化**: 用户语言偏好自动保存到 electron-store
- **组件集成**: 所有 UI 组件使用 useTranslation hook 获取翻译文本

## 许可证

MIT
