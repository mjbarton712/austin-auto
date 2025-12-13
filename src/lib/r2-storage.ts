import { supabase } from './supabase';

const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;
const USE_SERVERLESS_API = import.meta.env.PROD; // Use API in production, direct upload in dev

export const r2Storage = {
  /**
   * Upload a file to R2 storage
   * Uses serverless API in production for security, direct upload in dev
   * @param filePath - The path/key for the file in the bucket (e.g., "job-id/filename.jpg")
   * @param file - The file to upload
   * @returns Object with error if failed, null otherwise
   */
  async uploadFile(filePath: string, file: File): Promise<{ error: Error | null }> {
    try {
      if (USE_SERVERLESS_API) {
        // PRODUCTION: Use serverless API to keep credentials secure
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Get Supabase auth token for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            filePath,
            fileData: base64,
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        return { error: null };
      } else {
        // DEVELOPMENT: Direct upload (requires VITE_R2_* credentials in .env)
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
          },
        });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const command = new PutObjectCommand({
          Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
          Key: filePath,
          Body: buffer,
          ContentType: file.type,
        });

        await r2Client.send(command);
        return { error: null };
      }
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return { error: error as Error };
    }
  },

  /**
   * Delete a file from R2 storage
   * Uses serverless API in production for security, direct delete in dev
   * @param filePath - The path/key of the file to delete
   * @returns Object with error if failed, null otherwise
   */
  async deleteFile(filePath: string): Promise<{ error: Error | null }> {
    try {
      if (USE_SERVERLESS_API) {
        // PRODUCTION: Use serverless API
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/delete-photo', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({ filePath }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Delete failed');
        }

        return { error: null };
      } else {
        // DEVELOPMENT: Direct delete
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
          },
        });

        const command = new DeleteObjectCommand({
          Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
          Key: filePath,
        });

        await r2Client.send(command);
        return { error: null };
      }
    } catch (error) {
      console.error('Error deleting from R2:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get the public URL for a file
   * @param filePath - The path/key of the file
   * @returns The public URL for accessing the file
   */
  getPublicUrl(filePath: string): string {
    // Construct the public URL using the R2 public domain
    return `${PUBLIC_URL}/${filePath}`;
  },
};
