import { ipcMain, type BrowserWindow } from 'electron'
import type { SandboxExecutor } from './executor'
import type { SandboxExecuteRequest } from '@shared/ipc'

export function registerSandboxHandlers(sandbox: SandboxExecutor, mainWindow: BrowserWindow): void {
  ipcMain.handle('sandbox:execute', async (_, req: SandboxExecuteRequest) => {
    try {
      const result = await sandbox.execute(req, (output) => {
        mainWindow.webContents.send('sandbox:output', output)
      })
      return result
    } catch (error) {
      throw new Error(`Sandbox execution failed: ${error}`)
    }
  })

  ipcMain.on('sandbox:stop', (_, executionId: string) => {
    sandbox.stop(executionId)
  })
}
