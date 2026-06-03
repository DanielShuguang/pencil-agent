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

test.describe('Settings Dialog', () => {
  test('settings dialog opens and shows title', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    const title = dialog.locator('[class*="DialogTitle"], h2')
    await expect(title).toBeVisible()
    await window.keyboard.press('Escape')
  })

  test('settings dialog has tab buttons', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    const buttons = dialog.locator('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThanOrEqual(4)
    await window.keyboard.press('Escape')
  })

  test('settings dialog can switch to language tab', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    const langBtn = dialog.locator('button', { hasText: '语言' })
    await langBtn.click()
    await expect(dialog.locator('button', { hasText: '中文' })).toBeVisible()
    await expect(dialog.locator('button', { hasText: 'English' })).toBeVisible()
    await window.keyboard.press('Escape')
  })

  test('settings dialog can switch to theme tab', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    const themeBtn = dialog.locator('button', { hasText: '主题' })
    await themeBtn.click()
    await expect(dialog.locator('button', { hasText: '跟随系统' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '亮色模式' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '暗色模式' })).toBeVisible()
    await window.keyboard.press('Escape')
  })

  test('settings dialog can switch language to English', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    const langBtn = dialog.locator('button', { hasText: '语言' })
    await langBtn.click()

    const enBtn = dialog.locator('button', { hasText: 'English' })
    await enBtn.click()
    await window.waitForTimeout(500)

    await window.keyboard.press('Escape')
    await window.waitForTimeout(300)
    await openSettings()

    const newDialog = window.locator('[role="dialog"]')
    const title = newDialog.locator('[class*="DialogTitle"], h2')
    await expect(title).toHaveText(/settings/i)

    const newLangBtn = newDialog.locator('button', { hasText: 'Language' })
    await newLangBtn.click()
    const zhBtn = newDialog.locator('button', { hasText: '中文' })
    await zhBtn.click()
    await window.keyboard.press('Escape')
  })

  test('check for updates button exists', async () => {
    await openSettings()
    const dialog = window.locator('[role="dialog"]')
    const updateBtn = dialog.locator('button', { hasText: '检查更新' })
    await expect(updateBtn).toBeVisible()
    await window.keyboard.press('Escape')
  })
})
