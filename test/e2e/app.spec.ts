import { test, expect, openSettings, closeDialog } from './fixtures'

test.describe('App Shell', () => {
  test('app launches and shows main window', async ({ page }) => {
    await expect(page).toHaveTitle(/pencil/i)
    await expect(page.locator('#root')).toBeVisible()
  })

  test('custom title bar is visible with app name', async ({ page }) => {
    const titleBar = page.locator('header')
    await expect(titleBar).toBeVisible()
    await expect(titleBar.locator('text=Pencil Agent')).toBeVisible()
  })

  test('title bar has chat, editor, workflow tabs', async ({ page }) => {
    const header = page.locator('header')
    await expect(header.locator('button', { hasText: '对话' })).toBeVisible()
    await expect(header.locator('button', { hasText: '编辑器' })).toBeVisible()
    await expect(header.locator('button', { hasText: '工作流' })).toBeVisible()
  })

  test('title bar has window control buttons', async ({ page }) => {
    const count = await page.locator('header button').count()
    expect(count).toBeGreaterThanOrEqual(7) // 3 tabs + settings + minimize + maximize + close
  })

  test('settings button opens and closes the settings dialog', async ({ page }) => {
    const dialog = await openSettings(page)
    await expect(dialog).toBeVisible()

    await closeDialog(page)
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  })
})
