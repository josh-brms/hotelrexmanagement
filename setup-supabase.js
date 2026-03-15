// ============================================================
// Rex Hotel - Supabase Setup Script
// Run this once to create all tables and seed data:
//   node setup-supabase.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://klnmscehmptlxbfyuxwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rTtTzi1EXh6SJk9Z3qt_5g_sDMw_GiZ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple hash (same as used in the app)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(10);
}

async function runSQL(sql) {
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}

async function setup() {
  console.log('🚀 Setting up Rex Hotel database on Supabase...\n');

  // ── Create tables via Supabase SQL Editor ──────────────────
  // NOTE: The SQL in supabase-schema.sql must be run manually in the
  // Supabase SQL Editor at: https://supabase.com/dashboard/project/klnmscehmptlxbfyuxwg/sql
  // This script will seed the data AFTER tables are created.

  console.log('Step 1: Checking connection...');
  const { data, error: connError } = await supabase.from('users').select('count').limit(1);
  if (connError) {
    console.error('❌ Cannot connect or tables not found.');
    console.error('   Please run supabase-schema.sql in the Supabase SQL Editor first!');
    console.error('   URL: https://supabase.com/dashboard/project/klnmscehmptlxbfyuxwg/sql');
    console.error('\n   Error:', connError.message);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase!\n');

  console.log('Step 2: Seeding users...');
  const { error: userError } = await supabase.from('users').upsert([
    {
      username: 'admin',
      password_hash: simpleHash('admin123'),
      role: 'Admin',
      full_name: 'Hotel Admin',
      is_active: true,
      attendance_status: 'On Duty',
    },
    {
      username: 'employee1',
      password_hash: simpleHash('emp123'),
      role: 'Employee',
      full_name: 'Juan dela Cruz',
      is_active: true,
      attendance_status: 'Off Duty',
    },
  ], { onConflict: 'username' });
  if (userError) console.error('  User seed error:', userError.message);
  else console.log('✅ Users seeded\n');

  console.log('Step 3: Seeding room types...');
  const { data: rtData, error: rtError } = await supabase.from('room_types').upsert([
    { name: 'Standard Single', base_price: 1200, max_persons: 1, additional_person_price: 300, description: 'Cozy single room with basic amenities' },
    { name: 'Standard Double', base_price: 1800, max_persons: 2, additional_person_price: 400, description: 'Comfortable double room for couples' },
    { name: 'Deluxe Room', base_price: 2500, max_persons: 2, additional_person_price: 500, description: 'Spacious room with premium amenities' },
    { name: 'Family Suite', base_price: 3500, max_persons: 4, additional_person_price: 400, description: 'Large suite ideal for families' },
  ], { onConflict: 'name' }).select();
  if (rtError) console.error('  Room type seed error:', rtError.message);
  else console.log('✅ Room types seeded\n');

  console.log('Step 4: Seeding rooms...');
  const roomTypes = rtData || [];
  const rtMap = {};
  roomTypes.forEach(rt => { rtMap[rt.name] = rt.id; });

  if (Object.keys(rtMap).length > 0) {
    const { error: roomError } = await supabase.from('rooms').upsert([
      { room_number: '101', room_type_id: rtMap['Standard Single'], availability_status: 'Available' },
      { room_number: '102', room_type_id: rtMap['Standard Single'], availability_status: 'Available' },
      { room_number: '201', room_type_id: rtMap['Standard Double'], availability_status: 'Available' },
      { room_number: '202', room_type_id: rtMap['Standard Double'], availability_status: 'Available' },
      { room_number: '301', room_type_id: rtMap['Deluxe Room'], availability_status: 'Available' },
      { room_number: '302', room_type_id: rtMap['Deluxe Room'], availability_status: 'Available' },
      { room_number: '401', room_type_id: rtMap['Family Suite'], availability_status: 'Available' },
      { room_number: '402', room_type_id: rtMap['Family Suite'], availability_status: 'Available' },
    ], { onConflict: 'room_number' });
    if (roomError) console.error('  Room seed error:', roomError.message);
    else console.log('✅ Rooms seeded\n');
  }

  console.log('Step 5: Seeding additional items...');
  const { error: itemError } = await supabase.from('additional_items').upsert([
    { item_name: 'Extra Bed', default_price: 500, is_active: true, quantity: 10 },
    { item_name: 'Extra Pillow', default_price: 100, is_active: true, quantity: 20 },
    { item_name: 'Extra Towel', default_price: 80, is_active: true, quantity: 30 },
    { item_name: 'Laundry Service', default_price: 150, is_active: true, quantity: 100 },
    { item_name: 'Breakfast', default_price: 250, is_active: true, quantity: 50 },
  ], { onConflict: 'item_name' });
  if (itemError) console.error('  Item seed error:', itemError.message);
  else console.log('✅ Additional items seeded\n');

  console.log('Step 6: Seeding revenue row...');
  const { error: revError } = await supabase.from('revenue').upsert([
    { id: 1, total_revenue: 0, all_time_revenue: 0 }
  ], { onConflict: 'id' });
  if (revError) console.error('  Revenue seed error:', revError.message);
  else console.log('✅ Revenue row seeded\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Setup complete! Your Rex Hotel database is ready.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nDefault login credentials:');
  console.log('  Admin    → username: admin     password: admin123');
  console.log('  Employee → username: employee1  password: emp123');
  console.log('\nRun the app with: npm run dev');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
