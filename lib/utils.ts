import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function calculateTotal(
  basePrice: number,
  numDays: number,
  numPersons: number,
  maxPersons: number,
  additionalPersonPrice: number,
  additionalItemsCost: number,
  discountPercent: number
): { subtotal: number; discountAmount: number; total: number; extraPersonCost: number } {
  const roomCost = basePrice * numDays;
  const extraPersons = Math.max(0, numPersons - maxPersons);
  const extraPersonCost = extraPersons * additionalPersonPrice * numDays;
  const subtotal = roomCost + extraPersonCost + additionalItemsCost;
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  return { subtotal, discountAmount, total, extraPersonCost };
}
