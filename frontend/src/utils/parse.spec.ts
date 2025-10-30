// Unit tests for parseDurationToMinutes.
import { describe, it, expect } from 'vitest'
import { parseDurationToMinutes } from './parse'

describe('parseDurationToMinutes', () => {
  it('supports minutes-only', () => {
    expect(parseDurationToMinutes('45')).toBe(45)
    expect(parseDurationToMinutes('90m')).toBe(90)
    expect(parseDurationToMinutes('75min')).toBe(75)
  })

  it('supports hh:mm', () => {
    expect(parseDurationToMinutes('1:05')).toBe(65)
    expect(parseDurationToMinutes('2:5')).toBe(125)
    expect(parseDurationToMinutes('00:00')).toBe(0)
    expect(parseDurationToMinutes('12:59')).toBe(779)
  })

  it('supports hours and optional minutes', () => {
    expect(parseDurationToMinutes('1h')).toBe(60)
    expect(parseDurationToMinutes('1h15')).toBe(75)
    expect(parseDurationToMinutes('2h12')).toBe(132)
    expect(parseDurationToMinutes('1h15m')).toBe(75)
  })

  it('supports fractional hours and decimal comma', () => {
    expect(parseDurationToMinutes('1.5h')).toBe(90)
    expect(parseDurationToMinutes('2,25h')).toBe(135)
  })

  it('returns null on invalid input', () => {
    expect(parseDurationToMinutes('')).toBeNull()
    expect(parseDurationToMinutes('abc')).toBeNull()
  })
})
