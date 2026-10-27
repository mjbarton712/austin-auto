// Photos go through a Vercel function, which rejects bodies over 4.5 MB.
// Phone photos are routinely larger, so shrink them before upload.
const TARGET_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const PASSTHROUGH_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** Returns a file small enough to upload, re-encoding as JPEG when needed. */
export async function prepareImageForUpload(file: File): Promise<File> {
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
    let scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d')!;
      // JPEG has no alpha; without this, transparent PNGs come out black
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await toBlob(canvas, 0.85 - attempt * 0.1);
      if (blob && blob.size <= TARGET_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        return new File([blob], name, { type: 'image/jpeg' });
      }
      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }
  throw new Error(`"${file.name}" is too large to upload`);
}
