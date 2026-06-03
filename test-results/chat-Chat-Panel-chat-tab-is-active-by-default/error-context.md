# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.ts >> Chat Panel >> chat tab is active by default
- Location: test\e2e\chat.spec.ts:24:7

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
  23  | test.describe('Chat Panel', () => {
  24  |   test('chat tab is active by default', async () => {
  25  |     // The chat tab should be active (has bg-primary class)
  26  |     const chatBtn = window.locator('header button').filter({ hasText: /chat|聊天/i })
  27  |     await expect(chatBtn).toBeVisible()
  28  |     // The active tab should have a different style (bg-primary)
  29  |     await expect(chatBtn).toHaveClass(/bg-primary/)
  30  |   })
  31  | 
  32  |   test('sidebar is visible with session list', async () => {
  33  |     // Sidebar should be visible
  34  |     const sidebar = window.locator('.w-64, [class*="w-64"]').first()
  35  |     await expect(sidebar).toBeVisible()
  36  |   })
  37  | 
  38  |   test('create new session button works', async () => {
  39  |     // Find the "+" button in sidebar header
  40  |     const sidebar = window.locator('[class*="w-64"]').first()
  41  |     const addBtn = sidebar.locator('button').last() // The "+" button
  42  |     await addBtn.click()
  43  | 
  44  |     // After creating a session, the input should be enabled
  45  |     const input = window.locator('input[placeholder*="输入"], input[placeholder*="type"], input[placeholder*="Type"]')
  46  |     await expect(input).toBeVisible({ timeout: 5000 })
  47  |   })
  48  | 
  49  |   test('chat input is available and functional', async () => {
  50  |     const input = window.locator('input[placeholder*="输入"], input[placeholder*="type"], input[placeholder*="Type"]')
  51  |     await expect(input).toBeVisible()
  52  | 
  53  |     // Type a message
  54  |     await input.fill('Hello, this is a test message')
  55  |     await expect(input).toHaveValue('Hello, this is a test message')
  56  | 
  57  |     // Clear the input
  58  |     await input.fill('')
  59  |   })
  60  | 
  61  |   test('send button is disabled when input is empty', async () => {
  62  |     const sendBtn = window.locator('button').filter({ hasText: /send|发送/i })
  63  |     await expect(sendBtn).toBeVisible()
  64  | 
  65  |     const input = window.locator('input[placeholder*="输入"], input[placeholder*="type"], input[placeholder*="Type"]')
  66  |     await input.fill('')
  67  | 
  68  |     // Send button should be disabled
  69  |     await expect(sendBtn).toBeDisabled()
  70  |   })
  71  | 
  72  |   test('send button is enabled when input has text', async () => {
  73  |     const input = window.locator('input[placeholder*="输入"], input[placeholder*="type"], input[placeholder*="Type"]')
  74  |     await input.fill('Test message')
  75  | 
  76  |     const sendBtn = window.locator('button').filter({ hasText: /send|发送/i })
  77  |     await expect(sendBtn).toBeEnabled()
  78  | 
  79  |     // Clear input
  80  |     await input.fill('')
  81  |   })
  82  | 
  83  |   test('enter key sends message', async () => {
  84  |     const input = window.locator('input[placeholder*="输入"], input[placeholder*="type"], input[placeholder*="Type"]')
  85  |     await input.fill('Test enter key message')
  86  |     await input.press('Enter')
  87  | 
  88  |     // After sending, input should be cleared
  89  |     await expect(input).toHaveValue('')
  90  |   })
  91  | 
  92  |   test('session appears in sidebar after creation', async () => {
  93  |     // The sidebar should show at least one session
  94  |     const sidebar = window.locator('[class*="w-64"]').first()
  95  |     const sessionItems = sidebar.locator('[class*="hover"], [class*="cursor-pointer"]')
  96  |     const count = await sessionItems.count()
  97  |     expect(count).toBeGreaterThanOrEqual(1)
  98  |   })
  99  | 
  100 |   test('switching to editor tab works', async () => {
  101 |     const editorBtn = window.locator('header button').filter({ hasText: /editor|编辑器/i })
  102 |     await editorBtn.click()
  103 | 
  104 |     // Should show editor panel (lazy loaded, may take a moment)
  105 |     await window.waitForTimeout(1000)
  106 | 
  107 |     // Switch back to chat
  108 |     const chatBtn = window.locator('header button').filter({ hasText: /chat|聊天/i })
  109 |     await chatBtn.click()
  110 |   })
  111 | 
  112 |   test('switching to workflow tab works', async () => {
  113 |     const workflowBtn = window.locator('header button').filter({ hasText: /workflow|工作流/i })
  114 |     await workflowBtn.click()
  115 | 
  116 |     // Should show workflow canvas (lazy loaded)
  117 |     await window.waitForTimeout(1000)
  118 | 
  119 |     // Switch back to chat
  120 |     const chatBtn = window.locator('header button').filter({ hasText: /chat|聊天/i })
```