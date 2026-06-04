import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleEditor } from '../RoleEditor'
import '../../../i18n'

vi.mock('../../../stores/agent-store', () => ({
  useAgentStore: vi.fn(),
}))

const { useAgentStore } = await import('../../../stores/agent-store')
const mockUseAgentStore = vi.mocked(useAgentStore)

beforeEach(() => {
  mockUseAgentStore.mockReturnValue({
    language: 'zh',
  } as unknown as ReturnType<typeof useAgentStore>)
})

describe('RoleEditor', () => {
  it('renders form fields', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('名称')).toBeInTheDocument()
    expect(screen.getByText('描述')).toBeInTheDocument()
    expect(screen.getByText('系统提示词')).toBeInTheDocument()
  })

  it('renders tool buttons', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('read')).toBeInTheDocument()
    expect(screen.getByText('write')).toBeInTheDocument()
    expect(screen.getByText('edit')).toBeInTheDocument()
    expect(screen.getByText('bash')).toBeInTheDocument()
  })

  it('renders cancel and create buttons', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('取消')).toBeInTheDocument()
    expect(screen.getByText('创建')).toBeInTheDocument()
  })

  it('renders edit button when editing existing role', () => {
    const role = {
      id: 'role-1',
      name: 'Test Role',
      description: 'A test role',
      systemPrompt: 'You are helpful',
      model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      tools: ['read', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    render(<RoleEditor role={role} onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('编辑')).toBeInTheDocument()
  })

  it('calls onCancel on cancel click', () => {
    const onCancel = vi.fn()
    render(<RoleEditor onSave={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables save when name is empty', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('创建')).toBeDisabled()
  })

  it('disables save when systemPrompt is empty', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    const nameInput = screen.getByPlaceholderText('例如：研究员')
    fireEvent.change(nameInput, { target: { value: 'Test' } })
    expect(screen.getByText('创建')).toBeDisabled()
  })

  it('enables save when name and systemPrompt are filled', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    const nameInput = screen.getByPlaceholderText('例如：研究员')
    const promptInput = screen.getByPlaceholderText('定义角色的行为和能力...')
    fireEvent.change(nameInput, { target: { value: 'Test' } })
    fireEvent.change(promptInput, { target: { value: 'You are helpful' } })
    expect(screen.getByText('创建')).not.toBeDisabled()
  })

  it('calls onSave with correct data', () => {
    const onSave = vi.fn()
    render(<RoleEditor onSave={onSave} onCancel={vi.fn()} />)
    
    const nameInput = screen.getByPlaceholderText('例如：研究员')
    const promptInput = screen.getByPlaceholderText('定义角色的行为和能力...')
    fireEvent.change(nameInput, { target: { value: 'My Role' } })
    fireEvent.change(promptInput, { target: { value: 'Be helpful' } })
    fireEvent.click(screen.getByText('创建'))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Role',
        systemPrompt: 'Be helpful',
        model: { id: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      })
    )
  })

  it('generates ID from name', () => {
    const onSave = vi.fn()
    render(<RoleEditor onSave={onSave} onCancel={vi.fn()} />)
    
    const nameInput = screen.getByPlaceholderText('例如：研究员')
    const promptInput = screen.getByPlaceholderText('定义角色的行为和能力...')
    fireEvent.change(nameInput, { target: { value: 'My Role' } })
    fireEvent.change(promptInput, { target: { value: 'Be helpful' } })
    fireEvent.click(screen.getByText('创建'))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'my-role' })
    )
  })

  it('toggles tool selection', () => {
    render(<RoleEditor onSave={vi.fn()} onCancel={vi.fn()} />)
    
    const readBtn = screen.getByText('read')
    // read is selected by default
    expect(readBtn.className).toContain('bg-primary')
    
    // Click to deselect
    fireEvent.click(readBtn)
    expect(readBtn.className).toContain('bg-secondary')
    
    // Click to select again
    fireEvent.click(readBtn)
    expect(readBtn.className).toContain('bg-primary')
  })

  it('populates form with existing role data', () => {
    const role = {
      id: 'role-1',
      name: 'Existing Role',
      description: 'A role',
      systemPrompt: 'Existing prompt',
      model: { id: 'gpt-4o', provider: 'openai' },
      tools: ['read'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    render(<RoleEditor role={role} onSave={vi.fn()} onCancel={vi.fn()} />)
    
    expect(screen.getByDisplayValue('Existing Role')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A role')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing prompt')).toBeInTheDocument()
  })
})
