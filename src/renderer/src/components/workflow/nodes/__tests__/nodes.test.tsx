import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Position } from '@xyflow/react'
import { BaseNode } from '../BaseNode'
import { StartNode } from '../StartNode'
import { EndNode } from '../EndNode'
import { AgentNode } from '../AgentNode'
import { ToolNode } from '../ToolNode'
import { ConditionNode } from '../ConditionNode'
import { useWorkflowStore } from '../../../../stores/workflow-store'
import '../../../../i18n'

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id }: { type: string; position: string; id?: string }) => (
    <div data-testid='handle' data-type={type} data-position={position} data-id={id} />
  ),
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}))

function setStoreState(overrides: Record<string, unknown> = {}) {
  useWorkflowStore.setState({
    selectedNodeId: null,
    nodeStatus: new Map(),
    selectNode: vi.fn(),
    ...overrides,
  } as any)
}

describe('workflow nodes', () => {
  beforeEach(() => {
    setStoreState()
  })

  describe('BaseNode', () => {
    it('渲染子元素并默认带有输入/输出手柄', () => {
      render(
        <BaseNode nodeId='n1'>
          <span>内容</span>
        </BaseNode>,
      )

      expect(screen.getByText('内容')).toBeInTheDocument()
      const handles = screen.getAllByTestId('handle')
      expect(handles).toHaveLength(2)
      expect(handles[0]).toHaveAttribute('data-type', 'target')
      expect(handles[1]).toHaveAttribute('data-type', 'source')
    })

    it('hasInput=false 时不渲染输入手柄', () => {
      render(
        <BaseNode nodeId='n1' hasInput={false}>
          <span>开始</span>
        </BaseNode>,
      )

      const handles = screen.getAllByTestId('handle')
      expect(handles).toHaveLength(1)
      expect(handles[0]).toHaveAttribute('data-type', 'source')
    })

    it('hasOutput=false 时不渲染输出手柄', () => {
      render(
        <BaseNode nodeId='n1' hasOutput={false}>
          <span>结束</span>
        </BaseNode>,
      )

      const handles = screen.getAllByTestId('handle')
      expect(handles).toHaveLength(1)
      expect(handles[0]).toHaveAttribute('data-type', 'target')
    })

    it('outputHandles 存在时按定义渲染多个输出手柄', () => {
      render(
        <BaseNode
          nodeId='n1'
          outputHandles={[
            { id: 'true', position: Position.Bottom },
            { id: 'false', position: Position.Bottom },
          ]}
        >
          <span>条件</span>
        </BaseNode>,
      )

      const handles = screen.getAllByTestId('handle')
      const ids = handles.map((h) => h.getAttribute('data-id')).filter(Boolean)
      expect(ids).toEqual(['true', 'false'])
    })

    it('被选中时使用主色边框', () => {
      setStoreState({ selectedNodeId: 'n1' })

      const { container } = render(
        <BaseNode nodeId='n1'>
          <span>内容</span>
        </BaseNode>,
      )

      expect(container.firstElementChild?.className).toContain('border-primary')
    })

    it.each([
      ['running', 'border-blue-500'],
      ['success', 'border-green-500'],
      ['error', 'border-red-500'],
    ])('执行状态 %s 使用对应边框', (status, expectedClass) => {
      setStoreState({ nodeStatus: new Map([['n1', status]]) })

      const { container } = render(
        <BaseNode nodeId='n1'>
          <span>内容</span>
        </BaseNode>,
      )

      expect(container.firstElementChild?.className).toContain(expectedClass)
    })

    it('默认状态为 pending', () => {
      const { container } = render(
        <BaseNode nodeId='n1'>
          <span>内容</span>
        </BaseNode>,
      )

      expect(container.firstElementChild?.className).toContain('border-gray-300')
    })

    it('点击节点时选中自身', () => {
      const selectNode = vi.fn()
      setStoreState({ selectNode })

      const { container } = render(
        <BaseNode nodeId='node-42'>
          <span>内容</span>
        </BaseNode>,
      )

      fireEvent.click(container.firstElementChild!)

      expect(selectNode).toHaveBeenCalledWith('node-42')
    })
  })

  describe('具体节点', () => {
    it('StartNode 只渲染输出手柄', () => {
      render(<StartNode id='start-1' data={{}} />)

      expect(screen.getByText('开始')).toBeInTheDocument()
      const handles = screen.getAllByTestId('handle')
      expect(handles).toHaveLength(1)
      expect(handles[0]).toHaveAttribute('data-type', 'source')
    })

    it('EndNode 只渲染输入手柄', () => {
      render(<EndNode id='end-1' data={{}} />)

      expect(screen.getByText('结束')).toBeInTheDocument()
      const handles = screen.getAllByTestId('handle')
      expect(handles).toHaveLength(1)
      expect(handles[0]).toHaveAttribute('data-type', 'target')
    })

    it('AgentNode 展示配置的模型', () => {
      render(
        <AgentNode
          id='agent-1'
          data={{ config: { model: { id: 'gpt-4o', provider: 'openai' } } }}
        />,
      )

      expect(screen.getByText('Agent')).toBeInTheDocument()
      expect(screen.getByText('gpt-4o')).toBeInTheDocument()
    })

    it('AgentNode 未配置模型时不展示模型行', () => {
      render(<AgentNode id='agent-1' data={{ config: {} }} />)

      expect(screen.getByText('Agent')).toBeInTheDocument()
      expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument()
    })

    it('AgentNode 缺少 config 时不崩溃', () => {
      render(<AgentNode id='agent-1' data={{}} />)

      expect(screen.getByText('Agent')).toBeInTheDocument()
    })

    it('ToolNode 展示工具名', () => {
      render(<ToolNode id='tool-1' data={{ config: { toolName: 'read_file' } }} />)

      expect(screen.getByText('工具')).toBeInTheDocument()
      expect(screen.getByText('read_file')).toBeInTheDocument()
    })

    it('ToolNode 未配置工具名时不展示工具行', () => {
      render(<ToolNode id='tool-1' data={{ config: {} }} />)

      expect(screen.getByText('工具')).toBeInTheDocument()
      expect(screen.queryByText('read_file')).not.toBeInTheDocument()
    })

    it('ConditionNode 展示表达式与真假分支手柄', () => {
      render(
        <ConditionNode id='cond-1' data={{ config: { expression: 'input.value > 10' } }} />,
      )

      expect(screen.getByText('条件')).toBeInTheDocument()
      expect(screen.getByText('input.value > 10')).toBeInTheDocument()
      expect(screen.getByText('是')).toBeInTheDocument()
      expect(screen.getByText('否')).toBeInTheDocument()

      const ids = screen
        .getAllByTestId('handle')
        .map((h) => h.getAttribute('data-id'))
        .filter(Boolean)
      expect(ids).toEqual(['true', 'false'])
    })
  })
})
