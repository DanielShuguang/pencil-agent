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

async function openSettings(): Promise<void> {
  const header = window.locator('header')
  const btns = header.locator('button')
  const count = await btns.count()
  const settingsBtn = btns.nth(3)
  await settingsBtn.click()
  await window.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 10000 })
}

async function switchToThemeTab(): Promise<void> {
  const dialog = window.locator('[role="dialog"]')
  const themeBtn = dialog.locator('button', { hasText: '主题' })
  await themeBtn.click()
  await window.waitForTimeout(300)
}

test.describe('Theme Switching', () => {
  test('theme tab shows all theme options', async () => {
    await openSettings()
    await switchToThemeTab()

    const dialog = window.locator('[role="dialog"]')
    await expect(dialog.locator('button', { hasText: '跟随系统' })).toBeVisible()
    await expect(dialog.locator('button', { hasText: '亮色模式' })).toBeVisible()
    await expect(dialog.locator('button', { hasText: '暗色模式' })).toBeVisible()

    const themeButtons = dialog.locator('[class*="grid"] button, [class*="grid-cols"] button')
    const themeCount = await themeButtons.count()
    expect(themeCount).toBeGreaterThanOrEqual(2)

    await window.keyboard.press('Escape')
  })

  test('switching to light theme changes appearance', async () => {
    await openSettings()
    await switchToThemeTab()

    const dialog = window.locator('[role="dialog"]')
    // Use exact match - "亮色模式" is the mode button, "亮色" is the theme button
    const lightBtn = dialog.getByRole('button', { name: '亮色模式' })
    await lightBtn.click()
    await window.waitForTimeout(500)

    const root = window.locator('html')
    const classList = await root.getAttribute('class')
    expect(classList).toContain('light')

    await window.keyboard.press('Escape')
  })

  test('switching back to dark theme works', async () => {
    await openSettings()
    await switchToThemeTab()

    const dialog = window.locator('[role="dialog"]')
    const darkBtn = dialog.getByRole('button', { name: '暗色模式' })
    await darkBtn.click()
    await window.waitForTimeout(500)

    const root = window.locator('html')
    const classList = await root.getAttribute('class')
    expect(classList).toContain('dark')

    await window.keyboard.press('Escape')
  })

  test('status bar shows at bottom of window', async () => {
    const statusBar = window.locator('footer')
    await expect(statusBar).toBeVisible()
  })
})
