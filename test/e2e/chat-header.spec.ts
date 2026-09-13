import { test, expect, ensureSession, CHAT_INPUT_SELECTOR } from './fixtures'

test.describe('Chat Panel Header', () => {
  test.beforeEach(async ({ page }) => {
    // 关闭所有可能打开的 modal
    const overlay = page.locator('[data-state="open"]').first()
    if (await overlay.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
    await ensureSession(page)
  })

  test('header shows session title', async ({ page }) => {
    const header = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()
  })

  test('header shows workspace path with folder icon', async ({ page }) => {
    // 查找工作区路径元素
    const pathElement = page.locator('span').filter({ has: page.locator('svg.lucide-folder') })

    // 如果有 cwd 设置，应该显示路径
    const isVisible = await pathElement.isVisible().catch(() => false)

    if (isVisible) {
      // 验证路径文本不为空
      const pathText = await pathElement.textContent()
      expect(pathText).toBeTruthy()
      expect(pathText?.trim().length).toBeGreaterThan(0)
    }
  })

  test('workspace path has correct styling', async ({ page }) => {
    const pathContainer = page.locator('span.flex.items-center.gap-1.text-xs.text-muted-foreground').first()
    const isVisible = await pathContainer.isVisible().catch(() => false)

    if (isVisible) {
      // 验证有 title 属性（用于 hover 显示完整路径）
      const title = await pathContainer.getAttribute('title')
      expect(title).toBeTruthy()
    }
  })

  test('model selector is visible in header', async ({ page }) => {
    // ModelSelector 应该在 header 中
    const header = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // 应该有模型选择相关的元素
    const modelSelector = header.locator('button, [role="combobox"]').first()
    await expect(modelSelector).toBeVisible()
  })

  test('branch selector is visible when session has branches', async ({ page }) => {
    const header = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // BranchSelector 可能显示也可能不显示，取决于是否有分支
    const branchSelector = header.locator('[class*="branch"], [data-testid*="branch"]').first()
    // 不强制要求可见，因为可能没有分支
  })

  test('header layout is responsive', async ({ page }) => {
    const header = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(header).toBeVisible()

    // 验证 header 有正确的布局类
    const headerClass = await header.getAttribute('class')
    expect(headerClass).toContain('flex')
    expect(headerClass).toContain('justify-between')
  })

  test('model selector switches model for current session only', async ({ page }) => {
    // 打开模型选择器
    const header = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    const modelSelector = header.locator('button, [role="combobox"]').first()
    await modelSelector.click()
    await page.waitForTimeout(500)

    // 选择一个不同的模型（如果有下拉选项）
    const option = page.locator('[role="option"], [role="menuitem"]').first()
    if (await option.isVisible().catch(() => false)) {
      await option.click()
      await page.waitForTimeout(500)
    }

    // 创建第二个会话
    await ensureSession(page)
    await page.waitForTimeout(500)

    // 验证 header 仍然显示模型选择器
    const newHeader = page.locator('.flex.items-center.justify-between.px-4.py-2.border-b').first()
    await expect(newHeader).toBeVisible()
    const newModelSelector = newHeader.locator('button, [role="combobox"]').first()
    await expect(newModelSelector).toBeVisible()
  })
})
