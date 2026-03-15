'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { insertAdditionalItem, updateAdditionalItemRecord, deleteAdditionalItemRecord } from '@/lib/db';
import { formatPeso } from '@/lib/utils';
import { Plus, Edit2, Trash2, Package, Loader2 } from 'lucide-react';
import type { AdditionalItem } from '@/store/hotelStore';

export default function AdditionalItemsPage() {
  const { currentUser } = useHotelStore();
  const { additionalItems, loading, error, refresh } = useHotelData(['additionalItems']);
  const isAdmin = currentUser?.role === 'Admin';
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AdditionalItem | null>(null);
  const [form, setForm] = useState({ itemName: '', defaultPrice: '', isActive: true, quantity: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.itemName || !form.defaultPrice) return;
    setSaving(true);
    const data = { itemName: form.itemName, defaultPrice: parseFloat(form.defaultPrice), isActive: form.isActive, quantity: parseInt(form.quantity) || 0 };
    if (editItem) await updateAdditionalItemRecord(editItem.id, data);
    else await insertAdditionalItem(data);
    await refresh(); setSaving(false); setShowModal(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading items...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Additional Items</h1>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ itemName: '', defaultPrice: '', isActive: true, quantity: '' }); setShowModal(true); }}><Plus size={14} /> Add Item</button>}
      </div>
      {!isAdmin && <div className="alert alert-info" style={{ marginBottom: '16px' }}><Package size={14} /> View only — contact an admin to modify items</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {additionalItems.map(item => (
          <div key={item.id} className="card" style={{ padding: '16px', opacity: item.isActive ? 1 : 0.6, borderLeft: `3px solid ${item.isActive ? '#0056B3' : '#6c757d'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#e8f0fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#0056B3" /></div>
              {isAdmin && <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-secondary btn-xs" onClick={() => { setEditItem(item); setForm({ itemName: item.itemName, defaultPrice: String(item.defaultPrice), isActive: item.isActive, quantity: String(item.quantity) }); setShowModal(true); }}><Edit2 size={11} /></button>
                <button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Delete?')) { await deleteAdditionalItemRecord(item.id); refresh(); } }}><Trash2 size={11} /></button>
              </div>}
            </div>
            <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{item.itemName}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0056B3', marginBottom: '6px' }}>{formatPeso(item.defaultPrice)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d' }}>
              <span>Stock: {item.quantity}</span>
              <span className={`badge ${item.isActive ? 'badge-green' : 'badge-grey'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '400px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editItem ? 'Edit Item' : 'Add Item'}</h2></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Item Name</label><input className="form-input" value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} /></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Price (₱)</label><input className="form-input" type="number" value={form.defaultPrice} onChange={e => setForm(f => ({ ...f, defaultPrice: e.target.value }))} /></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Quantity in Stock</label><input className="form-input" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div style={{ marginBottom: '14px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: '18px', height: '18px' }} /><span style={{ fontSize: '14px', fontWeight: '600' }}>Active (available for booking)</span></label></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
