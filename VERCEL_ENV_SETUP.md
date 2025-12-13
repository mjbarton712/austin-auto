# Environment Variables for Vercel

## Public Variables (safe for frontend)
VITE_SUPABASE_URL=https://cffpowuluoctfuifcznq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZnBvd3VsdW9jdGZ1aWZjem5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3NjQ2ODgsImV4cCI6MjA0NDM0MDY4OH0.o1h7Prl0Cd2FLkza5HqKceeKWVcpj9-mnZW0-BF0T_k
VITE_R2_PUBLIC_URL=https://pub-66c64a81e5d6447e9a8d5afa24b4c1aa.r2.dev
VITE_R2_BUCKET_NAME=runew-photos

## ⚠️ PRIVATE Variables (DO NOT expose in frontend - need backend)
## These should be Vercel Environment Variables (not VITE_ prefixed)
R2_ACCOUNT_ID=436e14aaeeeb161284213795525b7b75
R2_ACCESS_KEY_ID=e21bf3201019e3c8af8f872c5df17394
R2_SECRET_ACCESS_KEY=c54738c932f8c9fc92cfca2dc999ed8551fca471f5d983d3d1d5fefa085dd578

## IMPORTANT SECURITY NOTES:
## 1. The VITE_* variables are safe because they're read-only (public URL, bucket name)
## 2. The R2_* credentials (without VITE_ prefix) are DANGEROUS if exposed in frontend
## 3. Currently, your app exposes these in the frontend, which is a security risk
## 4. Anyone can inspect your deployed app and extract these credentials
## 5. They could then upload malicious files or delete your photos

## RECOMMENDED FIX:
## Create Vercel Serverless Functions or Edge Functions to handle uploads/deletes
## See: api/upload-photo.ts and api/delete-photo.ts (to be created)
