import { test, expect, switchTopTab } from './fixtures'

test.describe('Workflow Panel', () => {
  test.beforeEach(async ({ page }) => {
    await switchTopTab(page, '工作流')
  })

  test('workflow tab shows toolbar and canvas', async ({ page }) => {
    await expect(page.getByTitle('添加开始节点')).toBeVisible()
    await expect(page.getByTitle('添加 Agent 节点')).toBeVisible()
    await expect(page.getByTitle('添加工具节点')).toBeVisible()
    await expect(page.getByTitle('添加条件节点')).toBeVisible()
    await expect(page.getByTitle('添加结束节点')).toBeVisible()
    await expect(page.getByTitle('执行')).toBeVisible()
    await expect(page.getByTitle('保存工作流')).toBeVisible()
    await expect(page.getByTitle('加载工作流')).toBeVisible()
    await expect(page.locator('.react-flow')).toBeVisible()
  })

  test('execute and save are disabled on an empty canvas', async ({ page }) => {
    await expect(page.getByTitle('执行')).toBeDisabled()
    await expect(page.getByTitle('保存工作流')).toBeDisabled()
    await expect(page.getByTitle('清空画布')).toBeDisabled()
  })

  test('adding nodes renders them on the canvas and enables execute', async ({ page }) => {
    await page.getByTitle('添加开始节点').click()
    await expect(page.locator('.react-flow__node')).toHaveCount(1)

    await page.getByTitle('添加 Agent 节点').click()
    await expect(page.locator('.react-flow__node')).toHaveCount(2)

    await expect(page.getByTitle('执行')).toBeEnabled()
    await expect(page.getByTitle('保存工作流')).toBeEnabled()
  })

  test('clicking a node opens the node configuration panel', async ({ page }) => {
    await page.getByTitle('添加开始节点').click()
    await page.locator('.react-flow__node').first().click()
    await page.waitForTimeout(500)

    // 选中节点后出现节点配置面板（含节点 ID 字段）
    await expect(page.getByText('节点 ID').first()).toBeVisible()
  })

  test('workflow state survives tab switches', async ({ page }) => {
    await page.getByTitle('添加开始节点').click()
    await expect(page.locator('.react-flow__node')).toHaveCount(1)

    await switchTopTab(page, '对话')
    await switchTopTab(page, '工作流')

    await expect(page.locator('.react-flow__node')).toHaveCount(1)
  })

  test('clear button empties the canvas after confirmation', async ({ page }) => {
    await page.getByTitle('添加开始节点').click()
    await expect(page.locator('.react-flow__node')).toHaveCount(1)

    await page.getByTitle('清空画布').click()
    await page.waitForTimeout(500)

    await expect(page.locator('.react-flow__node')).toHaveCount(0)
    await expect(page.getByTitle('执行')).toBeDisabled()
  })
})
