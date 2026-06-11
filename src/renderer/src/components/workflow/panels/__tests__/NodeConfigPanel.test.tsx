import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeConfigPanel } from '../NodeConfigPanel'
import '../../../../i18n'

vi.mock('../../../../stores/workflow-store', () => ({
  useWorkflowStore: vi.fn(),
}))

vi.mock('../../../../stores/tool-store', () => ({
  useToolStore: vi.fn(),
}))

const { useWorkflowStore } = await import('../../../../stores/workflow-store')
const { useToolStore } = await import('../../../../stores/tool-store')

const mockUseWorkflowStore = vi.mocked(useWorkflowStore)
const mockUseToolStore = vi.mocked(useToolStore)

beforeEach(() => {
  mockUseToolStore.mockReturnValue({
    tools: [
      { name: 'read_file', description: 'Read a file', parameters: {} },
      { name: 'write_file', description: 'Write a file', parameters: {} },
    ],
  } as unknown as ReturnType<typeof useToolStore>)
})

describe('NodeConfigPanel', () => {
  it('renders nothing when no node is selected', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [],
      selectedNodeId: null,
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    const { container } = render(<NodeConfigPanel />)
    expect(container.innerHTML).toBe('')
  })

  it('renders node config when node is selected', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'agent-1',
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    expect(screen.getByText('节点配置')).toBeInTheDocument()
    expect(screen.getByText('agent-1')).toBeInTheDocument()
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('renders agent-specific fields', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'agent-1',
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    expect(screen.getByText('模型')).toBeInTheDocument()
    expect(screen.getByText('系统提示词')).toBeInTheDocument()
    expect(screen.getByText('温度')).toBeInTheDocument()
  })

  it('renders tool-specific fields', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'tool-1',
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    expect(screen.getByText('工具')).toBeInTheDocument()
  })

  it('renders condition-specific fields', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'cond-1', type: 'condition', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'cond-1',
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    expect(screen.getByText('条件表达式')).toBeInTheDocument()
  })

  it('calls selectNode(null) on close click', () => {
    const selectNode = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'agent-1',
      updateNodeData: vi.fn(),
      selectNode,
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    fireEvent.click(screen.getByRole('button'))
    expect(selectNode).toHaveBeenCalledWith(null)
  })

  it('updates node data on system prompt change', () => {
    const updateNodeData = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'agent-1',
      updateNodeData,
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    const textarea = screen.getByPlaceholderText('输入系统提示词...')
    fireEvent.change(textarea, { target: { value: 'New prompt' } })
    expect(updateNodeData).toHaveBeenCalledWith('agent-1', {
      config: { systemPrompt: 'New prompt' },
    })
  })

  it('updates node data on condition expression change', () => {
    const updateNodeData = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'cond-1', type: 'condition', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'cond-1',
      updateNodeData,
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    const textarea = screen.getByPlaceholderText('$input !== null')
    fireEvent.change(textarea, { target: { value: '$input === true' } })
    expect(updateNodeData).toHaveBeenCalledWith('cond-1', {
      config: { expression: '$input === true' },
    })
  })

  it('renders temperature slider with default value', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { config: {} } }],
      selectedNodeId: 'agent-1',
      updateNodeData: vi.fn(),
      selectNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<NodeConfigPanel />)
    expect(screen.getByText('0.7')).toBeInTheDocument()
  })
})
