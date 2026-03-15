'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  fetchUsers, fetchRoomTypes, fetchRooms, fetchGuests,
  fetchAdditionalItems, fetchBookings, fetchReservations,
  fetchPayments, fetchDeposits, fetchRevenue, fetchGuestRecords,
} from '@/lib/db';
import type {
  User, RoomType, Room, Guest, AdditionalItem,
  Booking, Reservation, Payment, Deposit, Revenue, GuestRecord,
} from '@/store/hotelStore';

export interface HotelData {
  users: User[];
  roomTypes: RoomType[];
  rooms: Room[];
  guests: Guest[];
  additionalItems: AdditionalItem[];
  bookings: Booking[];
  reservations: Reservation[];
  payments: Payment[];
  deposits: Deposit[];
  revenue: Revenue;
  guestRecords: GuestRecord[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function useHotelData(sections?: string[]): HotelData {
  const all = !sections;
  const has = (s: string) => all || sections!.includes(s);

  const [users, setUsers] = useState<User[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [revenue, setRevenue] = useState<Revenue>({ totalRevenue: 0, allTimeRevenue: 0, lastUpdate: '' });
  const [guestRecords, setGuestRecords] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const promises = [];
      if (has('users')) promises.push(fetchUsers().then(d => setUsers(d as User[])));
      if (has('roomTypes')) promises.push(fetchRoomTypes().then(d => setRoomTypes(d as RoomType[])));
      if (has('rooms')) promises.push(fetchRooms().then(d => setRooms(d as Room[])));
      if (has('guests')) promises.push(fetchGuests().then(d => setGuests(d as Guest[])));
      if (has('additionalItems')) promises.push(fetchAdditionalItems().then(d => setAdditionalItems(d as AdditionalItem[])));
      if (has('bookings')) promises.push(fetchBookings().then(d => setBookings(d as Booking[])));
      if (has('reservations')) promises.push(fetchReservations().then(d => setReservations(d as Reservation[])));
      if (has('payments')) promises.push(fetchPayments().then(d => setPayments(d as Payment[])));
      if (has('deposits')) promises.push(fetchDeposits().then(d => setDeposits(d as Deposit[])));
      if (has('revenue')) promises.push(fetchRevenue().then(d => setRevenue(d as Revenue)));
      if (has('guestRecords')) promises.push(fetchGuestRecords().then(d => setGuestRecords(d as GuestRecord[])));
      await Promise.all(promises);
    } catch (e) {
      setError('Failed to load data. Check your connection.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { users, roomTypes, rooms, guests, additionalItems, bookings, reservations, payments, deposits, revenue, guestRecords, loading, error, refresh };
}
