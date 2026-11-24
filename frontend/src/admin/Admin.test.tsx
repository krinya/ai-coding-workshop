import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import Admin from './Admin'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }))

const ok = <T,>(data: T) => ({ data, response: new Response() })
const host = { id: 1, display_name: 'Host', is_admin: true }
const entry = {
  id: 5,
  display_name: 'Ada',
  rating: 2,
  comment: 'rude words',
  photo_url: null,
  created_at: '2026-11-24T10:00:00Z',
}

function backend(me: typeof host | null, joinUrl: string | null) {
  vi.mocked(api.GET).mockImplementation(((path: string) =>
    Promise.resolve(
      path === '/api/auth/me'
        ? me
          ? ok(me)
          : { error: { detail: 'Scan the QR code to join first.' }, response: new Response() }
        : path === '/api/admin/join-link'
          ? ok({ join_url: joinUrl, joined: 3 })
          : ok([entry]),
    )) as never)
}

describe('Admin', () => {
  beforeEach(() => vi.resetAllMocks())

  it('asks for the password first', async () => {
    backend(null, null)
    vi.mocked(api.POST).mockResolvedValue(ok(host) as never)
    render(<Admin />)

    await userEvent.type(await screen.findByLabelText('Admin password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(api.POST).toHaveBeenCalledWith('/api/auth/admin', { body: { password: 'secret' } })
  })

  it('opens feedback when it is closed', async () => {
    backend(host, null)
    vi.mocked(api.POST).mockResolvedValue(
      ok({ join_url: 'https://x.example/join/abc', joined: 0 }) as never,
    )
    render(<Admin />)

    expect(await screen.findByText('Feedback is closed')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open feedback' }))

    expect(api.POST).toHaveBeenCalledWith('/api/admin/join-link')
    expect(await screen.findByText('https://x.example/join/abc')).toBeInTheDocument()
  })

  it('shows the live QR code and can take it down', async () => {
    backend(host, 'https://x.example/join/abc')
    vi.mocked(api.DELETE).mockResolvedValue(ok({ join_url: null, joined: 0 }) as never)
    render(<Admin />)

    expect(await screen.findByText('3 people joined')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /QR code/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close feedback' }))

    expect(api.DELETE).toHaveBeenCalledWith('/api/admin/join-link')
    expect(await screen.findByText('Feedback is closed')).toBeInTheDocument()
  })

  it('removes an entry after confirming', async () => {
    backend(host, null)
    vi.mocked(api.DELETE).mockResolvedValue(ok(undefined) as never)
    render(<Admin />)

    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(api.DELETE).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(api.DELETE).toHaveBeenCalledWith('/api/admin/feedback/{feedback_id}', {
      params: { path: { feedback_id: 5 } },
    })
    expect(screen.queryByText('rude words')).not.toBeInTheDocument()
  })
})
