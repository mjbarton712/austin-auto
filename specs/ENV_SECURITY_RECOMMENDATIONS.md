# Environment Variables Security Recommendations

## Current Status

### Safe Variables (Keep These)
- ✅ `VITE_SUPABASE_URL` - Public URL, safe to expose
- ✅ `VITE_SUPABASE_ANON_KEY` - Anon/public key, designed for client-side use

### Dangerous Variables (Action Required)
- ❌ `VITE_SUPABASE_SERVICE_KEY` - **REMOVE IMMEDIATELY**
- ⚠️ `VITE_CLAUDE_API_KEY` - Not in .env but still referenced in code

## Actions to Take

### 1. Remove VITE_SUPABASE_SERVICE_KEY from .env
```bash
# Remove this line from .env:
VITE_SUPABASE_SERVICE_KEY="..."
```

**Why?** 
- Bypasses ALL Row Level Security policies
- Has full admin access to your database
- Never needed for client-side applications
- Not currently used in your code (verified)

### 2. Remove VITE_SUPABASE_SERVICE_KEY from GitHub Secrets
Go to: GitHub repo → Settings → Secrets and variables → Actions
- Delete `VITE_SUPABASE_SERVICE_KEY`

### 3. Update GitHub Actions Workflow
Remove these lines from `.github/workflows/gh-pages-static.yml`:
```yaml
VITE_SUPABASE_SERVICE_KEY: ${{ secrets.VITE_SUPABASE_SERVICE_KEY }}
VITE_CLAUDE_API_KEY: ${{ secrets.VITE_CLAUDE_API_KEY }}
```

### 4. Handle Claude API Key Properly

**Current Code References:**
- `src/components/dashboard.tsx` line 26
- `src/components/history.tsx` line 18

**Options:**

#### Option A: Remove Claude AI Feature (Simplest)
Remove the Claude modal/search feature entirely if not essential.

#### Option B: Move to Backend (Most Secure)
1. Create a Supabase Edge Function or serverless API endpoint
2. Store Claude API key on the server
3. Client calls your endpoint, which calls Claude API
4. Your endpoint can implement rate limiting and user authentication

#### Option C: Accept the Risk (Not Recommended)
- Keep it but understand anyone can extract and use your API key
- Could result in unexpected API charges
- Consider setting usage limits in Anthropic dashboard

## Understanding Supabase Security

### Why VITE_SUPABASE_ANON_KEY is Safe

Supabase uses Row Level Security (RLS) which means:
- The anon key can only access data allowed by RLS policies
- Authentication adds user context
- Each user can only access their own data (based on your RLS rules)
- Even if exposed, attackers can't bypass these restrictions

### Example RLS Policy (likely what you have):
```sql
-- Users can only access their own cars
CREATE POLICY "Users can view own cars"
ON cars_new
FOR SELECT
USING (auth.uid() = user_id);
```

This means even with the anon key, users can ONLY see their own data.

### What Service Key Does (Why It's Dangerous)
- Bypasses ALL policies
- Full read/write access to everything
- Can delete databases, modify tables, access all user data
- Should only be used in secure server environments

## Recommended .env File

Your .env should only contain:

```properties
# Public Supabase credentials (safe for client-side)
VITE_SUPABASE_URL="https://cffpowuluoctfuifcznq.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Additional Security Best Practices

1. **Add .env to .gitignore** (should already be there)
2. **Use Supabase RLS policies** for all tables
3. **Enable email verification** for new users
4. **Set up proper authentication flows**
5. **Regular security audits** of your RLS policies
6. **Monitor Supabase logs** for suspicious activity

## Questions?

### Q: Can someone steal my Supabase data with the anon key?
**A:** No, as long as you have proper RLS policies. They can only access what the policies allow.

### Q: Should I rotate my anon key?
**A:** Only if you suspect it's compromised AND you have weak/missing RLS policies. The key itself is meant to be public.

### Q: How do I test my RLS policies?
**A:** Use Supabase dashboard → Authentication → Policies, and test with different user contexts.

## Immediate Checklist

- [ ] Remove `VITE_SUPABASE_SERVICE_KEY` from `.env`
- [ ] Remove `VITE_SUPABASE_SERVICE_KEY` from GitHub Secrets
- [ ] Update GitHub Actions workflow file
- [ ] Decide what to do with Claude API (remove, move to backend, or accept risk)
- [ ] Verify RLS policies are in place for all tables
- [ ] Test that users can't access other users' data
