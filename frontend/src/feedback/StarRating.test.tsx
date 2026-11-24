import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import StarRating from './StarRating'

function Harness({ onChange }: { onChange?: (value: number) => void }) {
  const [value, setValue] = useState(0)
  return (
    <StarRating
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe('StarRating', () => {
  it('offers five choices, none picked at first', () => {
    render(<Harness />)
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByText('Pick a rating')).toBeInTheDocument()
    for (const star of screen.getAllByRole('radio')) expect(star).not.toBeChecked()
  })

  it('picks a rating on click', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }))
    expect(onChange).toHaveBeenCalledWith(4)
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked()
    expect(screen.getByText('4 / 5')).toBeInTheDocument()
  })

  it('works with the keyboard', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('radio', { name: '2 stars' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked()
  })

  it('is required in a form', () => {
    render(<Harness />)
    expect(screen.getByRole('radio', { name: '1 star' })).toBeRequired()
  })
})
