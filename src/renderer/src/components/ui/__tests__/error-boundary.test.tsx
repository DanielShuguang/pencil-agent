import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom')
  return <div>正常内容</div>
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // React 会把捕获到的错误再打印一次，测试里静音
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('无错误时渲染子组件', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('正常内容')).toBeInTheDocument()
    expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
  })

  it('子组件抛错时渲染默认兜底界面与错误信息', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument()
  })

  it('提供 fallback 时渲染自定义内容', () => {
    render(
      <ErrorBoundary fallback={<div>自定义兜底</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('自定义兜底')).toBeInTheDocument()
    expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
  })

  it('点击重试后尝试重新渲染子组件', () => {
    let shouldThrow = true
    function Recoverable() {
      if (shouldThrow) throw new Error('boom')
      return <div>恢复了</div>
    }

    render(
      <ErrorBoundary>
        <Recoverable />
      </ErrorBoundary>,
    )
    expect(screen.getByText('页面出现错误')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /重试/ }))

    expect(screen.getByText('恢复了')).toBeInTheDocument()
  })

  it('记录捕获到的错误', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(consoleError).toHaveBeenCalledWith(
      '[ErrorBoundary] Caught error:',
      expect.any(Error),
      expect.anything(),
    )
  })
})
