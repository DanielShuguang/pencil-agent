import type { AgentSessionManager } from './session-manager'
import type { RoleManager, AgentRole } from './role-manager'
import type { OrchestrationMode } from '@shared/ipc'

export interface OrchestrationResult {
  mode: OrchestrationMode
  results: { roleId: string; output: string }[]
  finalOutput: string
}

export class MultiAgentOrchestrator {
  constructor(
    private agents: AgentSessionManager,
    private roles: RoleManager,
  ) {}

  async execute(
    mode: OrchestrationMode,
    roleIds: string[],
    input: string,
    options: {
      cwd?: string
      maxRounds?: number
      mergerRoleId?: string
      onProgress?: (agentId: string, output: string) => void
    } = {},
  ): Promise<OrchestrationResult> {
    const roles = roleIds.map((id) => this.roles.get(id)).filter(Boolean) as AgentRole[]

    switch (mode) {
      case 'sequential':
        return this.executeSequential(roles, input, options.cwd, options.onProgress)
      case 'parallel':
        return this.executeParallel(roles, input, options.cwd, options.mergerRoleId, options.onProgress)
      case 'debate':
        return this.executeDebate(roles, input, options.cwd, options.maxRounds || 5, options.onProgress)
      case 'hierarchical':
        return this.executeHierarchical(roles, input, options.cwd, options.onProgress)
      default:
        throw new Error(`Unknown orchestration mode: ${mode}`)
    }
  }

  private async executeSequential(
    roles: AgentRole[],
    input: string,
    cwd: string | undefined,
    onProgress?: (agentId: string, output: string) => void,
  ): Promise<OrchestrationResult> {
    const results: { roleId: string; output: string }[] = []
    let currentInput = input

    for (const role of roles) {
      const sessionId = `orch-${role.id}-${Date.now()}`
      await this.agents.create({
        sessionId,
        model: role.model,
        cwd: cwd || process.cwd(),
        systemPrompt: role.systemPrompt,
        tools: role.tools,
      })

      let output = ''
      for await (const chunk of this.agents.prompt(sessionId, currentInput)) {
        if (chunk.type === 'text') {
          output += chunk.content
        }
      }

      results.push({ roleId: role.id, output })
      onProgress?.(role.id, output)
      currentInput = output

      // Cleanup
      await this.agents.stop(sessionId)
    }

    return {
      mode: 'sequential',
      results,
      finalOutput: currentInput,
    }
  }

  private async executeParallel(
    roles: AgentRole[],
    input: string,
    cwd: string | undefined,
    mergerRoleId?: string,
    onProgress?: (agentId: string, output: string) => void,
  ): Promise<OrchestrationResult> {
    const MAX_PARALLEL = 3
    const results: { roleId: string; output: string }[] = []

    // Execute in batches
    for (let i = 0; i < roles.length; i += MAX_PARALLEL) {
      const batch = roles.slice(i, i + MAX_PARALLEL)
      const batchResults = await Promise.all(
        batch.map(async (role) => {
          const sessionId = `orch-${role.id}-${Date.now()}`
          await this.agents.create({
            sessionId,
            model: role.model,
        cwd: cwd || process.cwd(),
            systemPrompt: role.systemPrompt,
            tools: role.tools,
          })

          let output = ''
          for await (const chunk of this.agents.prompt(sessionId, input)) {
            if (chunk.type === 'text') {
              output += chunk.content
            }
          }

          await this.agents.stop(sessionId)
          onProgress?.(role.id, output)
          return { roleId: role.id, output }
        }),
      )
      results.push(...batchResults)
    }

    // Merge results if merger role specified
    let finalOutput = results.map((r) => `## ${r.roleId}\n${r.output}`).join('\n\n')

    if (mergerRoleId) {
      const mergerRole = this.roles.get(mergerRoleId)
      if (mergerRole) {
        const sessionId = `orch-merger-${Date.now()}`
        await this.agents.create({
          sessionId,
          model: mergerRole.model,
          cwd: cwd || process.cwd(),
          systemPrompt: mergerRole.systemPrompt,
          tools: mergerRole.tools,
        })

        let mergedOutput = ''
        const mergedInput = results.map((r) => `## ${r.roleId}\n${r.output}`).join('\n\n')
        for await (const chunk of this.agents.prompt(sessionId, mergedInput)) {
          if (chunk.type === 'text') {
            mergedOutput += chunk.content
          }
        }

        await this.agents.stop(sessionId)
        finalOutput = mergedOutput
      }
    }

    return {
      mode: 'parallel',
      results,
      finalOutput,
    }
  }

  private async executeDebate(
    roles: AgentRole[],
    input: string,
    cwd: string | undefined,
    maxRounds: number,
    onProgress?: (agentId: string, output: string) => void,
  ): Promise<OrchestrationResult> {
    if (roles.length < 3) {
      throw new Error('Debate mode requires at least 3 roles: proposer, opposer, judge')
    }

    const [proposer, opposer, judge] = roles
    const results: { roleId: string; output: string }[] = []
    let proposerOutput = ''
    let opposerOutput = ''

    // Initial arguments
    const proposerSession = `orch-proposer-${Date.now()}`
    await this.agents.create({
      sessionId: proposerSession,
      model: proposer.model,
      cwd: cwd || process.cwd(),
      systemPrompt: proposer.systemPrompt,
      tools: proposer.tools,
    })

    for await (const chunk of this.agents.prompt(proposerSession, input)) {
      if (chunk.type === 'text') {
        proposerOutput += chunk.content
      }
    }
    results.push({ roleId: proposer.id, output: proposerOutput })
    onProgress?.(proposer.id, proposerOutput)
    await this.agents.stop(proposerSession)

    // Debate rounds
    for (let round = 0; round < maxRounds; round++) {
      // Opposer responds
      const opposerSession = `orch-opposer-${Date.now()}-${round}`
      await this.agents.create({
        sessionId: opposerSession,
        model: opposer.model,
        cwd: cwd || process.cwd(),
        systemPrompt: opposer.systemPrompt,
        tools: opposer.tools,
      })

      opposerOutput = ''
      const opposerInput = `Original question: ${input}\n\nProposer's argument:\n${proposerOutput}\n\nPlease provide your counter-argument.`
      for await (const chunk of this.agents.prompt(opposerSession, opposerInput)) {
        if (chunk.type === 'text') {
          opposerOutput += chunk.content
        }
      }
      results.push({ roleId: opposer.id, output: opposerOutput })
      onProgress?.(opposer.id, opposerOutput)
      await this.agents.stop(opposerSession)

      // Proposer responds
      const proposerSession2 = `orch-proposer-${Date.now()}-${round}`
      await this.agents.create({
        sessionId: proposerSession2,
        model: proposer.model,
        cwd: cwd || process.cwd(),
        systemPrompt: proposer.systemPrompt,
        tools: proposer.tools,
      })

      proposerOutput = ''
      const proposerInput = `Original question: ${input}\n\nOpposer's argument:\n${opposerOutput}\n\nPlease provide your rebuttal.`
      for await (const chunk of this.agents.prompt(proposerSession2, proposerInput)) {
        if (chunk.type === 'text') {
          proposerOutput += chunk.content
        }
      }
      results.push({ roleId: proposer.id, output: proposerOutput })
      onProgress?.(proposer.id, proposerOutput)
      await this.agents.stop(proposerSession2)
    }

    // Judge makes final decision
    const judgeSession = `orch-judge-${Date.now()}`
    await this.agents.create({
      sessionId: judgeSession,
      model: judge.model,
      cwd: cwd || process.cwd(),
      systemPrompt: judge.systemPrompt,
      tools: judge.tools,
    })

    let judgeOutput = ''
    const judgeInput = `Original question: ${input}\n\nDebate history:\n${results.map((r) => `## ${r.roleId}\n${r.output}`).join('\n\n')}\n\nPlease make a final decision based on the debate.`
    for await (const chunk of this.agents.prompt(judgeSession, judgeInput)) {
      if (chunk.type === 'text') {
        judgeOutput += chunk.content
      }
    }
    results.push({ roleId: judge.id, output: judgeOutput })
    onProgress?.(judge.id, judgeOutput)
    await this.agents.stop(judgeSession)

    return {
      mode: 'debate',
      results,
      finalOutput: judgeOutput,
    }
  }

  private async executeHierarchical(
    roles: AgentRole[],
    input: string,
    cwd: string | undefined,
    onProgress?: (agentId: string, output: string) => void,
  ): Promise<OrchestrationResult> {
    if (roles.length < 2) {
      throw new Error('Hierarchical mode requires at least 2 roles: manager and workers')
    }

    const [manager, ...workers] = roles
    const results: { roleId: string; output: string }[] = []

    // Manager decomposes the task
    const managerSession = `orch-manager-${Date.now()}`
    await this.agents.create({
      sessionId: managerSession,
      model: manager.model,
      cwd: cwd || process.cwd(),
      systemPrompt: manager.systemPrompt,
      tools: manager.tools,
    })

    let managerOutput = ''
    const managerInput = `You are a manager. Decompose the following task into subtasks for your workers. Each worker has specific capabilities.\n\nTask: ${input}\n\nWorkers: ${workers.map((w) => `- ${w.name}: ${w.description}`).join('\n')}\n\nPlease provide a JSON array of subtasks, each with "workerId" and "task" fields.`
    for await (const chunk of this.agents.prompt(managerSession, managerInput)) {
      if (chunk.type === 'text') {
        managerOutput += chunk.content
      }
    }
    results.push({ roleId: manager.id, output: managerOutput })
    onProgress?.(manager.id, managerOutput)
    await this.agents.stop(managerSession)

    // Parse subtasks
    let subtasks: { workerId: string; task: string }[] = []
    try {
      const jsonMatch = managerOutput.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        subtasks = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, assign task to first worker
      subtasks = [{ workerId: workers[0].id, task: input }]
    }

    // Execute subtasks in parallel
    const workerResults = await Promise.all(
      subtasks.map(async (subtask) => {
        const worker = workers.find((w) => w.id === subtask.workerId) || workers[0]
        const workerSession = `orch-worker-${worker.id}-${Date.now()}`
        await this.agents.create({
          sessionId: workerSession,
          model: worker.model,
          cwd: cwd || process.cwd(),
          systemPrompt: worker.systemPrompt,
          tools: worker.tools,
        })

        let output = ''
        for await (const chunk of this.agents.prompt(workerSession, subtask.task)) {
          if (chunk.type === 'text') {
            output += chunk.content
          }
        }
        await this.agents.stop(workerSession)
        onProgress?.(worker.id, output)
        return { roleId: worker.id, output }
      }),
    )
    results.push(...workerResults)

    // Manager aggregates results
    const aggregationSession = `orch-manager-agg-${Date.now()}`
    await this.agents.create({
      sessionId: aggregationSession,
      model: manager.model,
      cwd: cwd || process.cwd(),
      systemPrompt: manager.systemPrompt,
      tools: manager.tools,
    })

    let finalOutput = ''
    const aggInput = `Original task: ${input}\n\nWorker results:\n${workerResults.map((r) => `## ${r.roleId}\n${r.output}`).join('\n\n')}\n\nPlease aggregate these results into a final coherent response.`
    for await (const chunk of this.agents.prompt(aggregationSession, aggInput)) {
      if (chunk.type === 'text') {
        finalOutput += chunk.content
      }
    }
    results.push({ roleId: manager.id, output: finalOutput })
    onProgress?.(manager.id, finalOutput)
    await this.agents.stop(aggregationSession)

    return {
      mode: 'hierarchical',
      results,
      finalOutput,
    }
  }
}
