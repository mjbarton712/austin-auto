import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export type AuthedRequest = {
  user: User;
  // Supabase client that acts as the caller, so row-level security applies.
  db: SupabaseClient;
};

/**
 * Verifies the Supabase access token on the request. Responds with 401 and
 * returns null when the caller is not signed in.
 */
export async function authenticate(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthedRequest | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Supabase env vars are not configured for API routes');
    res.status(500).json({ error: 'Server misconfigured' });
    return null;
  }
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const db = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return { user: data.user, db };
}

/** True when the job exists and belongs to the signed-in user. */
export async function ownsJob(auth: AuthedRequest, jobId: string): Promise<boolean> {
  const { data } = await auth.db
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  return !!data;
}
