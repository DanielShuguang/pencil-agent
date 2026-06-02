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

- **对话交互** - 多轮对话、流式输出
- **工具调用** - 文件读写、Shell、HTTP、自定义工具
- **工作流编排** - 可视化 DAG 画布
- **多 Agent 协作** - 顺序/并行/辩论/层级模式
- **代码沙箱** - Docker 容器隔离执行
- **向量记忆** - ChromaDB 本地向量检索

## 许可证

MIT
