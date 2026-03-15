'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { insertReservation, updateReservationRecord, deleteReservationRecord, insertGuest } from '@/lib/db';
import { formatPeso, calculateTotal } from '@/lib/utils';
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import type { Reservation } from '@/store/hotelStore';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniCalendar({ reservations }: { reservations: Reservation[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const reservedDays = new Set<number>();
  reservations.forEach(r => {
    if (r.reservationStatus === 'Pending' || r.reservationStatus === 'Confirmed') {
      const d = new Date(r.checkInDateExpected);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        for (let i = 0; i < r.numDays; i++) reservedDays.add(d.getDate() + i);
      }
    }
  });
  return (
    <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button className="btn btn-secondary btn-xs" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}>‹</button>
        <span style={{ fontWeight: '700', fontSize: '14px' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button className="btn btn-secondary btn-xs" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ fontSize: '10px', fontWeight: '700', color: '#6c757d', padding: '4px 0' }}>{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const isReserved = reservedDays.has(day);
          return <div key={day} style={{ padding: '4px 2px', borderRadius: '4px', fontSize: '12px', background: isReserved ? '#0056B3' : isToday ? '#e8f0fe' : 'transparent', color: isReserved ? 'white' : isToday ? '#0056B3' : '#212529', fontWeight: isToday || isReserved ? '700' : '400' }}>{day}</div>;
        })}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#0056B3', borderRadius: '2px' }} />Reserved</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#e8f0fe', borderRadius: '2px' }} />Today</div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const { currentUser } = useHotelStore();
  const { reservations, roomTypes, guests, loading, error, refresh } = useHotelData(['reservations', 'roomTypes', 'guests']);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ guestName: '', roomTypeId: '', checkInDateExpected: new Date().toISOString().slice(0, 10), numDays: '1', numPersons: '1', amountDeposited: '0' });
  const [guestSuggestions, setGuestSuggestions] = useState<typeof guests>([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [saving, setSaving] = useState(false);

  const rt = roomTypes.find(t => t.id === form.roomTypeId);
  const numPersons = parseInt(form.numPersons) || 1;
  const numDays = parseInt(form.numDays) || 1;
  const { total } = rt ? calculateTotal(rt.basePrice, numDays, numPersons, rt.maxPersons, rt.additionalPersonPrice, 0, 0) : { total: 0 };
  const deposit = parseFloat(form.amountDeposited) || 0;
  const remaining = Math.max(0, total - deposit);

  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, guestName: val }));
    setSelectedGuestId('');
    setGuestSuggestions(val.length >= 2 ? guests.filter(g => g.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5) : []);
  };

  const saveReservation = async () => {
    if (!form.guestName || !form.roomTypeId || !form.checkInDateExpected) return;
    setSaving(true);
    let guestId = selectedGuestId;
    if (!guestId) {
      const ex = guests.find(g => g.name.toLowerCase() === form.guestName.toLowerCase());
      if (ex) guestId = ex.id;
      else { const ng = await insertGuest(form.guestName); guestId = ng?.id || ''; }
    }
    const roomTypeName = roomTypes.find(t => t.id === form.roomTypeId)?.name || '';
    await insertReservation({ guestId, guestName: form.guestName, roomTypeId: form.roomTypeId, roomTypeName, checkInDateExpected: form.checkInDateExpected, numDays, numPersons, amountDeposited: deposit, remainingBalance: remaining, totalEstimatedCost: total, reservationStatus: 'Pending', processedByUserId: currentUser!.id });
    await refresh(); setSaving(false); setShowModal(false);
  };

  const statusBadge = (s: string) => ({ Pending: 'badge-yellow', Confirmed: 'badge-blue', 'Checked In': 'badge-green', Cancelled: 'badge-grey' }[s] || 'badge-grey');

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading reservations...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ guestName: '', roomTypeId: roomTypes[0]?.id || '', checkInDateExpected: new Date().toISOString().slice(0, 10), numDays: '1', numPersons: '1', amountDeposited: '0' }); setSelectedGuestId(''); setShowModal(true); }}><Plus size={14} /> New Reservation</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card"><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Calendar size={16} color="#0056B3" /><h2 style={{ fontSize: '15px', fontWeight: '700' }}>Calendar View</h2></div><MiniCalendar reservations={reservations} /></div>
        <div className="card"><h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Summary</h2>
          {[['Pending', 'badge-yellow'], ['Confirmed', 'badge-blue'], ['Checked In', 'badge-green'], ['Cancelled', 'badge-grey']].map(([s, cls]) => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}><span className={`badge ${cls}`}>{s}</span><strong>{reservations.filter(r => r.reservationStatus === s).length}</strong></div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>All Reservations</h2>
        {reservations.length === 0 ? <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No reservations yet</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>Guest</th><th>Room Type</th><th>Check-in Date</th><th>Days</th><th>Persons</th><th>Total Est.</th><th>Deposit</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{reservations.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.guestName}</td><td>{r.roomTypeName}</td>
                  <td>{new Date(r.checkInDateExpected).toLocaleDateString('en-PH')}</td>
                  <td>{r.numDays}</td><td>{r.numPersons}</td>
                  <td>{formatPeso(r.totalEstimatedCost)}</td>
                  <td style={{ color: '#28A745', fontWeight: '600' }}>{formatPeso(r.amountDeposited)}</td>
                  <td style={{ color: r.remainingBalance > 0 ? '#DC3545' : '#28A745', fontWeight: '600' }}>{formatPeso(r.remainingBalance)}</td>
                  <td><span className={`badge ${statusBadge(r.reservationStatus)}`}>{r.reservationStatus}</span></td>
                  <td><div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-xs" onClick={async () => { await updateReservationRecord(r.id, { reservationStatus: 'Confirmed' }); refresh(); }} disabled={r.reservationStatus !== 'Pending'}>Confirm</button>
                    <button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Cancel reservation?')) { await deleteReservationRecord(r.id); refresh(); } }}><Trash2 size={11} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>New Reservation</h2></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1', position: 'relative' }}>
                <label className="form-label">Guest Name</label>
                <input className="form-input" value={form.guestName} onChange={e => handleNameChange(e.target.value)} placeholder="Type to search or enter new guest" />
                {guestSuggestions.length > 0 && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #0056B3', borderRadius: '8px', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{guestSuggestions.map(g => <div key={g.id} onClick={() => { setForm(f => ({ ...f, guestName: g.name })); setSelectedGuestId(g.id); setGuestSuggestions([]); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '600' }}>{g.name}</span>{g.isRegular && <span className="badge badge-gold">⭐ Regular</span>}</div>)}</div>}
              </div>
              <div><label className="form-label">Room Type</label><select className="form-input" value={form.roomTypeId} onChange={e => setForm(f => ({ ...f, roomTypeId: e.target.value }))}>{roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} — {formatPeso(rt.basePrice)}/night (Max {rt.maxPersons})</option>)}</select></div>
              <div><label className="form-label">Check-in Date</label><input className="form-input" type="date" value={form.checkInDateExpected} onChange={e => setForm(f => ({ ...f, checkInDateExpected: e.target.value }))} /></div>
              <div><label className="form-label">No. of Days</label><input className="form-input" type="number" min="1" value={form.numDays} onChange={e => setForm(f => ({ ...f, numDays: e.target.value }))} /></div>
              <div><label className="form-label">No. of Persons</label><input className="form-input" type="number" min="1" value={form.numPersons} onChange={e => setForm(f => ({ ...f, numPersons: e.target.value }))} />{rt && numPersons > rt.maxPersons && <div style={{ fontSize: '12px', color: '#DC3545', marginTop: '4px' }}>⚠ Exceeds max ({rt.maxPersons}). Extra charge applies.</div>}</div>
              <div><label className="form-label">Deposit/Reservation Fee (₱)</label><input className="form-input" type="number" min="0" value={form.amountDeposited} onChange={e => setForm(f => ({ ...f, amountDeposited: e.target.value }))} /></div>
            </div>
            {rt && <div style={{ background: '#e8f0fe', borderRadius: '8px', padding: '12px', marginTop: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Estimated Total:</span><strong>{formatPeso(total)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Deposit Paid:</span><strong style={{ color: '#28A745' }}>{formatPeso(deposit)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}><span>Remaining Balance:</span><strong style={{ color: remaining > 0 ? '#DC3545' : '#28A745' }}>{formatPeso(remaining)}</strong></div>
            </div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveReservation} disabled={saving}>{saving ? 'Saving...' : 'Save Reservation'}</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
