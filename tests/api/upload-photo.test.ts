import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JOB_ID, mockReq, mockRes } from './helpers'

const send = vi.fn()
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send })),
  PutObjectCommand: vi.fn((input) => ({ input })),
}))

const authenticate = vi.fn()
const ownsJob = vi.fn()
vi.mock('../../api/_lib/auth', () => ({ authenticate: (...a: unknown[]) => authenticate(...a), ownsJob: (...a: unknown[]) => ownsJob(...a) }))

import handler from '../../api/upload-photo'

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const png = Buffer.from([...PNG_MAGIC, 1, 2, 3]).toString('base64')
const validBody = { filePath: `${JOB_ID}/abc-123.png`, fileData: png, contentType: 'image/png' }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.R2_BUCKET_NAME = 'bucket'
  process.env.R2_PUBLIC_URL = 'https://cdn.example.com'
  authenticate.mockResolvedValue({ user: { id: 'user-1' }, db: {} })
  ownsJob.mockResolvedValue(true)
  send.mockResolvedValue({})
})

describe('POST /api/upload-photo', () => {
  it('rejects non-POST methods', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
    expect(authenticate).not.toHaveBeenCalled()
  })

  it('stops when the caller is not authenticated', async () => {
    authenticate.mockResolvedValue(null)
    const res = mockRes()
    await handler(mockReq({ body: validBody }), res)
    expect(send).not.toHaveBeenCalled()
  })

  it.each([
    ['path traversal', { ...validBody, filePath: `${JOB_ID}/../evil.png` }],
    ['key outside a job folder', { ...validBody, filePath: 'evil.png' }],
    ['non-uuid folder', { ...validBody, filePath: 'someone/abc.png' }],
    ['non-image content type', { ...validBody, contentType: 'text/html' }],
    ['extension that mismatches content type', { ...validBody, contentType: 'image/jpeg' }],
    ['disallowed extension', { ...validBody, filePath: `${JOB_ID}/abc.html` }],
    ['missing data', { ...validBody, fileData: undefined }],
  ])('400s on %s', async (_name, body) => {
    const res = mockRes()
    await handler(mockReq({ body }), res)
    expect(res.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it('400s when the bytes are not the claimed image type', async () => {
    const res = mockRes()
    await handler(mockReq({ body: { ...validBody, fileData: Buffer.from('<script>alert(1)</script>').toString('base64') } }), res)
    expect(res.statusCode).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it('500s (not 403) when the ownership lookup itself fails', async () => {
    ownsJob.mockRejectedValue(new Error('db down'))
    const res = mockRes()
    await handler(mockReq({ body: validBody }), res)
    expect(res.statusCode).toBe(500)
    expect(send).not.toHaveBeenCalled()
  })

  it("403s when the job isn't the caller's", async () => {
    ownsJob.mockResolvedValue(false)
    const res = mockRes()
    await handler(mockReq({ body: validBody }), res)
    expect(res.statusCode).toBe(403)
    expect(send).not.toHaveBeenCalled()
  })

  it('413s when the decoded photo is over the limit', async () => {
    const big = Buffer.alloc(3 * 1024 * 1024 + 1, 1).toString('base64')
    const res = mockRes()
    await handler(mockReq({ body: { ...validBody, fileData: big } }), res)
    expect(res.statusCode).toBe(413)
    expect(send).not.toHaveBeenCalled()
  })

  it('uploads to R2 and returns the public URL', async () => {
    const res = mockRes()
    await handler(mockReq({ body: validBody }), res)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ success: true, url: `https://cdn.example.com/${JOB_ID}/abc-123.png` })
    expect(ownsJob).toHaveBeenCalledWith(expect.anything(), JOB_ID)
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Bucket: 'bucket', Key: `${JOB_ID}/abc-123.png`, ContentType: 'image/png' }) })
    )
  })

  it('does not leak R2 error details', async () => {
    send.mockRejectedValue(new Error('secret endpoint details'))
    const res = mockRes()
    await handler(mockReq({ body: validBody }), res)
    expect(res.statusCode).toBe(500)
    expect(JSON.stringify(res.payload)).not.toContain('secret')
  })
})
