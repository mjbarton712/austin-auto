/**
 * Row-level security checks against a real Supabase project.
 *
 *   TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY
 *   TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD
 *   TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD   (two different, throwaway accounts)
 *
 * Creates its own car/job/media rows and removes them afterwards (fails loudly if it can't). Run: npm run test:integration
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const env = process.env
const configured = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_USER_A_EMAIL',
  'TEST_USER_A_PASSWORD',
  'TEST_USER_B_EMAIL',
  'TEST_USER_B_PASSWORD',
].every(k => env[k])

const newClient = () =>
  createClient(env.TEST_SUPABASE_URL!, env.TEST_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })

async function signIn(email: string, password: string) {
  const client = newClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { client, userId: data.user.id }
}

describe.skipIf(!configured)('row-level security', () => {
  let a: SupabaseClient, b: SupabaseClient, anon: SupabaseClient
  let aId: string
  let carId: string, jobId: string, mediaId: string

  beforeAll(async () => {
    const [ua, ub] = await Promise.all([
      signIn(env.TEST_USER_A_EMAIL!, env.TEST_USER_A_PASSWORD!),
      signIn(env.TEST_USER_B_EMAIL!, env.TEST_USER_B_PASSWORD!),
    ])
    a = ua.client
    aId = ua.userId
    b = ub.client
    anon = newClient()

    const car = await a
      .from('cars_new')
      .insert({ make: 'RLS', model: 'Test', owner_name: 'rls-test', user_id: aId })
      .select()
      .single()
    expect(car.error).toBeNull()
    carId = car.data!.id

    const job = await a
      .from('jobs')
      .insert({
        car_id: carId,
        description: 'rls test',
        status: 'not_started',
        payment_status: 'unpaid',
        intake_date: '2024-01-01',
        user_id: aId,
      })
      .select()
      .single()
    expect(job.error).toBeNull()
    jobId = job.data!.id

    const media = await a
      .from('media')
      .insert({ job_id: jobId, car_id: carId, url: 'https://example.invalid/x.jpg', filename: 'x.jpg' })
      .select()
      .single()
    expect(media.error).toBeNull()
    mediaId = media.data!.id
  })

  afterAll(async () => {
    // Media cascades from jobs, but jobs do NOT cascade from cars_new, so delete the job first.
    // Check each result: a silent failure here would leave test rows in the real database.
    if (jobId) expect((await a.from('jobs').delete().eq('id', jobId)).error).toBeNull()
    if (carId) expect((await a.from('cars_new').delete().eq('id', carId)).error).toBeNull()
    if (carId) expect((await a.from('cars_new').select('id').eq('id', carId)).data).toEqual([])
  })

  it('owner can read their own car, job and photo record', async () => {
    expect((await a.from('cars_new').select('id').eq('id', carId)).data).toHaveLength(1)
    expect((await a.from('jobs').select('id').eq('id', jobId)).data).toHaveLength(1)
    expect((await a.from('media').select('id').eq('id', mediaId)).data).toHaveLength(1)
  })

  it("another signed-in user can't see them", async () => {
    expect((await b.from('cars_new').select('id').eq('id', carId)).data).toEqual([])
    expect((await b.from('jobs').select('id').eq('id', jobId)).data).toEqual([])
    expect((await b.from('media').select('id').eq('id', mediaId)).data).toEqual([])
  })

  it("another signed-in user can't modify or delete them", async () => {
    await b.from('media').update({ filename: 'hacked.jpg' }).eq('id', mediaId)
    await b.from('media').delete().eq('id', mediaId)
    await b.from('jobs').update({ description: 'hacked' }).eq('id', jobId)
    await b.from('cars_new').delete().eq('id', carId)

    expect((await a.from('media').select('filename').eq('id', mediaId).single()).data?.filename).toBe('x.jpg')
    expect((await a.from('jobs').select('description').eq('id', jobId).single()).data?.description).toBe('rls test')
    expect((await a.from('cars_new').select('id').eq('id', carId)).data).toHaveLength(1)
  })

  it("another user can't attach a photo record to someone else's job", async () => {
    const { error } = await b
      .from('media')
      .insert({ job_id: jobId, car_id: carId, url: 'https://example.invalid/y.jpg', filename: 'y.jpg' })
    expect(error).not.toBeNull()
  })

  it("owner can't hand their data to another user", async () => {
    const { data: userB } = await b.auth.getUser()
    const { error } = await a.from('jobs').insert({
      car_id: carId,
      description: 'x',
      status: 'not_started',
      payment_status: 'unpaid',
      intake_date: '2024-01-01',
      user_id: userB.user!.id,
    })
    expect(error).not.toBeNull()
  })

  it.each(['cars_new', 'jobs', 'media'])('anonymous callers get nothing from %s', async table => {
    const { data } = await anon.from(table).select('id').limit(1)
    expect(data ?? []).toEqual([])
  })

  // The serverless functions (api/_lib/auth.ts) build a client from the project key plus the
  // caller's access token, so this is the path that breaks if the key format changes.
  it("a server-side client built from the key and a caller's token acts as that caller", async () => {
    const { data } = await a.auth.getSession()
    const token = data.session!.access_token
    const server = createClient(env.TEST_SUPABASE_URL!, env.TEST_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const user = await server.auth.getUser(token)
    expect(user.error).toBeNull()
    expect(user.data.user?.id).toBe(aId)
    expect((await server.from('jobs').select('id').eq('id', jobId).eq('user_id', aId).maybeSingle()).data).not.toBeNull()

    const bogus = await server.auth.getUser('not-a-token')
    expect(bogus.data.user).toBeNull()
  })

  it('anonymous callers cannot insert or delete photo records', async () => {
    const ins = await anon
      .from('media')
      .insert({ job_id: jobId, car_id: carId, url: 'https://example.invalid/z.jpg', filename: 'z.jpg' })
    expect(ins.error).not.toBeNull()
    await anon.from('media').delete().eq('id', mediaId)
    expect((await a.from('media').select('id').eq('id', mediaId)).data).toHaveLength(1)
  })
})
