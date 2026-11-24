import { describe, expect, it } from 'vitest'

import { applyFilter, fitWithin } from './photo'

describe('fitWithin', () => {
  it('shrinks the longest side to the maximum, keeping the shape', () => {
    expect(fitWithin(1920, 1080, 640)).toEqual({ width: 640, height: 360 })
    expect(fitWithin(1000, 2000, 640)).toEqual({ width: 320, height: 640 })
  })

  it('never makes a small picture bigger', () => {
    expect(fitWithin(300, 200, 640)).toEqual({ width: 300, height: 200 })
  })
})

describe('applyFilter', () => {
  const orange = () => new Uint8ClampedArray([255, 128, 0, 255])

  it('leaves the picture alone for "normal"', () => {
    expect([...applyFilter(orange(), 'normal')]).toEqual([255, 128, 0, 255])
  })

  it('makes every pixel grey for black-and-white', () => {
    const [r, g, b, a] = applyFilter(orange(), 'bw')
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(a).toBe(255)
  })

  it('gives a warm brown tone for sepia', () => {
    const [r, g, b] = applyFilter(new Uint8ClampedArray([100, 100, 100, 255]), 'sepia')
    expect(r).toBeGreaterThan(g!)
    expect(g).toBeGreaterThan(b!)
  })

  it('uses only a few colour levels for comic', () => {
    const pixels = new Uint8ClampedArray(256 * 4)
    for (let i = 0; i < 256; i++) pixels.set([i, i, i, 255], i * 4)
    const levels = new Set(applyFilter(pixels, 'comic').filter((_, i) => i % 4 === 0))
    expect(levels.size).toBeLessThanOrEqual(4)
  })
})
