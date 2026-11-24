import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { api } from './api/client'

// Replace the real API client, so the test needs no backend
vi.mock('./api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

function signedInAs(me: { id: number; email: string; display_name: string | null } | null) {
  vi.mocked(api.GET).mockResolvedValue(
    me
      ? { data: me, response: new Response() }
      : { error: { detail: 'Sign in first.' }, response: new Response() },
  )
}

describe('App', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows the title and the sign-in form when nobody is signed in', async () => {
    signedInAs(null)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rate this course')
    expect(await screen.findByRole('button', { name: 'Email me a code' })).toBeInTheDocument()
  })

  it('greets a signed-in user by name', async () => {
    signedInAs({ id: 1, email: 'ada@example.com', display_name: 'Ada' })
    render(<App />)
    expect(await screen.findByText('Ada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('links to the GitHub repository in a new tab', () => {
    signedInAs(null)
    render(<App />)
    const link = screen.getByRole('link', { name: 'View the code on GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/krinya/ai-coding-workshop')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
