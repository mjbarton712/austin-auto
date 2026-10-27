import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate, ownsJob } from './_lib/auth.js';
import { getR2Client, IMAGE_TYPES, matchesImageSignature, MAX_UPLOAD_BYTES, NEW_KEY, R2_BUCKET, R2_PUBLIC_URL } from './_lib/r2.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  const { filePath, fileData, contentType } = req.body ?? {};
  const ext = IMAGE_TYPES[contentType];
  const match = typeof filePath === 'string' ? NEW_KEY.exec(filePath) : null;

  if (!match || typeof fileData !== 'string' || !ext) {
    return res.status(400).json({ error: 'Invalid upload request' });
  }
  if (!filePath.endsWith(`.${ext}`)) {
    return res.status(400).json({ error: 'File extension does not match content type' });
  }

  const buffer = Buffer.from(fileData, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(413).json({ error: 'Photo is too large' });
  }
  if (!matchesImageSignature(buffer, contentType)) {
    return res.status(400).json({ error: 'File is not a valid image' });
  }

  try {
    if (!(await ownsJob(auth, match[1]))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET(),
        Key: filePath,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    return res.status(200).json({ success: true, url: `${R2_PUBLIC_URL()}/${filePath}` });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
