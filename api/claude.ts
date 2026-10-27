import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from './_lib/auth.js';

const MAX_QUERY_CHARS = 2000;

// Best-effort per-user limit. Serverless instances don't share memory, so this only bounds
// bursts; set a spend limit on the Anthropic workspace as the real cap.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const recent = new Map<string, number[]>();

function rateLimited(userId: string, now = Date.now()) {
  const hits = (recent.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    recent.set(userId, hits);
    return true;
  }
  recent.set(userId, [...hits, now]);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  if (rateLimited(auth.user.id)) {
    return res.status(429).json({ error: 'Too many requests, try again later' });
  }

  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (!query || query.length > MAX_QUERY_CHARS) {
    return res.status(400).json({ error: `Query must be 1-${MAX_QUERY_CHARS} characters` });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Claude is not configured' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-haiku-5-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: query }],
    });
    const text = message.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('');
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Claude error:', error);
    return res.status(502).json({ error: 'Claude request failed' });
  }
}
