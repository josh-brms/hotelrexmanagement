-- ============================================================
-- REX HOTEL MANAGEMENT - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('Admin', 'Employee')),
  full_name text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz,
  attendance_status text default 'Off Duty' check (attendance_status in ('On Duty', 'Off Duty', 'Absent', 'Day Off')),
  arrival_time timestamptz,
  off_time timestamptz
);

-- ─── ROOM TYPES ──────────────────────────────────────────────
create table if not exists room_types (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  base_price numeric(10,2) not null,
  max_persons int not null default 1,
  additional_person_price numeric(10,2) not null default 0,
  description text default ''
);

-- ─── ROOMS ───────────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  room_number text unique not null,
  room_type_id uuid references room_types(id) on delete set null,
  availability_status text default 'Available' check (availability_status in ('Available', 'Occupied', 'Maintenance', 'Reserved'))
);

-- ─── GUESTS ──────────────────────────────────────────────────
create table if not exists guests (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  is_regular boolean default false,
  check_in_count int default 0,
  total_revenue_generated numeric(12,2) default 0,
  avg_stay_duration numeric(5,2) default 0,
  last_checkout_date timestamptz,
  most_booked_room_type text,
  preferences_notes text
);

-- ─── ADDITIONAL ITEMS ────────────────────────────────────────
create table if not exists additional_items (
  id uuid primary key default uuid_generate_v4(),
  item_name text unique not null,
  default_price numeric(10,2) not null,
  is_active boolean default true,
  quantity int default 0
);

-- ─── RESERVATIONS ────────────────────────────────────────────
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete cascade,
  guest_name text not null,
  room_type_id uuid references room_types(id) on delete set null,
  room_type_name text not null,
  room_number text,
  check_in_date_expected date not null,
  num_days int not null,
  num_persons int not null,
  amount_deposited numeric(10,2) default 0,
  remaining_balance numeric(10,2) default 0,
  total_estimated_cost numeric(10,2) default 0,
  reservation_status text default 'Pending' check (reservation_status in ('Pending', 'Confirmed', 'Checked In', 'Cancelled')),
  processed_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── BOOKINGS ────────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete set null,
  guest_id uuid references guests(id) on delete cascade,
  guest_name text not null,
  room_id uuid references rooms(id) on delete set null,
  room_number text not null,
  room_type_name text not null,
  num_persons int not null,
  check_in_time timestamptz not null,
  num_days int not null,
  expected_check_out timestamptz not null,
  discount_type text default 'None',
  discount_amount numeric(10,2) default 0,
  total_amount numeric(10,2) not null,
  amount_paid numeric(10,2) default 0,
  balance_due numeric(10,2) not null,
  is_paid boolean default false,
  change_given numeric(10,2) default 0,
  change_returned_confirmed boolean default false,
  processed_by_user_id uuid references users(id) on delete set null,
  checkout_time timestamptz,
  status text default 'Active' check (status in ('Active', 'Checked Out')),
  extra_bed_added_cost numeric(10,2) default 0
);

-- ─── BOOKING ADDITIONAL ITEMS ────────────────────────────────
create table if not exists booking_additional_items (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  item_id uuid references additional_items(id) on delete set null,
  item_name text not null,
  quantity int not null,
  unit_price_at_sale numeric(10,2) not null,
  total_item_cost numeric(10,2) not null
);

-- ─── PAYMENTS ────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  guest_name text not null,
  payment_date timestamptz default now(),
  amount_received numeric(10,2) not null,
  payment_method text not null,
  is_deposit_payment boolean default false,
  recorded_by_user_id uuid references users(id) on delete set null,
  recorded_by_name text not null
);

-- ─── DEPOSITS ────────────────────────────────────────────────
create table if not exists deposits (
  id uuid primary key default uuid_generate_v4(),
  deposit_date timestamptz default now(),
  amount_deposited numeric(10,2) not null,
  source_description text not null,
  recorded_by_user_id uuid references users(id) on delete set null,
  recorded_by_name text not null
);

-- ─── REVENUE ─────────────────────────────────────────────────
create table if not exists revenue (
  id int primary key default 1,
  total_revenue numeric(12,2) default 0,
  all_time_revenue numeric(12,2) default 0,
  last_update timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ─── GUEST RECORD HISTORY ────────────────────────────────────
create table if not exists guest_record_history (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete cascade,
  guest_name text not null,
  booking_id uuid references bookings(id) on delete cascade,
  check_in_date_actual timestamptz not null,
  check_out_date_actual timestamptz not null,
  total_stay_cost numeric(10,2) not null,
  room_type_name text not null,
  num_days int not null
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed revenue row
insert into revenue (id, total_revenue, all_time_revenue) values (1, 0, 0)
on conflict (id) do nothing;

-- Seed admin user (password: admin123)
insert into users (username, password_hash, role, full_name, attendance_status)
values ('admin', '-194869393', 'Admin', 'Hotel Admin', 'On Duty')
on conflict (username) do nothing;

-- Seed employee user (password: emp123)
insert into users (username, password_hash, role, full_name, attendance_status)
values ('employee1', '1085075574', 'Employee', 'Juan dela Cruz', 'Off Duty')
on conflict (username) do nothing;

-- Seed room types
insert into room_types (name, base_price, max_persons, additional_person_price, description) values
  ('Standard Single', 1200, 1, 300, 'Cozy single room with basic amenities'),
  ('Standard Double', 1800, 2, 400, 'Comfortable double room for couples'),
  ('Deluxe Room', 2500, 2, 500, 'Spacious room with premium amenities'),
  ('Family Suite', 3500, 4, 400, 'Large suite ideal for families')
on conflict (name) do nothing;

-- Seed rooms
insert into rooms (room_number, room_type_id, availability_status)
select '101', id, 'Available' from room_types where name = 'Standard Single' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '102', id, 'Available' from room_types where name = 'Standard Single' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '201', id, 'Available' from room_types where name = 'Standard Double' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '202', id, 'Available' from room_types where name = 'Standard Double' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '301', id, 'Available' from room_types where name = 'Deluxe Room' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '302', id, 'Available' from room_types where name = 'Deluxe Room' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '401', id, 'Available' from room_types where name = 'Family Suite' on conflict (room_number) do nothing;
insert into rooms (room_number, room_type_id, availability_status)
select '402', id, 'Available' from room_types where name = 'Family Suite' on conflict (room_number) do nothing;

-- Seed additional items
insert into additional_items (item_name, default_price, is_active, quantity) values
  ('Extra Bed', 500, true, 10),
  ('Extra Pillow', 100, true, 20),
  ('Extra Towel', 80, true, 30),
  ('Laundry Service', 150, true, 100),
  ('Breakfast', 250, true, 50)
on conflict (item_name) do nothing;

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (using anon key for all ops)
-- ============================================================
alter table users disable row level security;
alter table room_types disable row level security;
alter table rooms disable row level security;
alter table guests disable row level security;
alter table additional_items disable row level security;
alter table reservations disable row level security;
alter table bookings disable row level security;
alter table booking_additional_items disable row level security;
alter table payments disable row level security;
alter table deposits disable row level security;
alter table revenue disable row level security;
alter table guest_record_history disable row level security;
