import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from './cors'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: corsHeaders,
  },
})

// Initialize CORS settings for storage bucket
export const initializeStorageCORS = async () => {
    try {
        const { data: bucket, error: bucketError } = await supabase.storage.getBucket('car-photos');
        if (bucket) console.log('Storage bucket CORS settings already initialized');
        if (bucketError) throw bucketError;

        const { error } = await supabase
            .storage
            .updateBucket('car-photos', {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 8388608, // 8MB in bytes
            })

        if (error) throw error
        console.log('Storage bucket updated successfully')
    } catch (error) {
        console.error('Error updating storage bucket:', error)
    }
}

// Call the function when the app initializes
initializeStorageCORS()