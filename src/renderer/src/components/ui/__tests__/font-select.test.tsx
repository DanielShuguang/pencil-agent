import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FontSelect } from '../font-select'

vi.mock('react-window', () => ({
  List: ({ rowComponent: Row, rowCount, rowProps }: any) => (
    <div data-testid='font-list' data-count={rowCount}>
      {Array.from({ length: rowCount }, (_, index) => (
        <Row key={index} index={index} style={{}} {...rowProps} />
      ))}
    </div>
  ),
}))

const options = [
  { label: 'Arial', value: "'Arial', sans-serif" },
  { label: 'Consolas', value: "'Consolas', monospace" },
  { label: 'Maple Mono NF CN', value: "'Maple Mono NF CN', monospace" },
]

describe('FontSelect', () => {
  it('未选中时展示 placeholder', () => {
    render(
      <FontSelect value='' onValueChange={vi.fn()} options={options} placeholder='选择字体' />,
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('选择字体')
  })

  it('没有 placeholder 时展示默认文案', () => {
    render(<FontSelect value='' onValueChange={vi.fn()} options={options} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Select font...')
  })

  it('已选中时展示对应字体名', () => {
    render(
      <FontSelect
        value="'Consolas', monospace"
        onValueChange={vi.fn()}
        options={options}
        placeholder='选择字体'
      />,
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('Consolas')
  })

  it('点击后在弹层中渲染全部字体', async () => {
    const user = userEvent.setup()
    render(<FontSelect value='' onValueChange={vi.fn()} options={options} />)

    await user.click(screen.getByRole('combobox'))

    expect(await screen.findByTestId('font-list')).toHaveAttribute('data-count', '3')
    expect(screen.getByText('Arial')).toBeInTheDocument()
    expect(screen.getByText('Maple Mono NF CN')).toBeInTheDocument()
  })

  it('搜索时按名称过滤（大小写不敏感）', async () => {
    const user = userEvent.setup()
    render(<FontSelect value='' onValueChange={vi.fn()} options={options} />)
    await user.click(screen.getByRole('combobox'))

    await user.type(screen.getByPlaceholderText('Search fonts...'), 'mono')

    expect(screen.getByTestId('font-list')).toHaveAttribute('data-count', '1')
    expect(screen.getByText('Maple Mono NF CN')).toBeInTheDocument()
    expect(screen.queryByText('Arial')).not.toBeInTheDocument()
  })

  it('搜索无结果时展示空状态', async () => {
    const user = userEvent.setup()
    render(<FontSelect value='' onValueChange={vi.fn()} options={options} />)
    await user.click(screen.getByRole('combobox'))

    await user.type(screen.getByPlaceholderText('Search fonts...'), 'zzz')

    expect(screen.getByText('No font found')).toBeInTheDocument()
    expect(screen.queryByTestId('font-list')).not.toBeInTheDocument()
  })

  it('选择字体时回调并关闭弹层', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FontSelect value='' onValueChange={onValueChange} options={options} />)
    await user.click(screen.getByRole('combobox'))

    await user.click(screen.getByText('Consolas'))

    expect(onValueChange).toHaveBeenCalledWith("'Consolas', monospace")
    await vi.waitFor(() => expect(screen.queryByTestId('font-list')).not.toBeInTheDocument())
  })

  it('重新打开时清空搜索词', async () => {
    const user = userEvent.setup()
    render(<FontSelect value='' onValueChange={vi.fn()} options={options} />)
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText('Search fonts...'), 'aria')
    expect(screen.getByTestId('font-list')).toHaveAttribute('data-count', '1')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('combobox'))

    expect(await screen.findByTestId('font-list')).toHaveAttribute('data-count', '3')
  })

  it('滚轮事件不冒泡到外部容器', async () => {
    const user = userEvent.setup()
    const outerWheel = vi.fn()
    render(
      <div onWheel={outerWheel}>
        <FontSelect value='' onValueChange={vi.fn()} options={options} />
      </div>,
    )
    await user.click(screen.getByRole('combobox'))

    const list = screen.getByTestId('font-list')
    list.parentElement!.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(outerWheel).not.toHaveBeenCalled()
  })
})
