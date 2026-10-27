import { supabase } from './supabase';

const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  };
}

async function failureMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return body?.error || `${fallback} (${response.status})`;
}

/**
 * Photo storage lives in Cloudflare R2. The bucket credentials only exist in
 * the /api serverless functions; the browser never sees them.
 */
export const r2Storage = {
  /** @param filePath `<job-id>/<filename>` key in the bucket */
  async uploadFile(filePath: string, file: File): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          filePath,
          fileData: toBase64(await file.arrayBuffer()),
          contentType: file.type,
        }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, 'Upload failed'));
      return { error: null };
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return { error: error as Error };
    }
  },

  async deleteFile(filePath: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: await authHeaders(),
        body: JSON.stringify({ filePath }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, 'Delete failed'));
      return { error: null };
    } catch (error) {
      console.error('Error deleting from R2:', error);
      return { error: error as Error };
    }
  },

  getPublicUrl(filePath: string): string {
    return `${PUBLIC_URL}/${filePath}`;
  },
};
