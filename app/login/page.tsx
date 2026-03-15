'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHotelStore } from '@/store/hotelStore';
import { dbLogin, dbSignup } from '@/lib/db';
import { Hotel, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Employee'>('Employee');
  const setCurrentUser = useHotelStore(s => s.setCurrentUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isSignup) {
        if (!fullName.trim()) { setError('Full name is required'); return; }
        const ok = await dbSignup(username, password, fullName, role);
        if (!ok) { setError('Username already exists'); return; }
      }
      const user = await dbLogin(username, password);
      if (user) {
        setCurrentUser(user as Parameters<typeof setCurrentUser>[0]);
        router.replace('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Connection error. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0056B3 0%, #3498DB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', background: '#0056B3', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Hotel size={36} color="white" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a2e' }}>Rex Hotel</h1>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Management System</p>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>{isSignup ? 'Create Account' : 'Sign In'}</h2>
        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label className="form-label">Password</label>
            <input className="form-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d' }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {isSignup && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value as 'Admin' | 'Employee')}>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '8px' }} disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Loading...</> : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }} style={{ background: 'none', border: 'none', color: '#0056B3', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
        {!isSignup && (
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
            <strong>Demo accounts:</strong><br />Admin: admin / admin123<br />Employee: employee1 / emp123
          </div>
        )}
      </div>
    </div>
  );
}
