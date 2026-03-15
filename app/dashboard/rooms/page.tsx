'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { insertRoom, updateRoomRecord, deleteRoomRecord, insertRoomType, updateRoomTypeRecord, deleteRoomTypeRecord } from '@/lib/db';
import { formatPeso } from '@/lib/utils';
import { Plus, Edit2, Trash2, BedDouble, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Room, RoomType } from '@/store/hotelStore';

const statusColors: Record<string, { bg: string; color: string }> = {
  Available: { bg: '#d4edda', color: '#155724' }, Occupied: { bg: '#f8d7da', color: '#721c24' },
  Reserved: { bg: '#fff3cd', color: '#856404' }, Maintenance: { bg: '#e2e3e5', color: '#383d41' },
};

export default function RoomsPage() {
  const { currentUser } = useHotelStore();
  const { rooms, roomTypes, loading, error, refresh } = useHotelData(['rooms', 'roomTypes']);
  const isAdmin = currentUser?.role === 'Admin';
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [editType, setEditType] = useState<RoomType | null>(null);
  const [showTypes, setShowTypes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNumber: '', roomTypeId: '', availabilityStatus: 'Available' });
  const [typeForm, setTypeForm] = useState({ name: '', basePrice: '', maxPersons: '', additionalPersonPrice: '', description: '' });

  const saveRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.roomTypeId) return;
    setSaving(true);
    if (editRoom) await updateRoomRecord(editRoom.id, { roomNumber: roomForm.roomNumber, roomTypeId: roomForm.roomTypeId, availabilityStatus: roomForm.availabilityStatus });
    else await insertRoom({ roomNumber: roomForm.roomNumber, roomTypeId: roomForm.roomTypeId, availabilityStatus: roomForm.availabilityStatus });
    await refresh(); setSaving(false); setShowRoomModal(false);
  };
  const saveType = async () => {
    if (!typeForm.name || !typeForm.basePrice) return;
    setSaving(true);
    const data = { name: typeForm.name, basePrice: parseFloat(typeForm.basePrice), maxPersons: parseInt(typeForm.maxPersons) || 1, additionalPersonPrice: parseFloat(typeForm.additionalPersonPrice) || 0, description: typeForm.description };
    if (editType) await updateRoomTypeRecord(editType.id, data);
    else await insertRoomType(data);
    await refresh(); setSaving(false); setShowTypeModal(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading rooms...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rooms</h1>
        {isAdmin && <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTypes(!showTypes)}>Room Types {showTypes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditRoom(null); setRoomForm({ roomNumber: '', roomTypeId: roomTypes[0]?.id || '', availabilityStatus: 'Available' }); setShowRoomModal(true); }}><Plus size={14} /> Add Room</button>
        </div>}
      </div>
      {isAdmin && showTypes && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Room Types</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditType(null); setTypeForm({ name: '', basePrice: '', maxPersons: '', additionalPersonPrice: '', description: '' }); setShowTypeModal(true); }}><Plus size={14} /> Add Type</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>Name</th><th>Base Price</th><th>Max Persons</th><th>Addl. Person Price</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>{roomTypes.map(rt => (<tr key={rt.id}><td style={{ fontWeight: '600' }}>{rt.name}</td><td>{formatPeso(rt.basePrice)}/night</td><td>{rt.maxPersons}</td><td>{formatPeso(rt.additionalPersonPrice)}/person/night</td><td>{rt.description}</td><td><div style={{ display: 'flex', gap: '6px' }}><button className="btn btn-secondary btn-xs" onClick={() => { setEditType(rt); setTypeForm({ name: rt.name, basePrice: String(rt.basePrice), maxPersons: String(rt.maxPersons), additionalPersonPrice: String(rt.additionalPersonPrice), description: rt.description }); setShowTypeModal(true); }}><Edit2 size={12} /></button><button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Delete?')) { await deleteRoomTypeRecord(rt.id); refresh(); } }}><Trash2 size={12} /></button></div></td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
        {rooms.map(room => {
          const rt = roomTypes.find(t => t.id === room.roomTypeId);
          const sc = statusColors[room.availabilityStatus] || statusColors.Available;
          return (
            <div key={room.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BedDouble size={18} color="#0056B3" /><span style={{ fontWeight: '800', fontSize: '18px' }}>Room {room.roomNumber}</span></div>
                {isAdmin && <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-xs" onClick={() => { setEditRoom(room); setRoomForm({ roomNumber: room.roomNumber, roomTypeId: room.roomTypeId, availabilityStatus: room.availabilityStatus }); setShowRoomModal(true); }}><Edit2 size={11} /></button>
                  <button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Delete room?')) { await deleteRoomRecord(room.id); refresh(); } }}><Trash2 size={11} /></button>
                </div>}
              </div>
              <span className="badge" style={{ background: sc.bg, color: sc.color, marginBottom: '10px' }}>{room.availabilityStatus}</span>
              {rt && <div style={{ marginTop: '8px' }}><div style={{ fontSize: '13px', fontWeight: '600' }}>{rt.name}</div>{isAdmin && <><div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>{formatPeso(rt.basePrice)}/night</div><div style={{ fontSize: '12px', color: '#6c757d' }}>Max {rt.maxPersons} persons</div></>}</div>}
            </div>
          );
        })}
      </div>
      {showRoomModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '400px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editRoom ? 'Edit Room' : 'Add Room'}</h2></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Room Number</label><input className="form-input" value={roomForm.roomNumber} onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))} /></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Room Type</label><select className="form-input" value={roomForm.roomTypeId} onChange={e => setRoomForm(f => ({ ...f, roomTypeId: e.target.value }))}>{roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}</select></div>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Status</label><select className="form-input" value={roomForm.availabilityStatus} onChange={e => setRoomForm(f => ({ ...f, availabilityStatus: e.target.value }))}>{['Available', 'Occupied', 'Reserved', 'Maintenance'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveRoom} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div></div>
      )}
      {showTypeModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editType ? 'Edit Room Type' : 'Add Room Type'}</h2></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}><label className="form-label">Type Name</label><input className="form-input" value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="form-label">Base Price (₱/night)</label><input className="form-input" type="number" value={typeForm.basePrice} onChange={e => setTypeForm(f => ({ ...f, basePrice: e.target.value }))} /></div>
              <div><label className="form-label">Max Persons</label><input className="form-input" type="number" value={typeForm.maxPersons} onChange={e => setTypeForm(f => ({ ...f, maxPersons: e.target.value }))} /></div>
              <div><label className="form-label">Addl. Person Price (₱/person/night)</label><input className="form-input" type="number" value={typeForm.additionalPersonPrice} onChange={e => setTypeForm(f => ({ ...f, additionalPersonPrice: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><textarea className="form-input" rows={2} value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}><button className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveType} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
