import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Only allow POST requests
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication (optional but recommended)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filePath, fileData, contentType } = req.body;

    if (!filePath || !fileData) {
      return res.status(400).json({ error: 'Missing filePath or fileData' });
    }

    // Initialize R2 client with server-side credentials
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filePath,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
    });

    await r2Client.send(command);

    // Return the public URL
    const publicUrl = `${process.env.VITE_R2_PUBLIC_URL}/${filePath}`;

    return res.status(200).json({ 
      success: true,
      url: publicUrl 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}
