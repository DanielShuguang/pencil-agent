import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AgentSessionManager } from './agent/session-manager'
import { registerAgentHandlers } from './agent/ipc-handlers'
import { createToolRegistry } from './agent/tool-registry'
import { createSandboxExecutor } from './sandbox/factory'
import { registerSandboxHandlers } from './sandbox/ipc-handlers'
import type { SandboxExecutor } from './sandbox/executor'
import { WorkflowEngine } from './workflow/engine'
import { registerWorkflowHandlers } from './workflow/ipc-handlers'
import { registerMemoryHandlers } from './memory/ipc-handlers'

let mainWindow: BrowserWindow | null = null
const agentManager = new AgentSessionManager()
const toolRegistry = createToolRegistry()
let sandbox: SandboxExecutor
let workflowEngine: WorkflowEngine

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Register agent IPC handlers
  registerAgentHandlers(agentManager, mainWindow, toolRegistry)

  // Register sandbox IPC handlers
  registerSandboxHandlers(sandbox, mainWindow)

  // Register workflow IPC handlers
  registerWorkflowHandlers(workflowEngine, mainWindow)

  // Register memory IPC handlers
  registerMemoryHandlers()

  // Register window control IPC handlers
  registerWindowHandlers(mainWindow)

  // Register app info IPC handlers
  registerAppHandlers()

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowHandlers(window: BrowserWindow): void {
  ipcMain.on('window:minimize', () => {
    window.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    window.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return window.isMaximized()
  })

  window.on('maximize', () => {
    window.webContents.send('window:maximized-changed', true)
  })

  window.on('unmaximize', () => {
    window.webContents.send('window:maximized-changed', false)
  })
}

function registerAppHandlers(): void {
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Initialize sandbox executor (with Docker auto-detection)
  sandbox = await createSandboxExecutor()

  // Initialize workflow engine
  workflowEngine = new WorkflowEngine(agentManager, toolRegistry)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  agentManager.destroyAll()
})
