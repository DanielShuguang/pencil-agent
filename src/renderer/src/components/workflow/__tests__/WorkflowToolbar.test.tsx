import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowToolbar } from '../WorkflowToolbar'
import '../../../i18n'

vi.mock('../../../stores/workflow-store', () => ({
  useWorkflowStore: vi.fn(),
}))

const { useWorkflowStore } = await import('../../../stores/workflow-store')
const mockUseWorkflowStore = vi.mocked(useWorkflowStore)

beforeEach(() => {
  mockUseWorkflowStore.mockReturnValue({
    nodes: [],
    edges: [],
    isExecuting: false,
    clearWorkflow: vi.fn(),
    addNode: vi.fn(),
  } as unknown as ReturnType<typeof useWorkflowStore>)
})

describe('WorkflowToolbar', () => {
  it('renders all add node buttons', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('开始')).toBeInTheDocument()
    expect(screen.getByText('Agent')).toBeInTheDocument()
    expect(screen.getByText('工具')).toBeInTheDocument()
    expect(screen.getByText('条件')).toBeInTheDocument()
    expect(screen.getByText('结束')).toBeInTheDocument()
  })

  it('renders execute button', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('执行')).toBeInTheDocument()
  })

  it('renders save and load buttons', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('保存')).toBeInTheDocument()
    expect(screen.getByText('加载')).toBeInTheDocument()
  })

  it('renders clear button', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('清空')).toBeInTheDocument()
  })

  it('disables execute when no nodes', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('执行')).toBeDisabled()
  })

  it('enables execute when nodes exist', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      isExecuting: false,
      clearWorkflow: vi.fn(),
      addNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<WorkflowToolbar />)
    expect(screen.getByText('执行')).not.toBeDisabled()
  })

  it('shows executing text when executing', () => {
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      isExecuting: true,
      clearWorkflow: vi.fn(),
      addNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<WorkflowToolbar />)
    expect(screen.getByText('执行中...')).toBeInTheDocument()
  })

  it('calls addNode on node button click', () => {
    const addNode = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [],
      edges: [],
      isExecuting: false,
      clearWorkflow: vi.fn(),
      addNode,
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByText('开始'))
    expect(addNode).toHaveBeenCalledWith(expect.objectContaining({ type: 'start' }))
  })

  it('calls clearWorkflow on clear click', () => {
    const clearWorkflow = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      isExecuting: false,
      clearWorkflow,
      addNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<WorkflowToolbar />)
    fireEvent.click(screen.getByText('清空'))
    expect(clearWorkflow).toHaveBeenCalled()
  })

  it('calls onExecute on execute click', () => {
    const onExecute = vi.fn()
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
      isExecuting: false,
      clearWorkflow: vi.fn(),
      addNode: vi.fn(),
    } as unknown as ReturnType<typeof useWorkflowStore>)

    render(<WorkflowToolbar onExecute={onExecute} />)
    fireEvent.click(screen.getByText('执行'))
    expect(onExecute).toHaveBeenCalled()
  })

  it('disables save when no nodes', () => {
    render(<WorkflowToolbar />)
    expect(screen.getByText('保存')).toBeDisabled()
  })
})
