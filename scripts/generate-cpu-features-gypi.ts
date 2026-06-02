import { execSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'

// cpu-features 必须在 pnpm.ignoredBuiltDependencies 中（跳过其 install 脚本），
// 否则 pnpm 会自行运行 node buildcheck.js > buildcheck.gypi && node-gyp rebuild，
// 与下方逻辑冲突。此处仅为 electron-builder install-app-deps 预生成 buildcheck.gypi。
try {
  const cpuPath = realpathSync('node_modules/cpu-features')
  const gypiPath = join(cpuPath, 'buildcheck.gypi')

  if (!existsSync(gypiPath)) {
    execSync('node buildcheck.js > buildcheck.gypi', {
      cwd: cpuPath,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
      stdio: 'inherit'
    })
    console.log('Generated buildcheck.gypi for cpu-features')
  }
} catch (e: unknown) {
  console.error(
    'Skipping cpu-features gypi generation:',
    e instanceof Error ? e.message : String(e)
  )
}
