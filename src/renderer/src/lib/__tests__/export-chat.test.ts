import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportAsMarkdown, exportAsJSON } from '../export-chat'
import type { Message } from '../../stores/agent-store'

describe('export-chat', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.spyOn>

  const messages: Message[] = [
    { id: '1', role: 'user', content: '你好', timestamp: 1000 },
    { id: '2', role: 'assistant', content: '你好！有什么可以帮你？', timestamp: 2000 },
  ]

  beforeEach(() => {
    createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clickSpy.mockRestore()
  })

  it('导出 Markdown 时按角色生成标题与内容', () => {
    exportAsMarkdown(messages, '会话记录')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/markdown')

    const downloadLink = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(downloadLink.download).toBe('会话记录.md')
    expect(downloadLink.href).toBe('blob:mock-url')
  })

  it('导出 Markdown 后释放 object URL', () => {
    exportAsMarkdown(messages, 'title')

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('导出 JSON 时使用 json 扩展名与 MIME 类型', () => {
    exportAsJSON(messages, '会话记录')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')

    const downloadLink = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(downloadLink.download).toBe('会话记录.json')
  })

  it('JSON 导出包含标题、导出时间与消息内容', async () => {
    exportAsJSON(messages, '会话记录')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    const text = await blob.text()
    const data = JSON.parse(text)

    expect(data.title).toBe('会话记录')
    expect(typeof data.exportedAt).toBe('string')
    expect(data.messages).toEqual([
      { role: 'user', content: '你好', timestamp: 1000 },
      { role: 'assistant', content: '你好！有什么可以帮你？', timestamp: 2000 },
    ])
  })

  it('空消息列表也能导出', () => {
    expect(() => exportAsMarkdown([], 'empty')).not.toThrow()
    expect(() => exportAsJSON([], 'empty')).not.toThrow()
    expect(createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('system 角色在 Markdown 中使用原始角色名', async () => {
    exportAsMarkdown([{ id: '3', role: 'system', content: '系统提示', timestamp: 1 }], 't')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    const text = await blob.text()
    expect(text).toContain('## system')
    expect(text).toContain('系统提示')
  })
})
