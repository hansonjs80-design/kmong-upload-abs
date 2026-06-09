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

async function testTherapistRoster() {
  console.log('--- Testing saveTherapistRoster (Insert into shockwave_therapists) ---');
  // 1. Deactivate existing
  const { error: deactivateError } = await supabase
    .from('shockwave_therapists')
    .update({ is_active: false })
    .eq('is_active', true);
  
  if (deactivateError) {
    console.error('Deactivate error:', deactivateError);
    return;
  }
  
  // 2. Insert new
  const rows = [{ name: '테스트치료사1', slot_index: 0, is_active: true }];
  const { data, error: insertError } = await supabase
    .from('shockwave_therapists')
    .insert(rows)
    .select('*');
  
  if (insertError) {
    console.error('Insert therapist error:', insertError);
  } else {
    console.log('Insert therapist success:', data);
  }
}

async function testMonthlyTherapist() {
  console.log('\n--- Testing saveMonthlyTherapist (Insert into shockwave_monthly_therapists) ---');
  // 1. Delete existing for 2026-06
  const { error: deleteError } = await supabase
    .from('shockwave_monthly_therapists')
    .delete()
    .eq('year', 2026)
    .eq('month', 6)
    .eq('type', 'shockwave');
  
  if (deleteError) {
    console.error('Delete monthly error:', deleteError);
    return;
  }
  
  // 2. Insert new
  const rows = [{
    year: 2026,
    month: 6,
    slot_index: 0,
    therapist_name: '테스트치료사1',
    start_day: 1,
    end_day: 30,
    type: 'shockwave',
    created_at: new Date().toISOString(),
  }];
  
  const { data, error: insertError } = await supabase
    .from('shockwave_monthly_therapists')
    .insert(rows)
    .select('*');
  
  if (insertError) {
    console.error('Insert monthly error:', insertError);
  } else {
    console.log('Insert monthly success:', data);
  }
}

async function testSaveSettings() {
  console.log('\n--- Testing saveShockwaveSettings (Upsert shockwave_settings) ---');
  const payload = {
    id: '00000000-0000-0000-0000-000000000000',
    start_time: '09:00:00',
    end_time: '18:00:00',
    interval_minutes: 10,
    day_overrides: {},
    date_overrides: {},
    prescriptions: ['F1.5', 'F/Rdc', 'F/R'],
    manual_therapy_prescriptions: ['40분', '60분'],
    prescription_prices: {
      'F1.5': 50000,
      'F/Rdc': 70000,
      'F/R': 80000,
    },
    incentive_percentage: 7,
    manual_therapy_incentive_percentage: 0,
    frozen_columns: 6,
    prescription_colors: {},
    shortcuts: {},
    manual_therapy_shortcuts: {},
    manual_therapy_dose_tags: {},
    duration_minutes: { 'F/R': 20 },
    manual_therapy_duration_minutes: { '40분': 40 },
    staff_schedule_block_rules: {},
    monthly_settlement_settings: {},
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('shockwave_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*');
  
  if (error) {
    console.error('Upsert settings error:', error);
  } else {
    console.log('Upsert settings success:', data);
  }
}

async function run() {
  await testTherapistRoster();
  await testMonthlyTherapist();
  await testSaveSettings();
}

run();
