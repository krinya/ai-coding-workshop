import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PhotoPicker from './PhotoPicker'

function pretendToBe(device: 'laptop' | 'phone') {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: fine)' && device === 'laptop',
  }))
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
}

describe('PhotoPicker', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('offers the live camera on a laptop', () => {
    pretendToBe('laptop')
    render(<PhotoPicker onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /use camera/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/take a selfie/i)).not.toBeInTheDocument()
  })

  it("opens the phone's own camera app on a phone", () => {
    pretendToBe('phone')
    render(<PhotoPicker onChange={() => {}} />)
    expect(screen.getByLabelText(/take a selfie/i)).toHaveAttribute('capture', 'user')
    expect(screen.queryByRole('button', { name: /use camera/i })).not.toBeInTheDocument()
  })

  it('always allows uploading an existing picture', () => {
    pretendToBe('phone')
    render(<PhotoPicker onChange={() => {}} />)
    const upload = screen.getByLabelText(/upload a picture/i)
    expect(upload).toHaveAttribute('type', 'file')
    expect(upload).not.toHaveAttribute('capture')
  })
})
