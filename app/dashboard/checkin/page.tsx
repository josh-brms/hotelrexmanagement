'use client';
import { useState, useEffect, useCallback } from 'react';
import { useHotelStore, DiscountType } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { insertBooking, insertPayment, updateReservationRecord, insertGuest } from '@/lib/db';
import { formatPeso, calculateTotal } from '@/lib/utils';
import { Plus, Minus, UserCheck, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckInPage() {
  const router = useRouter();
  const { currentUser } = useHotelStore();
  const { rooms, roomTypes, guests, additionalItems, reservations, loading, refresh } = useHotelData(['rooms', 'roomTypes', 'guests', 'additionalItems', 'reservations']);
  const [guestName, setGuestName] = useState('');
  const [suggestions, setSuggestions] = useState<typeof guests>([]);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [numPersons, setNumPersons] = useState(1);
  const [numDays, setNumDays] = useState(1);
  const [discount, setDiscount] = useState<DiscountType>('None');
  const [checkInTime, setCheckInTime] = useState(new Date().toISOString());
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedItems, setSelectedItems] = useState<{ id: string; qty: number }[]>([]);
  const [fromReservationId, setFromReservationId] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setInterval(() => setCheckInTime(new Date().toISOString()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (guestName.length < 2) { setSuggestions([]); return; }
    setSuggestions(guests.filter(g => g.name.toLowerCase().includes(guestName.toLowerCase())).slice(0, 5));
  }, [guestName, guests]);

  const pendingReservations = reservations.filter(r => r.reservationStatus === 'Pending' || r.reservationStatus === 'Confirmed');
  const loadReservation = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;
    setFromReservationId(resId); setGuestName(res.guestName); setSelectedGuestId(res.guestId);
    const room = rooms.find(r => r.roomNumber === res.roomNumber);
    if (room) setSelectedRoomId(room.id);
    setNumPersons(res.numPersons); setNumDays(res.numDays); setAmountPaid(String(res.amountDeposited));
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedRoomType = roomTypes.find(t => t.id === selectedRoom?.roomTypeId);
  const discountPercent = discount !== 'None' ? 20 : 0;
  const itemsCost = selectedItems.reduce((acc, si) => { const item = additionalItems.find(i => i.id === si.id); return acc + (item ? item.defaultPrice * si.qty : 0); }, 0);
  const { subtotal, discountAmount, total, extraPersonCost } = selectedRoomType ? calculateTotal(selectedRoomType.basePrice, numDays, numPersons, selectedRoomType.maxPersons, selectedRoomType.additionalPersonPrice, itemsCost, discountPercent) : { subtotal: 0, discountAmount: 0, total: 0, extraPersonCost: 0 };
  void subtotal;
  const paid = parseFloat(amountPaid) || 0;
  const change = paid > total ? paid - total : 0;
  const balance = paid < total ? total - paid : 0;

  const addItem = (itemId: string) => setSelectedItems(prev => { const ex = prev.find(i => i.id === itemId); return ex ? prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i) : [...prev, { id: itemId, qty: 1 }]; });
  const removeItem = (itemId: string) => setSelectedItems(prev => { const ex = prev.find(i => i.id === itemId); if (!ex) return prev; return ex.qty <= 1 ? prev.filter(i => i.id !== itemId) : prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i); });

  const handleSubmit = useCallback(async () => {
    setError(''); setSaving(true);
    if (!guestName.trim()) { setError('Guest name is required'); setSaving(false); return; }
    if (!selectedRoomId) { setError('Please select a room'); setSaving(false); return; }
    if (!selectedRoom || selectedRoom.availabilityStatus === 'Occupied') { setError('Room is not available'); setSaving(false); return; }
    try {
      let guestId = selectedGuestId;
      if (!guestId) {
        const ex = guests.find(g => g.name.toLowerCase() === guestName.toLowerCase());
        if (ex) { guestId = ex.id; }
        else { const ng = await insertGuest(guestName); guestId = ng?.id || ''; }
      }
      const bookingItems = selectedItems.map(si => { const item = additionalItems.find(i => i.id === si.id)!; return { itemId: si.id, itemName: item.itemName, quantity: si.qty, unitPriceAtSale: item.defaultPrice, totalItemCost: item.defaultPrice * si.qty }; });
      const expectedCheckOut = new Date(checkInTime); expectedCheckOut.setDate(expectedCheckOut.getDate() + numDays);
      const newBooking = await insertBooking({ reservationId: fromReservationId || undefined, guestId, guestName, roomId: selectedRoomId, roomNumber: selectedRoom.roomNumber, roomTypeName: selectedRoomType?.name || '', numPersons, checkInTime, numDays, expectedCheckOut: expectedCheckOut.toISOString(), discountType: discount, discountAmount, totalAmount: total, amountPaid: paid, balanceDue: balance, isPaid: balance <= 0, changeGiven: change, changeReturnedConfirmed: false, processedByUserId: currentUser!.id, status: 'Active', extraBedAddedCost: 0 }, bookingItems);
      if (paid > 0 && newBooking) await insertPayment({ bookingId: newBooking.id, guestName, paymentDate: new Date().toISOString(), amountReceived: paid, paymentMethod, isDepositPayment: false, recordedByUserId: currentUser!.id, recordedByName: currentUser!.fullName });
      if (fromReservationId) await updateReservationRecord(fromReservationId, { reservationStatus: 'Checked In' });
      setSuccess(`Check-in successful! Booking ID: ${newBooking?.id.toUpperCase()}`);
      setTimeout(() => router.push('/dashboard/bookings'), 2000);
    } catch (e) { setError('Failed to check in. Please try again.'); console.error(e); }
    setSaving(false);
  }, [guestName, selectedRoomId, selectedRoom, selectedGuestId, guests, selectedItems, additionalItems, checkInTime, fromReservationId, numPersons, numDays, discount, discountAmount, total, paid, balance, change, selectedRoomType, currentUser, paymentMethod, router]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check In</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e8f0fe', padding: '8px 14px', borderRadius: '8px' }}><Clock size={16} color="#0056B3" /><span style={{ fontSize: '13px', fontWeight: '600', color: '#0056B3' }}>{new Date(checkInTime).toLocaleString('en-PH')}</span></div>
      </div>
      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {pendingReservations.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #3498DB' }}>
          <div style={{ marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: '#0056B3' }}>Check-in from Reservation</div>
          <select className="form-input" value={fromReservationId} onChange={e => { setFromReservationId(e.target.value); if (e.target.value) loadReservation(e.target.value); }} style={{ maxWidth: '500px' }}>
            <option value="">-- Select a reservation --</option>
            {pendingReservations.map(r => <option key={r.id} value={r.id}>{r.guestName} — {r.roomTypeName} — {new Date(r.checkInDateExpected).toLocaleDateString()} (Deposit: {formatPeso(r.amountDeposited)})</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#0056B3', display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={16} /> Guest & Room Details</h2>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <label className="form-label">Guest Name *</label>
            <input className="form-input" value={guestName} onChange={e => { setGuestName(e.target.value); setSelectedGuestId(''); }} placeholder="Type to search regular guests..." />
            {suggestions.length > 0 && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #0056B3', borderRadius: '8px', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{suggestions.map(g => <div key={g.id} onClick={() => { setGuestName(g.name); setSelectedGuestId(g.id); setSuggestions([]); }} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}><span style={{ fontWeight: '600' }}>{g.name}</span>{g.isRegular && <span className="badge badge-gold">⭐ Regular</span>}</div>)}</div>}
          </div>
          <div style={{ marginBottom: '14px' }}><label className="form-label">Room *</label>
            <select className="form-input" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
              <option value="">-- Select Room --</option>
              {rooms.filter(r => r.availabilityStatus === 'Available' || r.availabilityStatus === 'Reserved').map(r => { const rt = roomTypes.find(t => t.id === r.roomTypeId); return <option key={r.id} value={r.id}>Room {r.roomNumber} — {rt?.name} ({r.availabilityStatus}) — {formatPeso(rt?.basePrice || 0)}/night</option>; })}
            </select>
          </div>
          {selectedRoomType && <div style={{ background: '#e8f0fe', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '13px' }}>Max persons: <strong>{selectedRoomType.maxPersons}</strong> &bull; Extra person: <strong>{formatPeso(selectedRoomType.additionalPersonPrice)}/night</strong></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label className="form-label">No. of Persons</label><input className="form-input" type="number" min={1} value={numPersons} onChange={e => setNumPersons(parseInt(e.target.value) || 1)} /></div>
            <div><label className="form-label">No. of Days</label><input className="form-input" type="number" min={1} value={numDays} onChange={e => setNumDays(parseInt(e.target.value) || 1)} /></div>
          </div>
          <div style={{ marginBottom: '14px' }}><label className="form-label">Discount</label>
            <select className="form-input" value={discount} onChange={e => setDiscount(e.target.value as DiscountType)}><option value="None">No Discount</option><option value="Senior">Senior Citizen (20%)</option><option value="PWD">PWD (20%)</option></select>
          </div>
          <div style={{ marginBottom: '14px' }}><label className="form-label">Check-In Time (Real-Time)</label><input className="form-input" value={new Date(checkInTime).toLocaleString('en-PH')} disabled style={{ background: '#f8f9fa' }} /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#0056B3' }}>Additional Items</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {additionalItems.filter(i => i.isActive).map(item => { const si = selectedItems.find(s => s.id === item.id); return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: si ? '#e8f0fe' : '#f8f9fa', borderRadius: '8px', border: `1px solid ${si ? '#0056B3' : '#dee2e6'}` }}>
                  <div><div style={{ fontSize: '13px', fontWeight: '600' }}>{item.itemName}</div><div style={{ fontSize: '12px', color: '#6c757d' }}>{formatPeso(item.defaultPrice)}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => removeItem(item.id)} style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}><Minus size={12} /></button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '700' }}>{si?.qty || 0}</span>
                    <button className="btn btn-primary btn-xs" onClick={() => addItem(item.id)} style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}><Plus size={12} /></button>
                  </div>
                </div>
              ); })}
            </div>
          </div>
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#0056B3' }}>Payment</h2>
            {selectedRoomType && (
              <div style={{ marginBottom: '14px', background: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span>Room ({numDays} nights)</span><span>{formatPeso(selectedRoomType.basePrice * numDays)}</span></div>
                {extraPersonCost > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span>Extra persons</span><span>{formatPeso(extraPersonCost)}</span></div>}
                {itemsCost > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}><span>Additional items</span><span>{formatPeso(itemsCost)}</span></div>}
                {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#28A745' }}><span>{discount} discount (20%)</span><span>-{formatPeso(discountAmount)}</span></div>}
                <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '15px' }}><span>Total Due</span><span style={{ color: '#0056B3' }}>{formatPeso(total)}</span></div>
              </div>
            )}
            <div style={{ marginBottom: '12px' }}><label className="form-label">Amount Paid (₱)</label><input className="form-input" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" /></div>
            <div style={{ marginBottom: '12px' }}><label className="form-label">Payment Method</label><select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>{['Cash', 'Credit Card', 'Debit Card', 'GCash', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}</select></div>
            {paid > 0 && (
              <div style={{ padding: '12px', borderRadius: '8px', background: change > 0 ? '#fff3cd' : balance > 0 ? '#f8d7da' : '#d4edda', marginBottom: '12px' }}>
                {change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#856404' }}><span>Change to Return:</span><span style={{ fontSize: '18px' }}>{formatPeso(change)}</span></div>}
                {balance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#721c24' }}><span>Balance Due:</span><span style={{ fontSize: '18px' }}>{formatPeso(balance)}</span></div>}
                {balance <= 0 && change <= 0 && <div style={{ fontWeight: '700', color: '#155724', textAlign: 'center' }}>✓ Fully Paid</div>}
              </div>
            )}
            {change > 0 && <div style={{ padding: '10px 12px', background: '#fff3cd', borderRadius: '8px', marginBottom: '12px', border: '1px solid #ffc107', fontSize: '13px', color: '#856404', fontWeight: '600' }}>⚠ Change of {formatPeso(change)} to be returned — confirm in Bookings before checkout</div>}
            <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }} onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : '✓ Complete Check-In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
