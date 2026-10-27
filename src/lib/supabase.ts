import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A password-recovery link lands as /update-password#access_token=...&type=recovery.
// supabase-js consumes (and clears) that hash while initializing, and React mounts too late
// to see the PASSWORD_RECOVERY event, so capture it here, before the client is created.
export const recovery = {
  active: typeof window !== 'undefined' && /[#&]type=recovery(&|$)/.test(window.location.hash),
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') recovery.active = true
  if (event === 'SIGNED_OUT') recovery.active = false
})
