import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { api } from './api/client'

// Replace the real API client, so the test needs no backend
vi.mock('./api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

function signedInAs(me: { id: number; display_name: string | null; is_admin: boolean } | null) {
  const answer = (path: string) =>
    path === '/api/auth/me' && !me
      ? { error: { detail: 'Sign in first.' }, response: new Response() }
      : { data: path === '/api/auth/me' ? me : null, response: new Response() }
  vi.mocked(api.GET).mockImplementation(((path: string) => Promise.resolve(answer(path))) as never)
}

describe('App', () => {
  beforeEach(() => vi.resetAllMocks())

  it('asks people who have not joined to scan the QR code', async () => {
    signedInAs(null)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rate this course')
    expect(await screen.findByText('Scan the QR code to join')).toBeInTheDocument()
  })

  it('links the host to the controls', async () => {
    signedInAs({ id: 1, display_name: 'Host', is_admin: true })
    render(<App />)
    expect(await screen.findByRole('link', { name: 'Host controls' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('greets a signed-in user by name', async () => {
    signedInAs({ id: 1, display_name: 'Ada', is_admin: false })
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
