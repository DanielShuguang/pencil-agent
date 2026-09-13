import { test, expect, ensureSession, CHAT_INPUT_SELECTOR } from './fixtures'

test.describe('Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    // 关闭所有可能打开的 modal
    const overlay = page.locator('[data-state="open"]').first()
    if (await overlay.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
  })

  test('chat tab is active by default', async ({ page }) => {
    const chatBtn = page.locator('header button', { hasText: '对话' })
    await expect(chatBtn).toBeVisible()
    await expect(chatBtn).toHaveClass(/bg-primary/)
  })

  test('sidebar is visible with session list', async ({ page }) => {
    const sidebar = page.locator('[class*="border-r"]').first()
    await expect(sidebar).toBeVisible()
  })

  test('create new session button works', async ({ page }) => {
    await ensureSession(page)
  })

  test('chat input is available and functional', async ({ page }) => {
    const input = await ensureSession(page)
    await input.fill('Hello, this is a test message')
    await expect(input).toHaveValue('Hello, this is a test message')
    await input.fill('')
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await ensureSession(page)
    const sendBtn = page.locator('button', { hasText: '发送' })
    await expect(sendBtn).toBeDisabled()
  })

  test('send button is enabled when input has text', async ({ page }) => {
    const input = await ensureSession(page)
    await input.fill('Test message')
    const sendBtn = page.locator('button', { hasText: '发送' })
    await expect(sendBtn).toBeEnabled()
    await input.fill('')
  })

  test('enter key sends message', async ({ page }) => {
    const input = await ensureSession(page)
    await input.fill('Test enter key message')
    await input.press('Enter')
    await expect(input).toHaveValue('')
  })

  test('session appears in sidebar after creation', async ({ page }) => {
    await ensureSession(page)
    const sidebar = page.locator('[class*="border-r"]').first()
    const sessionItems = sidebar.locator('[class*="hover"], [class*="cursor-pointer"]')
    const count = await sessionItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('switching to editor tab works', async ({ page }) => {
    const editorBtn = page.locator('header button', { hasText: '编辑器' })
    await editorBtn.click()
    await page.waitForTimeout(2000)

    // Switch back to chat
    const chatBtn = page.locator('header button', { hasText: '对话' })
    await chatBtn.click()
    await page.waitForTimeout(500)
  })

  test('switching to workflow tab works', async ({ page }) => {
    const workflowBtn = page.locator('header button', { hasText: '工作流' })
    await workflowBtn.click()
    await page.waitForTimeout(2000)

    const chatBtn = page.locator('header button', { hasText: '对话' })
    await chatBtn.click()
    await page.waitForTimeout(500)
  })
})
