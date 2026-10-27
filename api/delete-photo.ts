import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate, ownsJob } from './_lib/auth';
import { DELETABLE_KEY, getR2Client, R2_BUCKET } from './_lib/r2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  const { filePath } = req.body ?? {};
  const match = typeof filePath === 'string' ? DELETABLE_KEY.exec(filePath) : null;
  if (!match || filePath.includes('..')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  if (!(await ownsJob(auth, match[1]))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET(), Key: filePath }));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
