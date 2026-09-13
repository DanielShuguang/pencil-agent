import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkflowToolbar } from '../WorkflowToolbar'
import '../../../i18n'

const storeMocks = vi.hoisted(() => ({
  addNode: vi.fn(),
  clearWorkflow: vi.fn(),
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  state: { nodes: [] as unknown[], edges: [] as unknown[], isExecuting: false },
}))

vi.mock('../../../stores/workflow-store', () => ({
  useWorkflowStore: Object.assign(
    () => ({
      nodes: storeMocks.state.nodes,
      edges: storeMocks.state.edges,
      isExecuting: storeMocks.state.isExecuting,
      clearWorkflow: storeMocks.clearWorkflow,
      addNode: storeMocks.addNode,
    }),
    {
      getState: () => ({
        setNodes: storeMocks.setNodes,
        setEdges: storeMocks.setEdges,
      }),
    },
  ),
}))

describe('WorkflowToolbar 操作', () => {
  let realCreateElement: typeof document.createElement

  beforeEach(() => {
    vi.clearAllMocks()
    storeMocks.state = { nodes: [], edges: [], isExecuting: false }
    realCreateElement = document.createElement.bind(document)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('点击各类节点按钮时按类型创建节点', () => {
    render(<WorkflowToolbar />)

    fireEvent.click(screen.getByTitle('添加开始节点'))
    fireEvent.click(screen.getByTitle('添加 Agent 节点'))
    fireEvent.click(screen.getByTitle('添加工具节点'))
    fireEvent.click(screen.getByTitle('添加条件节点'))
    fireEvent.click(screen.getByTitle('添加结束节点'))

    expect(storeMocks.addNode).toHaveBeenCalledTimes(5)
    const types = storeMocks.addNode.mock.calls.map((call) => call[0].type)
    expect(types).toEqual(['start', 'agent', 'tool', 'condition', 'end'])
    expect(storeMocks.addNode.mock.calls[0][0]).toMatchObject({
      position: { x: 250, y: 150 },
      data: { config: {} },
    })
    expect(storeMocks.addNode.mock.calls[0][0].id).toMatch(/^start-/)
  })

  it('点击执行按钮调用 onExecute', () => {
    storeMocks.state.nodes = [{ id: 'n1', type: 'start' }]
    const onExecute = vi.fn()
    render(<WorkflowToolbar onExecute={onExecute} />)

    fireEvent.click(screen.getByTitle('执行'))

    expect(onExecute).toHaveBeenCalled()
  })

  it('点击清空按钮调用 clearWorkflow', () => {
    storeMocks.state.nodes = [{ id: 'n1', type: 'start' }]
    render(<WorkflowToolbar />)

    fireEvent.click(screen.getByTitle('清空画布'))

    expect(storeMocks.clearWorkflow).toHaveBeenCalled()
  })

  it('保存按钮在无节点时禁用，有节点时导出 JSON 文件', async () => {
    const inputStub: any = { type: '', accept: '', click: vi.fn(), onchange: null }
    const anchor = realCreateElement('a')
    const anchorClick = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    // input/a 返回桩对象，其余元素走真实实现，避免破坏 React 渲染
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'input') return inputStub
      if (tagName === 'a') return anchor
      return realCreateElement(tagName)
    }) as typeof document.createElement)

    const { unmount } = render(<WorkflowToolbar />)
    expect(screen.getByTitle('保存工作流')).toBeDisabled()
    unmount()

    storeMocks.state.nodes = [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }]
    storeMocks.state.edges = [{ id: 'e1', source: 'n1', target: 'n2' }]
    const createObjectURL = vi.fn().mockReturnValue('blob:workflow')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByTitle('保存工作流'))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:workflow')

    expect(anchor.download).toBe('workflow.json')
    expect(anchorClick).toHaveBeenCalled()
  })

  it('导入合法 JSON 时写入节点与边', async () => {
    const input: any = { type: '', accept: '', click: vi.fn(), onchange: null }
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) =>
      tagName === 'input'
        ? (input as unknown as HTMLElement)
        : realCreateElement(tagName)) as typeof document.createElement)

    class FileReaderStub {
      onload: ((event: { target: { result: string } }) => void) | null = null
      result = JSON.stringify({
        nodes: [{ id: 'n1', type: 'start', position: { x: 1, y: 2 }, data: {} }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      })
      readAsText() {
        this.onload?.({ target: { result: this.result } })
      }
    }
    vi.stubGlobal('FileReader', FileReaderStub)

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByTitle('加载工作流'))

    expect(input.click).toHaveBeenCalled()
    input.onchange({ target: { files: [{ name: 'workflow.json' }] } })

    await waitFor(() => expect(storeMocks.setNodes).toHaveBeenCalled())
    expect(storeMocks.setEdges).toHaveBeenCalled()
  })

  it('导入非法 JSON 时弹出错误对话框', async () => {
    const input: any = { type: '', accept: '', click: vi.fn(), onchange: null }
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) =>
      tagName === 'input'
        ? (input as unknown as HTMLElement)
        : realCreateElement(tagName)) as typeof document.createElement)

    class FileReaderStub {
      onload: ((event: { target: { result: string } }) => void) | null = null
      result = 'not-json'
      readAsText() {
        this.onload?.({ target: { result: this.result } })
      }
    }
    vi.stubGlobal('FileReader', FileReaderStub)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByTitle('加载工作流'))
    input.onchange({ target: { files: [{ name: 'bad.json' }] } })

    await waitFor(() => expect(screen.getByText('无效的工作流文件')).toBeInTheDocument())
    expect(storeMocks.setNodes).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('未选择文件时不读取', () => {
    const input: any = { type: '', accept: '', click: vi.fn(), onchange: null }
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) =>
      tagName === 'input'
        ? (input as unknown as HTMLElement)
        : realCreateElement(tagName)) as typeof document.createElement)
    const readAsText = vi.fn()
    vi.stubGlobal('FileReader', class { readAsText = readAsText })

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByTitle('加载工作流'))
    input.onchange({ target: { files: [] } })

    expect(readAsText).not.toHaveBeenCalled()
  })
})
