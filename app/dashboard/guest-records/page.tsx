'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { formatPeso, formatDateTime } from '@/lib/utils';
import { generateRecordsPDF } from '@/lib/pdfGenerator';
import { Star, FileText, Search, Loader2 } from 'lucide-react';

export default function GuestRecordsPage() {
  const { currentUser } = useHotelStore();
  const { guests, guestRecords, loading, error } = useHotelData(['guests', 'guestRecords']);
  const isAdmin = currentUser?.role === 'Admin';
  const [search, setSearch] = useState('');
  const [filterRegular, setFilterRegular] = useState(false);

  const filtered = guests.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) && (!filterRegular || g.isRegular));

  const handlePrint = async () => {
    const headers = ['Guest', 'Regular', 'Total Stays', 'Revenue', 'Avg Days', 'Last Checkout', 'Preferred Room'];
    const rows = filtered.map(g => [g.name, g.isRegular ? 'Yes ⭐' : 'No', String(g.checkInCount), formatPeso(g.totalRevenueGenerated), g.avgStayDuration ? g.avgStayDuration.toFixed(1) + ' days' : '—', g.lastCheckoutDate ? formatDateTime(g.lastCheckoutDate) : '—', g.mostBookedRoomType || '—']);
    await generateRecordsPDF('Guest Records', headers, rows);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading guest records...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Guest Records</h1>
        {isAdmin && <button className="btn btn-secondary" onClick={handlePrint}><FileText size={14} /> Export PDF</button>}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} /><input className="form-input" style={{ paddingLeft: '38px' }} placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}><input type="checkbox" checked={filterRegular} onChange={e => setFilterRegular(e.target.checked)} style={{ width: '16px', height: '16px' }} />Regular guests only</label>
        <span style={{ fontSize: '13px', color: '#6c757d' }}>{filtered.length} guests</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No guests found</div>
          : filtered.map(guest => {
            const stays = guestRecords.filter(r => r.guestId === guest.id).sort((a, b) => new Date(b.checkInDateActual).getTime() - new Date(a.checkInDateActual).getTime());
            return (
              <div key={guest.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', background: guest.isRegular ? '#fdf3d0' : '#e8f0fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '20px', fontWeight: '800', color: guest.isRegular ? '#856404' : '#0056B3' }}>{guest.name[0]}</span></div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px' }}>{guest.name}</span>
                        {guest.isRegular && <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} fill="currentColor" /> Regular Guest</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>{guest.checkInCount} stay(s) • Avg {guest.avgStayDuration ? guest.avgStayDuration.toFixed(1) : 0} days</div>
                      {guest.lastCheckoutDate && <div style={{ fontSize: '12px', color: '#6c757d' }}>Last checkout: {formatDateTime(guest.lastCheckoutDate)}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0056B3' }}>{formatPeso(guest.totalRevenueGenerated)}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>lifetime value</div>
                  </div>
                </div>
                {stays.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Stay History</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '12px' }}><thead><tr><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Days</th><th>Total Cost</th></tr></thead>
                        <tbody>{stays.slice(0, 5).map(s => (<tr key={s.id}><td>{s.roomTypeName}</td><td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(s.checkInDateActual)}</td><td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(s.checkOutDateActual)}</td><td>{s.numDays}</td><td style={{ fontWeight: '700' }}>{formatPeso(s.totalStayCost)}</td></tr>))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
