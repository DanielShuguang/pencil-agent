import { ipcMain, type BrowserWindow } from 'electron'
import type { WorkflowEngine } from './engine'
import type { WorkflowDefinition } from '@shared/ipc'

export function registerWorkflowHandlers(
  engine: WorkflowEngine,
  mainWindow: BrowserWindow,
): void {
  ipcMain.handle('workflow:execute', async (_, workflow: WorkflowDefinition, input: Record<string, unknown>) => {
    try {
      const result = await engine.execute(workflow, input, (progress) => {
        mainWindow.webContents.send('workflow:progress', progress)
      })
      return result
    } catch (error) {
      throw new Error(`Workflow execution failed: ${error}`)
    }
  })
}
