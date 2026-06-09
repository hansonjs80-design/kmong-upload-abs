import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = '';
let supabaseKey = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].replace(/['"]/g, '');
    }
    if (trimmed.startsWith('VITE_SUPABASE_KEY=')) {
      supabaseKey = trimmed.split('=')[1].replace(/['"]/g, '');
    }
  }
} catch (e) {
  console.error('Failed to read .env:', e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking app_users table ---');
  const { data: users, error: userError } = await supabase
    .from('app_users')
    .select('*');
  
  if (userError) {
    console.error('Error fetching users:', userError);
  } else {
    console.log('app_users data:', users);
  }

  console.log('\n--- Checking shockwave_settings table ---');
  const { data: settings, error: settingsError } = await supabase
    .from('shockwave_settings')
    .select('*');

  if (settingsError) {
    console.error('Error fetching settings:', settingsError);
  } else {
    console.log('shockwave_settings data:', settings);
  }

  console.log('\n--- Checking shockwave_therapists table ---');
  const { data: therapists, error: therapistsError } = await supabase
    .from('shockwave_therapists')
    .select('*');

  if (therapistsError) {
    console.error('Error fetching therapists:', therapistsError);
  } else {
    console.log('shockwave_therapists data:', therapists);
  }
}

check();
