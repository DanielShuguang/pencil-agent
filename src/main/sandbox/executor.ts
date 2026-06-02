import type { SandboxExecuteRequest, SandboxOutput, SandboxResult } from '@shared/ipc'

export interface SandboxExecutor {
  execute(req: SandboxExecuteRequest, onOutput?: (output: SandboxOutput) => void): Promise<SandboxResult>
  stop(executionId: string): void
}

export type SandboxMode = 'child_process' | 'docker' | 'auto'
