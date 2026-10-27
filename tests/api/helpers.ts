import type { VercelRequest, VercelResponse } from '@vercel/node'

export function mockReq(init: Partial<Pick<VercelRequest, 'method' | 'body'>> & { headers?: Record<string, string> } = {}) {
  return { method: 'POST', headers: {}, body: {}, ...init } as unknown as VercelRequest
}

export function mockRes() {
  const res = { statusCode: 0, payload: undefined as unknown } as {
    statusCode: number
    payload: unknown
    status: (code: number) => typeof res
    json: (body: unknown) => typeof res
  }
  res.status = (code) => ((res.statusCode = code), res)
  res.json = (body) => ((res.payload = body), res)
  return res as typeof res & VercelResponse
}

export const JOB_ID = '123e4567-e89b-12d3-a456-426614174000'
export const OTHER_JOB_ID = '987e6543-e21b-12d3-a456-426614174999'
