#!/usr/bin/env node
/**
 * Migration script to move photos from Supabase Storage to Cloudflare R2
 * 
 * This script will:
 * 1. Fetch all photo records from the media table
 * 2. Download each photo from Supabase storage
 * 3. Upload to R2 storage with the same folder structure (job_id/filename)
 * 4. Update the media table with the new R2 URL
 * 
 * Run with: node scripts/migrate-to-r2.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

// Configuration from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.error('❌ Missing R2 credentials in .env file');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to extract file path from Supabase URL
function extractFilePathFromUrl(url) {
  // Supabase storage URLs typically look like:
  // https://[project].supabase.co/storage/v1/object/public/car-photos/[job-id]/[filename]
  const match = url.match(/\/car-photos\/(.+)$/);
  if (match) {
    return match[1];
  }
  // If the URL doesn't match, try to extract job_id/filename from the end
  const parts = url.split('/');
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return null;
}

// Main migration function
async function migratePhotos() {
  console.log('🚀 Starting photo migration from Supabase to R2...\n');

  try {
    // Step 1: Fetch all media records
    console.log('📋 Fetching all photo records from database...');
    const { data: photos, error: fetchError } = await supabase
      .from('media')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch photos: ${fetchError.message}`);
    }

    if (!photos || photos.length === 0) {
      console.log('✅ No photos found to migrate.');
      return;
    }

    console.log(`📸 Found ${photos.length} photos to migrate\n`);

    let successCount = 0;
    let failCount = 0;
    const failures = [];

    // Step 2: Process each photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`[${i + 1}/${photos.length}] Processing photo: ${photo.filename}`);

      try {
        // Extract the file path from the Supabase URL
        const filePath = extractFilePathFromUrl(photo.url);
        
        if (!filePath) {
          console.log(`  ⚠️  Could not extract file path from URL: ${photo.url}`);
          failCount++;
          failures.push({ photo, reason: 'Could not extract file path' });
          continue;
        }

        console.log(`  📥 Downloading from Supabase: ${filePath}`);
        
        // Download the file from Supabase
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('car-photos')
          .download(filePath);

        if (downloadError || !fileData) {
          console.log(`  ❌ Failed to download: ${downloadError?.message || 'No data'}`);
          failCount++;
          failures.push({ photo, reason: downloadError?.message || 'No data returned' });
          continue;
        }

        // Convert blob to buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        console.log(`  📤 Uploading to R2: ${filePath}`);

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

        console.log(`  💾 Updating database with new URL`);

        // Update the media record with the new R2 URL
        const { error: updateError } = await supabase
          .from('media')
          .update({ url: newUrl })
          .eq('id', photo.id);

        if (updateError) {
          console.log(`  ❌ Failed to update database: ${updateError.message}`);
          failCount++;
          failures.push({ photo, reason: `DB update failed: ${updateError.message}` });
          continue;
        }

        console.log(`  ✅ Successfully migrated!`);
        successCount++;

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failCount++;
        failures.push({ photo, reason: error.message });
      }

      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📸 Total photos: ${photos.length}`);

    if (failures.length > 0) {
      console.log('\n❌ Failed migrations:');
      failures.forEach(({ photo, reason }) => {
        console.log(`  - ${photo.filename} (ID: ${photo.id}): ${reason}`);
      });
    }

    if (successCount === photos.length) {
      console.log('\n🎉 All photos successfully migrated to R2!');
      console.log('\n💡 Next steps:');
      console.log('  1. Test uploading a new photo to verify R2 integration works');
      console.log('  2. Once confirmed, you can delete photos from Supabase storage to free up space');
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePhotos();
