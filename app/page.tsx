'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHotelStore } from '@/store/hotelStore';

export default function HomePage() {
  const router = useRouter();
  const currentUser = useHotelStore(s => s.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0056B3' }}>
      <div className="text-white text-center">
        <div className="text-4xl font-bold mb-2">Rex Hotel</div>
        <div className="text-blue-200">Loading...</div>
      </div>
    </div>
  );
}
