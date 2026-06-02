## Context

P2 工作流引擎已完成，但应用仍缺少基础用户体验功能：
- 用户无法切换模型（硬编码为 anthropic/claude-sonnet-4-20250514）
- 无法管理 API Key（依赖环境变量）
- 会话数据关闭即丢失
- 只能使用单个会话

当前架构：
- 主进程：AgentSessionManager 管理单个会话
- 渲染进程：agent-store 使用 Map 存储会话（内存）
- IPC：已有 agent:create/prompt/stop 通道

## Goals / Non-Goals

**Goals:**
- 用户可在聊天界面切换 Provider 和模型
- 用户可在设置页面管理 API Key（安全存储）
- 会话数据持久化到 localStorage，启动时恢复
- 支持创建、切换、删除多个会话

**Non-Goals:**
- 不做会话搜索/过滤（后续迭代）
- 不做会话导出/导入
- 不做云端同步
- 不做用户认证系统

## Decisions

### 1. 会话持久化使用 localStorage

**选择**: localStorage

**替代方案**:
- SQLite (better-sqlite3): 更强大但增加依赖复杂度
- electron-store: 需要额外依赖，API 不适合结构化数据

**理由**: 会话数据量小（单用户桌面应用），localStorage 足够，无需额外依赖

### 2. 模型选择器放在 ChatPanel 顶部

**选择**: ChatPanel 顶部下拉框

**替代方案**:
- 设置页面：切换模型需要离开聊天界面
- 侧边栏：占用空间，不够直观

**理由**: 模型切换是高频操作，放在聊天界面顶部最便捷

### 3. API Key 存储使用 safeStorage + localStorage

**选择**: 主进程 safeStorage 加密后存入 localStorage

**替代方案**:
- 纯 localStorage 明文：不安全
- electron-store: 需要额外依赖

**理由**: safeStorage 提供系统级加密，localStorage 提供跨会话持久化

### 4. 会话列表放在左侧边栏

**选择**: AppShell 左侧添加可折叠侧边栏

**替代方案**:
- 顶部 Tab 栏：空间有限
- 右侧面板：与工作流配置面板冲突

**理由**: 左侧边栏是聊天应用的标准模式，用户熟悉

### 5. 多会话管理扩展 agent-store

**选择**: 扩展现有 agent-store，添加持久化逻辑

**替代方案**:
- 新建 session-store：增加状态管理复杂度
- 使用 React Context：不适合全局状态

**理由**: agent-store 已有会话管理逻辑，扩展而非重建

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| localStorage 容量限制（~5MB） | 限制每个会话消息数量（如 100 条），超出时截断 |
| API Key 泄露风险 | 使用 safeStorage 加密，不暴露到渲染进程 |
| 多会话内存占用 | 按需加载会话消息，不活跃会话只保留元数据 |
| localStorage 清空导致数据丢失 | 可选：导出/导入功能（后续迭代） |

## Architecture Changes

### 新增组件

```
src/renderer/src/
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx           # 侧边栏容器
│   │   ├── SessionList.tsx       # 会话列表
│   │   └── SessionItem.tsx       # 单个会话项
│   ├── settings/
│   │   ├── SettingsDialog.tsx    # 设置弹窗
│   │   ├── ApiKeyForm.tsx        # API Key 管理表单
│   │   └── ModelSelector.tsx     # 模型选择器（独立组件）
│   └── chat/
│       └── ChatPanel.tsx         # 修改：集成 ModelSelector
├── stores/
│   ├── agent-store.ts            # 修改：添加持久化和多会话
│   └── settings-store.ts         # 新增：API Key 和模型配置
└── lib/
    └── storage.ts                # 新增：localStorage 封装
```

### IPC 通道变更

```
新增:
  api:save-key    — 保存 API Key (safeStorage 加密)
  api:get-key     — 读取 API Key
  api:get-models  — 获取可用模型列表
```

### 数据模型变更

```typescript
// 会话元数据
interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }
  createdAt: number
  updatedAt: number
  messageCount: number
}

// 持久化数据
interface PersistedData {
  sessions: SessionMeta[]
  activeSessionId: string | null
  messages: Record<string, Message[]>
}
```
