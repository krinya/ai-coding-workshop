import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import CodeInput from './CodeInput'

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [code, setCode] = useState('')
  return <CodeInput value={code} onChange={setCode} onComplete={onComplete} />
}

describe('CodeInput', () => {
  it('keeps only digits', async () => {
    render(<Harness onComplete={() => {}} />)
    const input = screen.getByLabelText('6-digit code')
    await userEvent.type(input, '1a2-b3')
    expect(input).toHaveValue('123')
  })

  it('stops at six digits', async () => {
    render(<Harness onComplete={() => {}} />)
    const input = screen.getByLabelText('6-digit code')
    await userEvent.type(input, '12345678')
    expect(input).toHaveValue('123456')
  })

  it('accepts a pasted code with spaces and reports it when complete', async () => {
    const onComplete = vi.fn()
    render(<Harness onComplete={onComplete} />)
    await userEvent.click(screen.getByLabelText('6-digit code'))
    await userEvent.paste('123 456')
    expect(screen.getByLabelText('6-digit code')).toHaveValue('123456')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('does not report an incomplete code', async () => {
    const onComplete = vi.fn()
    render(<Harness onComplete={onComplete} />)
    await userEvent.type(screen.getByLabelText('6-digit code'), '12345')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('lets phones fill in the code from the email', () => {
    render(<Harness onComplete={() => {}} />)
    const input = screen.getByLabelText('6-digit code')
    expect(input).toHaveAttribute('autocomplete', 'one-time-code')
    expect(input).toHaveAttribute('inputmode', 'numeric')
  })
})
