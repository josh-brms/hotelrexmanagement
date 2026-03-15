'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { deletePaymentRecord } from '@/lib/db';
import { formatPeso, formatDateTime } from '@/lib/utils';
import { Trash2, FileText, Search, Loader2 } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/pdfGenerator';

export default function PaymentsPage() {
  const { currentUser } = useHotelStore();
  const { payments, bookings, loading, error, refresh } = useHotelData(['payments', 'bookings']);
  const isAdmin = currentUser?.role === 'Admin';
  const [search, setSearch] = useState('');
  const [generatingId, setGeneratingId] = useState('');

  const filtered = payments.filter(p => p.guestName.toLowerCase().includes(search.toLowerCase()) || p.bookingId.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((acc, p) => acc + p.amountReceived, 0);

  const handleReceipt = async (p: typeof payments[0]) => {
    setGeneratingId(p.id);
    const booking = bookings.find(b => b.id === p.bookingId);
    await generateReceiptPDF({ id: p.id, guestName: p.guestName, bookingId: p.bookingId, paymentDate: p.paymentDate, amountReceived: p.amountReceived, paymentMethod: p.paymentMethod, roomNumber: booking?.roomNumber, numDays: booking?.numDays, totalAmount: booking?.totalAmount, balanceDue: booking?.balanceDue });
    setGeneratingId('');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading payments...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Payments</h1><div style={{ background: '#d4edda', borderRadius: '8px', padding: '8px 14px', fontWeight: '700', color: '#155724' }}>Total: {formatPeso(total)}</div></div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} /><input className="form-input" style={{ paddingLeft: '38px' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>Date/Time</th><th>Guest</th><th>Booking ID</th><th>Amount</th><th>Method</th><th>Recorded By</th><th>Actions</th></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>No payments found</td></tr> : filtered.map(p => (
              <tr key={p.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDateTime(p.paymentDate)}</td>
                <td style={{ fontWeight: '600' }}>{p.guestName}</td>
                <td><span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f0f4f8', padding: '2px 6px', borderRadius: '4px' }}>{p.bookingId.toUpperCase().slice(0, 8)}</span></td>
                <td style={{ fontWeight: '700', color: '#28A745' }}>{formatPeso(p.amountReceived)}</td>
                <td>{p.paymentMethod}</td>
                <td style={{ fontSize: '12px', color: '#6c757d' }}>{p.recordedByName}</td>
                <td><div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary btn-xs" onClick={() => handleReceipt(p)} disabled={generatingId === p.id}><FileText size={12} /> {generatingId === p.id ? '...' : 'Receipt'}</button>
                  {isAdmin && <button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Delete payment?')) { await deletePaymentRecord(p.id); refresh(); } }}><Trash2 size={12} /></button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
