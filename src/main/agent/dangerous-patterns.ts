// 危险命令正则规则
export interface DangerousPattern {
  id: string
  pattern: RegExp
  description: string
  riskLevel: 'high' | 'critical'
}

// 默认危险命令规则列表
export const DEFAULT_DANGEROUS_PATTERNS: DangerousPattern[] = [
  {
    id: 'rm-recursive',
    pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+|-r\s+)/,
    description: '递归删除文件或目录',
    riskLevel: 'critical',
  },
  {
    id: 'rm-force',
    pattern: /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|-f\s+)/,
    description: '强制删除文件（不提示确认）',
    riskLevel: 'high',
  },
  {
    id: 'sudo',
    pattern: /\bsudo\b/,
    description: '以管理员权限执行命令',
    riskLevel: 'critical',
  },
  {
    id: 'chmod-777',
    pattern: /\bchmod\s+(-R\s+)?777\b/,
    description: '设置文件权限为所有人可读写执行',
    riskLevel: 'high',
  },
  {
    id: 'curl-pipe-bash',
    pattern: /\bcurl\b.*\|\s*(ba)?sh/,
    description: '从网络下载并直接执行脚本',
    riskLevel: 'critical',
  },
  {
    id: 'wget-pipe-bash',
    pattern: /\bwget\b.*\|\s*(ba)?sh/,
    description: '从网络下载并直接执行脚本',
    riskLevel: 'critical',
  },
  {
    id: 'mkfs',
    pattern: /\bmkfs\b/,
    description: '格式化文件系统',
    riskLevel: 'critical',
  },
  {
    id: 'dd-of-device',
    pattern: /\bdd\b.*of=\/dev\//,
    description: '直接写入设备（可能导致数据丢失）',
    riskLevel: 'critical',
  },
  {
    id: 'shutdown-reboot',
    pattern: /\b(shutdown|reboot|halt|poweroff)\b/,
    description: '关闭或重启系统',
    riskLevel: 'high',
  },
  {
    id: 'kill-all',
    pattern: /\bkill\s+-9\s+-1\b|\bkillall\b/,
    description: '终止所有进程',
    riskLevel: 'critical',
  },
]

// 检测命令中的危险模式
export function checkDangerousCommand(
  command: string,
  patterns: DangerousPattern[] = DEFAULT_DANGEROUS_PATTERNS,
): DangerousPattern | null {
  for (const pattern of patterns) {
    if (pattern.pattern.test(command)) {
      return pattern
    }
  }
  return null
}
