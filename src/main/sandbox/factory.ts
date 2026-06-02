import type { SandboxExecutor } from './executor'
import { ChildProcessSandbox } from './child-process'
import { DockerSandbox } from './docker'

export async function createSandboxExecutor(): Promise<SandboxExecutor> {
  const dockerSandbox = new DockerSandbox()

  try {
    const isDockerAvailable = await dockerSandbox.isAvailable()
    if (isDockerAvailable) {
      console.log('Docker is available, using DockerSandbox')
      return dockerSandbox
    }
  } catch {
    // Docker not available
  }

  console.log('Docker is not available, falling back to ChildProcessSandbox')
  return new ChildProcessSandbox()
}
