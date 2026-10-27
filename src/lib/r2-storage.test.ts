import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }) } },
}))
import { r2Storage } from './r2-storage'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset() })

describe('r2Storage', () => {
  it('uploads base64 data with the session token', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' })
    const { error } = await r2Storage.uploadFile('job/a.png', file)
    expect(error).toBeNull()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/upload-photo')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body)).toEqual({ filePath: 'job/a.png', fileData: 'AQID', contentType: 'image/png' })
  })

  it('surfaces the server error message on failed uploads', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 413, json: async () => ({ error: 'Photo is too large' }) })
    const { error } = await r2Storage.uploadFile('job/a.png', new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
    expect(error?.message).toBe('Photo is too large')
  })

  it('falls back to a status message when the body is not JSON', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('html') } })
    const { error } = await r2Storage.deleteFile('job/a.png')
    expect(error?.message).toBe('Delete failed (502)')
  })

  it('deletes via DELETE /api/delete-photo', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    await r2Storage.deleteFile('job/a.png')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/delete-photo')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })
})
