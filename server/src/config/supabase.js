import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const missing = [
  !supabaseUrl && 'SUPABASE_URL',
  !supabaseKey && 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean);

if (missing.length > 0) {
  throw new Error(`${missing.join(' and ')} must be set in Replit Secrets or the local environment`);
}

// Service-role client (full access — backend only, never expose to frontend)
// Note: ws transport required for Node.js < 22
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth:     { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
});

export const SUPABASE_URL = supabaseUrl;
export const BUCKET = process.env.SUPABASE_BUCKET || 'fseg';
export const FALLBACK_BUCKETS = (process.env.SUPABASE_FALLBACK_BUCKETS || BUCKET)
  .split(',')
  .map(bucket => bucket.trim())
  .filter(bucket => bucket && bucket !== BUCKET);
