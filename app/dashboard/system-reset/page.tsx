'use client';
import { useState } from 'react';
import { useHotelStore } from '@/store/hotelStore';
import { resetSystemData } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Eye, EyeOff, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Lock, Trash2, Loader2 } from 'lucide-react';

const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_RESET_PASSWORD || 'DEV@RexHotel2025!';

const RESET_OPTIONS = [
  { scope: 'bookings', label: 'Bookings & Guest Records', description: 'Clears all check-in records, active/past bookings, stay history. Resets room statuses to Available.', danger: false },
  { scope: 'payments', label: 'Payment Records', description: 'Clears all payment transaction records.', danger: false },
  { scope: 'deposits', label: 'Deposit Records', description: 'Clears all deposit records.', danger: false },
  { scope: 'reservations', label: 'Reservations', description: 'Clears all reservation records.', danger: false },
  { scope: 'guests', label: 'Guest Registry', description: 'Clears all guest profiles, regular status, and lifetime statistics.', danger: false },
  { scope: 'revenue', label: 'Revenue Counters', description: 'Resets undeposited and all-time revenue back to ₱0.00.', danger: false },
  { scope: 'all', label: '⚠ FULL SYSTEM RESET', description: 'Wipes ALL data — bookings, payments, deposits, reservations, guests, revenue, and resets rooms. Cannot be undone.', danger: true },
];

export default function SystemResetPage() {
  const router = useRouter();
  const { currentUser } = useHotelStore();
  const isAdmin = currentUser?.role === 'Admin';
  const [step, setStep] = useState<'auth' | 'select' | 'confirm' | 'done'>('auth');
  const [devPassword, setDevPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authAttempts, setAuthAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');
  const [resetLog, setResetLog] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);

  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
        <XCircle size={48} color="#DC3545" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Access Denied</h2>
        <p style={{ color: '#6c757d' }}>Only Admins can access System Reset.</p>
        <button className="btn btn-secondary" style={{ marginTop: '20px' }} onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    </div>
  );

  const handleAuth = () => {
    if (locked) return;
    if (devPassword === DEV_PASSWORD) { setStep('select'); setAuthError(''); }
    else {
      const attempts = authAttempts + 1; setAuthAttempts(attempts);
      if (attempts >= 5) { setLocked(true); setAuthError('Too many failed attempts. Please refresh to try again.'); }
      else setAuthError(`Incorrect password. ${5 - attempts} attempt(s) remaining.`);
      setDevPassword('');
    }
  };

  const toggleScope = (scope: string) => {
    if (scope === 'all') { setSelected(prev => prev.includes('all') ? [] : ['all']); return; }
    setSelected(prev => { const wa = prev.filter(s => s !== 'all'); return wa.includes(scope) ? wa.filter(s => s !== scope) : [...wa, scope]; });
  };

  const executeReset = async () => {
    if (confirmText !== 'RESET') return;
    setExecuting(true);
    const log: string[] = [];
    try {
      await resetSystemData(selected);
      const doAll = selected.includes('all');
      if (doAll || selected.includes('bookings')) log.push('✓ Bookings, guest records cleared. Room statuses reset to Available.');
      if (doAll || selected.includes('payments')) log.push('✓ Payment records cleared.');
      if (doAll || selected.includes('deposits')) log.push('✓ Deposit records cleared.');
      if (doAll || selected.includes('reservations')) log.push('✓ Reservations cleared.');
      if (doAll || selected.includes('guests')) log.push('✓ Guest registry cleared.');
      if (doAll || selected.includes('revenue')) log.push('✓ Revenue counters reset to ₱0.00.');
      if (doAll) log.push('✓ Full system reset complete.');
    } catch (e) { log.push('❌ Error during reset: ' + String(e)); }
    log.push(`— Reset by: ${currentUser?.fullName} (${currentUser?.username})`);
    log.push(`— Timestamp: ${new Date().toLocaleString('en-PH')}`);
    setResetLog(log); setExecuting(false); setStep('done');
  };

  const steps = ['auth', 'select', 'confirm', 'done'];
  const currentStepIdx = steps.indexOf(step);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldAlert size={28} color="#DC3545" /> System Reset</h1>
        <span className="badge badge-red">Admin Only</span>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[{ label: '1. Authenticate', key: 'auth' }, { label: '2. Select Scope', key: 'select' }, { label: '3. Confirm', key: 'confirm' }, { label: '4. Done', key: 'done' }].map(({ label, key }, i, arr) => {
          const idx = steps.indexOf(key); const isDone = idx < currentStepIdx; const isActive = idx === currentStepIdx;
          return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: isDone ? '#d4edda' : isActive ? '#0056B3' : '#f0f4f8', color: isDone ? '#155724' : isActive ? 'white' : '#6c757d' }}>
              {isDone && <CheckCircle2 size={14} />}{label}
            </div>
            {i < arr.length - 1 && <div style={{ width: '24px', height: '2px', background: isDone ? '#28A745' : '#dee2e6' }} />}
          </div>;
        })}
      </div>

      {/* STEP 1: AUTH */}
      {step === 'auth' && (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="card" style={{ borderTop: '4px solid #DC3545' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: '#f8d7da', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Lock size={28} color="#DC3545" /></div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Developer Authentication</h2>
              <p style={{ color: '#6c757d', fontSize: '13px' }}>This action requires the developer master password.</p>
            </div>
            {authError && <div className="alert alert-error" style={{ marginBottom: '16px' }}><AlertTriangle size={14} /> {authError}</div>}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label className="form-label">Developer Password</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} value={devPassword} onChange={e => setDevPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && !locked && handleAuth()} placeholder="Enter developer password" disabled={locked} style={{ paddingRight: '44px', letterSpacing: showPw ? 'normal' : '3px' }} autoComplete="off" />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d' }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }} onClick={handleAuth} disabled={locked || !devPassword}><Lock size={16} /> Authenticate</button>
            <div style={{ marginTop: '16px', padding: '10px 14px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>Password is set in <code style={{ background: '#e9ecef', padding: '1px 5px', borderRadius: '3px' }}>.env.local</code> → <code style={{ background: '#e9ecef', padding: '1px 5px', borderRadius: '3px' }}>NEXT_PUBLIC_DEV_RESET_PASSWORD</code></div>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT */}
      {step === 'select' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card" style={{ borderTop: '4px solid #FFC107' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>Select Data to Reset</h2>
            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>Choose which parts of the system to wipe. This cannot be undone.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {RESET_OPTIONS.map(opt => {
                const isChecked = selected.includes(opt.scope);
                const isDisabled = opt.scope !== 'all' && selected.includes('all');
                return (
                  <label key={opt.scope} onClick={() => !isDisabled && toggleScope(opt.scope)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '14px 16px', borderRadius: '10px', background: isChecked ? (opt.danger ? '#f8d7da' : '#e8f0fe') : '#f8f9fa', border: `2px solid ${isChecked ? (opt.danger ? '#DC3545' : '#0056B3') : '#dee2e6'}`, opacity: isDisabled ? 0.45 : 1, transition: 'all 0.15s' }}>
                    <div style={{ marginTop: '1px', flexShrink: 0 }}><div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `2px solid ${isChecked ? (opt.danger ? '#DC3545' : '#0056B3') : '#adb5bd'}`, background: isChecked ? (opt.danger ? '#DC3545' : '#0056B3') : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isChecked && <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>✓</span>}</div></div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: '700', fontSize: '14px', color: opt.danger ? '#721c24' : '#212529' }}>{opt.label}</div><div style={{ fontSize: '12px', color: '#6c757d', marginTop: '3px' }}>{opt.description}</div></div>
                    {opt.danger && <Trash2 size={18} color="#DC3545" style={{ flexShrink: 0 }} />}
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setStep('auth'); setDevPassword(''); setSelected([]); }}>Back</button>
              <button className="btn btn-danger" onClick={() => setStep('confirm')} disabled={selected.length === 0}><AlertTriangle size={14} /> Continue to Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRM */}
      {step === 'confirm' && (
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div className="card" style={{ borderTop: '4px solid #DC3545' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', background: '#f8d7da', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><AlertTriangle size={28} color="#DC3545" /></div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#DC3545', marginBottom: '6px' }}>Final Confirmation</h2>
              <p style={{ color: '#6c757d', fontSize: '13px' }}>You are about to permanently delete:</p>
            </div>
            <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
              {(selected.includes('all') ? RESET_OPTIONS.filter(o => o.scope !== 'all') : RESET_OPTIONS.filter(o => selected.includes(o.scope))).map(opt => (
                <div key={opt.scope} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#721c24' }}><Trash2 size={13} /><span style={{ fontWeight: '600' }}>{opt.label}</span></div>
              ))}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ color: '#DC3545' }}>Type <strong>RESET</strong> to confirm</label>
              <input className="form-input" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type RESET to confirm" style={{ borderColor: confirmText === 'RESET' ? '#28A745' : '#dee2e6', fontSize: '16px', fontWeight: '700', letterSpacing: '2px' }} autoComplete="off" />
              {confirmText.length > 0 && confirmText !== 'RESET' && <div style={{ fontSize: '12px', color: '#DC3545', marginTop: '4px' }}>Must type exactly: RESET</div>}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setStep('select'); setConfirmText(''); }}>Back</button>
              <button className="btn btn-danger" onClick={executeReset} disabled={confirmText !== 'RESET' || executing}>
                {executing ? <><Loader2 size={14} className="animate-spin" /> Resetting...</> : <><RotateCcw size={14} /> Execute Reset</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: DONE */}
      {step === 'done' && (
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div className="card" style={{ borderTop: '4px solid #28A745' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><CheckCircle2 size={32} color="#28A745" /></div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#28A745', marginBottom: '6px' }}>Reset Complete</h2>
              <p style={{ color: '#6c757d', fontSize: '13px' }}>The selected data has been successfully cleared.</p>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '16px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
              {resetLog.map((line, i) => <div key={i} style={{ color: line.startsWith('✓') ? '#28A745' : line.startsWith('❌') ? '#DC3545' : '#adb5bd', marginBottom: '6px' }}>{line}</div>)}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }} onClick={() => router.push('/dashboard')}>Return to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
