import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleList } from '../RoleList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../stores/role-store', () => ({
  useRoleStore: vi.fn(),
}))

const { useRoleStore } = await import('../../../stores/role-store')
const mockUseRoleStore = vi.mocked(useRoleStore)

const mockRole = {
  id: 'role-1',
  name: 'Test Role',
  description: 'A test role',
  model: { provider: 'openai', id: 'gpt-4' },
  tools: ['tool1', 'tool2'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseRoleStore.mockReturnValue({
    roles: [],
    isLoading: false,
    fetchRoles: vi.fn(),
    deleteRole: vi.fn(),
  } as unknown as ReturnType<typeof useRoleStore>)
})

describe('RoleList', () => {
  it('shows loading state', () => {
    mockUseRoleStore.mockReturnValue({
      roles: [],
      isLoading: true,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    render(<RoleList />)
    expect(screen.getByText('role.loading')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<RoleList />)
    expect(screen.getByText('role.noRoles')).toBeInTheDocument()
  })

  it('renders role list', () => {
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    render(<RoleList />)
    expect(screen.getByText('Test Role')).toBeInTheDocument()
    expect(screen.getByText('A test role')).toBeInTheDocument()
    expect(screen.getByText('openai/gpt-4')).toBeInTheDocument()
  })

  it('calls onSelect when role is clicked', () => {
    const onSelect = vi.fn()
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    render(<RoleList onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Test Role'))
    expect(onSelect).toHaveBeenCalledWith('role-1')
  })

  it('applies selected style to selected role', () => {
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    const { container } = render(<RoleList selectedRoleId='role-1' />)
    expect(container.querySelector('.bg-accent')).toBeInTheDocument()
  })

  it('calls deleteRole on delete button click', () => {
    const deleteRole = vi.fn()
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole,
    } as unknown as ReturnType<typeof useRoleStore>)

    const { container } = render(<RoleList />)
    const deleteBtn = container.querySelector('.text-destructive')!.closest('button')!
    fireEvent.click(deleteBtn)
    expect(deleteRole).toHaveBeenCalledWith('role-1')
  })

  it('renders multiple roles', () => {
    const role2 = { ...mockRole, id: 'role-2', name: 'Second Role' }
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole, role2],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    render(<RoleList />)
    expect(screen.getByText('Test Role')).toBeInTheDocument()
    expect(screen.getByText('Second Role')).toBeInTheDocument()
  })

  it('shows tools count', () => {
    mockUseRoleStore.mockReturnValue({
      roles: [mockRole],
      isLoading: false,
      fetchRoles: vi.fn(),
      deleteRole: vi.fn(),
    } as unknown as ReturnType<typeof useRoleStore>)

    render(<RoleList />)
    expect(screen.getByText('role.toolsCount')).toBeInTheDocument()
  })
})
