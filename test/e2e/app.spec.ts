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

test('app launches and shows main window', async () => {
  await expect(window).toHaveTitle(/pencil/i)
  await expect(window.locator('#root')).toBeVisible()
})

test('custom title bar is visible with app name', async () => {
  const titleBar = window.locator('header')
  await expect(titleBar).toBeVisible()
  await expect(titleBar.locator('text=Pencil Agent')).toBeVisible()
})

test('title bar has chat, editor, workflow tabs', async () => {
  const header = window.locator('header')
  await expect(header.locator('button', { hasText: '对话' })).toBeVisible()
  await expect(header.locator('button', { hasText: '编辑器' })).toBeVisible()
  await expect(header.locator('button', { hasText: '工作流' })).toBeVisible()
})

test('title bar has window control buttons', async () => {
  const header = window.locator('header')
  const buttons = header.locator('button')
  const count = await buttons.count()
  expect(count).toBeGreaterThanOrEqual(7) // 3 tabs + settings + minimize + maximize + close
})

test('settings button opens settings dialog', async () => {
  const header = window.locator('header')
  const btns = header.locator('button')
  const count = await btns.count()
  // Settings button is the 4th button (index 3), after 3 tabs
  const settingsBtn = btns.nth(3)
  await settingsBtn.click()

  const dialog = window.locator('[role="dialog"]')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  await window.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible({ timeout: 10000 })
})
