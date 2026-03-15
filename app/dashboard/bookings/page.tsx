'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { updateBookingRecord, checkoutBookingRecord, addExtraItemToBookingRecord, insertPayment } from '@/lib/db';
import { formatPeso, formatDateTime } from '@/lib/utils';
import { LogOut, Plus, Minus, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import type { Booking } from '@/store/hotelStore';

export default function BookingsPage() {
  const { currentUser } = useHotelStore();
  const { bookings, additionalItems, loading, error, refresh } = useHotelData(['bookings', 'additionalItems']);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [extraItems, setExtraItems] = useState<{ id: string; qty: number }[]>([]);
  const [changeConfirmed, setChangeConfirmed] = useState(false);
  const [filter, setFilter] = useState<'Active' | 'Checked Out' | 'All'>('Active');
  const [saving, setSaving] = useState(false);

  const displayed = bookings.filter(b => filter === 'All' ? true : b.status === filter);

  const openPayModal = (b: Booking) => { setSelectedBooking(b); setPayAmount(''); setPayMethod('Cash'); setShowPayModal(true); };

  const handlePay = async () => {
    if (!selectedBooking) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await insertPayment({ bookingId: selectedBooking.id, guestName: selectedBooking.guestName, paymentDate: new Date().toISOString(), amountReceived: amt, paymentMethod: payMethod, isDepositPayment: false, recordedByUserId: currentUser!.id, recordedByName: currentUser!.fullName });
    await refresh(); setSaving(false); setShowPayModal(false);
  };

  const addExtraItem = (itemId: string) => setExtraItems(prev => { const ex = prev.find(i => i.id === itemId); return ex ? prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i) : [...prev, { id: itemId, qty: 1 }]; });
  const removeExtraItem = (itemId: string) => setExtraItems(prev => { const ex = prev.find(i => i.id === itemId); if (!ex) return prev; return ex.qty <= 1 ? prev.filter(i => i.id !== itemId) : prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i); });

  const saveExtras = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    for (const si of extraItems) {
      const item = additionalItems.find(i => i.id === si.id);
      if (item) await addExtraItemToBookingRecord(selectedBooking.id, { itemId: si.id, itemName: item.itemName, quantity: si.qty, unitPriceAtSale: item.defaultPrice, totalItemCost: item.defaultPrice * si.qty });
    }
    await refresh(); setSaving(false); setShowExtraModal(false);
  };

  const openCheckout = (b: Booking) => {
    const fresh = bookings.find(bk => bk.id === b.id) || b;
    setSelectedBooking(fresh); setChangeConfirmed(false); setShowCheckoutModal(true);
  };

  const doCheckout = async () => {
    if (!selectedBooking) return;
    const b = bookings.find(bk => bk.id === selectedBooking.id) || selectedBooking;
    if (b.balanceDue > 0) return;
    if (b.changeGiven > 0 && !changeConfirmed) return;
    setSaving(true);
    if (b.changeGiven > 0) await updateBookingRecord(b.id, { changeReturnedConfirmed: true });
    await checkoutBookingRecord(b.id);
    await refresh(); setSaving(false); setShowCheckoutModal(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading bookings...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bookings</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['Active', 'Checked Out', 'All'] as const).map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No bookings found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayed.map(b => {
            const borderColor = b.status === 'Active'
              ? (b.balanceDue > 0 ? '#DC3545' : (b.changeGiven > 0 && !b.changeReturnedConfirmed ? '#FFC107' : '#28A745'))
              : '#6c757d';
            return (
              <div key={b.id} className="card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '16px' }}>{b.guestName}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>Room {b.roomNumber} • {b.roomTypeName} • {b.numPersons} person(s)</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Check-in: {formatDateTime(b.checkInTime)} • {b.numDays} day(s)</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Expected checkout: {formatDateTime(b.expectedCheckOut)}</div>
                    {b.discountType !== 'None' && <span className="badge badge-blue" style={{ marginTop: '4px' }}>{b.discountType} 20%</span>}
                    {b.status === 'Checked Out' && b.checkoutTime && <div style={{ fontSize: '12px', color: '#28A745', marginTop: '4px' }}>Checked out: {formatDateTime(b.checkoutTime)}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#f8f9fa', padding: '10px 14px', borderRadius: '8px', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '13px' }}><span>Total:</span><strong>{formatPeso(b.totalAmount)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '13px' }}><span>Paid:</span><strong style={{ color: '#28A745' }}>{formatPeso(b.amountPaid)}</strong></div>
                      {b.balanceDue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '13px' }}><span>Balance:</span><strong style={{ color: '#DC3545' }}>{formatPeso(b.balanceDue)}</strong></div>}
                      {b.changeGiven > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '13px' }}><span>Change:</span><strong style={{ color: '#856404' }}>{formatPeso(b.changeGiven)}</strong></div>}
                    </div>
                  </div>
                </div>
                {b.additionalItems.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px' }}>
                    <strong>Additional items:</strong> {b.additionalItems.map(ai => `${ai.itemName} x${ai.quantity} (${formatPeso(ai.totalItemCost)})`).join(', ')}
                  </div>
                )}
                {b.status === 'Active' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {b.balanceDue > 0 && <button className="btn btn-primary btn-sm" onClick={() => openPayModal(b)}><CreditCard size={14} /> Pay Balance</button>}
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedBooking(b); setExtraItems([]); setShowExtraModal(true); }}><Plus size={14} /> Add Extra</button>
                    <button
                      className="btn btn-sm"
                      style={{ background: b.balanceDue > 0 ? '#dee2e6' : '#DC3545', color: b.balanceDue > 0 ? '#6c757d' : 'white', cursor: b.balanceDue > 0 ? 'not-allowed' : 'pointer' }}
                      onClick={() => b.balanceDue <= 0 && openCheckout(b)}
                      disabled={b.balanceDue > 0}
                    ><LogOut size={14} /> Checkout</button>
                    {b.balanceDue > 0 && <div className="alert alert-error" style={{ padding: '6px 10px', fontSize: '12px' }}><AlertTriangle size={12} /> Settle balance before checkout</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedBooking && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '380px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>Record Payment</h2><p style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>Guest: {selectedBooking.guestName}</p></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Total:</span><strong>{formatPeso(selectedBooking.totalAmount)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Paid:</span><strong>{formatPeso(selectedBooking.amountPaid)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#DC3545' }}><span>Balance Due:</span><strong>{formatPeso(selectedBooking.balanceDue)}</strong></div>
            </div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Amount to Pay (₱)</label><input className="form-input" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Payment Method</label><select className="form-input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>{['Cash', 'Credit Card', 'Debit Card', 'GCash', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}</select></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handlePay} disabled={saving}>{saving ? 'Processing...' : 'Record Payment'}</button></div>
          </div>
        </div></div>
      )}

      {/* Extra Items Modal */}
      {showExtraModal && selectedBooking && (
        <div className="modal-overlay"><div className="modal-content">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>Add Extra Items</h2><p style={{ fontSize: '13px', color: '#6c757d' }}>{selectedBooking.guestName} — Room {selectedBooking.roomNumber}</p></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {additionalItems.filter(i => i.isActive).map(item => { const si = extraItems.find(e => e.id === item.id); return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: si ? '#e8f0fe' : '#f8f9fa', borderRadius: '8px', border: `1px solid ${si ? '#0056B3' : '#dee2e6'}` }}>
                  <div><div style={{ fontWeight: '600', fontSize: '13px' }}>{item.itemName}</div><div style={{ fontSize: '12px', color: '#6c757d' }}>{formatPeso(item.defaultPrice)}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => removeExtraItem(item.id)} style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}><Minus size={12} /></button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '700' }}>{si?.qty || 0}</span>
                    <button className="btn btn-primary btn-xs" onClick={() => addExtraItem(item.id)} style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}><Plus size={12} /></button>
                  </div>
                </div>
              ); })}
            </div>
            {extraItems.length > 0 && <div style={{ background: '#e8f0fe', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontWeight: '700', fontSize: '13px' }}>Added cost: {formatPeso(extraItems.reduce((acc, si) => { const item = additionalItems.find(i => i.id === si.id); return acc + (item ? item.defaultPrice * si.qty : 0); }, 0))}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowExtraModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveExtras} disabled={extraItems.length === 0 || saving}>{saving ? 'Saving...' : 'Add to Bill'}</button></div>
          </div>
        </div></div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && selectedBooking && (() => {
        const b = bookings.find(bk => bk.id === selectedBooking.id) || selectedBooking;
        return (
          <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>Confirm Checkout</h2><p style={{ fontSize: '13px', color: '#6c757d' }}>{b.guestName} — Room {b.roomNumber}</p></div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Total Charged:</span><strong>{formatPeso(b.totalAmount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Total Paid:</span><strong style={{ color: '#28A745' }}>{formatPeso(b.amountPaid)}</strong></div>
                {b.balanceDue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC3545', fontWeight: '700' }}><span>Balance:</span><strong>{formatPeso(b.balanceDue)}</strong></div>}
                {b.changeGiven > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#856404', fontWeight: '700' }}><span>Change to return:</span><strong>{formatPeso(b.changeGiven)}</strong></div>}
              </div>
              {b.balanceDue > 0 && <div className="alert alert-error" style={{ marginBottom: '14px' }}><AlertTriangle size={14} /> Cannot checkout — balance of {formatPeso(b.balanceDue)} must be settled first.</div>}
              {b.changeGiven > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '14px', padding: '12px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                  <input type="checkbox" checked={changeConfirmed} onChange={e => setChangeConfirmed(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#856404' }}>I confirm change of {formatPeso(b.changeGiven)} has been returned to the guest</span>
                </label>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={doCheckout} disabled={b.balanceDue > 0 || (b.changeGiven > 0 && !changeConfirmed) || saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><LogOut size={14} /> Confirm Checkout</>}
                </button>
              </div>
            </div>
          </div></div>
        );
      })()}
    </div>
  );
}
