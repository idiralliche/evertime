// Unit tests for formatDuration (French typography with NBSP).
import { describe, it, expect } from 'vitest'
import { formatDuration } from './format'

const NBSP = '\u00A0'

describe('formatDuration', () => {
  it('formats sub-hour as minutes', () => {
    expect(formatDuration(45)).toBe(`45${NBSP}min`)
    expect(formatDuration(0)).toBe(`0${NBSP}min`)
  })

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe(`1${NBSP}h`)
    expect(formatDuration(180)).toBe(`3${NBSP}h`)
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(75)).toBe(`1${NBSP}h${NBSP}15${NBSP}min`)
    expect(formatDuration(132)).toBe(`2${NBSP}h${NBSP}12${NBSP}min`)
  })

  it('handles null/NaN gracefully', () => {
    expect(formatDuration(null)).toBe('')
    expect(formatDuration(Number.NaN)).toBe('')
  })
})
