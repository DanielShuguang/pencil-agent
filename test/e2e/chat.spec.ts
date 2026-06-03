import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'path'

const APP_ROOT = path.resolve(__dirname, '../..')
const MAIN_ENTRY = path.join(APP_ROOT, 'out/main/index.mjs')

let electronApp: ElectronApplication
let window: Page

test.beforeAll(async () => {
  electronApp = await _electron.launch({
    args: [MAIN_ENTRY],
    cwd: APP_ROOT,
    timeout: 120000,
  })
  window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded', { timeout: 120000 })
  await window.waitForTimeout(2000)
})

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close()
  }
})

test.describe('Chat Panel', () => {
  test('chat tab is active by default', async () => {
    const chatBtn = window.locator('header button', { hasText: '对话' })
    await expect(chatBtn).toBeVisible()
    await expect(chatBtn).toHaveClass(/bg-primary/)
  })

  test('sidebar is visible with session list', async () => {
    const sidebar = window.locator('[class*="w-64"]').first()
    await expect(sidebar).toBeVisible()
  })

  test('create new session button works', async () => {
    const sidebar = window.locator('[class*="w-64"]').first()
    const addBtn = sidebar.locator('button').last()
    await addBtn.click()

    const input = window.locator('input[placeholder*="输入"], input[placeholder*="消息"]')
    await expect(input).toBeVisible({ timeout: 10000 })
  })

  test('chat input is available and functional', async () => {
    const input = window.locator('input[placeholder*="输入"], input[placeholder*="消息"]')
    await expect(input).toBeVisible()
    await input.fill('Hello, this is a test message')
    await expect(input).toHaveValue('Hello, this is a test message')
    await input.fill('')
  })

  test('send button is disabled when input is empty', async () => {
    const input = window.locator('input[placeholder*="输入"], input[placeholder*="消息"]')
    await input.fill('')
    const sendBtn = window.locator('button', { hasText: '发送' })
    await expect(sendBtn).toBeDisabled()
  })

  test('send button is enabled when input has text', async () => {
    const input = window.locator('input[placeholder*="输入"], input[placeholder*="消息"]')
    await input.fill('Test message')
    const sendBtn = window.locator('button', { hasText: '发送' })
    await expect(sendBtn).toBeEnabled()
    await input.fill('')
  })

  test('enter key sends message', async () => {
    const input = window.locator('input[placeholder*="输入"], input[placeholder*="消息"]')
    await input.fill('Test enter key message')
    await input.press('Enter')
    await expect(input).toHaveValue('')
  })

  test('session appears in sidebar after creation', async () => {
    const sidebar = window.locator('[class*="w-64"]').first()
    const sessionItems = sidebar.locator('[class*="hover"], [class*="cursor-pointer"]')
    const count = await sessionItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('switching to editor tab works', async () => {
    const editorBtn = window.locator('header button', { hasText: '编辑器' })
    await editorBtn.click()
    await window.waitForTimeout(2000)

    // Switch back to chat
    const chatBtn = window.locator('header button', { hasText: '对话' })
    await chatBtn.click()
    await window.waitForTimeout(500)
  })

  test('switching to workflow tab works', async () => {
    const workflowBtn = window.locator('header button', { hasText: '工作流' })
    await workflowBtn.click()
    await window.waitForTimeout(2000)

    const chatBtn = window.locator('header button', { hasText: '对话' })
    await chatBtn.click()
    await window.waitForTimeout(500)
  })
})
