import { describe, expect, it } from 'vitest'
import { combinedSchema } from './schema'

const job = { description: 'Brakes', status: 'in_progress' as const, intake_date: new Date() }
const car = { make: 'Ford', model: 'F-150', owner_name: 'Austin' }

describe('combinedSchema', () => {
  it('accepts the minimum required fields', () => {
    expect(combinedSchema.safeParse({ ...car, jobs: [job] }).success).toBe(true)
  })

  it('accepts null optional fields from the database (regression: "Expected string, received null")', () => {
    const result = combinedSchema.safeParse({
      ...car, trim: null, vin: null, year: null, color: null,
      jobs: [{ ...job, mileage: null, parts_ordered: null, problems_encountered: null, completion_date: null, hours_spent: null }],
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ['make', { ...car, make: '' }],
    ['model', { ...car, model: '' }],
    ['owner_name', { ...car, owner_name: '' }],
  ])('requires %s', (_f, c) => {
    expect(combinedSchema.safeParse({ ...c, jobs: [job] }).success).toBe(false)
  })

  it('requires a job description and a valid status', () => {
    expect(combinedSchema.safeParse({ ...car, jobs: [{ ...job, description: '' }] }).success).toBe(false)
    expect(combinedSchema.safeParse({ ...car, jobs: [{ ...job, status: 'done' }] }).success).toBe(false)
  })

  it('defaults payment_status to unpaid', () => {
    const parsed = combinedSchema.parse({ ...car, jobs: [job] })
    expect(parsed.jobs[0].payment_status).toBe('unpaid')
  })
})
