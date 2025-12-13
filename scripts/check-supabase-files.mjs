#!/usr/bin/env node
/**
 * Check if photos exist in Supabase storage
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const filePaths = [
  '18d2bfd1-a40f-41e1-8227-8c002281481f/1741734510976-0.41985514450967387.png',
  '023cfa5d-8d30-47fe-bf45-17ce6d804092/1742156494412-duxgoi7e.png',
  '26b4a448-ed64-4dec-b85e-97cbd3793aa2/1736635791316-0.2053988979807162.png'
];

const photoIds = [
  '6f45e530-5765-4052-a06d-2928c4b2186c',
  '6933548a-6686-4566-8f9e-57f4a23e0b10',
  'b2592ad5-c82a-43d2-9f6f-18f06c206bf5'
];

async function checkFiles() {
  console.log('🔍 Checking if files exist in Supabase storage...\n');

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const photoId = photoIds[i];
    
    console.log(`📁 Checking: ${filePath}`);
    
    // Try to download the file
    const { data, error } = await supabase.storage
      .from('car-photos')
      .download(filePath);
    
    if (error) {
      console.log(`   ❌ Does NOT exist in Supabase`);
      console.log(`   Error: ${JSON.stringify(error, null, 2)}`);
      console.log(`   Photo ID: ${photoId}`);
      console.log(`   → Recommendation: Delete this orphaned database record\n`);
    } else {
      console.log(`   ✅ Exists in Supabase (size: ${data.size} bytes)\n`);
    }
  }
}

checkFiles();
