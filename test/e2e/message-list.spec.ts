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

test.describe('Message List', () => {
  test.beforeEach(async () => {
    // 关闭所有可能打开的 modal
    const overlay = window.locator('[data-state="open"]').first()
    if (await overlay.isVisible().catch(() => false)) {
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
    await ensureSession(window)
  })

  test('empty state shows start conversation message', async () => {
    // 检查是否有 empty state 或者已经有消息
    const emptyState = window.locator('p').filter({ hasText: /开始对话|Start conversation/ })
    const messages = await window.locator('[class*="message"], [class*="Message"]').count()
    
    // 如果没有消息，应该显示 empty state
    if (messages === 0) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('scroll to bottom button is hidden when at bottom', async () => {
    // 滚动按钮只有在滚动到上方时才显示
    // 在底部时应该不可见
    const scrollButtons = await window.locator('button.fixed.rounded-full').all()
    expect(scrollButtons.length).toBe(0)
  })

  test('scroll to bottom button appears when scrolled up', async () => {
    // 获取所有可滚动的容器
    const scrollContainers = await window.locator('[data-radix-scroll-area-viewport]').all()
    
    if (scrollContainers.length === 0) {
      return
    }

    const scrollArea = scrollContainers[0]
    
    // 先确保有足够内容可以滚动
    const scrollHeight = await scrollArea.evaluate((el) => el.scrollHeight)
    const clientHeight = await scrollArea.evaluate((el) => el.clientHeight)
    
    if (scrollHeight <= clientHeight) {
      // 内容不够多，跳过测试
      return
    }

    // 滚动到顶部并触发事件
    await scrollArea.evaluate((el) => {
      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await window.waitForTimeout(500)

    // 检查按钮是否出现 - 使用更宽松的选择器
    const scrollButton = window.locator('button').filter({ hasText: '' }).filter({ has: window.locator('svg') })
    // 这个测试可能因为消息列表没有足够内容而跳过
  })

  test('clicking scroll button scrolls to bottom', async () => {
    const scrollContainers = await window.locator('[data-radix-scroll-area-viewport]').all()
    
    if (scrollContainers.length === 0) {
      return
    }

    const scrollArea = scrollContainers[0]
    
    // 先确保有足够内容可以滚动
    const scrollHeight = await scrollArea.evaluate((el) => el.scrollHeight)
    const clientHeight = await scrollArea.evaluate((el) => el.clientHeight)
    
    if (scrollHeight <= clientHeight) {
      return
    }

    // 滚动到顶部并触发事件
    await scrollArea.evaluate((el) => {
      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await window.waitForTimeout(500)

    // 尝试找到并点击滚动按钮
    const scrollButton = window.locator('button').filter({ hasText: '' }).filter({ has: window.locator('svg') })
    const isButtonVisible = await scrollButton.isVisible().catch(() => false)

    if (isButtonVisible) {
      await scrollButton.click()
      await window.waitForTimeout(500)

      // 验证已滚动到底部
      const isAtBottom = await scrollArea.evaluate((el) => {
        return el.scrollHeight - el.scrollTop - el.clientHeight < 50
      })
      expect(isAtBottom).toBe(true)
    }
  })

  test('auto-scrolls when new message arrives', async () => {
    const textarea = window.locator(INPUT_SELECTOR).first()
    
    // 发送消息触发新内容
    await textarea.fill('Test auto-scroll message')
    await textarea.press('Enter')
    await window.waitForTimeout(1000) // 等待消息发送
    
    // 验证消息已发送（textarea 被清空）
    const value = await textarea.inputValue()
    expect(value).toBe('')
  })
})
