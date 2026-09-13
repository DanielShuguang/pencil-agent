import { test, expect, ensureSession, CHAT_INPUT_SELECTOR } from './fixtures'

test.describe('Session Persistence', () => {
  test('session survives a window reload', async ({ page }) => {
    const input = await ensureSession(page)
    await input.fill('persist me')
    await input.press('Enter')
    await expect(input).toHaveValue('')
    await page.waitForTimeout(1000)

    const messagesBefore = await page.locator('[data-testid="message-list"], [data-testid="virtual-message-list"]').count()
    expect(messagesBefore).toBeGreaterThanOrEqual(0)

    await page.reload()
    await page.waitForTimeout(2000)

    // 会话仍处于活跃状态：输入框可用
    const inputAfterReload = page.locator(CHAT_INPUT_SELECTOR).first()
    await expect(inputAfterReload).toBeVisible()
    // 首条消息成为会话标题并出现在侧边栏
    await expect(page.locator('text=persist me').first()).toBeVisible()
  })

  test('language preference persists across reload', async ({ page }) => {
    await page.locator('header button').nth(3).click()
    const dialog = page.locator('[role="dialog"]')
    await dialog.waitFor({ state: 'visible' })
    await dialog.locator('button', { hasText: '语言' }).first().click()
    await page.waitForTimeout(300)
    await dialog.locator('button', { hasText: 'English' }).click()
    await page.waitForTimeout(500)
    await page.keyboard.press('Escape')

    await page.reload()
    await page.waitForTimeout(2000)

    await expect(page.locator('header button', { hasText: 'Chat' })).toBeVisible()

    // 还原为中文，避免影响同文件后续用例
    await page.locator('header button').nth(3).click()
    const reopened = page.locator('[role="dialog"]')
    await reopened.waitFor({ state: 'visible' })
    await reopened.locator('button', { hasText: 'Language' }).first().click()
    await page.waitForTimeout(300)
    await reopened.locator('button', { hasText: '中文' }).click()
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
  })
})
