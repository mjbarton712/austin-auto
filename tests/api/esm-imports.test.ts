import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The project is "type": "module", so Vercel runs api/ as native ESM, where relative imports
// need an explicit extension. Vitest's resolver is more forgiving, so unit tests can't catch
// this; a missing extension crashes every function at startup (FUNCTION_INVOCATION_FAILED).
function apiFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? apiFiles(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : []
  )
}

describe('api/ relative imports', () => {
  it.each(apiFiles('api'))('%s uses explicit .js extensions', file => {
    const specifiers = [...readFileSync(file, 'utf8').matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)].map(m => m[1])
    expect(specifiers.filter(s => !/\.(js|json)$/.test(s))).toEqual([])
  })
})
