import { describe, expect, it } from 'vitest'
import { createInvoiceFileName, createInvoiceImageFileName, formatInvoiceDate, generateInvoiceNumber } from './invoice-utils'
import type { Car } from '@/types'

const car = { id: '1', make: 'Ford', model: 'F-150 / XLT', year: 2019, owner_name: 'A', user_id: 'u' } as Car

describe('invoice helpers', () => {
  it('generates INV-YYYYMMDD-HHMMrr numbers', () => {
    expect(generateInvoiceNumber()).toMatch(/^INV-\d{8}-\d{6}$/)
  })
  it('formats dates for display', () => {
    expect(formatInvoiceDate(new Date(2024, 2, 9))).toBe('March 9, 2024')
  })
  it('builds safe file names', () => {
    expect(createInvoiceFileName(car, 'INV-1')).toBe('Invoice_INV-1_2019_Ford_F-150__XLT.pdf')
    expect(createInvoiceImageFileName(car, 'INV-1')).toBe('Invoice_INV-1_2019_Ford_F-150__XLT.png')
  })
})
