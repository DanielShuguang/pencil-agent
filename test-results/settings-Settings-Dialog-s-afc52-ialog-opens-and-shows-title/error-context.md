# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.ts >> Settings Dialog >> settings dialog opens and shows title
- Location: test\e2e\settings.spec.ts:48:7

# Error details

```
"beforeAll" hook timeout of 60000ms exceeded.
```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test'
  2   | import path from 'path'
  3   | 
  4   | const APP_ROOT = path.resolve(__dirname, '../..')
  5   | const MAIN_ENTRY = path.join(APP_ROOT, 'out/main/index.mjs')
  6   | 
  7   | let electronApp: ElectronApplication
  8   | let window: Page
  9   | 
  10  | test.beforeAll(async () => {
  11  |   electronApp = await _electron.launch({
  12  |     args: [MAIN_ENTRY],
  13  |     cwd: APP_ROOT,
  14  |   })
  15  |   window = await electronApp.firstWindow()
  16  |   await window.waitForLoadState('domcontentloaded')
  17  | })
  18  | 
  19  | test.afterAll(async () => {
> 20  |   await electronApp.close()
      |                     ^ TypeError: Cannot read properties of undefined (reading 'close')
  21  | })
  22  | 
  23  | async function openSettings(): Promise<void> {
  24  |   // Find settings button in header (the button before window controls)
  25  |   const header = window.locator('header')
  26  |   const settingsBtn = header.locator('button').filter({ has: window.locator('svg.lucide-settings, [class*="settings"]') })
  27  |   if (await settingsBtn.isVisible()) {
  28  |     await settingsBtn.click()
  29  |   } else {
  30  |     // Fallback: click the first button that's not a tab
  31  |     const allBtns = header.locator('button')
  32  |     const count = await allBtns.count()
  33  |     // Settings is usually the 4th button (after chat, editor, workflow)
  34  |     for (let i = 0; i < count; i++) {
  35  |       const btn = allBtns.nth(i)
  36  |       const text = await btn.textContent()
  37  |       if (!text?.includes('Chat') && !text?.includes('Editor') && !text?.includes('Workflow') &&
  38  |           !text?.includes('聊天') && !text?.includes('编辑器') && !text?.includes('工作流')) {
  39  |         await btn.click()
  40  |         break
  41  |       }
  42  |     }
  43  |   }
  44  |   await window.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 })
  45  | }
  46  | 
  47  | test.describe('Settings Dialog', () => {
  48  |   test('settings dialog opens and shows title', async () => {
  49  |     await openSettings()
  50  |     const dialog = window.locator('[role="dialog"]')
  51  |     await expect(dialog).toBeVisible()
  52  |     // Should have a title with "Settings" or "设置"
  53  |     const title = dialog.locator('[class*="DialogTitle"], h2')
  54  |     await expect(title).toBeVisible()
  55  |     await window.keyboard.press('Escape')
  56  |   })
  57  | 
  58  |   test('settings dialog has tab buttons', async () => {
  59  |     await openSettings()
  60  |     const dialog = window.locator('[role="dialog"]')
  61  |     // Should have tabs: API Keys, Models, Language, Theme
  62  |     const buttons = dialog.locator('button')
  63  |     const count = await buttons.count()
  64  |     expect(count).toBeGreaterThanOrEqual(4) // At least 4 tabs + check update button
  65  |     await window.keyboard.press('Escape')
  66  |   })
  67  | 
  68  |   test('settings dialog can switch to language tab', async () => {
  69  |     await openSettings()
  70  |     const dialog = window.locator('[role="dialog"]')
  71  | 
  72  |     // Find and click language tab
  73  |     const langBtn = dialog.locator('button').filter({ hasText: /language|语言/i })
  74  |     await langBtn.click()
  75  | 
  76  |     // Should show language options
  77  |     await expect(dialog.locator('button', { hasText: /chinese|中文/i })).toBeVisible()
  78  |     await expect(dialog.locator('button', { hasText: /english|english/i })).toBeVisible()
  79  | 
  80  |     await window.keyboard.press('Escape')
  81  |   })
  82  | 
  83  |   test('settings dialog can switch to theme tab', async () => {
  84  |     await openSettings()
  85  |     const dialog = window.locator('[role="dialog"]')
  86  | 
  87  |     // Find and click theme tab
  88  |     const themeBtn = dialog.locator('button').filter({ hasText: /theme|主题/i })
  89  |     await themeBtn.click()
  90  | 
  91  |     // Should show theme mode options
  92  |     await expect(dialog.locator('button', { hasText: /system|跟随系统/i })).toBeVisible()
  93  |     await expect(dialog.locator('button', { hasText: /light|亮色/i })).toBeVisible()
  94  |     await expect(dialog.locator('button', { hasText: /dark|暗色/i })).toBeVisible()
  95  | 
  96  |     await window.keyboard.press('Escape')
  97  |   })
  98  | 
  99  |   test('settings dialog can switch language to English', async () => {
  100 |     await openSettings()
  101 |     const dialog = window.locator('[role="dialog"]')
  102 | 
  103 |     // Click language tab
  104 |     const langBtn = dialog.locator('button').filter({ hasText: /language|语言/i })
  105 |     await langBtn.click()
  106 | 
  107 |     // Click English button
  108 |     const enBtn = dialog.locator('button', { hasText: /english/i })
  109 |     await enBtn.click()
  110 | 
  111 |     // Wait for language change to propagate
  112 |     await window.waitForTimeout(500)
  113 | 
  114 |     // Close and reopen settings - title should be in English
  115 |     await window.keyboard.press('Escape')
  116 |     await window.waitForTimeout(300)
  117 |     await openSettings()
  118 | 
  119 |     const newDialog = window.locator('[role="dialog"]')
  120 |     const title = newDialog.locator('[class*="DialogTitle"], h2')
```