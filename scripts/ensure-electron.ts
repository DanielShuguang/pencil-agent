import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// 确保 Electron 二进制文件已下载
// pnpm v10+ 默认不运行依赖的 install 脚本，需要手动触发
try {
  const electronPkgPath = join('node_modules', 'electron', 'package.json')
  const electronPkg = JSON.parse(readFileSync(electronPkgPath, 'utf-8'))
  const electronVersion = electronPkg.version

  const electronPath = join(
    'node_modules',
    '.pnpm',
    `electron@${electronVersion}`,
    'node_modules',
    'electron',
    'dist',
    process.platform === 'win32' ? 'electron.exe' : 'electron'
  )

  if (!existsSync(electronPath)) {
    console.log('Electron binary not found, downloading...')
    execSync('node node_modules/electron/install.js', {
      stdio: 'inherit',
      env: {
        ...process.env,
        // 使用国内镜像加速下载
        ELECTRON_MIRROR:
          process.env.ELECTRON_MIRROR ||
          'https://npmmirror.com/mirrors/electron/',
      },
    })
    console.log('Electron binary downloaded successfully')
  }
} catch (e: unknown) {
  console.error(
    'Failed to download Electron binary:',
    e instanceof Error ? e.message : String(e)
  )
  process.exit(1)
}
