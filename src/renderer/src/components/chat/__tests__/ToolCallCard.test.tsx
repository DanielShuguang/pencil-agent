import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolCallCard } from '../ToolCallCard'
import '../../../i18n'

describe('ToolCallCard', () => {
  it('should render tool name', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'pending',
        }}
      />,
    )
    expect(screen.getByText('bash')).toBeInTheDocument()
  })

  it('should show pending status', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'pending',
        }}
      />,
    )
    expect(screen.getByText('等待中')).toBeInTheDocument()
  })

  it('should show running status', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'running',
        }}
      />,
    )
    expect(screen.getByText('执行中')).toBeInTheDocument()
  })

  it('should show success status', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'success',
          result: 'hello',
        }}
      />,
    )
    expect(screen.getByText('成功')).toBeInTheDocument()
  })

  it('should show error status', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'error',
          error: 'Command failed',
        }}
      />,
    )
    expect(screen.getByText('失败')).toBeInTheDocument()
  })

  it('should expand and show parameters when clicked', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: { command: 'echo hello' },
          status: 'success',
        }}
      />,
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('参数')).toBeInTheDocument()
  })

  it('字符串结果直接展示原文', () => {
    render(
      <ToolCallCard
        toolCall={{
          toolName: 'bash',
          parameters: {},
          status: 'success',
          result: 'plain text result',
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('plain text result')).toBeInTheDocument()
  })

  it('对象结果以 JSON 形式展示', () => {
    const { container } = render(
      <ToolCallCard
        toolCall={{
          toolName: 'read',
          parameters: {},
          status: 'success',
          result: { path: '/tmp/file.txt', lines: 12 },
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button'))

    expect(container.textContent).toContain('/tmp/file.txt')
    expect(container.textContent).toContain('lines')
  })

  it('展开后可再次收起', () => {
    render(
      <ToolCallCard
        toolCall={{ toolName: 'bash', parameters: {}, status: 'success' }}
      />,
    )
    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(screen.getByText('参数')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.queryByText('参数')).not.toBeInTheDocument()
  })
})
