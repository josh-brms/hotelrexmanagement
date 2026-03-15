'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { useHotelData } from '@/lib/useHotelData';
import { updateUserAttendance, updateUserRecord, deactivateUserRecord, dbSignup } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { Plus, Edit2, Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import type { User, AttendanceStatus } from '@/store/hotelStore';

const statusClass: Record<string, string> = { 'On Duty': 'badge-green', 'Off Duty': 'badge-blue', 'Absent': 'badge-red', 'Day Off': 'badge-grey' };

export default function EmployeesPage() {
  const { currentUser, setCurrentUser } = useHotelStore();
  const { users, loading, error, refresh } = useHotelData(['users']);
  const isAdmin = currentUser?.role === 'Admin';
  const [showModal, setShowModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [attUser, setAttUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'Employee' });
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('On Duty');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    if (editUser) {
      await updateUserRecord(editUser.id, { full_name: form.fullName, role: form.role });
      if (currentUser?.id === editUser.id) setCurrentUser({ ...currentUser, fullName: form.fullName, role: form.role as 'Admin' | 'Employee' });
    } else {
      await dbSignup(form.username, form.password, form.fullName, form.role);
    }
    await refresh(); setSaving(false); setShowModal(false);
  };

  const handleClockIn = async () => {
    if (!currentUser) return;
    await updateUserAttendance(currentUser.id, 'On Duty', new Date().toISOString());
    setCurrentUser({ ...currentUser, attendanceStatus: 'On Duty', arrivalTime: new Date().toISOString() });
    await refresh();
  };
  const handleClockOut = async () => {
    if (!currentUser) return;
    await updateUserAttendance(currentUser.id, 'Off Duty', undefined, new Date().toISOString());
    setCurrentUser({ ...currentUser, attendanceStatus: 'Off Duty', offTime: new Date().toISOString() });
    await refresh();
  };

  const saveAtt = async () => {
    if (!attUser) return;
    setSaving(true);
    await updateUserAttendance(attUser.id, attStatus);
    if (currentUser?.id === attUser.id) setCurrentUser({ ...currentUser, attendanceStatus: attStatus });
    await refresh(); setSaving(false); setShowAttModal(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#0056B3' }}><Loader2 size={28} className="animate-spin" /> Loading employees...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditUser(null); setForm({ username: '', password: '', fullName: '', role: 'Employee' }); setShowModal(true); }}><Plus size={14} /> Add Employee</button>}
      </div>

      {!isAdmin && currentUser && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #0056B3' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>My Attendance</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span className={`badge ${statusClass[currentUser.attendanceStatus]}`} style={{ fontSize: '13px', padding: '6px 14px' }}>{currentUser.attendanceStatus}</span>
            {currentUser.arrivalTime && <span style={{ fontSize: '13px', color: '#6c757d' }}>Clock-in: {formatDateTime(currentUser.arrivalTime)}</span>}
            {currentUser.offTime && <span style={{ fontSize: '13px', color: '#6c757d' }}>Clock-out: {formatDateTime(currentUser.offTime)}</span>}
            <button className="btn btn-success btn-sm" onClick={handleClockIn} disabled={currentUser.attendanceStatus === 'On Duty'}><LogIn size={14} /> Clock In</button>
            <button className="btn btn-secondary btn-sm" onClick={handleClockOut} disabled={currentUser.attendanceStatus !== 'On Duty'}><LogOut size={14} /> Clock Out</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>All Employees</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Clock In</th><th>Clock Out</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.fullName}{u.id === currentUser?.id && <span className="badge badge-blue" style={{ marginLeft: '8px', fontSize: '10px' }}>You</span>}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.username}</td>
                <td><span className={`badge ${u.role === 'Admin' ? 'badge-gold' : 'badge-grey'}`}>{u.role}</span></td>
                <td><span className={`badge ${statusClass[u.attendanceStatus] || 'badge-grey'}`}>{u.attendanceStatus}</span></td>
                <td style={{ fontSize: '12px', color: '#6c757d' }}>{u.arrivalTime ? formatDateTime(u.arrivalTime) : '—'}</td>
                <td style={{ fontSize: '12px', color: '#6c757d' }}>{u.offTime ? formatDateTime(u.offTime) : '—'}</td>
                {isAdmin && <td><div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary btn-xs" onClick={() => { setEditUser(u); setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role }); setShowModal(true); }}><Edit2 size={12} /></button>
                  <button className="btn btn-primary btn-xs" onClick={() => { setAttUser(u); setAttStatus(u.attendanceStatus); setShowAttModal(true); }}><Clock size={12} /></button>
                  {u.id !== currentUser?.id && <button className="btn btn-danger btn-xs" onClick={async () => { if (confirm('Deactivate?')) { await deactivateUserRecord(u.id); refresh(); } }}>×</button>}
                </div></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '420px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editUser ? 'Edit Employee' : 'Add Employee'}</h2></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: '14px' }}><label className="form-label">Full Name</label><input className="form-input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
            {!editUser && <>
              <div style={{ marginBottom: '14px' }}><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
              <div style={{ marginBottom: '14px' }}><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            </>}
            <div style={{ marginBottom: '14px' }}><label className="form-label">Role</label><select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value="Employee">Employee</option><option value="Admin">Admin</option></select></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div></div>
      )}

      {showAttModal && attUser && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '360px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}><h2 style={{ fontSize: '18px', fontWeight: '700' }}>Update Attendance</h2><p style={{ fontSize: '13px', color: '#6c757d' }}>{attUser.fullName}</p></div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(['On Duty', 'Off Duty', 'Absent', 'Day Off'] as AttendanceStatus[]).map(s => (
                <label key={s} onClick={() => setAttStatus(s)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', background: attStatus === s ? '#e8f0fe' : '#f8f9fa', borderRadius: '8px', border: `1px solid ${attStatus === s ? '#0056B3' : '#dee2e6'}` }}>
                  <input type="radio" checked={attStatus === s} onChange={() => setAttStatus(s)} /><span className={`badge ${statusClass[s]}`}>{s}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setShowAttModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveAtt} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
