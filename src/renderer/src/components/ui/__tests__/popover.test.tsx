import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Popover, PopoverTrigger, PopoverContent } from '../popover'

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders content when open', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <Popover open={false}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('applies custom className to content', () => {
    render(
      <Popover open={true}>
        <PopoverContent className='custom-popover'>Content</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Content').className).toContain('custom-popover')
  })
})
