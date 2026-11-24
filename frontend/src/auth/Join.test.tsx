import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import Join from './Join'

vi.mock('../api/client', () => ({ api: { POST: vi.fn() } }))

describe('Join', () => {
  beforeEach(() => vi.resetAllMocks())

  it('joins with the token from the QR code and an optional name', async () => {
    vi.mocked(api.POST).mockResolvedValue({
      data: { id: 1, display_name: 'Ada', is_admin: false },
      response: new Response(),
    } as never)
    const onJoined = vi.fn()
    render(<Join token="abc123" onJoined={onJoined} />)

    await userEvent.type(screen.getByLabelText(/your name on the wall/i), 'Ada')
    await userEvent.click(screen.getByRole('button', { name: 'Join' }))

    expect(api.POST).toHaveBeenCalledWith('/api/auth/join', {
      body: { token: 'abc123', display_name: 'Ada' },
    })
    expect(onJoined).toHaveBeenCalled()
  })

  it('joins without a name too', async () => {
    vi.mocked(api.POST).mockResolvedValue({
      data: { id: 1, display_name: null, is_admin: false },
      response: new Response(),
    } as never)
    render(<Join token="abc123" onJoined={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(api.POST).toHaveBeenCalledWith('/api/auth/join', {
      body: { token: 'abc123', display_name: null },
    })
  })

  it('explains when the QR code is no longer active', async () => {
    vi.mocked(api.POST).mockResolvedValue({
      error: { detail: 'This QR code is not active any more. Scan the one on the screen.' },
      response: new Response(),
    } as never)
    const onJoined = vi.fn()
    render(<Join token="old" onJoined={onJoined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('not active any more')
    expect(onJoined).not.toHaveBeenCalled()
  })
})
