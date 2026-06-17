# Per-Session Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现每个对话独立选择模型的功能，采用"全局默认 + 独立覆盖"方案

**Architecture:** 扩展现有 SessionMeta 结构，添加 currentModel 字段，修改 agent-store 的状态管理逻辑，更新 UI 组件以支持每个对话独立的模型选择

**Tech Stack:** React, TypeScript, Zustand, localStorage

---

## File Structure

### 需要修改的文件

1. **`src/renderer/src/stores/agent-store.ts`**
   - 添加 `defaultModel` 状态
   - 修改 `SessionMeta` 接口，添加 `currentModel` 字段
   - 修改 `AgentState` 接口，添加新方法
   - 修改 `createSession`、`createBranch`、`sendMessage` 等方法

2. **`src/renderer/src/components/chat/ModelSelector.tsx`**
   - 修改为使用当前会话的 `currentModel`
   - 切换模型时调用 `switchSessionModel`

3. **`src/renderer/src/components/chat/ChatPanel.tsx`**
   - 传递当前会话的模型信息给 ModelSelector

4. **`src/renderer/src/components/layout/StatusBar.tsx`**
   - 移除模型显示和选择器

5. **`src/renderer/src/components/sidebar/SessionItem.tsx`**
   - 移除模型显示

6. **`src/renderer/src/stores/status-store.ts`**
   - 移除模型相关的状态和方法

### 需要创建的文件

1. **`src/renderer/src/components/settings/DefaultModelSettings.tsx`**
   - 全局默认模型配置组件

---

## Task 1: 扩展 SessionMeta 接口

**Covers:** [S3]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts:59-69`

- [ ] **Step 1: 修改 SessionMeta 接口**

```typescript
// 会话元数据
export interface SessionMeta {
  id: string
  title: string
  model: { id: string; provider: string }  // 创建时的模型（历史记录）
  currentModel: { id: string; provider: string }  // 当前使用的模型
  cwd?: string
  createdAt: number
  updatedAt: number
  messageCount: number
  parentSessionId?: string  // 父会话 ID（分支功能）
  branchPointMessageId?: string  // 分支点消息 ID
}
```

- [ ] **Step 2: 添加 defaultModel 到 AgentState 接口**

```typescript
// Agent 状态接口
interface AgentState {
  sessions: Map<string, Message[]>
  sessionMetas: Map<string, SessionMeta>
  activeSessionId: string | null
  isGenerating: boolean
  defaultModel: { id: string; provider: string }  // 全局默认模型
  language: 'zh' | 'en'

  initFromStorage: () => void
  syncModelWithProviders: () => Promise<void>
  createSession: (cwd: string) => Promise<string>
  deleteSession: (id: string) => void
  sendMessage: (content: string) => void
  stopGeneration: () => void
  switchSession: (id: string) => void
  validateAndSwitchSession: (id: string) => Promise<boolean>
  appendChunk: (chunk: AgentChunk) => void
  switchSessionModel: (model: { id: string; provider: string }) => void
  switchDefaultModel: (model: { id: string; provider: string }) => void
  createBranch: (messageId: string) => Promise<string | null>
  getBranches: () => SessionMeta[]
  setLanguage: (lang: 'zh' | 'en') => void
}
```

- [ ] **Step 3: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 扩展 SessionMeta 接口，添加 currentModel 字段"
```

---

## Task 2: 修改 agent-store 状态初始化

**Covers:** [S4, S7]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts:221-230`

- [ ] **Step 1: 修改初始状态**

```typescript
export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: new Map(),
  sessionMetas: new Map(),
  activeSessionId: null,
  isGenerating: false,
  defaultModel: getStorageItem<{ id: string; provider: string }>('defaultModel', {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  }),
  language: getStorageItem<'zh' | 'en'>('language', 'zh'),
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 添加 defaultModel 状态初始化"
```

---

## Task 3: 修改 createSession 方法

**Covers:** [S4, S6]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts:293-323`

- [ ] **Step 1: 修改 createSession 方法**

```typescript
createSession: async (cwd: string) => {
  const { sessionMetas, defaultModel } = get()
  
  // 获取上一个会话的 currentModel，如果没有则使用 defaultModel
  const lastSession = Array.from(sessionMetas.values())
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const model = lastSession?.currentModel || defaultModel
  
  const id = `session-${Date.now()}`
  await window.api.agent.create({
    sessionId: id,
    model,
    cwd,
  })

  const meta: SessionMeta = {
    id,
    title: i18n.t('app.newConversation'),
    model,  // 创建时的模型
    currentModel: model,  // 当前使用的模型
    cwd,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  }

  const sessions = new Map(get().sessions)
  const sessionMetas = new Map(get().sessionMetas)
  sessions.set(id, [])
  sessionMetas.set(id, meta)

  setStorageItem('sessionIds', Array.from(sessions.keys()))
  setStorageItem('activeSessionId', id)
  persistSession(meta, [])

  set({ sessions, sessionMetas, activeSessionId: id })
  return id
},
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 修改 createSession 方法，继承上一个会话的模型"
```

---

## Task 4: 修改 createBranch 方法

**Covers:** [S4, S6]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts:520-566`

- [ ] **Step 1: 修改 createBranch 方法**

```typescript
createBranch: async (messageId: string) => {
  const { activeSessionId, sessions, sessionMetas } = get()
  if (!activeSessionId) return null

  const messages = sessions.get(activeSessionId) || []
  const branchIndex = messages.findIndex((m) => m.id === messageId)
  if (branchIndex === -1) return null

  const branchMessages = messages.slice(0, branchIndex + 1)
  const branchId = `branch-${Date.now()}`
  const parentMeta = sessionMetas.get(activeSessionId)
  const branchCwd = parentMeta?.cwd

  if (!branchCwd) return null

  // 继承父会话的 currentModel
  const model = parentMeta?.currentModel || get().defaultModel

  await window.api.agent.create({
    sessionId: branchId,
    model,
    cwd: branchCwd,
  })

  const meta: SessionMeta = {
    id: branchId,
    title: i18n.t('app.branchTitle', {
      title: sessionMetas.get(activeSessionId)?.title || i18n.t('app.newConversation'),
    }),
    model,  // 创建时的模型
    currentModel: model,  // 当前使用的模型
    cwd: branchCwd,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: branchMessages.length,
    parentSessionId: activeSessionId,
    branchPointMessageId: messageId,
  }

  const newSessions = new Map(sessions)
  const newMetas = new Map(sessionMetas)
  newSessions.set(branchId, branchMessages)
  newMetas.set(branchId, meta)

  setStorageItem('sessionIds', Array.from(newSessions.keys()))
  setStorageItem('activeSessionId', branchId)
  persistSession(meta, branchMessages)

  set({ sessions: newSessions, sessionMetas: newMetas, activeSessionId: branchId })
  return branchId
},
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 修改 createBranch 方法，继承父会话的模型"
```

---

## Task 5: 添加 switchSessionModel 方法

**Covers:** [S4, S6]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts`

- [ ] **Step 1: 添加 switchSessionModel 方法**

在 `switchModel` 方法之后添加：

```typescript
switchSessionModel: (model: { id: string; provider: string }) => {
  const { activeSessionId, sessionMetas } = get()
  if (!activeSessionId) return

  const meta = sessionMetas.get(activeSessionId)
  if (!meta) return

  const updatedMeta = { ...meta, currentModel: model, updatedAt: Date.now() }
  const newMetas = new Map(sessionMetas)
  newMetas.set(activeSessionId, updatedMeta)

  // 持久化
  persistSession(updatedMeta, get().sessions.get(activeSessionId) || [])

  set({ sessionMetas: newMetas })
},
```

- [ ] **Step 2: 添加 switchDefaultModel 方法**

```typescript
switchDefaultModel: (model: { id: string; provider: string }) => {
  setStorageItem('defaultModel', model)
  set({ defaultModel: model })
},
```

- [ ] **Step 3: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 添加 switchSessionModel 和 switchDefaultModel 方法"
```

---

## Task 6: 修改 sendMessage 方法

**Covers:** [S4, S6]

**Files:**
- Modify: `src/renderer/src/stores/agent-store.ts:344-378`

- [ ] **Step 1: 修改 sendMessage 方法**

```typescript
sendMessage: (content: string) => {
  const { activeSessionId, sessionMetas } = get()
  if (!activeSessionId) return

  // 使用当前会话的 currentModel
  const meta = sessionMetas.get(activeSessionId)
  if (!meta) return
  const model = meta.currentModel

  const sessions = new Map(get().sessions)
  const metas = new Map(get().sessionMetas)
  const prev = sessions.get(activeSessionId) || []
  const newMessages = [
    ...prev,
    {
      id: generateMessageId(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    },
  ]

  const truncatedMessages = truncateMessages(newMessages)
  sessions.set(activeSessionId, truncatedMessages)

  if (meta) {
    const updatedMeta = {
      ...meta,
      title: prev.length === 0 ? content.slice(0, 30) : meta.title,
      updatedAt: Date.now(),
      messageCount: truncatedMessages.length,
    }
    metas.set(activeSessionId, updatedMeta)
    persistSession(updatedMeta, truncatedMessages)
  }

  set({ sessions, sessionMetas: metas, isGenerating: true })
  window.api.agent.prompt(activeSessionId, content, model)
},
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/stores/agent-store.ts
git commit -m "feat: 修改 sendMessage 方法，使用当前会话的模型"
```

---

## Task 7: 修改 ModelSelector 组件

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/components/chat/ModelSelector.tsx`

- [ ] **Step 1: 修改 ModelSelector 组件**

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentStore } from '../../stores/agent-store'
import { useModelConfigStore } from '../../stores/model-config-store'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface ModelSelectorProps {
  showTrigger?: boolean
  mode?: 'session' | 'default'  // 新增：选择模式
}

export function ModelSelector({ showTrigger = true, mode = 'session' }: ModelSelectorProps) {
  const { activeSessionId, sessionMetas, defaultModel, switchSessionModel, switchDefaultModel } = useAgentStore()
  const { providers, fetchProviders } = useModelConfigStore()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // 根据模式获取当前模型
  const currentModel = mode === 'session' 
    ? (activeSessionId ? sessionMetas.get(activeSessionId)?.currentModel : null) || defaultModel
    : defaultModel

  const currentProvider = providers.find((p) => p.id === currentModel.provider)
  const currentModelInfo = currentProvider?.models.find((m) => m.id === currentModel.id)

  const filteredProviders = providers
    .map((provider) => ({
      ...provider,
      models: provider.models.filter(
        (model) =>
          model.visible !== false &&
          (model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.name.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    }))
    .filter((provider) => provider.models.length > 0)

  const handleSelect = (providerId: string, modelId: string) => {
    const model = { id: modelId, provider: providerId }
    if (mode === 'session') {
      switchSessionModel(model)
    } else {
      switchDefaultModel(model)
    }
    setIsOpen(false)
    setSearchQuery('')
  }

  const modelList = (
    <div className='w-80'>
      <div className='p-2'>
        <input
          type='text'
          placeholder={t('settings.searchModels')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full px-3 py-1.5 text-sm border rounded-md bg-background'
        />
      </div>

      <div className='max-h-64 overflow-y-auto'>
        {filteredProviders.length === 0 ? (
          <div className='p-4 text-sm text-muted-foreground text-center'>{t('settings.noModelsFound')}</div>
        ) : (
          filteredProviders.map((provider) => (
            <div key={provider.id} className='p-2'>
              <div className='px-2 py-1 text-xs font-medium text-muted-foreground'>
                {provider.name}
              </div>
              {provider.models.map((model) => (
                <button
                  key={model.id}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    currentModel.provider === provider.id && currentModel.id === model.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleSelect(provider.id, model.id)}
                >
                  {model.name}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )

  if (!showTrigger) {
    return modelList
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className='flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors'>
          <span className='text-muted-foreground'>
            {currentProvider?.name || currentModel.provider}
          </span>
          <span className='font-medium'>{currentModelInfo?.name || currentModel.id}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' sideOffset={4} className='p-0 w-auto'>
        {modelList}
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/components/chat/ModelSelector.tsx
git commit -m "feat: 修改 ModelSelector 组件，支持会话和默认两种模式"
```

---

## Task 8: 修改 ChatPanel 组件

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/components/chat/ChatPanel.tsx`

- [ ] **Step 1: 修改 ChatPanel 组件**

```typescript
<ModelSelector mode='session' />
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/components/chat/ChatPanel.tsx
git commit -m "feat: 修改 ChatPanel，使用会话模式的 ModelSelector"
```

---

## Task 9: 修改 StatusBar 组件

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/components/layout/StatusBar.tsx`

- [ ] **Step 1: 移除模型显示**

移除以下代码：
- 第 14 行：`currentModel,`
- 第 23 行：`const { currentModel: agentModel, isGenerating: agentIsGenerating, activeSessionId, sessionMetas } = useAgentStore()`
- 第 28-30 行：`useEffect` 中的 `syncFromAgentStore` 调用
- 第 61-76 行：模型显示的 Popover 组件

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/components/layout/StatusBar.tsx
git commit -m "feat: 移除 StatusBar 中的模型显示"
```

---

## Task 10: 修改 SessionItem 组件

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/components/sidebar/SessionItem.tsx`

- [ ] **Step 1: 移除模型显示**

移除第 67-73 行：
```typescript
<div className='flex items-center gap-2 text-xs text-muted-foreground'>
  <span>
    {meta.model.provider}/{meta.model.id}
  </span>
  <span>·</span>
  <span>{formatTime(meta.updatedAt, i18n.language, t)}</span>
</div>
```

替换为：
```typescript
<div className='flex items-center gap-2 text-xs text-muted-foreground'>
  <span>{formatTime(meta.updatedAt, i18n.language, t)}</span>
</div>
```

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/components/sidebar/SessionItem.tsx
git commit -m "feat: 移除 SessionItem 中的模型显示"
```

---

## Task 11: 修改 status-store

**Covers:** [S5]

**Files:**
- Modify: `src/renderer/src/stores/status-store.ts`

- [ ] **Step 1: 移除模型相关的状态和方法**

移除以下内容：
- 第 8 行：`currentModel: { id: string; provider: string }`
- 第 23 行：`currentModel: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },`
- 第 46-50 行：`checkConnection` 方法中的模型相关代码
- 第 65-67 行：`syncFromAgentStore` 方法

- [ ] **Step 2: 提交更改**

```bash
git add src/renderer/src/stores/status-store.ts
git commit -m "feat: 移除 status-store 中的模型相关状态"
```

---

## Task 12: 创建 DefaultModelSettings 组件

**Covers:** [S5]

**Files:**
- Create: `src/renderer/src/components/settings/DefaultModelSettings.tsx`

- [ ] **Step 1: 创建 DefaultModelSettings 组件**

```typescript
import { useTranslation } from 'react-i18next'
import { ModelSelector } from '../chat/ModelSelector'

export function DefaultModelSettings() {
  const { t } = useTranslation()

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-medium'>{t('settings.defaultModel')}</h3>
        <p className='text-sm text-muted-foreground'>
          {t('settings.defaultModelDescription')}
        </p>
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium'>{t('settings.model')}:</span>
        <ModelSelector mode='default' />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 添加翻译键**

在 `src/renderer/src/locales/zh.json` 中添加：
```json
{
  "settings": {
    "defaultModel": "默认模型",
    "defaultModelDescription": "新创建的对话将使用此模型"
  }
}
```

在 `src/renderer/src/locales/en.json` 中添加：
```json
{
  "settings": {
    "defaultModel": "Default Model",
    "defaultModelDescription": "New conversations will use this model"
  }
}
```

- [ ] **Step 3: 提交更改**

```bash
git add src/renderer/src/components/settings/DefaultModelSettings.tsx src/renderer/src/locales/zh.json src/renderer/src/locales/en.json
git commit -m "feat: 创建 DefaultModelSettings 组件"
```

---

## Task 13: 集成测试

**Covers:** [S9]

**Files:**
- Modify: `src/renderer/src/stores/__tests__/agent-store.test.ts`

- [ ] **Step 1: 添加 switchSessionModel 测试**

```typescript
it('switchSessionModel updates currentModel for active session', () => {
  // 创建一个会话
  const store = useAgentStore.getState()
  store.createSession('/test')
  
  // 切换模型
  store.switchSessionModel({ id: 'gpt-4o', provider: 'openai' })
  
  // 验证
  const activeSessionId = store.activeSessionId
  const meta = store.sessionMetas.get(activeSessionId!)
  expect(meta?.currentModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
})
```

- [ ] **Step 2: 添加 createSession 继承测试**

```typescript
it('createSession inherits model from last session', async () => {
  const store = useAgentStore.getState()
  
  // 创建第一个会话并切换模型
  await store.createSession('/test1')
  store.switchSessionModel({ id: 'gpt-4o', provider: 'openai' })
  
  // 创建第二个会话
  await store.createSession('/test2')
  
  // 验证第二个会话继承了第一个会话的模型
  const sessionIds = Array.from(store.sessionMetas.keys())
  const secondSessionMeta = store.sessionMetas.get(sessionIds[1])
  expect(secondSessionMeta?.currentModel).toEqual({ id: 'gpt-4o', provider: 'openai' })
})
```

- [ ] **Step 3: 运行测试**

```bash
pnpm test:run
```

- [ ] **Step 4: 提交更改**

```bash
git add src/renderer/src/stores/__tests__/agent-store.test.ts
git commit -m "test: 添加 switchSessionModel 和 createSession 继承测试"
```

---

## Task 14: E2E 测试

**Covers:** [S9]

**Files:**
- Modify: `test/e2e/chat-header.spec.ts`

- [ ] **Step 1: 添加模型切换 E2E 测试**

```typescript
test('model selector switches model for current session only', async ({ page }) => {
  // 打开应用
  await page.goto('/')
  
  // 创建第一个会话
  await page.click('[data-testid="new-session"]')
  
  // 切换模型
  await page.click('[data-testid="model-selector"]')
  await page.click('text=GPT-4o')
  
  // 创建第二个会话
  await page.click('[data-testid="new-session"]')
  
  // 验证第二个会话使用了继承的模型
  const modelSelector = page.locator('[data-testid="model-selector"]')
  await expect(modelSelector).toContainText('GPT-4o')
})
```

- [ ] **Step 2: 运行 E2E 测试**

```bash
pnpm test:e2e
```

- [ ] **Step 3: 提交更改**

```bash
git add test/e2e/chat-header.spec.ts
git commit -m "test: 添加模型切换 E2E 测试"
```

---

## Task 15: 最终验证

**Covers:** [S10]

- [ ] **Step 1: 运行所有测试**

```bash
pnpm test:run
```

- [ ] **Step 2: 运行类型检查**

```bash
pnpm typecheck
```

- [ ] **Step 3: 运行 lint**

```bash
pnpm lint
```

- [ ] **Step 4: 提交最终更改**

```bash
git add .
git commit -m "feat: 完成每个对话独立模型选择功能"
```
