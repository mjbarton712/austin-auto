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

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/** Keys written by this API: `<job uuid>/<generated name>.<ext>` */
export const NEW_KEY = new RegExp(`^(${UUID})/[A-Za-z0-9_-]+\\.(jpg|png|webp|gif)$`);

/**
 * Keys that may be deleted. Looser than NEW_KEY so photos migrated from
 * Supabase (which can have arbitrary filenames) can still be removed.
 */
export const DELETABLE_KEY = new RegExp(`^(${UUID})/[^/\\\\]{1,200}$`);
