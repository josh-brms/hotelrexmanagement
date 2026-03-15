'use client';
import { useState } from 'react';
import { useHotelData } from '@/lib/useHotelData';
import { formatPeso } from '@/lib/utils';
import { generateRecordsPDF } from '@/lib/pdfGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, TrendingUp, Users, BedDouble, DollarSign, Target, Loader2 } from 'lucide-react';
import { subDays, subMonths, startOfDay, format } from 'date-fns';

type ViewMode = 'daily' | 'weekly' | 'monthly';
const COLORS = ['#0056B3', '#3498DB', '#28A745', '#FFC107', '#DC3545', '#6f42c1'];

export default function AnalyticsPage() {
  const { bookings, payments, rooms, guests, guestRecords, loading, error } = useHotelData();
  const [view, setView] = useState<ViewMode>('monthly');

  const now = new Date();
  const totalRooms = rooms.length;

  const getLabels = () => {
    if (view === 'daily') return Array.from({ length: 14 }, (_, i) => format(subDays(now, 13 - i), 'MM/dd'));
    if (view === 'weekly') return Array.from({ length: 8 }, (_, i) => `W-${8 - i}`);
    return Array.from({ length: 6 }, (_, i) => format(subMonths(now, 5 - i), 'MMM yyyy'));
  };

  const getRange = (index: number): [Date, Date] => {
    if (view === 'daily') { const s = startOfDay(subDays(now, 13 - index)); const e = new Date(s); e.setDate(e.getDate() + 1); return [s, e]; }
    if (view === 'weekly') { const s = subDays(now, (7 - index) * 7 + 7); const e = subDays(now, (7 - index) * 7); return [s, e]; }
    const d = subMonths(now, 5 - index);
    return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 1)];
  };

  const labels = getLabels();
  const revenueData = labels.map((label, i) => {
    const [s, e] = getRange(i);
    return { name: label, revenue: payments.filter(p => { const pd = new Date(p.paymentDate); return pd >= s && pd < e; }).reduce((acc, p) => acc + p.amountReceived, 0) };
  });
  const occupancyData = labels.map((label, i) => {
    const [s, e] = getRange(i);
    const occ = bookings.filter(b => { const ci = new Date(b.checkInTime); const co = b.checkoutTime ? new Date(b.checkoutTime) : new Date(); return ci < e && co > s; }).length;
    return { name: label, rate: totalRooms > 0 ? Math.min(100, Math.round((occ / totalRooms) * 100)) : 0 };
  });

  const totalPaid = payments.reduce((acc, p) => acc + p.amountReceived, 0);
  const completed = bookings.filter(b => b.status === 'Checked Out');
  const totalNights = completed.reduce((acc, b) => acc + b.numDays, 0);
  const adr = totalNights > 0 ? totalPaid / totalNights : 0;
  const revpar = totalRooms > 0 ? totalPaid / totalRooms : 0;
  const alos = completed.length > 0 ? totalNights / completed.length : 0;
  const regularGuests = guests.filter(g => g.isRegular).length;

  const roomPopularity = bookings.reduce<Record<string, number>>((acc, b) => { acc[b.roomNumber] = (acc[b.roomNumber] || 0) + 1; return acc; }, {});
  const topRooms = Object.entries(roomPopularity).sort(([, a], [, b]) => b - a).slice(0, 5).map(([room, count]) => ({ room: `Room ${room}`, count }));
  const guestPieData = [{ name: 'Regular', value: regularGuests }, { name: 'New', value: guests.length - regularGuests }];

  const handlePrint = async () => {
    await generateRecordsPDF('Analytics Report', ['Metric', 'Value'], [
      ['Total Revenue', formatPeso(totalPaid)], ['ADR', formatPeso(adr)], ['RevPAR', formatPeso(revpar)],
      ['ALOS', `${alos.toFixed(1)} days`], ['Total Guests', String(guests.length)], ['Regular Guests', String(regularGuests)],
      ['Completed Stays', String(completed.length)], ['Total Stay Nights', String(totalNights)],
    ]);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading analytics...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(v => <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView(v)} style={{ textTransform: 'capitalize' }}>{v}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}><FileText size={14} /> PDF</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Revenue', value: formatPeso(totalPaid), icon: DollarSign, color: '#0056B3' },
          { label: 'ADR', value: formatPeso(adr), icon: TrendingUp, color: '#28A745' },
          { label: 'RevPAR', value: formatPeso(revpar), icon: Target, color: '#6f42c1' },
          { label: 'ALOS', value: `${alos.toFixed(1)} days`, icon: BedDouble, color: '#3498DB' },
          { label: 'Total Guests', value: String(guests.length), icon: Users, color: '#FD7E14' },
          { label: 'Occupancy Rate', value: `${totalRooms > 0 ? Math.round((bookings.filter(b => b.status === 'Active').length / totalRooms) * 100) : 0}%`, icon: Target, color: '#DC3545' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="kpi-card" style={{ borderLeftColor: color }}>
            <div style={{ width: '36px', height: '36px', background: `${color}18`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}><Icon size={18} color={color} /></div>
            <div style={{ fontSize: '20px', fontWeight: '800', color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card"><h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Revenue Over Time</h2><ResponsiveContainer width="100%" height={200}><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `₱${(v/1000).toFixed(0)}k` : `₱${v}`} /><Tooltip formatter={(v: number) => formatPeso(v)} /><Bar dataKey="revenue" fill="#0056B3" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="card"><h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Occupancy Rate (%)</h2><ResponsiveContainer width="100%" height={200}><LineChart data={occupancyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} /><Tooltip formatter={(v: number) => `${v}%`} /><Line type="monotone" dataKey="rate" stroke="#28A745" strokeWidth={2} dot={{ fill: '#28A745', r: 3 }} /></LineChart></ResponsiveContainer></div>
        <div className="card"><h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Guest Distribution</h2><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={guestPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{guestPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        <div className="card"><h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Most Booked Rooms</h2>
          {topRooms.length === 0 ? <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No data yet</p> :
          <ResponsiveContainer width="100%" height={200}><BarChart data={topRooms} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="room" tick={{ fontSize: 10 }} width={70} /><Tooltip /><Bar dataKey="count" fill="#3498DB" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer>}
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Guest Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {[{ label: 'Total Guests', value: guests.length, color: '#0056B3' }, { label: 'Regular Guests', value: regularGuests, color: '#856404' }, { label: 'New Guests', value: guests.length - regularGuests, color: '#28A745' }, { label: 'Completed Stays', value: completed.length, color: '#6f42c1' }, { label: 'Active Bookings', value: bookings.filter(b => b.status === 'Active').length, color: '#DC3545' }, { label: 'Total Stay Nights', value: totalNights, color: '#3498DB' }].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
