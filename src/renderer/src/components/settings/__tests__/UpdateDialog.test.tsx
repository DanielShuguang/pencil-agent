import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UpdateDialog } from '../UpdateDialog'
import '../../../i18n'

vi.stubGlobal(
  'getComputedStyle',
  vi.fn(() => ({
    getPropertyValue: () => '',
    paddingLeft: '0px',
    paddingRight: '0px',
  })),
)

vi.mock('../../../stores/update-store', () => ({
  useUpdateStore: vi.fn(),
}))

const { useUpdateStore } = await import('../../../stores/update-store')
const mockUseUpdateStore = vi.mocked(useUpdateStore)

beforeEach(() => {
  mockUseUpdateStore.mockReturnValue({
    status: 'idle',
    progress: 0,
    error: null,
    updateInfo: null,
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    reset: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateStore>)
})

describe('UpdateDialog', () => {
  it('renders when open', () => {
    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<UpdateDialog isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows idle state with no update message', () => {
    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('关闭')).toBeInTheDocument()
  })

  it('shows checking state', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'checking',
      progress: 0,
      error: null,
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('正在检查更新...')).toBeInTheDocument()
  })

  it('shows available state with version info', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'available',
      progress: 0,
      error: null,
      updateInfo: { version: '1.2.0', releaseNotes: 'New features' },
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('1.2.0')).toBeInTheDocument()
    expect(screen.getByText('New features')).toBeInTheDocument()
    expect(screen.getByText('下载更新')).toBeInTheDocument()
  })

  it('shows downloading state with progress', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'downloading',
      progress: 50,
      error: null,
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows downloaded state with install button', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'downloaded',
      progress: 100,
      error: null,
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('立即安装')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseUpdateStore.mockReturnValue({
      status: 'error',
      progress: 0,
      error: 'Network error',
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('calls downloadUpdate on download click', () => {
    const downloadUpdate = vi.fn()
    mockUseUpdateStore.mockReturnValue({
      status: 'available',
      progress: 0,
      error: null,
      updateInfo: { version: '1.2.0' },
      downloadUpdate,
      installUpdate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    const downloadButton = screen.getByText('下载更新')
    fireEvent.click(downloadButton)
    expect(downloadUpdate).toHaveBeenCalled()
  })

  it('calls installUpdate on install click', () => {
    const installUpdate = vi.fn()
    mockUseUpdateStore.mockReturnValue({
      status: 'downloaded',
      progress: 100,
      error: null,
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('立即安装'))
    expect(installUpdate).toHaveBeenCalled()
  })

  it('calls reset and onClose on close', () => {
    const reset = vi.fn()
    const onClose = vi.fn()
    mockUseUpdateStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
      updateInfo: null,
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      reset,
    } as unknown as ReturnType<typeof useUpdateStore>)

    render(<UpdateDialog isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('关闭'))
    expect(reset).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
