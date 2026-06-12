---
name: i18n-integration
description: 为 React 组件添加 i18n 国际化支持。自动检测硬编码字符串，生成翻译键，并更新 zh.json 和 en.json。
metadata:
  author: pencil-agent
  version: "1.0"
---

# i18n 国际化集成

为组件添加中英文国际化支持。

## 输入

用户提供：
- 组件文件路径
- 或组件名称（自动推断路径）

## 步骤

### 1. 分析组件硬编码文本

读取目标组件，识别所有硬编码的中文/英文字符串：
- JSX 中的文本节点
- `placeholder`、`title`、`aria-label` 等属性值
- `console.log` 中的用户可见文本（可选）

```bash
# 示例：查找硬编码字符串
grep -n '[\u4e00-\u9fa5]' src/renderer/src/components/xxx/Component.tsx
```

### 2. 确定翻译键命名

按模块组织翻译键：

| 组件位置 | 模块前缀 | 示例 |
|----------|----------|------|
| `components/chat/` | `chat.*` | `chat.inputPlaceholder` |
| `components/settings/` | `settings.*` | `settings.apiKey` |
| `components/sidebar/` | `sidebar.*` | `sidebar.noSessions` |
| `components/workflow/` | `workflow.*` | `workflow.addNode` |
| `components/role-manager/` | `role.*` | `role.editor` |
| `components/permission/` | `permission.*` | `permission.confirm` |
| `components/memory/` | `memory.*` | `memory.search` |
| `components/code-editor/` | `editor.*` | `editor.noOpenFiles` |

### 3. 修改组件代码

**添加 hook 导入：**
```tsx
import { useTranslation } from 'react-i18next'
```

**在组件内部调用：**
```tsx
const { t } = useTranslation()
```

**替换硬编码文本：**
```tsx
// 之前
<button>保存</button>
<input placeholder="输入消息..." />

// 之后
<button>{t('common.save')}</button>
<input placeholder={t('chat.inputPlaceholder')} />
```

**条件渲染中的文本：**
```tsx
// 之前
{isLoading ? '加载中...' : '完成'}

// 之后
{isLoading ? t('common.loading') : t('common.done')}
```

### 4. 更新翻译文件

**zh.json** (`src/renderer/src/locales/zh.json`)：
```json
{
  "chat": {
    "inputPlaceholder": "输入消息...",
    "send": "发送"
  }
}
```

**en.json** (`src/renderer/src/locales/en.json`)：
```json
{
  "chat": {
    "inputPlaceholder": "Type a message...",
    "send": "Send"
  }
}
```

### 5. 验证

1. 运行类型检查：
```bash
pnpm typecheck
```

2. 运行组件测试（如有）：
```bash
pnpm test:run -- --reporter=verbose src/renderer/src/components/xxx/__tests__/
```

3. 手动验证：切换语言确认文本正确显示

## 护栏

- 新增文本**必须**同时更新 `zh.json` 和 `en.json`
- 翻译键使用 `module.submodule.key` 格式
- 保持键名简洁且语义明确
- 避免过度拆分：一个短语一个键，不要把句子拆成单词
- 参数化文本使用 `{{variable}}` 格式：`"{{count}} 分钟前"`
- 不要翻译：品牌名、技术术语、代码示例

## 翻译键速查

| 常用键 | 中文 | 英文 |
|--------|------|------|
| `common.ok` | 确定 | OK |
| `common.cancel` | 取消 | Cancel |
| `common.save` | 保存 | Save |
| `common.delete` | 删除 | Delete |
| `common.edit` | 编辑 | Edit |
| `common.search` | 搜索 | Search |
| `common.loading` | 加载中... | Loading... |
| `common.error` | 错误 | Error |
| `common.success` | 成功 | Success |
| `common.noData` | 暂无数据 | No data |

## 示例：为 StatusBar 添加 i18n

**输入：** `StatusBar.tsx` 包含 `已连接`、`已断开`、`检查中...` 等硬编码文本

**修改：**
```tsx
import { useTranslation } from 'react-i18next'

export function StatusBar() {
  const { t } = useTranslation()
  
  return (
    <div>
      {match(status)
        .with('connected', () => <span>{t('status.connected')}</span>)
        .with('disconnected', () => <span>{t('status.disconnected')}</span>)
        .with('checking', () => <span>{t('status.checking')}</span>)
        .exhaustive()}
    </div>
  )
}
```

**zh.json 添加：**
```json
{
  "status": {
    "connected": "已连接",
    "disconnected": "已断开",
    "checking": "检查中..."
  }
}
```

**en.json 添加：**
```json
{
  "status": {
    "connected": "Connected",
    "disconnected": "Disconnected",
    "checking": "Checking..."
  }
}
```
