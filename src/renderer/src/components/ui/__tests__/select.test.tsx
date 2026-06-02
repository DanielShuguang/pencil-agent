import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select'

describe('Select', () => {
  it('renders trigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Choose option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='a'>Option A</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByText('Choose option')).toBeInTheDocument()
  })

  it('renders value when set', () => {
    render(
      <Select value='a'>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='a'>Option A</SelectItem>
          <SelectItem value='b'>Option B</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
  })

  it('renders items in content when open', () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue placeholder='Pick' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>Item 1</SelectItem>
          <SelectItem value='2'>Item 2</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('renders grouped items with label and separator', () => {
    render(
      <Select open={true}>
        <SelectTrigger>
          <SelectValue placeholder='Pick' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value='a'>A</SelectItem>
            <SelectSeparator />
            <SelectItem value='b'>B</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByText('Group 1')).toBeInTheDocument()
  })

  it('renders with disabled trigger', () => {
    render(
      <Select>
        <SelectTrigger disabled>
          <SelectValue placeholder='Disabled' />
        </SelectTrigger>
      </Select>,
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
