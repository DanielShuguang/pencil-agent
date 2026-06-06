# AI Agent Desktop

基于 pi-mono Agent 引擎的桌面端 AI Agent 平台。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^39.x |
| 前端 | React + TypeScript | ^19.x / ^6.x |
| 状态管理 | Zustand | ^5.x |
| UI | shadcn/ui + Radix UI + Tailwind CSS | ^4.x |
| Agent 引擎 | @earendil-works/pi-coding-agent | ^0.78.x |
| LLM | @earendil-works/pi-ai | ^0.78.x |
| 沙箱 | Dockerode | ^5.x |
| 国际化 | react-i18next | ^17.x |
| 模式匹配 | ts-pattern | ^5.x |
| 构建 | Vite + electron-builder | ^7.x / ^26.x |
| 包管理 | pnpm | ^10.x |
| 测试 | vitest + testing-library + Playwright | ^4.x |

## 项目结构

```
src/main/agent/      # Agent 会话管理、工具注册、权限控制
src/main/workflow/   # 工作流引擎 (DAG)
src/main/sandbox/    # Docker 代码沙箱
src/preload/         # contextBridge 预加载脚本
src/renderer/src/
  components/        # UI 组件（__tests__/ 下为组件测试）
  stores/            # Zustand 状态管理
  hooks/             # 自定义 hooks
  lib/               # 工具函数
  locales/           # 国际化 (zh.json / en.json)
packages/shared-types/  # IPC 共享类型
test/e2e/            # Playwright E2E
```

## 开发命令

```bash
pnpm dev           # 启动开发环境
pnpm build         # 构建
pnpm lint          # oxlint --fix
pnpm fmt           # oxfmt
pnpm test          # 监视模式 vitest
pnpm test:run      # 单次运行所有 vitest 测试
pnpm test:e2e      # Playwright E2E (需先 build)
pnpm typecheck     # 类型检查
```

## 通用约定

- **组件文件**: PascalCase.tsx，**工具/库**: camelCase.ts，**Store**: kebab-case.ts
- **注释语言**: 中文，关键逻辑处添加，避免冗余
- **提交前必须**: `pnpm test:run` 全部通过
- 详细规范见对应知识文件

## 知识文件索引

需要时读取对应文件（不自动加载）：

| 文件 | 内容 | 何时读取 |
|------|------|----------|
| `.claude/rules/architecture.md` | IPC 通信、Agent 会话、工作流、安全模型、权限控制 | 涉及主进程、IPC、Agent 架构时 |
| `.claude/rules/ui.md` | UI 组件规范、i18n、JSX 条件渲染、动画 | 涉及 UI 开发、国际化时 |
| `.claude/rules/testing.md` | TDD 流程、测试策略、Mock 注意事项 | 编写或调试测试时 |
