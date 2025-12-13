#!/usr/bin/env node
/**
 * Retry migration for failed photos
 * Handles photos that might already be in R2
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const failedIds = [
  '6f45e530-5765-4052-a06d-2928c4b2186c',
  '6933548a-6686-4566-8f9e-57f4a23e0b10',
  'b2592ad5-c82a-43d2-9f6f-18f06c206bf5',
  '21689cc7-2564-4676-a704-289a86207aaf'
];

function extractFilePathFromUrl(url) {
  const match = url.match(/\/car-photos\/(.+)$/);
  if (match) {
    return match[1];
  }
  const parts = url.split('/');
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return null;
}

async function retryMigration() {
  console.log('🔄 Retrying migration for failed photos...\n');

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const photoId of failedIds) {
    try {
      // Fetch the photo record
      const { data: photo, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        console.log(`❌ Could not fetch photo ${photoId}: ${fetchError.message}`);
        failCount++;
        continue;
      }

      console.log(`\n📸 Processing: ${photo.filename}`);
      console.log(`   Current URL: ${photo.url}`);

      // Check if already migrated to R2
      if (photo.url.includes(R2_PUBLIC_URL)) {
        console.log(`   ✅ Already migrated to R2 - skipping`);
        skipCount++;
        continue;
      }

      // Extract file path
      const filePath = extractFilePathFromUrl(photo.url);
      if (!filePath) {
        console.log(`   ❌ Could not extract file path`);
        failCount++;
        continue;
      }

      console.log(`   📥 Downloading from Supabase: ${filePath}`);

      // Download from Supabase
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('car-photos')
        .download(filePath);

      if (downloadError || !fileData) {
        console.log(`   ❌ Download failed: ${downloadError?.message || 'No data'}`);
        failCount++;
        continue;
      }

      // Convert to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      console.log(`   📤 Uploading to R2: ${filePath}`);

      // Upload to R2
      const putCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: fileData.type || 'image/jpeg',
      });

      await r2Client.send(putCommand);

      // Construct new R2 URL
      const newUrl = `${R2_PUBLIC_URL}/${filePath}`;

      console.log(`   💾 Updating database with new URL`);

      // Update database
      const { error: updateError } = await supabase
        .from('media')
        .update({ url: newUrl })
        .eq('id', photoId);

      if (updateError) {
        console.log(`   ❌ Database update failed: ${updateError.message}`);
        failCount++;
        continue;
      }

      console.log(`   ✅ Successfully migrated!`);
      successCount++;

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Retry Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`⏭️  Already migrated (skipped): ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📸 Total attempted: ${failedIds.length}`);

  if (successCount + skipCount === failedIds.length) {
    console.log('\n🎉 All photos are now in R2!');
  }
}

retryMigration();
