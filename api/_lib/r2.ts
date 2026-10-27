import { S3Client } from '@aws-sdk/client-s3';

export function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export const R2_BUCKET = () => process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = () => process.env.R2_PUBLIC_URL ?? process.env.VITE_R2_PUBLIC_URL!;

// Vercel rejects request bodies over 4.5 MB. Base64 adds ~33%, so cap the
// decoded image below that. The client compresses photos to fit.
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** True when the bytes start with the signature of the claimed image type. */
export function matchesImageSignature(buffer: Buffer, contentType: string): boolean {
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => buffer[i] === b);
  switch (contentType) {
    case 'image/jpeg': return startsWith(0xff, 0xd8, 0xff);
    case 'image/png': return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case 'image/gif': return startsWith(0x47, 0x49, 0x46, 0x38);
    case 'image/webp': return buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    default: return false;
  }
}

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/** Keys written by this API: `<job uuid>/<generated name>.<ext>` */
export const NEW_KEY = new RegExp(`^(${UUID})/[A-Za-z0-9_-]+\\.(jpg|png|webp|gif)$`);

/**
 * Keys that may be deleted. Looser than NEW_KEY so photos migrated from
 * Supabase (which can have arbitrary filenames) can still be removed.
 */
export const DELETABLE_KEY = new RegExp(`^(${UUID})/[^/\\\\]{1,200}$`);
