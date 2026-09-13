import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageBubble } from '../MessageBubble'

const baseMessage = {
  id: '1',
  content: 'Hello World',
  timestamp: 1000,
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('MessageBubble', () => {
  it('renders user message right-aligned', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-end')
  })

  it('renders assistant message left-aligned', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'assistant' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-start')
  })

  it('renders message content', () => {
    render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders system message left-aligned like assistant', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'system' }} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('justify-start')
  })

  it('renders thinking block when thinkingContent is present', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Let me analyze...' }}
      />,
    )
    expect(screen.getByText('chat.thinkingProcess')).toBeInTheDocument()
  })

  it('thinking block is collapsed by default', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Deep thought' }}
      />,
    )
    expect(screen.queryByText('Deep thought')).not.toBeInTheDocument()
  })

  it('thinking block expands on click', async () => {
    const user = userEvent.setup()
    render(
      <MessageBubble
        message={{ ...baseMessage, role: 'assistant', thinkingContent: 'Deep thought' }}
      />,
    )
    await user.click(screen.getByText('chat.thinkingProcess'))
    expect(screen.getByText('Deep thought')).toBeInTheDocument()
  })

  it('shows rewind button for user messages when onRewind is provided', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  it('does not show rewind button when onRewind is not provided', () => {
    const { container } = render(<MessageBubble message={{ ...baseMessage, role: 'user' }} />)
    const button = container.querySelector('button')
    expect(button).toBeNull()
  })

  it('does not show rewind button for assistant messages', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'assistant' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')
    expect(button).toBeNull()
  })

  it('shows confirmation dialog when rewind button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={vi.fn()} />,
    )
    const button = container.querySelector('button')!
    await user.click(button)
    expect(screen.getByText('chat.rewindTitle')).toBeInTheDocument()
    expect(screen.getByText('chat.rewindConfirm')).toBeInTheDocument()
  })

  it('calls onRewind when confirmation is accepted', async () => {
    const user = userEvent.setup()
    const onRewind = vi.fn()
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, role: 'user' }} onRewind={onRewind} />,
    )
    await user.click(container.querySelector('button')!)
    await user.click(screen.getByText('common.ok'))
    expect(onRewind).toHaveBeenCalledWith('1')
  })

  describe('markdown 自定义渲染', () => {
    function renderContent(content: string) {
      const { container } = render(
        <MessageBubble
          message={{ ...baseMessage, role: 'assistant', content }}
        />,
      )
      return container
    }

    it('行内代码使用等宽样式', () => {
      const container = renderContent('使用 `npm test` 运行测试')

      const code = container.querySelector('code')
      expect(code).toHaveTextContent('npm test')
      expect(code?.className).toContain('font-mono')
    })

    it('围栏代码块走 CodeBlock 渲染并带语言', () => {
      const container = renderContent('```ts\nconst a = 1\n```')

      expect(container.textContent).toContain('const a = 1')
      expect(container.querySelector('code')).toBeTruthy()
    })

    it('无序列表与有序列表', () => {
      const unordered = renderContent('- 第一项\n- 第二项')
      expect(unordered.querySelector('ul')?.className).toContain('list-disc')

      const ordered = renderContent('1. 第一项\n2. 第二项')
      expect(ordered.querySelector('ol')?.className).toContain('list-decimal')
      expect(ordered.querySelectorAll('li')).toHaveLength(2)
    })

    it('三级标题分别使用对应字号', () => {
      const container = renderContent('# 一级\n\n## 二级\n\n### 三级')

      expect(container.querySelector('h1')?.className).toContain('text-xl')
      expect(container.querySelector('h2')?.className).toContain('text-lg')
      expect(container.querySelector('h3')?.className).toContain('text-base')
    })

    it('引用块带左边框', () => {
      const container = renderContent('> 引用内容')

      const quote = container.querySelector('blockquote')
      expect(quote).toHaveTextContent('引用内容')
      expect(quote?.className).toContain('border-l-4')
    })

    it('链接在新标签页打开并带安全属性', () => {
      const container = renderContent('[文档](https://example.com)')

      const link = container.querySelector('a')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('GFM 表格渲染为 table 且带边框样式', () => {
      const container = renderContent('| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |')

      const table = container.querySelector('table')
      expect(table).toBeTruthy()
      expect(container.querySelectorAll('th')).toHaveLength(2)
      expect(container.querySelectorAll('td')).toHaveLength(2)
      expect(container.querySelector('table')?.className).toContain('border-collapse')
    })

    it('水平分割线渲染为 hr', () => {
      const container = renderContent('上方\n\n---\n\n下方')

      expect(container.querySelector('hr')).toBeTruthy()
    })
  })
})
