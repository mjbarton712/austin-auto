import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_EXTENSIONS, prepareImageForUpload } from './image'

afterEach(() => vi.unstubAllGlobals())

const file = (bytes: number, type: string, name = 'photo.jpg') => new File([new Uint8Array(bytes)], name, { type })

describe('prepareImageForUpload', () => {
  it('passes small supported images through untouched', async () => {
    const f = file(1024, 'image/jpeg')
    expect(await prepareImageForUpload(f)).toBe(f)
  })

  it('keeps small GIFs as-is so animation survives', async () => {
    const f = file(1024, 'image/gif', 'a.gif')
    expect(await prepareImageForUpload(f)).toBe(f)
  })

  it('rejects images that cannot be decoded (e.g. HEIC on Chrome)', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')))
    await expect(prepareImageForUpload(file(3 * 1024 * 1024, 'image/heic', 'IMG_1.heic'))).rejects.toThrow('not a supported image format')
  })

  it('tries to re-encode large images instead of passing them through', async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
    // No canvas in node: the attempt to encode must be reached (and bitmap closed)
    await expect(prepareImageForUpload(file(5 * 1024 * 1024, 'image/jpeg'))).rejects.toThrow()
    expect(bitmap.close).toHaveBeenCalled()
  })
})

describe('IMAGE_EXTENSIONS', () => {
  it('matches the server-side allowlist', () => {
    expect(Object.keys(IMAGE_EXTENSIONS).sort()).toEqual(['image/gif', 'image/jpeg', 'image/png', 'image/webp'])
  })
})
