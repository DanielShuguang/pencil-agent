import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PermissionConfirmDialog } from '../PermissionConfirmDialog'
import { usePermissionStore } from '../../../stores/permission-store'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'permission.confirmTitle': '工具执行确认',
        'permission.toolName': '工具名称',
        'permission.parameters': '参数',
        'permission.riskWarning': '风险警告',
        'permission.rememberSession': '本次会话记住选择',
        'permission.allow': '允许',
        'permission.deny': '拒绝',
      }
      return translations[key] || key
    },
  }),
}))

const mockSubmitConfirmResponse = vi.fn()
const mockDismissConfirm = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  usePermissionStore.setState({
    pendingConfirm: null,
    config: { mode: 'smart', disabledTools: [], dangerousPatternOverrides: [] },
    isLoaded: true,
    submitConfirmResponse: mockSubmitConfirmResponse,
    dismissConfirm: mockDismissConfirm,
  })
  ;(window as any).api = {
    permission: {
      submitConfirmResponse: vi.fn(),
    },
  }
})

describe('PermissionConfirmDialog', () => {
  it('should render nothing when no pending confirm', () => {
    const { container } = render(<PermissionConfirmDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('should render dialog when pending confirm exists', () => {
    usePermissionStore.setState({
      pendingConfirm: {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'ls -la' },
        riskLevel: 'medium',
      },
    })

    render(<PermissionConfirmDialog />)
    expect(screen.getByText('工具执行确认')).toBeInTheDocument()
    expect(screen.getByText('bash')).toBeInTheDocument()
  })

  it('should show risk warning for high-risk commands', () => {
    usePermissionStore.setState({
      pendingConfirm: {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'rm -rf /tmp' },
        riskLevel: 'high',
        pattern: '递归删除文件或目录',
      },
    })

    render(<PermissionConfirmDialog />)
    expect(screen.getByText('递归删除文件或目录')).toBeInTheDocument()
  })

  it('should call submitConfirmResponse with allowed=true on allow click', async () => {
    usePermissionStore.setState({
      pendingConfirm: {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        riskLevel: 'low',
      },
    })

    const user = userEvent.setup()
    render(<PermissionConfirmDialog />)

    await user.click(screen.getByText('允许'))

    expect(mockSubmitConfirmResponse).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'confirm-1', allowed: true }),
    )
  })

  it('should call submitConfirmResponse with allowed=false on deny click', async () => {
    usePermissionStore.setState({
      pendingConfirm: {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        riskLevel: 'low',
      },
    })

    const user = userEvent.setup()
    render(<PermissionConfirmDialog />)

    await user.click(screen.getByText('拒绝'))

    expect(mockSubmitConfirmResponse).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'confirm-1', allowed: false }),
    )
  })

  it('should include rememberSession when checkbox is checked', async () => {
    usePermissionStore.setState({
      pendingConfirm: {
        id: 'confirm-1',
        toolName: 'bash',
        parameters: { command: 'ls' },
        riskLevel: 'low',
      },
    })

    const user = userEvent.setup()
    render(<PermissionConfirmDialog />)

    await user.click(screen.getByText('本次会话记住选择'))
    await user.click(screen.getByText('允许'))

    expect(mockSubmitConfirmResponse).toHaveBeenCalledWith(
      expect.objectContaining({ rememberSession: true }),
    )
  })
})
