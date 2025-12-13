#!/usr/bin/env node
/**
 * Check the failed photo records to diagnose the issue
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const failedIds = [
  '6f45e530-5765-4052-a06d-2928c4b2186c',
  '6933548a-6686-4566-8f9e-57f4a23e0b10',
  'b2592ad5-c82a-43d2-9f6f-18f06c206bf5',
  '21689cc7-2564-4676-a704-289a86207aaf'
];

async function checkPhotos() {
  console.log('🔍 Checking failed photo records...\n');
  
  for (const id of failedIds) {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.log(`❌ Photo ${id}: ${error.message}`);
    } else {
      console.log(`📸 Photo ${id}:`);
      console.log(`   URL: ${data.url}`);
      console.log(`   Filename: ${data.filename}`);
      console.log(`   Job ID: ${data.job_id}`);
      console.log(`   Car ID: ${data.car_id || 'null'}`);
      console.log('');
    }
  }
}

checkPhotos();
