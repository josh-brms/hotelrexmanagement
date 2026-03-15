import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────
export type UserRole = 'Admin' | 'Employee';
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
export type AttendanceStatus = 'On Duty' | 'Off Duty' | 'Absent' | 'Day Off';
export type ReservationStatus = 'Pending' | 'Confirmed' | 'Checked In' | 'Cancelled';
export type DiscountType = 'None' | 'Senior' | 'PWD';

export interface User {
  id: string; username: string; passwordHash: string; role: UserRole; fullName: string;
  isActive: boolean; createdAt: string; lastLogin?: string; attendanceStatus: AttendanceStatus;
  arrivalTime?: string; offTime?: string;
}
export interface RoomType { id: string; name: string; basePrice: number; maxPersons: number; additionalPersonPrice: number; description: string; }
export interface Room { id: string; roomNumber: string; roomTypeId: string; availabilityStatus: RoomStatus; }
export interface Guest { id: string; name: string; isRegular: boolean; checkInCount: number; totalRevenueGenerated: number; avgStayDuration: number; lastCheckoutDate?: string; mostBookedRoomType?: string; preferencesNotes?: string; }
export interface AdditionalItem { id: string; itemName: string; defaultPrice: number; isActive: boolean; quantity: number; }
export interface BookingAdditionalItem { id: string; bookingId: string; itemId: string; itemName: string; quantity: number; unitPriceAtSale: number; totalItemCost: number; }
export interface Booking { id: string; reservationId?: string; guestId: string; guestName: string; roomId: string; roomNumber: string; roomTypeName: string; numPersons: number; checkInTime: string; numDays: number; expectedCheckOut: string; discountType: DiscountType; discountAmount: number; totalAmount: number; amountPaid: number; balanceDue: number; isPaid: boolean; changeGiven: number; changeReturnedConfirmed: boolean; processedByUserId: string; checkoutTime?: string; status: 'Active' | 'Checked Out'; additionalItems: BookingAdditionalItem[]; extraBedAddedCost: number; }
export interface Reservation { id: string; guestId: string; guestName: string; roomTypeId: string; roomTypeName: string; roomNumber?: string; checkInDateExpected: string; numDays: number; numPersons: number; amountDeposited: number; remainingBalance: number; totalEstimatedCost: number; reservationStatus: ReservationStatus; processedByUserId: string; createdAt: string; }
export interface Payment { id: string; bookingId: string; guestName: string; paymentDate: string; amountReceived: number; paymentMethod: string; isDepositPayment: boolean; recordedByUserId: string; recordedByName: string; }
export interface Deposit { id: string; depositDate: string; amountDeposited: number; sourceDescription: string; recordedByUserId: string; recordedByName: string; }
export interface GuestRecord { id: string; guestId: string; guestName: string; bookingId: string; checkInDateActual: string; checkOutDateActual: string; totalStayCost: number; roomTypeName: string; numDays: number; }
export interface Revenue { totalRevenue: number; allTimeRevenue: number; lastUpdate: string; }

// ─── Auth-only store (persisted) ─────────────────────────────
interface AuthStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export const useHotelStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    { name: 'rex-hotel-auth' }
  )
);
