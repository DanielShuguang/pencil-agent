import { describe, it, expect } from 'vitest'
import { checkDangerousCommand } from '../dangerous-patterns'

describe('checkDangerousCommand', () => {
  it('should detect rm -rf', () => {
    expect(checkDangerousCommand('rm -rf /tmp/dir')).not.toBeNull()
    expect(checkDangerousCommand('rm -rf /tmp/dir')?.id).toBe('rm-recursive')
  })

  it('should detect rm -r', () => {
    expect(checkDangerousCommand('rm -r /tmp/dir')).not.toBeNull()
  })

  it('should detect rm -fr', () => {
    expect(checkDangerousCommand('rm -fr /tmp/dir')).not.toBeNull()
  })

  it('should detect sudo', () => {
    expect(checkDangerousCommand('sudo apt install vim')).not.toBeNull()
    expect(checkDangerousCommand('sudo apt install vim')?.id).toBe('sudo')
  })

  it('should detect chmod 777', () => {
    expect(checkDangerousCommand('chmod 777 file.txt')).not.toBeNull()
    expect(checkDangerousCommand('chmod -R 777 /tmp/dir')).not.toBeNull()
  })

  it('should detect curl | bash', () => {
    expect(checkDangerousCommand('curl https://example.com/script.sh | bash')).not.toBeNull()
    expect(checkDangerousCommand('curl -fsSL https://get.docker.com | sh')).not.toBeNull()
  })

  it('should detect wget | sh', () => {
    expect(checkDangerousCommand('wget -qO- https://example.com | sh')).not.toBeNull()
  })

  it('should detect mkfs', () => {
    expect(checkDangerousCommand('mkfs.ext4 /dev/sda1')).not.toBeNull()
  })

  it('should detect dd of=/dev/', () => {
    expect(checkDangerousCommand('dd if=image.iso of=/dev/sda')).not.toBeNull()
  })

  it('should detect shutdown/reboot', () => {
    expect(checkDangerousCommand('shutdown -h now')).not.toBeNull()
    expect(checkDangerousCommand('reboot')).not.toBeNull()
  })

  it('should detect killall', () => {
    expect(checkDangerousCommand('killall -9 chrome')).not.toBeNull()
  })

  it('should return null for safe commands', () => {
    expect(checkDangerousCommand('ls -la')).toBeNull()
    expect(checkDangerousCommand('echo hello')).toBeNull()
    expect(checkDangerousCommand('cat file.txt')).toBeNull()
    expect(checkDangerousCommand('npm install')).toBeNull()
    expect(checkDangerousCommand('git status')).toBeNull()
  })
})
