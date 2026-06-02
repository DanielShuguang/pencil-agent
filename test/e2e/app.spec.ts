import { test, expect, _electron } from '@playwright/test'
import path from 'path'

// 需要先执行 pnpm build 生成 out/main/index.mjs
const APP_ROOT = path.resolve(__dirname, '../..')
const MAIN_ENTRY = path.join(APP_ROOT, 'out/main/index.mjs')

test('app launches and shows main window', async () => {
  const app = await _electron.launch({
    args: [MAIN_ENTRY],
    cwd: APP_ROOT
  })

  const window = await app.firstWindow()
  await expect(window).toHaveTitle(/pencil-agent/i)
  await expect(window.locator('#root')).toBeVisible()

  await app.close()
})
