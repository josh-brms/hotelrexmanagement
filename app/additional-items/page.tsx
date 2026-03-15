'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHotelStore } from '@/store/hotelStore';

export default function RedirectPage() {
  const router = useRouter();
  const currentUser = useHotelStore(s => s.currentUser);
  useEffect(() => {
    if (!currentUser) router.replace('/login');
    else router.replace('/dashboard/additional-items');
  }, [currentUser, router]);
  return null;
}
