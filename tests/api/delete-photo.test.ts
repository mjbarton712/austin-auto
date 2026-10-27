import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JOB_ID, mockReq, mockRes } from './helpers'

const send = vi.fn()
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send })),
  DeleteObjectCommand: vi.fn((input) => ({ input })),
}))

const authenticate = vi.fn()
const ownsJob = vi.fn()
vi.mock('../../api/_lib/auth', () => ({ authenticate: (...a: unknown[]) => authenticate(...a), ownsJob: (...a: unknown[]) => ownsJob(...a) }))

import handler from '../../api/delete-photo'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.R2_BUCKET_NAME = 'bucket'
  authenticate.mockResolvedValue({ user: { id: 'user-1' }, db: {} })
  ownsJob.mockResolvedValue(true)
  send.mockResolvedValue({})
})

const del = (filePath: unknown) => mockReq({ method: 'DELETE', body: { filePath } })

describe('DELETE /api/delete-photo', () => {
  it('rejects other methods', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'POST' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('stops when unauthenticated', async () => {
    authenticate.mockResolvedValue(null)
    await handler(del(`${JOB_ID}/a.jpg`), mockRes())
    expect(send).not.toHaveBeenCalled()
  })

  it.each([
    ['missing path', undefined],
    ['traversal', `${JOB_ID}/../x.jpg`],
    ['nested path', `${JOB_ID}/a/b.jpg`],
    ['not a job folder', 'photos/a.jpg'],
    ['backslash', `${JOB_ID}/a\\b.jpg`],
  ])('400s on %s', async (_n, path) => {
    const res = mockRes()
    await handler(del(path), res)
    expect(res.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it.each([['.'], ['..']])('400s when the filename is %s', async (name) => {
    const res = mockRes()
    await handler(del(`${JOB_ID}/${name}`), res)
    expect(res.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it('allows legacy filenames that merely contain dots', async () => {
    const res = mockRes()
    await handler(del(`${JOB_ID}/IMG..1.jpg`), res)
    expect(res.statusCode).toBe(200)
  })

  it("403s for someone else's job", async () => {
    ownsJob.mockResolvedValue(false)
    const res = mockRes()
    await handler(del(`${JOB_ID}/a.jpg`), res)
    expect(res.statusCode).toBe(403)
    expect(send).not.toHaveBeenCalled()
  })

  it('deletes migrated photos with arbitrary legacy filenames', async () => {
    const key = `${JOB_ID}/IMG 2021 (1).JPG`
    const res = mockRes()
    await handler(del(key), res)
    expect(res.statusCode).toBe(200)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ input: { Bucket: 'bucket', Key: key } }))
  })
})
