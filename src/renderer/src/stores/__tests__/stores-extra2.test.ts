import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSandboxStore } from '../sandbox-store'
import { useWorkflowStore } from '../workflow-store'
import { useStatusStore } from '../status-store'

describe('sandbox-store 边界', () => {
  beforeEach(() => {
    useSandboxStore.setState({ executions: new Map(), activeExecutionId: null })
  })

  it('没有活跃执行时 appendOutput 是空操作', () => {
    useSandboxStore.getState().appendOutput({ type: 'stdout', content: 'hi' })

    expect(useSandboxStore.getState().executions.size).toBe(0)
  })

  it('活跃执行已被清除时 appendOutput 不创建新条目', () => {
    useSandboxStore.getState().startExecution('exec-1', 'javascript', 'console.log(1)')
    useSandboxStore.setState({ activeExecutionId: 'missing' })

    useSandboxStore.getState().appendOutput({ type: 'stdout', content: 'hi' })

    expect(useSandboxStore.getState().executions.size).toBe(1)
  })

  it('没有活跃执行时 completeExecution 是空操作', () => {
    useSandboxStore.getState().completeExecution(0)

    expect(useSandboxStore.getState().executions.size).toBe(0)
  })

  it('活跃执行已被清除时 completeExecution 不报错', () => {
    useSandboxStore.setState({ executions: new Map(), activeExecutionId: 'missing' })

    expect(() => useSandboxStore.getState().completeExecution(0)).not.toThrow()
  })

  it('setActiveExecution 可切换与清空当前执行', () => {
    useSandboxStore.getState().startExecution('exec-1', 'python', 'print(1)')
    useSandboxStore.getState().startExecution('exec-2', 'python', 'print(2)')

    useSandboxStore.getState().setActiveExecution('exec-1')
    expect(useSandboxStore.getState().activeExecutionId).toBe('exec-1')

    useSandboxStore.getState().setActiveExecution(null)
    expect(useSandboxStore.getState().activeExecutionId).toBeNull()
  })

  it('清除非活跃执行时保留当前活跃执行', () => {
    useSandboxStore.getState().startExecution('exec-1', 'python', 'print(1)')
    useSandboxStore.getState().startExecution('exec-2', 'python', 'print(2)')

    useSandboxStore.getState().clearExecution('exec-1')

    expect(useSandboxStore.getState().activeExecutionId).toBe('exec-2')
    expect(useSandboxStore.getState().executions.size).toBe(1)
  })

  it('exit 事件写入退出码并标记完成', () => {
    useSandboxStore.getState().startExecution('exec-1', 'bash', 'echo hi')

    useSandboxStore.getState().appendOutput({ type: 'exit', content: '', exitCode: 0 })

    const execution = useSandboxStore.getState().executions.get('exec-1')
    expect(execution?.status).toBe('completed')
    expect(execution?.exitCode).toBe(0)
    expect(execution?.output).toHaveLength(1)
    expect(typeof execution?.output[0].timestamp).toBe('number')
  })
})

describe('workflow-store 剩余操作', () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      nodeStatus: new Map(),
      isExecuting: false,
    })
    localStorage.clear()
  })

  it('onEdgesChange 应用边变化并持久化', () => {
    useWorkflowStore.getState().setNodes([
      { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'n2', type: 'end', position: { x: 10, y: 10 }, data: {} },
    ])
    useWorkflowStore.getState().setEdges([
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n1' },
    ])

    useWorkflowStore.getState().onEdgesChange([{ id: 'e2', type: 'remove' }])

    expect(useWorkflowStore.getState().edges.map((e) => e.id)).toEqual(['e1'])
    const saved = JSON.parse(localStorage.getItem('pencil-agent:workflow')!)
    expect(saved.edges).toHaveLength(1)
  })

  it('setExecuting 切换执行状态', () => {
    useWorkflowStore.getState().setExecuting(true)
    expect(useWorkflowStore.getState().isExecuting).toBe(true)

    useWorkflowStore.getState().setExecuting(false)
    expect(useWorkflowStore.getState().isExecuting).toBe(false)
  })

  it('updateNodeStatus 累积节点状态', () => {
    useWorkflowStore.getState().updateNodeStatus({ nodeId: 'n1', status: 'running' })
    useWorkflowStore.getState().updateNodeStatus({ nodeId: 'n2', status: 'error' })
    useWorkflowStore.getState().updateNodeStatus({ nodeId: 'n1', status: 'success' })

    const status = useWorkflowStore.getState().nodeStatus
    expect(status.get('n1')).toBe('success')
    expect(status.get('n2')).toBe('error')
  })
})

describe('status-store 初始化细节', () => {
  const listeners = new Map<string, EventListener>()
  const addEventListener = vi.fn((event: string, handler: EventListener) => {
    listeners.set(event, handler)
  })

  beforeEach(() => {
    listeners.clear()
    addEventListener.mockClear()
    useStatusStore.setState({
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      connectionStatus: 'checking',
      lastChecked: 0,
      version: '0.0.0',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('注册 token-usage 监听并累加用量', async () => {
    vi.stubGlobal('window', {
      addEventListener,
      api: {
        app: { getVersion: vi.fn().mockResolvedValue('2.0.0') },
        settings: { checkConnection: vi.fn().mockResolvedValue(true) },
      },
    })

    await useStatusStore.getState().init()

    expect(useStatusStore.getState().version).toBe('2.0.0')
    const handler = listeners.get('token-usage')
    expect(handler).toBeDefined()

    handler!(new CustomEvent('token-usage', { detail: { prompt: 10, completion: 5, total: 15 } }))
    expect(useStatusStore.getState().tokenUsage.total).toBe(15)
  })

  it('getVersion 失败时记录日志并继续', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('window', {
      addEventListener,
      api: {
        app: { getVersion: vi.fn().mockRejectedValue(new Error('no version')) },
        settings: { checkConnection: vi.fn().mockResolvedValue(true) },
      },
    })

    await useStatusStore.getState().init()

    expect(consoleError).toHaveBeenCalled()
    expect(useStatusStore.getState().version).toBe('0.0.0')
    expect(useStatusStore.getState().connectionStatus).toBe('connected')
    consoleError.mockRestore()
  })

  it('init 后每 60 秒重新检查连接', async () => {
    vi.useFakeTimers()
    const checkConnection = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('window', {
      addEventListener,
      api: {
        app: { getVersion: vi.fn().mockResolvedValue('1.0.0') },
        settings: { checkConnection },
      },
    })

    await useStatusStore.getState().init()
    expect(checkConnection).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60000)
    expect(checkConnection).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(60000)
    expect(checkConnection).toHaveBeenCalledTimes(3)
  })
})
