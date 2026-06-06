# UI 开发知识

## 组件规范

**可用 UI 组件** (`src/renderer/src/components/ui/`)：button, input, textarea, label, dialog, alert-dialog, select, popover, scroll-area, tooltip, checkbox, resize-handle, loading

**核心规则：**
1. **禁止使用原生 HTML 交互组件**：`<select>`、`<dialog>`、`<input type="dialog">`
2. **禁止使用浏览器弹窗**：`alert()`、`confirm()`、`prompt()`
3. **优先使用 Radix UI** 封装的组件
4. **新组件统一放在** `src/renderer/src/components/ui/`
5. **样式**：Tailwind CSS + `cn()` 合并

```tsx
// ❌ 错误
<select value={value} onChange={e => setValue(e.target.value)}>
  <option value="a">A</option>
</select>

// ✅ 正确
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
<Select value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
</Select>
```

## Dialog 布局

Dialog 使用 flex 布局，Header/Footer 固定不滚动，中间用 `DialogBody`（`flex-1 overflow-y-auto p-6`）：

```tsx
<DialogContent>
  <DialogHeader><DialogTitle>标题</DialogTitle></DialogHeader>
  <DialogBody>{/* 可滚动内容 */}</DialogBody>
  <DialogFooter><Button>确定</Button></DialogFooter>
</DialogContent>
```

## 国际化 (i18n)

```typescript
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
return <button>{t('common.save')}</button>
```

翻译键按模块组织：`common.*`、`chat.*`、`settings.*`、`workflow.*`、`role.*`、`permission.*`、`memory.*`、`status.*`
新增文本必须同时更新 `zh.json` 和 `en.json`。

## JSX 条件渲染

3 个或更多分支必须使用 `ts-pattern` 的 `match`，禁止三元链和 switch：

```tsx
import { match } from 'ts-pattern'

{match(status)
  .with('connected', () => <Wifi />)
  .with('disconnected', () => <WifiOff />)
  .with('checking', () => <Loader2 />)
  .exhaustive()}
```

二元判断仍可用三元：`{isGenerating ? <StopButton /> : <SendButton />}`

## 动画

- **列表增删排序**：使用 `@formkit/auto-animate` 的 `useListAnimate()` hook
- **CSS 过渡**：Tailwind `transition-*` 类（transition-colors、transition-opacity 等）
- **弹窗动画**：`tw-animate-css` 提供（dialog 的 animate-in/fade-in 等），无需额外配置

## 弹窗与浮动层

- Dialog/AlertDialog：`max-w-*` 控制宽度，`max-h-[90vh]` + flex 布局防止溢出
- Popover：`max-h-[80vh] overflow-y-auto`
- Select：已有 `max-h-96` 和 Radix 自动避让
- ModelSelector 使用 Popover 组件，自动避让窗口边界
