'use client';
import { useHotelData } from '@/lib/useHotelData';
import { formatPeso, formatDateTime } from '@/lib/utils';
import { BedDouble, Users, DollarSign, Calendar, TrendingUp, Star, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';

export default function DashboardPage() {
  const { rooms, bookings, reservations, revenue, guestRecords, payments, loading, error } = useHotelData();

  const availableRooms = rooms.filter(r => r.availabilityStatus === 'Available').length;
  const occupiedRooms = rooms.filter(r => r.availabilityStatus === 'Occupied').length;
  const reservedRooms = rooms.filter(r => r.availabilityStatus === 'Reserved').length;
  const activeGuests = bookings.filter(b => b.status === 'Active').length;
  const upcomingReservations = reservations.filter(r => r.reservationStatus === 'Pending' || r.reservationStatus === 'Confirmed').length;

  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const dayStr = format(d, 'EEE');
    const start = startOfDay(d);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const total = payments.filter(p => { const pd = new Date(p.paymentDate); return pd >= start && pd < end; }).reduce((acc, p) => acc + p.amountReceived, 0);
    return { day: dayStr, revenue: total };
  });

  const recentBookings = [...bookings].slice(0, 5);

  const kpis = [
    { label: 'Available Rooms', value: availableRooms, total: rooms.length, icon: BedDouble, color: '#0056B3', bg: '#e8f0fe' },
    { label: 'Active Guests', value: activeGuests, icon: Users, color: '#28A745', bg: '#d4edda' },
    { label: 'Undeposited Revenue', value: formatPeso(revenue.totalRevenue), icon: DollarSign, color: '#FFC107', bg: '#fff3cd' },
    { label: 'Upcoming Reservations', value: upcomingReservations, icon: Calendar, color: '#3498DB', bg: '#cce5ff' },
    { label: 'All-Time Revenue', value: formatPeso(revenue.allTimeRevenue), icon: TrendingUp, color: '#6f42c1', bg: '#f0e8ff' },
    { label: 'Total Stays Recorded', value: guestRecords.length, icon: Star, color: '#fd7e14', bg: '#fde8d0' },
  ];

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: '13px', color: '#6c757d' }}>{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map(({ label, value, icon: Icon, color, bg, total }) => (
          <div key={label} className="kpi-card" style={{ borderLeftColor: color }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color} /></div>
              {total !== undefined && <span style={{ fontSize: '12px', color: '#6c757d' }}>/ {total}</span>}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Room Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[{ label: 'Available', count: availableRooms, color: '#28A745' }, { label: 'Occupied', count: occupiedRooms, color: '#DC3545' }, { label: 'Reserved', count: reservedRooms, color: '#FFC107' }, { label: 'Maintenance', count: rooms.filter(r => r.availabilityStatus === 'Maintenance').length, color: '#6c757d' }].map(({ label, count, color }) => (
              <div key={label} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '14px', textAlign: 'center', borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color }}>{count}</div>
                <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>7-Day Revenue</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7Days}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} /><Tooltip formatter={(v: number) => formatPeso(v)} /><Bar dataKey="revenue" fill="#0056B3" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Recent Bookings</h2>
        {recentBookings.length === 0 ? <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No bookings yet</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>Guest</th><th>Room</th><th>Check In</th><th>Days</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>{recentBookings.map(b => (<tr key={b.id}><td style={{ fontWeight: '600' }}>{b.guestName}</td><td>Room {b.roomNumber}</td><td>{formatDateTime(b.checkInTime)}</td><td>{b.numDays}</td><td>{formatPeso(b.totalAmount)}</td><td><span className={`badge ${b.status === 'Active' ? 'badge-green' : 'badge-grey'}`}>{b.status}</span></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
