import { _electron, type ElectronApplication, type Locator, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test as base } from '@playwright/test'
import path from 'path'

const APP_ROOT = path.resolve(__dirname, '../..')
const MAIN_ENTRY = path.join(APP_ROOT, 'out/main/index.mjs')

export const APP_ENTRY = MAIN_ENTRY
export const APP_CWD = APP_ROOT

export interface AppFixtures {
  app: ElectronApplication
  page: Page
  userDataDir: string
}

// 每个 worker 使用独立的 userData 目录：既不污染开发者真实配置，
// 也避免不同 spec 之间通过持久化状态互相影响。
function createIsolatedUserDataDir(workerIndex: number): string {
  return mkdtempSync(join(tmpdir(), `pencil-agent-e2e-${workerIndex}-`))
}

export const test = base.extend<AppFixtures>({
  userDataDir: async ({}, use, workerInfo) => {
    await use(createIsolatedUserDataDir(workerInfo.workerIndex))
  },

  app: async ({ userDataDir }, use) => {
    const app = await _electron.launch({
      args: [MAIN_ENTRY, `--user-data-dir=${userDataDir}`],
      cwd: APP_ROOT,
      // 让主进程的目录选择直接返回该目录，避免原生对话框阻塞自动化
      env: { ...process.env, PENCIL_AGENT_E2E_WORKSPACE: userDataDir },
      timeout: 120_000,
    })

    try {
      await use(app)
    } finally {
      await app.close().catch(() => {})
      rmSync(userDataDir, { recursive: true, force: true })
    }
  },

  page: async ({ app }, use) => {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded', { timeout: 120_000 })
    await page.waitForTimeout(1500)
    await use(page)
  },
})

export { expect } from '@playwright/test'

export const CHAT_INPUT_SELECTOR =
  'textarea[placeholder*="输入"], textarea[placeholder*="消息"], textarea[placeholder*="input"], textarea[placeholder*="message"], textarea[placeholder*="Type"]'

/** 打开设置弹窗（标题栏第 4 个按钮） */
export async function openSettings(page: Page): Promise<Locator> {
  await page.locator('header button').nth(3).click()
  const dialog = page.locator('[role="dialog"]')
  await dialog.waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(300)
  return dialog
}

/** 切换到设置弹窗中的指定标签页 */
export async function switchSettingsTab(page: Page, label: string): Promise<void> {
  const dialog = page.locator('[role="dialog"]')
  await dialog.locator('button', { hasText: label }).first().click()
  await page.waitForTimeout(300)
}

/** 关闭当前弹窗（Escape） */
export async function closeDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

/** 确保存在一个活跃会话：没有会话时点击侧边栏的“新建会话”按钮 */
export async function ensureSession(page: Page): Promise<Locator> {
  const input = page.locator(CHAT_INPUT_SELECTOR)
  if ((await input.count()) > 0) return input.first()

  // 没有会话时先点空状态里的“新建会话”，失败再退回侧边栏的 “+” 按钮
  const emptyStateButton = page.locator('button', { hasText: '新建会话' })
  if (await emptyStateButton.count()) {
    await emptyStateButton.first().click()
  } else {
    await page.locator('[class*="border-r"]').first().locator('button').last().click()
  }
  await page.waitForTimeout(2000)

  let sessionInput = page.locator(CHAT_INPUT_SELECTOR).first()
  if ((await page.locator(CHAT_INPUT_SELECTOR).count()) === 0) {
    // 兜底再试一次侧边栏按钮
    await page.locator('[class*="border-r"]').first().locator('button').last().click()
    await page.waitForTimeout(1500)
    sessionInput = page.locator(CHAT_INPUT_SELECTOR).first()
  }
  return sessionInput
}

/** 切换到顶部标签页（对话 / 编辑器 / 工作流） */
export async function switchTopTab(page: Page, label: string): Promise<void> {
  await page.locator('header button', { hasText: label }).click()
  await page.waitForTimeout(800)
}
