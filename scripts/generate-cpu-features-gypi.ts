import { execSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'

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
} catch (e: any) {
  console.error('Skipping cpu-features gypi generation:', e.message)
}
