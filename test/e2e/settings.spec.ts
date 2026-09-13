import { test, expect, openSettings, switchSettingsTab, closeDialog } from './fixtures'

test.describe('Settings Dialog', () => {
  test('opens and shows title', async ({ page }) => {
    const dialog = await openSettings(page)

    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('设置')).toBeVisible()

    await closeDialog(page)
  })

  test('has all tab buttons', async ({ page }) => {
    const dialog = await openSettings(page)

    for (const label of ['API 密钥', '模型', '权限', '日志', '记忆', '语言', '主题']) {
      await expect(dialog.locator('button', { hasText: label }).first()).toBeVisible()
    }
    await expect(dialog.locator('button', { hasText: '检查更新' })).toBeVisible()

    await closeDialog(page)
  })

  test('can switch to language tab', async ({ page }) => {
    const dialog = await openSettings(page)
    await switchSettingsTab(page, '语言')

    await expect(dialog.locator('button', { hasText: '中文' })).toBeVisible()
    await expect(dialog.locator('button', { hasText: 'English' })).toBeVisible()

    await closeDialog(page)
  })

  test('can switch to theme tab', async ({ page }) => {
    const dialog = await openSettings(page)
    await switchSettingsTab(page, '主题')

    await expect(dialog.getByText('跟随系统')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '暗色' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '亮色' })).toBeVisible()

    await closeDialog(page)
  })

  test('can switch to permission, audit and memory tabs', async ({ page }) => {
    const dialog = await openSettings(page)

    await switchSettingsTab(page, '权限')
    await expect(dialog.getByText('权限').first()).toBeVisible()

    await switchSettingsTab(page, '日志')
    await expect(dialog.getByText('日志').first()).toBeVisible()

    await switchSettingsTab(page, '记忆')
    await expect(dialog.getByText('记忆').first()).toBeVisible()

    await closeDialog(page)
  })

  test('switching language to English translates the dialog', async ({ page }) => {
    const dialog = await openSettings(page)
    await switchSettingsTab(page, '语言')
    await dialog.locator('button', { hasText: 'English' }).click()
    await page.waitForTimeout(500)

    await closeDialog(page)
    const reopened = await openSettings(page)
    await expect(reopened.getByText('Settings')).toBeVisible()

    // 还原为中文，避免影响同文件后续用例
    await switchSettingsTab(page, 'Language')
    await reopened.locator('button', { hasText: '中文' }).click()
    await page.waitForTimeout(300)
    await closeDialog(page)
  })

  test('check for updates button is available', async ({ page }) => {
    const dialog = await openSettings(page)

    await expect(dialog.locator('button', { hasText: '检查更新' })).toBeEnabled()

    await closeDialog(page)
  })
})
