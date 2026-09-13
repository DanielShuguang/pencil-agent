import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  reactFlowProps: null as Record<string, any> | null,
}))

vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: Record<string, any>) => {
    mocks.reactFlowProps = props
    return (
      <div data-testid='react-flow'>
        <div data-testid='background' />
        <div data-testid='controls' />
        <div data-testid='minimap' />
      </div>
    )
  },
  Background: () => <div data-testid='background' />,
  Controls: () => <div data-testid='controls' />,
  MiniMap: () => <div data-testid='minimap' />,
}))

vi.mock('../../../stores/workflow-store', () => ({
  useWorkflowStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}))

import { WorkflowCanvas } from '../WorkflowCanvas'
import { useWorkflowStore } from '../../../stores/workflow-store'
import { StartNode, EndNode, AgentNode, ToolNode, ConditionNode } from '../nodes'

const mockUseWorkflowStore = vi.mocked(useWorkflowStore) as any

describe('WorkflowCanvas', () => {
  const selectNode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reactFlowProps = null
    mockUseWorkflowStore.mockReturnValue({
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: {} }],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      selectNode,
    })
    mockUseWorkflowStore.getState.mockReturnValue({ addNode: vi.fn() })
  })

  it('把 store 中的节点与边传给 ReactFlow', () => {
    render(<WorkflowCanvas />)

    expect(mocks.reactFlowProps?.nodes).toHaveLength(1)
    expect(mocks.reactFlowProps?.edges).toHaveLength(1)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('注册全部节点类型', () => {
    render(<WorkflowCanvas />)

    expect(mocks.reactFlowProps?.nodeTypes).toEqual({
      start: StartNode,
      end: EndNode,
      agent: AgentNode,
      tool: ToolNode,
      condition: ConditionNode,
    })
  })

  it('支持 Backspace/Delete 删除节点', () => {
    render(<WorkflowCanvas />)

    expect(mocks.reactFlowProps?.deleteKeyCode).toEqual(['Backspace', 'Delete'])
  })

  it('渲染背景、控制条与缩略图', () => {
    render(<WorkflowCanvas />)

    expect(screen.getByTestId('background')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByTestId('minimap')).toBeInTheDocument()
  })

  it('点击空白处取消选中', () => {
    render(<WorkflowCanvas />)

    mocks.reactFlowProps?.onPaneClick()

    expect(selectNode).toHaveBeenCalledWith(null)
  })

  it('onInit 保存实例供拖拽使用', () => {
    render(<WorkflowCanvas />)
    const instance = {
      screenToFlowPosition: vi.fn().mockReturnValue({ x: 10, y: 20 }),
    }

    expect(() => mocks.reactFlowProps?.onInit(instance)).not.toThrow()
  })

  describe('拖拽放置', () => {
    function dragEvent(type: string | null, x = 100, y = 200) {
      return {
        preventDefault: vi.fn(),
        clientX: x,
        clientY: y,
        dataTransfer: {
          getData: vi.fn().mockReturnValue(type),
          dropEffect: '',
        },
      } as unknown as React.DragEvent
    }

    it('dragover 阻止默认行为并设置移动光标', () => {
      render(<WorkflowCanvas />)
      const event = dragEvent(null)

      mocks.reactFlowProps?.onDragOver(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe('move')
    })

    it('drop 时按拖拽类型新增节点', () => {
      const addNode = vi.fn()
      mockUseWorkflowStore.getState.mockReturnValue({ addNode })
      render(<WorkflowCanvas />)
      mocks.reactFlowProps?.onInit({
        screenToFlowPosition: vi.fn().mockReturnValue({ x: 42, y: 84 }),
      })

      mocks.reactFlowProps?.onDrop(dragEvent('condition'))

      expect(addNode).toHaveBeenCalledTimes(1)
      const node = addNode.mock.calls[0][0]
      expect(node.type).toBe('condition')
      expect(node.position).toEqual({ x: 42, y: 84 })
      expect(node.id).toMatch(/^condition-/)
      expect(node.data).toEqual({ config: {} })
    })

    it('drop 未携带类型时忽略', () => {
      const addNode = vi.fn()
      mockUseWorkflowStore.getState.mockReturnValue({ addNode })
      render(<WorkflowCanvas />)

      mocks.reactFlowProps?.onDrop(dragEvent(null))

      expect(addNode).not.toHaveBeenCalled()
    })

    it('未初始化实例时 drop 不新增节点', () => {
      const addNode = vi.fn()
      mockUseWorkflowStore.getState.mockReturnValue({ addNode })
      render(<WorkflowCanvas />)

      mocks.reactFlowProps?.onDrop(dragEvent('agent'))

      expect(addNode).not.toHaveBeenCalled()
    })
  })

  it('透传 className', () => {
    const { container } = render(<WorkflowCanvas className='h-full' />)

    expect(container.firstElementChild?.className).toContain('h-full')
  })

  it('节点类型切换后仍从 store 读取最新数据', () => {
    const { rerender } = render(<WorkflowCanvas />)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()

    mockUseWorkflowStore.mockReturnValue({
      nodes: [],
      edges: [],
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      selectNode,
    })
    rerender(<WorkflowCanvas />)

    expect(mocks.reactFlowProps?.nodes).toEqual([])
  })
})
