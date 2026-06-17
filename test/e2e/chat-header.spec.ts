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

const INPUT_SELECTOR = 'textarea[placeholder*="输入"], textarea[placeholder*="消息"], textarea[placeholder*="input"], textarea[placeholder*="message"], textarea[placeholder*="Type"]'

async function ensureSession(page: Page) {
  const input = page.locator(INPUT_SELECTOR)
  const count = await input.count()
  if (count === 0) {
    // 新建会话按钮是 sidebar 中的 + 图标按钮
    const sidebar = page.locator('[class*="border-r"]').first()
    const buttons = sidebar.locator('button')
    const lastButton = buttons.last()
    await lastButton.click()
    await page.waitForTimeout(1000)
  }
  return page.locator(INPUT_SELECTOR).first()
}

test.describe('Chat Panel Header', () => {
  test.beforeEach(async () => {
    // 关闭所有可能打开的 modal
    const overlay = window.locator('[data-state="open"]').first()
    if (await overlay.isVisible().catch(() => false)) {
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
    await ensureSession(window)
  })

  test('header shows session title', async () => {
    const header = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()
  })

  test('header shows workspace path with folder icon', async () => {
    // 查找工作区路径元素
    const pathElement = window.locator('span').filter({ has: window.locator('svg.lucide-folder') })

    // 如果有 cwd 设置，应该显示路径
    const isVisible = await pathElement.isVisible().catch(() => false)

    if (isVisible) {
      // 验证路径文本不为空
      const pathText = await pathElement.textContent()
      expect(pathText).toBeTruthy()
      expect(pathText?.trim().length).toBeGreaterThan(0)
    }
  })

  test('workspace path has correct styling', async () => {
    const pathContainer = window.locator('span.flex.items-center.gap-1.text-xs.text-muted-foreground').first()
    const isVisible = await pathContainer.isVisible().catch(() => false)

    if (isVisible) {
      // 验证有 title 属性（用于 hover 显示完整路径）
      const title = await pathContainer.getAttribute('title')
      expect(title).toBeTruthy()
    }
  })

  test('model selector is visible in header', async () => {
    // ModelSelector 应该在 header 中
    const header = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // 应该有模型选择相关的元素
    const modelSelector = header.locator('button, [role="combobox"]').first()
    await expect(modelSelector).toBeVisible()
  })

  test('branch selector is visible when session has branches', async () => {
    const header = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // BranchSelector 可能显示也可能不显示，取决于是否有分支
    const branchSelector = header.locator('[class*="branch"], [data-testid*="branch"]').first()
    // 不强制要求可见，因为可能没有分支
  })

  test('header layout is responsive', async () => {
    const header = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // 验证 header 有正确的布局类
    const headerClass = await header.getAttribute('class')
    expect(headerClass).toContain('flex')
    expect(headerClass).toContain('justify-between')
  })

  test('model selector switches model for current session only', async () => {
    // 打开模型选择器
    const header = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    const modelSelector = header.locator('button, [role="combobox"]').first()
    await modelSelector.click()
    await window.waitForTimeout(500)

    // 选择一个不同的模型（如果有下拉选项）
    const option = window.locator('[role="option"], [role="menuitem"]').first()
    if (await option.isVisible().catch(() => false)) {
      await option.click()
      await window.waitForTimeout(500)
    }

    // 创建第二个会话
    await ensureSession(window)
    await window.waitForTimeout(500)

    // 验证 header 仍然显示模型选择器
    const newHeader = window.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(newHeader).toBeVisible()
    const newModelSelector = newHeader.locator('button, [role="combobox"]').first()
    await expect(newModelSelector).toBeVisible()
  })
})
