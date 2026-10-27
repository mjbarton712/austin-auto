import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReq, mockRes } from './helpers'

const create = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn(() => ({ messages: { create } })) }))
const authenticate = vi.fn()
vi.mock('../../api/_lib/auth', () => ({ authenticate: (...a: unknown[]) => authenticate(...a) }))

import handler from '../../api/claude'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ANTHROPIC_API_KEY = 'test-key'
  delete process.env.CLAUDE_MODEL
  authenticate.mockResolvedValue({ user: { id: 'u' }, db: {} })
})

describe('POST /api/claude', () => {
  it('requires authentication', async () => {
    authenticate.mockResolvedValue(null)
    await handler(mockReq({ body: { query: 'hi' } }), mockRes())
    expect(create).not.toHaveBeenCalled()
  })

  it.each([[''], ['   '], [undefined], [42], ['x'.repeat(2001)]])('400s on invalid query %#', async (query) => {
    const res = mockRes()
    await handler(mockReq({ body: { query } }), res)
    expect(res.statusCode).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('503s when no API key is configured', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const res = mockRes()
    await handler(mockReq({ body: { query: 'hi' } }), res)
    expect(res.statusCode).toBe(503)
  })

  it('returns the concatenated text blocks', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'Hello ' }, { type: 'tool_use' }, { type: 'text', text: 'world' }] })
    const res = mockRes()
    await handler(mockReq({ body: { query: '  hi  ' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ text: 'Hello world' })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 1024, messages: [{ role: 'user', content: 'hi' }] }))
  })

  it('maps upstream failures to 502 without leaking details', async () => {
    create.mockRejectedValue(new Error('sk-ant-secret'))
    const res = mockRes()
    await handler(mockReq({ body: { query: 'hi' } }), res)
    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.payload)).not.toContain('secret')
  })
})
