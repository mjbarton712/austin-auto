import { describe, expect, it } from 'vitest'
import { calculateJobNumbers, cleanNumberFields, formatDateForServer, normalizeDate, sanitizeCarData } from './car-form'

describe('formatDateForServer', () => {
  it('formats using local calendar fields (no UTC day shift)', () => {
    expect(formatDateForServer(new Date(2024, 0, 5, 23, 59))).toBe('2024-01-05')
    expect(formatDateForServer(new Date(2024, 11, 31, 0, 1))).toBe('2024-12-31')
  })
  it('returns null for empty input', () => {
    expect(formatDateForServer(null)).toBeNull()
    expect(formatDateForServer(undefined)).toBeNull()
  })
})

describe('normalizeDate', () => {
  it('parses a DB date as the same local calendar day', () => {
    const d = normalizeDate('2024-03-09')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 2, 9])
  })
  it('ignores the time part of ISO strings', () => {
    const d = normalizeDate('2024-03-09T00:00:00+00:00')!
    expect(d.getDate()).toBe(9)
  })
  it('round-trips with formatDateForServer', () => {
    for (const s of ['2024-02-29', '2023-12-31', '2025-01-01']) {
      expect(formatDateForServer(normalizeDate(s))).toBe(s)
    }
  })
  it('passes Dates through and handles empties', () => {
    const d = new Date()
    expect(normalizeDate(d)).toBe(d)
    expect(normalizeDate(null)).toBeUndefined()
    expect(normalizeDate('')).toBeUndefined()
  })
})

describe('cleanNumberFields', () => {
  it('coerces numeric fields and never produces off-by-one values', () => {
    expect(cleanNumberFields({ mileage: '8050', cost_to_fix: 8050, amount_charged: 8050.0, hours_spent: '12' })).toEqual({
      mileage: 8050, cost_to_fix: 8050, amount_charged: 8050, hours_spent: 12,
    })
  })
  it('turns blank/invalid values into 0', () => {
    expect(cleanNumberFields({ mileage: '', cost_to_fix: null, amount_charged: undefined, hours_spent: 'abc' })).toEqual({
      mileage: 0, cost_to_fix: 0, amount_charged: 0, hours_spent: 0,
    })
  })
  it('leaves unrelated fields alone and only touches fields that are present', () => {
    expect(cleanNumberFields({ description: 'x', mileage: 5 })).toEqual({ description: 'x', mileage: 5 })
  })
  it('keeps year undefined when blank', () => {
    expect(cleanNumberFields({ year: 0 }).year).toBeUndefined()
    expect(cleanNumberFields({ year: '2019' }).year).toBe(2019)
  })
})

describe('sanitizeCarData', () => {
  it('converts nulls to undefined, keeps everything else', () => {
    expect(sanitizeCarData({ make: 'Ford', trim: null, year: 2019 })).toEqual({ make: 'Ford', trim: undefined, year: 2019 })
  })
})

describe('calculateJobNumbers', () => {
  it('numbers jobs by intake date, earliest first, keyed by original index', () => {
    const map = calculateJobNumbers([
      { intake_date: new Date(2024, 5, 1) },
      { intake_date: new Date(2023, 0, 1) },
      { intake_date: new Date(2024, 0, 1) },
    ])
    expect([map.get(0), map.get(1), map.get(2)]).toEqual([3, 1, 2])
  })
  it('handles missing dates without throwing', () => {
    expect(calculateJobNumbers([{ intake_date: null }, {}]).size).toBe(2)
  })
})
