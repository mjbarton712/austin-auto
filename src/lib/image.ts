// Every photo is squeezed before upload. Phones shoot 4-8 MB frames, but the app never shows one
// wider than a screen, and R2's free tier is 10 GB. Small files pass through, everything else is
// re-encoded as WebP (JPEG on Safari, which can't encode WebP) at a few hundred KB.
// The Vercel function also rejects bodies over 4.5 MB, so this keeps uploads well under that.
const MAX_DIMENSION = 1600;
const TARGET_BYTES = 400 * 1024;
// Last resort when nothing reaches TARGET_BYTES; the API itself rejects anything over 3 MB
const HARD_MAX_BYTES = 2 * 1024 * 1024;
const QUALITIES = [0.82, 0.74, 0.66, 0.58];
const SHRINK_STEPS = [1, 0.8, 0.64];
const PASSTHROUGH_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

/** Safari ignores 'image/webp' in toBlob and hands back a PNG, so ask a 1px canvas what we really get. */
async function canEncodeWebp(): Promise<boolean> {
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  return (await toBlob(probe, 'image/webp', 0.8))?.type === 'image/webp';
}

/** Returns a file small enough to upload, re-encoding it when it is not already tiny. */
export async function prepareImageForUpload(file: File): Promise<File> {
  // Re-encoding would flatten an animation to one frame
  if (file.type === 'image/gif') {
    if (file.size > HARD_MAX_BYTES) throw new Error(`"${file.name}" is too large to upload`);
    return file;
  }
  if (PASSTHROUGH_TYPES.includes(file.type) && file.size <= TARGET_BYTES) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`"${file.name}" is not a supported image format`);
  }

  try {
    const webp = await canEncodeWebp();
    const type = webp ? 'image/webp' : 'image/jpeg';
    const extension = IMAGE_EXTENSIONS[type];
    const baseScale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    let smallest: Blob | null = null;

    for (const shrink of SHRINK_STEPS) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * baseScale * shrink);
      canvas.height = Math.round(bitmap.height * baseScale * shrink);
      const ctx = canvas.getContext('2d')!;
      if (!webp) {
        // JPEG has no alpha; without this, transparent PNGs come out black
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, type, quality);
        if (!blob) continue;
        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= TARGET_BYTES) {
          return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + extension, { type });
        }
      }
    }

    if (smallest && smallest.size <= HARD_MAX_BYTES) {
      return new File([smallest], file.name.replace(/\.[^.]+$/, '') + '.' + extension, { type });
    }
  } finally {
    bitmap.close();
  }
  throw new Error(`"${file.name}" is too large to upload`);
}
