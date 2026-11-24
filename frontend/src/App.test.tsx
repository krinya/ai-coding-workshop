import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('shows the title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Coding Workshop')
  })

  it('links to the GitHub repository in a new tab', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: 'View the code on GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/krinya/ai-coding-workshop')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
