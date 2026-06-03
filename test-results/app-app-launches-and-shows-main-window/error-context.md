# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> app launches and shows main window
- Location: test\e2e\app.spec.ts:23:5

# Error details

```
"beforeAll" hook timeout of 60000ms exceeded.
```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1  | import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test'
  2  | import path from 'path'
  3  | 
  4  | const APP_ROOT = path.resolve(__dirname, '../..')
  5  | const MAIN_ENTRY = path.join(APP_ROOT, 'out/main/index.mjs')
  6  | 
  7  | let electronApp: ElectronApplication
  8  | let window: Page
  9  | 
  10 | test.beforeAll(async () => {
  11 |   electronApp = await _electron.launch({
  12 |     args: [MAIN_ENTRY],
  13 |     cwd: APP_ROOT,
  14 |   })
  15 |   window = await electronApp.firstWindow()
  16 |   await window.waitForLoadState('domcontentloaded')
  17 | })
  18 | 
  19 | test.afterAll(async () => {
> 20 |   await electronApp.close()
     |                     ^ TypeError: Cannot read properties of undefined (reading 'close')
  21 | })
  22 | 
  23 | test('app launches and shows main window', async () => {
  24 |   await expect(window).toHaveTitle(/pencil-agent/i)
  25 |   await expect(window.locator('#root')).toBeVisible()
  26 | })
  27 | 
  28 | test('custom title bar is visible with app name', async () => {
  29 |   const titleBar = window.locator('header')
  30 |   await expect(titleBar).toBeVisible()
  31 |   await expect(titleBar.locator('text=Pencil Agent')).toBeVisible()
  32 | })
  33 | 
  34 | test('title bar has chat, editor, workflow tabs', async () => {
  35 |   const header = window.locator('header')
  36 |   await expect(header.locator('button', { hasText: /chat/i })).toBeVisible()
  37 |   await expect(header.locator('button', { hasText: /editor/i })).toBeVisible()
  38 |   await expect(header.locator('button', { hasText: /workflow/i })).toBeVisible()
  39 | })
  40 | 
  41 | test('title bar has window control buttons', async () => {
  42 |   const header = window.locator('header')
  43 |   // Minimize, Maximize, Close buttons (svg icons inside buttons)
  44 |   const buttons = header.locator('button')
  45 |   const count = await buttons.count()
  46 |   // At least: settings + minimize + maximize + close = 4 window control buttons
  47 |   expect(count).toBeGreaterThanOrEqual(4)
  48 | })
  49 | 
  50 | test('settings button opens settings dialog', async () => {
  51 |   // Click the settings button (gear icon, last button group before window controls)
  52 |   const settingsBtn = window.locator('header button').filter({ has: window.locator('svg') }).nth(0)
  53 |   await settingsBtn.click()
  54 | 
  55 |   // Settings dialog should appear
  56 |   const dialog = window.locator('[role="dialog"]')
  57 |   await expect(dialog).toBeVisible({ timeout: 5000 })
  58 | 
  59 |   // Close it
  60 |   await window.keyboard.press('Escape')
  61 |   await expect(dialog).not.toBeVisible({ timeout: 5000 })
  62 | })
  63 | 
```