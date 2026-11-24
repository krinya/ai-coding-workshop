import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import type { Wall as WallData } from '../api/types'
import Wall from './Wall'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

const wall: WallData = {
  average: 4.5,
  count: 2,
  histogram: [0, 0, 0, 1, 1],
  entries: [
    {
      id: 1,
      display_name: 'Ada',
      rating: 5,
      comment: 'Brilliant demos',
      photo_url: '/api/feedback/1/photo?v=1',
      created_at: '2026-11-24T10:00:00Z',
      reactions: { clap: 2, laugh: 0, heart: 1 },
      my_reactions: [],
    },
    {
      id: 2,
      display_name: null,
      rating: 4,
      comment: '',
      photo_url: null,
      created_at: '2026-11-24T09:00:00Z',
      reactions: { clap: 0, laugh: 0, heart: 0 },
      my_reactions: [],
    },
  ],
  words: [
    { word: 'demos', count: 3 },
    { word: 'brilliant', count: 1 },
  ],
  join_url: 'http://192.168.1.20:5173',
}

function backend({ signedIn }: { signedIn: boolean }) {
  vi.mocked(api.GET).mockImplementation(((path: string) =>
    Promise.resolve(
      path === '/api/wall'
        ? { data: wall, response: new Response() }
        : signedIn
          ? {
              data: { id: 9, email: 'me@example.com', display_name: 'Me' },
              response: new Response(),
            }
          : { error: { detail: 'Sign in first.' }, response: new Response() },
    )) as never)
}

describe('Wall', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows the average, the star counts and the word cloud', async () => {
    backend({ signedIn: false })
    render(<Wall />)
    expect(await screen.findByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('2 ratings')).toBeInTheDocument()
    expect(screen.getByLabelText('5 stars: 1')).toBeInTheDocument()
    expect(screen.getByLabelText('1 star: 0')).toBeInTheDocument()
    expect(screen.getByText('demos')).toBeInTheDocument()
  })

  it('shows each entry with photo, name, stars and comment', async () => {
    backend({ signedIn: false })
    render(<Wall />)
    const ada = await screen.findByRole('article', { name: 'Ada' })
    expect(within(ada).getByRole('img', { name: 'Ada' })).toHaveAttribute(
      'src',
      '/api/feedback/1/photo?v=1',
    )
    expect(within(ada).getByLabelText('5 out of 5 stars')).toBeInTheDocument()
    expect(within(ada).getByText('Brilliant demos')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Anonymous' })).toBeInTheDocument()
  })

  it('links the QR code to the sign-in page', async () => {
    backend({ signedIn: false })
    render(<Wall />)
    expect(await screen.findByText('http://192.168.1.20:5173')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /QR code/ })).toBeInTheDocument()
  })

  it('shows reaction counts but needs sign-in to react', async () => {
    backend({ signedIn: false })
    render(<Wall />)
    const ada = await screen.findByRole('article', { name: 'Ada' })
    expect(within(ada).getByRole('button', { name: '👏 2' })).toBeDisabled()
  })

  it('lets a signed-in user react', async () => {
    backend({ signedIn: true })
    vi.mocked(api.POST).mockResolvedValue({
      data: { reactions: { clap: 3, laugh: 0, heart: 1 }, my_reactions: ['clap'] },
      response: new Response(),
    } as never)
    render(<Wall />)
    const ada = await screen.findByRole('article', { name: 'Ada' })
    const clap = within(ada).getByRole('button', { name: '👏 2' })
    await vi.waitFor(() => expect(clap).toBeEnabled())

    await userEvent.click(clap)

    expect(api.POST).toHaveBeenCalledWith('/api/feedback/{feedback_id}/reactions', {
      params: { path: { feedback_id: 1 } },
      body: { emoji: 'clap' },
    })
    expect(await within(ada).findByRole('button', { name: '👏 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
