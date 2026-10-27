import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReq, mockRes, JOB_ID } from './helpers'

const getUser = vi.fn()
const maybeSingle = vi.fn()
const eq = vi.fn()
const chain = { select: vi.fn(() => chain), eq, maybeSingle }
eq.mockReturnValue(chain)
const createClient = vi.fn(() => ({ auth: { getUser }, from: vi.fn(() => chain) }))
vi.mock('@supabase/supabase-js', () => ({ createClient: (...a: unknown[]) => (createClient as (...x: unknown[]) => unknown)(...a) }))

import { authenticate, ownsJob } from '../../api/_lib/auth'

beforeEach(() => {
  vi.clearAllMocks()
  eq.mockReturnValue(chain)
  process.env.VITE_SUPABASE_URL = 'https://x.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon'
})

describe('authenticate', () => {
  it('401s without a bearer token', async () => {
    const res = mockRes()
    expect(await authenticate(mockReq(), res)).toBeNull()
    expect(res.statusCode).toBe(401)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('401s when Supabase rejects the token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad jwt') })
    const res = mockRes()
    expect(await authenticate(mockReq({ headers: { authorization: 'Bearer junk' } }), res)).toBeNull()
    expect(res.statusCode).toBe(401)
  })

  it('500s when server env is missing', async () => {
    delete process.env.VITE_SUPABASE_URL
    const res = mockRes()
    expect(await authenticate(mockReq({ headers: { authorization: 'Bearer t' } }), res)).toBeNull()
    expect(res.statusCode).toBe(500)
  })

  it('returns the user and a client that acts as the caller', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const res = mockRes()
    const result = await authenticate(mockReq({ headers: { authorization: 'bearer tok' } }), res)
    expect(result?.user.id).toBe('user-1')
    expect(getUser).toHaveBeenCalledWith('tok')
    expect(createClient).toHaveBeenCalledWith('https://x.supabase.co', 'anon', expect.objectContaining({
      global: { headers: { Authorization: 'Bearer tok' } },
    }))
  })
})

describe('ownsJob', () => {
  const auth = { user: { id: 'user-1' }, db: { from: () => chain } } as never

  it('is true when the job row is visible and owned', async () => {
    maybeSingle.mockResolvedValue({ data: { id: JOB_ID } })
    expect(await ownsJob(auth, JOB_ID)).toBe(true)
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('throws when the lookup fails, instead of reporting "not the owner"', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: new Error('timeout') })
    await expect(ownsJob(auth, JOB_ID)).rejects.toThrow('timeout')
  })

  it('is false when no row matches', async () => {
    maybeSingle.mockResolvedValue({ data: null })
    expect(await ownsJob(auth, JOB_ID)).toBe(false)
  })
})
