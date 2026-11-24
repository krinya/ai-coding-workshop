import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import confetti from 'canvas-confetti'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import type { MyFeedback } from '../api/types'
import FeedbackForm from './FeedbackForm'

vi.mock('../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() },
}))
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const saved: MyFeedback = {
  id: 7,
  rating: 4,
  comment: 'Nice',
  photo_url: null,
  created_at: '2026-11-24T10:00:00Z',
  updated_at: '2026-11-24T10:00:00Z',
}
const ok = <T,>(data: T) => ({ data, response: new Response() })

function existingEntry(entry: MyFeedback | null) {
  vi.mocked(api.GET).mockResolvedValue(ok(entry) as never)
}

describe('FeedbackForm', () => {
  beforeEach(() => vi.resetAllMocks())

  it('needs a rating before it can be sent', async () => {
    existingEntry(null)
    render(<FeedbackForm />)
    expect(await screen.findByRole('button', { name: 'Send feedback' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled()
  })

  it('sends new feedback and celebrates', async () => {
    existingEntry(null)
    vi.mocked(api.POST).mockResolvedValue(ok(saved) as never)
    render(<FeedbackForm />)

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }))
    await userEvent.type(screen.getByLabelText('Comment'), 'Nice')
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(api.POST).toHaveBeenCalledWith('/api/feedback', {
      body: { rating: 4, comment: 'Nice', photo: null, photo_consent: false, remove_photo: false },
    })
    expect(await screen.findByText('Thank you for your feedback!')).toBeInTheDocument()
    expect(confetti).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('edits an existing entry', async () => {
    existingEntry(saved)
    vi.mocked(api.PUT).mockResolvedValue(ok({ ...saved, rating: 2 }) as never)
    render(<FeedbackForm />)

    expect(await screen.findByLabelText('Comment')).toHaveValue('Nice')
    await userEvent.click(screen.getByRole('radio', { name: '2 stars' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(api.PUT).toHaveBeenCalledWith('/api/feedback/{feedback_id}', {
      params: { path: { feedback_id: 7 } },
      body: expect.objectContaining({ rating: 2 }),
    })
  })

  it('deletes only after a second click', async () => {
    existingEntry(saved)
    vi.mocked(api.DELETE).mockResolvedValue(ok(undefined) as never)
    render(<FeedbackForm />)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(api.DELETE).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(api.DELETE).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Send feedback' })).toBeInTheDocument()
  })

  it('shows the backend error', async () => {
    existingEntry(null)
    vi.mocked(api.POST).mockResolvedValue({
      error: { detail: 'You already sent feedback — edit it instead.' },
      response: new Response(),
    } as never)
    render(<FeedbackForm />)
    await userEvent.click(await screen.findByRole('radio', { name: '3 stars' }))
    await userEvent.click(screen.getByRole('button', { name: 'Send feedback' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already sent feedback')
  })

  it('says so when your feedback cannot be loaded', async () => {
    vi.mocked(api.GET).mockRejectedValue(new TypeError('Failed to fetch'))
    render(<FeedbackForm />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your feedback.')
  })
})
