import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import Versions from '@renderer/components/Versions'

beforeAll(() => {
  window.electron = {
    process: {
      versions: { electron: '39.0.0', chrome: '130.0.0', node: '22.0.0' },
    },
  } as never
})

describe('Versions', () => {
  it('renders version information', () => {
    render(<Versions />)
    expect(screen.getByText(/39\.0\.0/)).toBeInTheDocument()
    expect(screen.getByText(/130\.0\.0/)).toBeInTheDocument()
    expect(screen.getByText(/22\.0\.0/)).toBeInTheDocument()
  })
})
