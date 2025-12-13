import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Missing filePath' });
    }

    // Initialize R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filePath,
    });

    await r2Client.send(command);

    return res.status(200).json({ 
      success: true 
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return res.status(500).json({ 
      error: 'Delete failed',
      message: error.message 
    });
  }
}
