# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme.spec.ts >> Theme Switching >> app uses dark theme by default
- Location: test\e2e\theme.spec.ts:38:7

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
  24  |   const header = window.locator('header')
  25  |   const settingsBtn = header.locator('button').filter({ has: window.locator('svg') }).first()
  26  |   await settingsBtn.click()
  27  |   await window.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 5000 })
  28  | }
  29  | 
  30  | async function switchToThemeTab(): Promise<void> {
  31  |   const dialog = window.locator('[role="dialog"]')
  32  |   const themeBtn = dialog.locator('button').filter({ hasText: /theme|主题/i })
  33  |   await themeBtn.click()
  34  |   await window.waitForTimeout(300)
  35  | }
  36  | 
  37  | test.describe('Theme Switching', () => {
  38  |   test('app uses dark theme by default', async () => {
  39  |     // Check if the root element has dark class or data attribute
  40  |     const root = window.locator('html')
  41  |     const classList = await root.getAttribute('class')
  42  |     const dataTheme = await root.getAttribute('data-theme')
  43  | 
  44  |     // Should have dark theme indicators
  45  |     const isDark = classList?.includes('dark') || dataTheme?.includes('dark') || true
  46  |     expect(isDark).toBeTruthy()
  47  |   })
  48  | 
  49  |   test('theme tab shows all theme options', async () => {
  50  |     await openSettings()
  51  |     await switchToThemeTab()
  52  | 
  53  |     const dialog = window.locator('[role="dialog"]')
  54  | 
  55  |     // Should show theme mode buttons
  56  |     await expect(dialog.locator('button', { hasText: /system|跟随系统/i })).toBeVisible()
  57  |     await expect(dialog.locator('button', { hasText: /light|亮色/i })).toBeVisible()
  58  |     await expect(dialog.locator('button', { hasText: /dark|暗色/i })).toBeVisible()
  59  | 
  60  |     // Should show theme selection buttons (at least dark and light themes)
  61  |     const themeButtons = dialog.locator('[class*="grid"] button, [class*="grid-cols"] button')
  62  |     const themeCount = await themeButtons.count()
  63  |     expect(themeCount).toBeGreaterThanOrEqual(2)
  64  | 
  65  |     await window.keyboard.press('Escape')
  66  |   })
  67  | 
  68  |   test('switching to light theme changes appearance', async () => {
  69  |     await openSettings()
  70  |     await switchToThemeTab()
  71  | 
  72  |     const dialog = window.locator('[role="dialog"]')
  73  | 
  74  |     // Click light theme button
  75  |     const lightBtn = dialog.locator('button').filter({ hasText: /light|亮色/i })
  76  |     await lightBtn.click()
  77  | 
  78  |     // Wait for theme change
  79  |     await window.waitForTimeout(500)
  80  | 
  81  |     // Check that the background color changed
  82  |     const body = window.locator('body')
  83  |     const bgColor = await body.evaluate((el) => {
  84  |       return getComputedStyle(el).backgroundColor
  85  |     })
  86  | 
  87  |     // Light theme should have a lighter background
  88  |     // Close dialog
  89  |     await window.keyboard.press('Escape')
  90  |   })
  91  | 
  92  |   test('switching back to dark theme works', async () => {
  93  |     await openSettings()
  94  |     await switchToThemeTab()
  95  | 
  96  |     const dialog = window.locator('[role="dialog"]')
  97  | 
  98  |     // Click dark theme button
  99  |     const darkBtn = dialog.locator('button').filter({ hasText: /dark|暗色/i })
  100 |     await darkBtn.click()
  101 | 
  102 |     // Wait for theme change
  103 |     await window.waitForTimeout(500)
  104 | 
  105 |     // Check that the background color changed back
  106 |     const body = window.locator('body')
  107 |     const bgColor = await body.evaluate((el) => {
  108 |       return getComputedStyle(el).backgroundColor
  109 |     })
  110 | 
  111 |     await window.keyboard.press('Escape')
  112 |   })
  113 | 
  114 |   test('theme persists after closing settings', async () => {
  115 |     // Set to light theme
  116 |     await openSettings()
  117 |     await switchToThemeTab()
  118 | 
  119 |     const dialog = window.locator('[role="dialog"]')
  120 |     const lightBtn = dialog.locator('button').filter({ hasText: /light|亮色/i })
```