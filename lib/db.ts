// ============================================================
// Rex Hotel - Supabase Data Service
// All database operations go through this file
// ============================================================
import { supabase } from './supabase';

// ─── TYPE HELPERS ────────────────────────────────────────────
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(10);
}

// ─── AUTH ────────────────────────────────────────────────────
export async function dbLogin(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', simpleHash(password))
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.id);
  return mapUser(data);
}

export async function dbSignup(username: string, password: string, fullName: string, role: string) {
  const { error } = await supabase.from('users').insert({
    username, password_hash: simpleHash(password), role, full_name: fullName,
    is_active: true, attendance_status: 'Off Duty',
  });
  return !error;
}

// ─── MAPPERS (snake_case → camelCase) ────────────────────────
export function mapUser(d: Record<string, unknown>) {
  return {
    id: d.id as string, username: d.username as string, passwordHash: d.password_hash as string,
    role: d.role as string, fullName: d.full_name as string, isActive: d.is_active as boolean,
    createdAt: d.created_at as string, lastLogin: d.last_login as string | undefined,
    attendanceStatus: d.attendance_status as string,
    arrivalTime: d.arrival_time as string | undefined, offTime: d.off_time as string | undefined,
  };
}
export function mapRoomType(d: Record<string, unknown>) {
  return {
    id: d.id as string, name: d.name as string, basePrice: Number(d.base_price),
    maxPersons: d.max_persons as number, additionalPersonPrice: Number(d.additional_person_price),
    description: d.description as string,
  };
}
export function mapRoom(d: Record<string, unknown>) {
  return {
    id: d.id as string, roomNumber: d.room_number as string, roomTypeId: d.room_type_id as string,
    availabilityStatus: d.availability_status as string,
  };
}
export function mapGuest(d: Record<string, unknown>) {
  return {
    id: d.id as string, name: d.name as string, isRegular: d.is_regular as boolean,
    checkInCount: d.check_in_count as number, totalRevenueGenerated: Number(d.total_revenue_generated),
    avgStayDuration: Number(d.avg_stay_duration), lastCheckoutDate: d.last_checkout_date as string | undefined,
    mostBookedRoomType: d.most_booked_room_type as string | undefined, preferencesNotes: d.preferences_notes as string | undefined,
  };
}
export function mapAdditionalItem(d: Record<string, unknown>) {
  return {
    id: d.id as string, itemName: d.item_name as string, defaultPrice: Number(d.default_price),
    isActive: d.is_active as boolean, quantity: d.quantity as number,
  };
}
export function mapBookingItem(d: Record<string, unknown>) {
  return {
    id: d.id as string, bookingId: d.booking_id as string, itemId: d.item_id as string,
    itemName: d.item_name as string, quantity: d.quantity as number,
    unitPriceAtSale: Number(d.unit_price_at_sale), totalItemCost: Number(d.total_item_cost),
  };
}
export function mapBooking(d: Record<string, unknown>, items: ReturnType<typeof mapBookingItem>[] = []) {
  return {
    id: d.id as string, reservationId: d.reservation_id as string | undefined,
    guestId: d.guest_id as string, guestName: d.guest_name as string,
    roomId: d.room_id as string, roomNumber: d.room_number as string,
    roomTypeName: d.room_type_name as string, numPersons: d.num_persons as number,
    checkInTime: d.check_in_time as string, numDays: d.num_days as number,
    expectedCheckOut: d.expected_check_out as string, discountType: d.discount_type as string,
    discountAmount: Number(d.discount_amount), totalAmount: Number(d.total_amount),
    amountPaid: Number(d.amount_paid), balanceDue: Number(d.balance_due),
    isPaid: d.is_paid as boolean, changeGiven: Number(d.change_given),
    changeReturnedConfirmed: d.change_returned_confirmed as boolean,
    processedByUserId: d.processed_by_user_id as string,
    checkoutTime: d.checkout_time as string | undefined, status: d.status as string,
    extraBedAddedCost: Number(d.extra_bed_added_cost), additionalItems: items,
  };
}
export function mapReservation(d: Record<string, unknown>) {
  return {
    id: d.id as string, guestId: d.guest_id as string, guestName: d.guest_name as string,
    roomTypeId: d.room_type_id as string, roomTypeName: d.room_type_name as string,
    roomNumber: d.room_number as string | undefined,
    checkInDateExpected: d.check_in_date_expected as string, numDays: d.num_days as number,
    numPersons: d.num_persons as number, amountDeposited: Number(d.amount_deposited),
    remainingBalance: Number(d.remaining_balance), totalEstimatedCost: Number(d.total_estimated_cost),
    reservationStatus: d.reservation_status as string,
    processedByUserId: d.processed_by_user_id as string, createdAt: d.created_at as string,
  };
}
export function mapPayment(d: Record<string, unknown>) {
  return {
    id: d.id as string, bookingId: d.booking_id as string, guestName: d.guest_name as string,
    paymentDate: d.payment_date as string, amountReceived: Number(d.amount_received),
    paymentMethod: d.payment_method as string, isDepositPayment: d.is_deposit_payment as boolean,
    recordedByUserId: d.recorded_by_user_id as string, recordedByName: d.recorded_by_name as string,
  };
}
export function mapDeposit(d: Record<string, unknown>) {
  return {
    id: d.id as string, depositDate: d.deposit_date as string,
    amountDeposited: Number(d.amount_deposited), sourceDescription: d.source_description as string,
    recordedByUserId: d.recorded_by_user_id as string, recordedByName: d.recorded_by_name as string,
  };
}
export function mapGuestRecord(d: Record<string, unknown>) {
  return {
    id: d.id as string, guestId: d.guest_id as string, guestName: d.guest_name as string,
    bookingId: d.booking_id as string, checkInDateActual: d.check_in_date_actual as string,
    checkOutDateActual: d.check_out_date_actual as string, totalStayCost: Number(d.total_stay_cost),
    roomTypeName: d.room_type_name as string, numDays: d.num_days as number,
  };
}

// ─── FETCH ALL ────────────────────────────────────────────────
export async function fetchUsers() {
  const { data } = await supabase.from('users').select('*').eq('is_active', true).order('created_at');
  return (data || []).map(mapUser);
}
export async function fetchRoomTypes() {
  const { data } = await supabase.from('room_types').select('*').order('name');
  return (data || []).map(mapRoomType);
}
export async function fetchRooms() {
  const { data } = await supabase.from('rooms').select('*').order('room_number');
  return (data || []).map(mapRoom);
}
export async function fetchGuests() {
  const { data } = await supabase.from('guests').select('*').order('name');
  return (data || []).map(mapGuest);
}
export async function fetchAdditionalItems() {
  const { data } = await supabase.from('additional_items').select('*').order('item_name');
  return (data || []).map(mapAdditionalItem);
}
export async function fetchBookings() {
  const { data: bookings } = await supabase.from('bookings').select('*').order('check_in_time', { ascending: false });
  const { data: items } = await supabase.from('booking_additional_items').select('*');
  const itemsByBooking: Record<string, ReturnType<typeof mapBookingItem>[]> = {};
  (items || []).forEach(i => {
    const mapped = mapBookingItem(i);
    if (!itemsByBooking[mapped.bookingId]) itemsByBooking[mapped.bookingId] = [];
    itemsByBooking[mapped.bookingId].push(mapped);
  });
  return (bookings || []).map(b => mapBooking(b, itemsByBooking[b.id] || []));
}
export async function fetchReservations() {
  const { data } = await supabase.from('reservations').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapReservation);
}
export async function fetchPayments() {
  const { data } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
  return (data || []).map(mapPayment);
}
export async function fetchDeposits() {
  const { data } = await supabase.from('deposits').select('*').order('deposit_date', { ascending: false });
  return (data || []).map(mapDeposit);
}
export async function fetchRevenue() {
  const { data } = await supabase.from('revenue').select('*').eq('id', 1).single();
  return data ? { totalRevenue: Number(data.total_revenue), allTimeRevenue: Number(data.all_time_revenue), lastUpdate: data.last_update as string } : { totalRevenue: 0, allTimeRevenue: 0, lastUpdate: new Date().toISOString() };
}
export async function fetchGuestRecords() {
  const { data } = await supabase.from('guest_record_history').select('*').order('check_in_date_actual', { ascending: false });
  return (data || []).map(mapGuestRecord);
}

// ─── MUTATIONS ────────────────────────────────────────────────

// Users
export async function updateUserAttendance(id: string, status: string, arrivalTime?: string, offTime?: string) {
  const update: Record<string, unknown> = { attendance_status: status };
  if (arrivalTime) update.arrival_time = arrivalTime;
  if (offTime) update.off_time = offTime;
  await supabase.from('users').update(update).eq('id', id);
}
export async function updateUserRecord(id: string, fields: Record<string, unknown>) {
  await supabase.from('users').update(fields).eq('id', id);
}
export async function deactivateUserRecord(id: string) {
  await supabase.from('users').update({ is_active: false }).eq('id', id);
}

// Room Types
export async function insertRoomType(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('room_types').insert({ name: data.name, base_price: data.basePrice, max_persons: data.maxPersons, additional_person_price: data.additionalPersonPrice, description: data.description }).select().single();
  return d ? mapRoomType(d) : null;
}
export async function updateRoomTypeRecord(id: string, data: Record<string, unknown>) {
  await supabase.from('room_types').update({ name: data.name, base_price: data.basePrice, max_persons: data.maxPersons, additional_person_price: data.additionalPersonPrice, description: data.description }).eq('id', id);
}
export async function deleteRoomTypeRecord(id: string) {
  await supabase.from('room_types').delete().eq('id', id);
}

// Rooms
export async function insertRoom(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('rooms').insert({ room_number: data.roomNumber, room_type_id: data.roomTypeId, availability_status: data.availabilityStatus }).select().single();
  return d ? mapRoom(d) : null;
}
export async function updateRoomRecord(id: string, data: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  if (data.roomNumber !== undefined) update.room_number = data.roomNumber;
  if (data.roomTypeId !== undefined) update.room_type_id = data.roomTypeId;
  if (data.availabilityStatus !== undefined) update.availability_status = data.availabilityStatus;
  await supabase.from('rooms').update(update).eq('id', id);
}
export async function deleteRoomRecord(id: string) {
  await supabase.from('rooms').delete().eq('id', id);
}

// Guests
export async function insertGuest(name: string) {
  const { data: d } = await supabase.from('guests').insert({ name, is_regular: false, check_in_count: 0, total_revenue_generated: 0, avg_stay_duration: 0 }).select().single();
  return d ? mapGuest(d) : null;
}
export async function updateGuestRecord(id: string, data: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  if (data.isRegular !== undefined) update.is_regular = data.isRegular;
  if (data.checkInCount !== undefined) update.check_in_count = data.checkInCount;
  if (data.totalRevenueGenerated !== undefined) update.total_revenue_generated = data.totalRevenueGenerated;
  if (data.avgStayDuration !== undefined) update.avg_stay_duration = data.avgStayDuration;
  if (data.lastCheckoutDate !== undefined) update.last_checkout_date = data.lastCheckoutDate;
  if (data.mostBookedRoomType !== undefined) update.most_booked_room_type = data.mostBookedRoomType;
  if (data.preferencesNotes !== undefined) update.preferences_notes = data.preferencesNotes;
  await supabase.from('guests').update(update).eq('id', id);
}

// Additional Items
export async function insertAdditionalItem(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('additional_items').insert({ item_name: data.itemName, default_price: data.defaultPrice, is_active: data.isActive, quantity: data.quantity }).select().single();
  return d ? mapAdditionalItem(d) : null;
}
export async function updateAdditionalItemRecord(id: string, data: Record<string, unknown>) {
  await supabase.from('additional_items').update({ item_name: data.itemName, default_price: data.defaultPrice, is_active: data.isActive, quantity: data.quantity }).eq('id', id);
}
export async function deleteAdditionalItemRecord(id: string) {
  await supabase.from('additional_items').delete().eq('id', id);
}

// Bookings
export async function insertBooking(b: Record<string, unknown>, items: Record<string, unknown>[]) {
  const { data: d } = await supabase.from('bookings').insert({
    reservation_id: b.reservationId || null,
    guest_id: b.guestId, guest_name: b.guestName, room_id: b.roomId,
    room_number: b.roomNumber, room_type_name: b.roomTypeName, num_persons: b.numPersons,
    check_in_time: b.checkInTime, num_days: b.numDays, expected_check_out: b.expectedCheckOut,
    discount_type: b.discountType, discount_amount: b.discountAmount, total_amount: b.totalAmount,
    amount_paid: b.amountPaid, balance_due: b.balanceDue, is_paid: b.isPaid,
    change_given: b.changeGiven, change_returned_confirmed: b.changeReturnedConfirmed,
    processed_by_user_id: b.processedByUserId, status: b.status, extra_bed_added_cost: b.extraBedAddedCost,
  }).select().single();
  if (!d) return null;
  if (items.length > 0) {
    await supabase.from('booking_additional_items').insert(
      items.map(i => ({ booking_id: d.id, item_id: i.itemId, item_name: i.itemName, quantity: i.quantity, unit_price_at_sale: i.unitPriceAtSale, total_item_cost: i.totalItemCost }))
    );
  }
  // Update room status
  await supabase.from('rooms').update({ availability_status: 'Occupied' }).eq('id', b.roomId);
  // Update guest check-in count
  const { data: guest } = await supabase.from('guests').select('check_in_count').eq('id', b.guestId).single();
  if (guest) {
    const newCount = (guest.check_in_count || 0) + 1;
    await supabase.from('guests').update({ check_in_count: newCount, is_regular: newCount > 3 }).eq('id', b.guestId);
  }
  // Add to revenue
  if (Number(b.amountPaid) > 0) {
    await supabase.rpc('increment_revenue', { amount: Number(b.amountPaid) });
  }
  const allItems = items.map((i, idx) => ({ ...i, id: `temp-${idx}`, bookingId: d.id }));
  return mapBooking(d, allItems.map(mapBookingItem));
}
export async function updateBookingRecord(id: string, data: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  if (data.amountPaid !== undefined) update.amount_paid = data.amountPaid;
  if (data.balanceDue !== undefined) update.balance_due = data.balanceDue;
  if (data.isPaid !== undefined) update.is_paid = data.isPaid;
  if (data.changeGiven !== undefined) update.change_given = data.changeGiven;
  if (data.changeReturnedConfirmed !== undefined) update.change_returned_confirmed = data.changeReturnedConfirmed;
  if (data.status !== undefined) update.status = data.status;
  if (data.checkoutTime !== undefined) update.checkout_time = data.checkoutTime;
  if (data.totalAmount !== undefined) update.total_amount = data.totalAmount;
  await supabase.from('bookings').update(update).eq('id', id);
}
export async function checkoutBookingRecord(id: string) {
  const now = new Date().toISOString();
  const { data: b } = await supabase.from('bookings').select('*').eq('id', id).single();
  if (!b) return;
  await supabase.from('bookings').update({ status: 'Checked Out', checkout_time: now }).eq('id', id);
  await supabase.from('rooms').update({ availability_status: 'Available' }).eq('id', b.room_id);
  await supabase.from('guest_record_history').insert({
    guest_id: b.guest_id, guest_name: b.guest_name, booking_id: id,
    check_in_date_actual: b.check_in_time, check_out_date_actual: now,
    total_stay_cost: b.total_amount, room_type_name: b.room_type_name, num_days: b.num_days,
  });
  // Update guest stats
  const { data: guest } = await supabase.from('guests').select('*').eq('id', b.guest_id).single();
  if (guest) {
    const newTotal = Number(guest.total_revenue_generated) + Number(b.amount_paid);
    const { data: records } = await supabase.from('guest_record_history').select('num_days').eq('guest_id', b.guest_id);
    const allDays = (records || []).map(r => r.num_days);
    allDays.push(b.num_days);
    const avg = allDays.reduce((a, c) => a + c, 0) / allDays.length;
    await supabase.from('guests').update({ total_revenue_generated: newTotal, avg_stay_duration: avg, last_checkout_date: now }).eq('id', b.guest_id);
  }
}
export async function addExtraItemToBookingRecord(bookingId: string, item: Record<string, unknown>) {
  await supabase.from('booking_additional_items').insert({
    booking_id: bookingId, item_id: item.itemId, item_name: item.itemName,
    quantity: item.quantity, unit_price_at_sale: item.unitPriceAtSale, total_item_cost: item.totalItemCost,
  });
  const { data: b } = await supabase.from('bookings').select('total_amount, amount_paid').eq('id', bookingId).single();
  if (b) {
    const newTotal = Number(b.total_amount) + Number(item.totalItemCost);
    const newBalance = newTotal - Number(b.amount_paid);
    await supabase.from('bookings').update({ total_amount: newTotal, balance_due: Math.max(0, newBalance), is_paid: newBalance <= 0 }).eq('id', bookingId);
  }
}

// Reservations
export async function insertReservation(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('reservations').insert({
    guest_id: data.guestId, guest_name: data.guestName, room_type_id: data.roomTypeId,
    room_type_name: data.roomTypeName, room_number: data.roomNumber || null,
    check_in_date_expected: data.checkInDateExpected, num_days: data.numDays,
    num_persons: data.numPersons, amount_deposited: data.amountDeposited,
    remaining_balance: data.remainingBalance, total_estimated_cost: data.totalEstimatedCost,
    reservation_status: data.reservationStatus, processed_by_user_id: data.processedByUserId,
  }).select().single();
  return d ? mapReservation(d) : null;
}
export async function updateReservationRecord(id: string, data: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  if (data.reservationStatus !== undefined) update.reservation_status = data.reservationStatus;
  if (data.amountDeposited !== undefined) update.amount_deposited = data.amountDeposited;
  if (data.remainingBalance !== undefined) update.remaining_balance = data.remainingBalance;
  await supabase.from('reservations').update(update).eq('id', id);
}
export async function deleteReservationRecord(id: string) {
  await supabase.from('reservations').delete().eq('id', id);
}

// Payments
export async function insertPayment(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('payments').insert({
    booking_id: data.bookingId, guest_name: data.guestName, payment_date: data.paymentDate,
    amount_received: data.amountReceived, payment_method: data.paymentMethod,
    is_deposit_payment: data.isDepositPayment, recorded_by_user_id: data.recordedByUserId,
    recorded_by_name: data.recordedByName,
  }).select().single();
  // Update booking amounts
  const { data: b } = await supabase.from('bookings').select('total_amount, amount_paid').eq('id', data.bookingId).single();
  if (b) {
    const newPaid = Number(b.amount_paid) + Number(data.amountReceived);
    const newBalance = Number(b.total_amount) - newPaid;
    await supabase.from('bookings').update({
      amount_paid: newPaid, balance_due: Math.max(0, newBalance),
      is_paid: newBalance <= 0, change_given: newBalance < 0 ? Math.abs(newBalance) : 0,
    }).eq('id', data.bookingId);
  }
  // Update revenue
  await supabase.rpc('increment_revenue', { amount: Number(data.amountReceived) });
  return d ? mapPayment(d) : null;
}
export async function deletePaymentRecord(id: string) {
  await supabase.from('payments').delete().eq('id', id);
}

// Deposits
export async function insertDeposit(data: Record<string, unknown>) {
  const { data: d } = await supabase.from('deposits').insert({
    deposit_date: data.depositDate, amount_deposited: data.amountDeposited,
    source_description: data.sourceDescription, recorded_by_user_id: data.recordedByUserId,
    recorded_by_name: data.recordedByName,
  }).select().single();
  // Reduce undeposited revenue
  await supabase.rpc('reduce_revenue', { amount: Number(data.amountDeposited) });
  return d ? mapDeposit(d) : null;
}
export async function updateDepositRecord(id: string, data: Record<string, unknown>) {
  await supabase.from('deposits').update({ amount_deposited: data.amountDeposited, source_description: data.sourceDescription }).eq('id', id);
}
export async function deleteDepositRecord(id: string) {
  await supabase.from('deposits').delete().eq('id', id);
}

// System Reset
export async function resetSystemData(scope: string[]) {
  const doAll = scope.includes('all');
  if (doAll || scope.includes('bookings')) {
    await supabase.from('booking_additional_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('guest_record_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rooms').update({ availability_status: 'Available' }).neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (doAll || scope.includes('payments')) {
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (doAll || scope.includes('deposits')) {
    await supabase.from('deposits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (doAll || scope.includes('reservations')) {
    await supabase.from('reservations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!doAll) await supabase.from('rooms').update({ availability_status: 'Available' }).eq('availability_status', 'Reserved');
  }
  if (doAll || scope.includes('guests')) {
    await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (doAll || scope.includes('revenue')) {
    await supabase.from('revenue').update({ total_revenue: 0, all_time_revenue: 0 }).eq('id', 1);
  }
}
