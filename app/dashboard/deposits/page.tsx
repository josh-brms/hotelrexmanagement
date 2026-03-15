'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { insertDeposit, updateDepositRecord, deleteDepositRecord } from '@/lib/db';
import { formatPeso, formatDateTime } from '@/lib/utils';
import { Plus, Trash2, Edit2, PiggyBank, AlertTriangle, Loader2 } from 'lucide-react';
import type { Deposit } from '@/store/hotelStore';

export default function DepositsPage() {
  const { currentUser } = useHotelStore();
  const { deposits, revenue, loading, error, refresh } = useHotelData(['deposits', 'revenue']);
  const isAdmin = currentUser?.role === 'Admin';
  const [showModal, setShowModal] = useState(false);
  const [editDep, setEditDep] = useState<Deposit | null>(null);
  const [form, setForm] = useState({ amountDeposited: '', sourceDescription: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.amountDeposited || !form.sourceDescription) return;
    if (!editDep && !confirmed) return;
    setSaving(true);
    if (editDep) await updateDepositRecord(editDep.id, { amountDeposited: parseFloat(form.amountDeposited), sourceDescription: form.sourceDescription });
    else await insertDeposit({ amountDeposited: parseFloat(form.amountDeposited), sourceDescription: form.sourceDescription, depositDate: new Date().toISOString(), recordedByUserId: currentUser!.id, recordedByName: currentUser!.fullName });
    await refresh(); setSaving(false); setShowModal(false);
  };

  const totalDeposited = deposits.reduce((acc, d) => acc + d.amountDeposited, 0);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading deposits...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Deposits</h1>{isAdmin && <button className="btn btn-primary" onClick={() => { setEditDep(null); setForm({ amountDeposited: '', sourceDescription: '' }); setConfirmed(false); setShowModal(true); }}><Plus size={14} /> Record Deposit</button>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card"><div style={{ color: '#0056B3', marginBottom: '8px' }}><PiggyBank size={24} /></div><div style={{ fontSize: '26px', fontWeight: '800', color: '#0056B3' }}>{formatPeso(revenue.totalRevenue)}</div><div style={{ fontSize: '13px', color: '#6c757d' }}>Undeposited Revenue</div><div style={{ fontSize: '11px', color: '#DC3545', marginTop: '4px' }}>⚠ Resets upon deposit</div></div>
        <div className="kpi-card" style={{ borderLeftColor: '#28A745' }}><div style={{ color: '#28A745', marginBottom: '8px' }}><PiggyBank size={24} /></div><div style={{ fontSize: '26px', fontWeight: '800', color: '#28A745' }}>{formatPeso(revenue.allTimeRevenue)}</div><div style={{ fontSize: '13px', color: '#6c757d' }}>All-Time Revenue</div></div>
        <div className="kpi-card" style={{ borderLeftColor: '#6f42c1' }}><div style={{ fontSize: '26px', fontWeight: '800', color: '#6f42c1' }}>{formatPeso(totalDeposited)}</div><div style={{ fontSize: '13px', color: '#6c757d' }}>Total Deposited (All Time)</div></div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Deposit Records</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>Date/Time</th><th>Amount</th><th>Source</th><th>Recorded By</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{deposits.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>No deposits recorded</td></tr> : deposits.map(d => (
              <tr key={d.id}><td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(d.depositDate)}</td><td style={{ fontWeight: '700', color: '#28A745' }}>{formatPeso(d.amountDeposited)}</td><td>{d.sourceDescription}</td><td style={{ fontSize: '12px', color: '#6c757d' }}>{d.recordedByName}</td>
                {isAdmin && <td><div style={{ display: 'flex', gap: '6px' }}><button className="btn btn-secondary btn-xs" onClick={() => { setEditDep(d); setForm({ amountDeposited: String(d.amountDeposited), sourceDescription: d.sourceDescription }); setConfirmed(false); setShowModal(true); }}><Edit2 size={12} /></button><button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Delete deposit?')) { await deleteDepositRecord(d.id); refresh(); } }}><Trash2 size={12} /></button></div></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '420px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editDep ? 'Edit Deposit' : 'Record New Deposit'}</h2></div>
          <div style={{ padding: '20px 24px' }}>
            {!editDep && revenue.totalRevenue > 0 && <div className="alert alert-warning" style={{ marginBottom: '14px' }}><AlertTriangle size={14} /> Recording this deposit will reduce undeposited revenue ({formatPeso(revenue.totalRevenue)}) by the deposited amount.</div>}
            <div style={{ marginBottom: '14px' }}><label className="form-label">Amount (₱)</label><input className="form-input" type="number" value={form.amountDeposited} onChange={e => setForm(f => ({ ...f, amountDeposited: e.target.value }))} /></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Source Description</label><input className="form-input" value={form.sourceDescription} onChange={e => setForm(f => ({ ...f, sourceDescription: e.target.value }))} /></div>
            {!editDep && <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '14px', padding: '10px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: '18px', height: '18px' }} /><span style={{ fontSize: '13px', fontWeight: '600', color: '#856404' }}>I confirm this deposit and understand revenue will be reduced</span></label>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={(!editDep && !confirmed) || saving}>{saving ? 'Saving...' : 'Save Deposit'}</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
