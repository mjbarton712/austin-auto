import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_EXTENSIONS, prepareImageForUpload } from './image'

afterEach(() => vi.unstubAllGlobals())

const KB = 1024
const file = (bytes: number, type: string, name = 'photo.jpg') => new File([new Uint8Array(bytes)], name, { type })

/**
 * Minimal canvas stand-in. `webp` says whether toBlob honours 'image/webp' (Chrome/Firefox)
 * or falls back to PNG (Safari); `sizeFor` is the encoded size for a given type, quality and pixel width.
 */
function stubCanvas(opts: { webp: boolean; sizeFor: (type: string, quality: number, width: number) => number; bitmap?: { width: number; height: number } }) {
  const canvases: { width: number; height: number; fillRect: ReturnType<typeof vi.fn> }[] = []
  const bitmap = { width: 4000, height: 3000, ...opts.bitmap, close: vi.fn() }
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
  vi.stubGlobal('document', {
    createElement: () => {
      const fillRect = vi.fn()
      const canvas = {
        width: 0,
        height: 0,
        fillRect,
        getContext: () => ({ fillRect, drawImage: vi.fn(), fillStyle: '' }),
        toBlob(cb: (b: Blob) => void, type: string, quality: number) {
          const actual = type === 'image/webp' && !opts.webp ? 'image/png' : type
          cb(new Blob([new Uint8Array(opts.sizeFor(actual, quality, canvas.width))], { type: actual }))
        },
      }
      canvases.push(canvas)
      return canvas
    },
  })
  return { bitmap, canvases }
}

describe('prepareImageForUpload', () => {
  it('passes images already under the target size through untouched', async () => {
    const f = file(100 * KB, 'image/jpeg')
    expect(await prepareImageForUpload(f)).toBe(f)
  })

  it('keeps small GIFs as-is so animation survives, and rejects big ones', async () => {
    const small = file(KB, 'image/gif', 'a.gif')
    expect(await prepareImageForUpload(small)).toBe(small)
    await expect(prepareImageForUpload(file(3 * 1024 * KB, 'image/gif', 'big.gif'))).rejects.toThrow('too large')
  })

  it('rejects images that cannot be decoded (e.g. HEIC on Chrome)', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')))
    await expect(prepareImageForUpload(file(3 * 1024 * KB, 'image/heic', 'IMG_1.heic'))).rejects.toThrow('not a supported image format')
  })

  it('re-encodes a big photo as a downscaled WebP', async () => {
    const { bitmap, canvases } = stubCanvas({ webp: true, sizeFor: () => 250 * KB })
    const out = await prepareImageForUpload(file(5 * 1024 * KB, 'image/jpeg', 'IMG_0042.jpg'))
    expect(out.type).toBe('image/webp')
    expect(out.name).toBe('IMG_0042.webp')
    expect(out.size).toBe(250 * KB)
    const real = canvases.at(-1)!
    expect([real.width, real.height]).toEqual([1600, 1200])
    expect(real.fillRect).not.toHaveBeenCalled() // WebP keeps transparency
    expect(bitmap.close).toHaveBeenCalled()
  })

  it('falls back to JPEG on browsers that cannot encode WebP (Safari), filling transparency white', async () => {
    const { canvases } = stubCanvas({ webp: false, sizeFor: () => 300 * KB })
    const out = await prepareImageForUpload(file(5 * 1024 * KB, 'image/png', 'shot.png'))
    expect(out.type).toBe('image/jpeg')
    expect(out.name).toBe('shot.jpg')
    expect(canvases.at(-1)!.fillRect).toHaveBeenCalled()
  })

  it('lowers quality, then size, until the file fits', async () => {
    // Only fits once the canvas has been shrunk below 1600px wide
    const { canvases } = stubCanvas({ webp: true, sizeFor: (_t, q, width) => (width < 1600 ? 350 * KB : 900 * KB) * q })
    const out = await prepareImageForUpload(file(6 * 1024 * KB, 'image/jpeg'))
    expect(out.size).toBeLessThanOrEqual(400 * KB)
    expect(canvases.at(-1)!.width).toBeLessThan(1600)
  })

  it('never upscales small-dimension images', async () => {
    const { canvases } = stubCanvas({ webp: true, sizeFor: () => 100 * KB, bitmap: { width: 800, height: 600 } })
    await prepareImageForUpload(file(900 * KB, 'image/jpeg'))
    expect([canvases.at(-1)!.width, canvases.at(-1)!.height]).toEqual([800, 600])
  })

  it('throws when nothing gets small enough', async () => {
    stubCanvas({ webp: true, sizeFor: () => 5 * 1024 * KB })
    await expect(prepareImageForUpload(file(9 * 1024 * KB, 'image/jpeg'))).rejects.toThrow('too large')
  })
})

describe('IMAGE_EXTENSIONS', () => {
  it('matches the server-side allowlist', () => {
    expect(Object.keys(IMAGE_EXTENSIONS).sort()).toEqual(['image/gif', 'image/jpeg', 'image/png', 'image/webp'])
  })
})
