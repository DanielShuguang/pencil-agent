import { _electron } from '@playwright/test'
import {
  test,
  expect,
  openSettings,
  switchSettingsTab,
  closeDialog,
  APP_ENTRY,
  APP_CWD,
} from './fixtures'

test.describe('Theme Switching', () => {
  test('theme tab shows theme options and follow-system switch', async ({ page }) => {
    await openSettings(page)
    await switchSettingsTab(page, '主题')
    const dialog = page.locator('[role="dialog"]')

    await expect(dialog.getByText('跟随系统')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '暗色' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '亮色' })).toBeVisible()
    await expect(dialog.getByRole('checkbox')).toBeVisible()

    await closeDialog(page)
  })

  test('switching to light theme updates the root class', async ({ page }) => {
    await openSettings(page)
    await switchSettingsTab(page, '主题')
    // 默认处于“跟随系统”，此时主题按钮被禁用；先关掉跟随系统
    await page.locator('[role="dialog"]').getByRole('checkbox').click()
    await page.waitForTimeout(300)

    await page.locator('[role="dialog"]').getByRole('button', { name: '亮色' }).click()
    await page.waitForTimeout(500)

    await expect(page.locator('html')).toHaveClass(/light/)

    await closeDialog(page)
  })

  test('switching to dark theme updates the root class', async ({ page }) => {
    await openSettings(page)
    await switchSettingsTab(page, '主题')
    await page.locator('[role="dialog"]').getByRole('checkbox').click()
    await page.waitForTimeout(300)

    await page.locator('[role="dialog"]').getByRole('button', { name: '暗色' }).click()
    await page.waitForTimeout(500)

    await expect(page.locator('html')).toHaveClass(/dark/)

    await closeDialog(page)
  })

  test('theme choice persists across app restart', async ({ page, app, userDataDir }) => {
    await openSettings(page)
    await switchSettingsTab(page, '主题')
    await page.locator('[role="dialog"]').getByRole('checkbox').click()
    await page.waitForTimeout(300)
    await page.locator('[role="dialog"]').getByRole('button', { name: '亮色' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('html')).toHaveClass(/light/)
    await closeDialog(page)

    // 沿用在同一个 userData 目录上重启应用，验证主题写入主进程存储后可恢复
    await app.close()

    const relaunched = await _electron.launch({
      args: [APP_ENTRY, `--user-data-dir=${userDataDir}`],
      cwd: APP_CWD,
      timeout: 120_000,
    })
    try {
      const newPage = await relaunched.firstWindow()
      await newPage.waitForLoadState('domcontentloaded', { timeout: 120_000 })
      await newPage.waitForTimeout(1500)

      await expect(newPage.locator('html')).toHaveClass(/light/)
    } finally {
      await relaunched.close().catch(() => {})
    }
  })

  test('status bar shows at bottom of window', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible()
  })
})
