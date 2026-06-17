# Per-Session Model Selection Design

## [S1] Problem

当前系统中，模型选择是全局的，所有对话共享同一个模型。用户希望每个对话可以独立选择模型，以便在不同对话中使用不同的模型。

## [S2] Solution Overview

采用"全局默认 + 独立覆盖"方案：
- 保留全局默认模型，新创建的对话使用默认模型
- 每个对话可以独立切换模型，不影响其他对话
- 切换模型仅影响后续消息，历史消息保持原模型

## [S3] Data Structure Changes

### SessionMeta 接口扩展

```typescript
export interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }  // 创建时的模型（历史记录）
  currentModel: { id: string; provider: string }  // 当前使用的模型
  cwd?: string
  createdAt: number
  updatedAt: number
  messageCount: number
  parentSessionId?: string
  branchPointMessageId?: string
}
```

### AgentState 接口扩展

```typescript
interface AgentState {
  // 现有字段...
  defaultModel: { id: string; provider: string }  // 全局默认模型
  
  // 新增方法
  switchSessionModel: (model: { id: string; provider: string }) => void
  switchDefaultModel: (model: { id: string; provider: string }) => void
}
```

## [S4] Store Modifications

### agent-store.ts 修改

1. **添加 defaultModel 状态**
   - 从 localStorage 读取默认模型
   - 提供 switchDefaultModel 方法

2. **修改 createSession 方法**
   - 使用上一个会话的 currentModel（如果存在）
   - 如果没有上一个会话，使用 defaultModel

3. **修改 createBranch 方法**
   - 继承父会话的 currentModel

4. **添加 switchSessionModel 方法**
   - 更新当前会话的 currentModel
   - 持久化到 localStorage

5. **修改 sendMessage 方法**
   - 使用当前会话的 currentModel 而不是全局的 currentModel

## [S5] UI Modifications

### ChatPanel.tsx

- 修改 ModelSelector 使用当前会话的 currentModel
- 切换模型时调用 switchSessionModel

### StatusBar.tsx

- 移除模型显示和选择器
- 保留其他状态信息（连接状态、token 使用量等）

### SessionItem.tsx

- 移除模型显示（第69行）
- 只显示标题、项目路径和时间

### Settings 页面

- 添加全局默认模型配置
- 使用 ModelSelector 组件选择默认模型

## [S6] Behavior Specifications

### 创建新会话

1. 获取上一个会话的 currentModel（如果存在）
2. 如果没有上一个会话，使用 defaultModel
3. 将模型设置为新会话的 currentModel

### 切换会话模型

1. 用户在聊天面板顶部选择新模型
2. 更新当前会话的 currentModel
3. 持久化到 localStorage
4. 后续消息使用新模型

### 创建分支会话

1. 继承父会话的 currentModel
2. 分支会话可以独立切换模型

### 发送消息

1. 从当前会话的 currentModel 获取模型
2. 使用该模型发送消息

## [S7] Persistence

- **defaultModel**: 存储在 localStorage
- **会话模型**: 存储在 SessionMeta 中，随会话一起持久化

## [S8] Migration Strategy

1. 添加 currentModel 字段到 SessionMeta
2. 对于现有会话，将 model 字段复制到 currentModel
3. 添加 defaultModel 到 agent-store
4. 从 localStorage 读取现有 currentModel 作为 defaultModel

## [S9] Testing Strategy

1. **单元测试**
   - 测试 switchSessionModel 方法
   - 测试 createSession 继承逻辑
   - 测试 createBranch 继承逻辑

2. **集成测试**
   - 测试模型切换后消息发送使用正确模型
   - 测试会话持久化和恢复

3. **E2E 测试**
   - 测试完整的模型切换流程
   - 测试多会话模型独立性

## [S10] Success Criteria

1. 每个对话可以独立选择模型
2. 切换模型仅影响后续消息
3. 新创建的对话继承上一个对话的模型
4. 分支对话继承父对话的模型
5. 设置页面可以配置全局默认模型
6. 所有现有测试通过
