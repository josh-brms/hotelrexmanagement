'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useHotelStore } from '@/store/hotelStore';
import {
  Hotel, LayoutDashboard, BedDouble, LogIn, BookOpen,
  CreditCard, PiggyBank, Users, Package, Calendar,
  History, BarChart3, Menu, X, LogOut, ChevronRight, Star, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/dashboard/checkin', label: 'Check In', icon: LogIn },
  { href: '/dashboard/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/dashboard/reservations', label: 'Reservations', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/deposits', label: 'Deposits', icon: PiggyBank },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/additional-items', label: 'Additional Items', icon: Package },
  { href: '/dashboard/guest-records', label: 'Guest Records', icon: History },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/system-reset', label: 'System Reset', icon: ShieldAlert },
];

const employeeLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/dashboard/checkin', label: 'Check In', icon: LogIn },
  { href: '/dashboard/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/dashboard/reservations', label: 'Reservations', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/deposits', label: 'Deposits', icon: PiggyBank },
  { href: '/dashboard/employees', label: 'Attendance', icon: Users },
  { href: '/dashboard/additional-items', label: 'Additional Items', icon: Package },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useHotelStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  if (!currentUser) return null;

  const links = currentUser.role === 'Admin' ? adminLinks : employeeLinks;

  const handleLogout = () => {
    setCurrentUser(null);
    router.replace('/login');
  };

  const NavContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Hotel size={22} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', lineHeight: '1.2' }}>Rex Hotel</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>Management System</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{currentUser.fullName[0]}</span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.fullName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {currentUser.role === 'Admin' && <Star size={10} color="#FFC107" fill="#FFC107" />}
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>{currentUser.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const isDanger = href.includes('system-reset');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: isDanger ? '0' : '2px',
                marginTop: isDanger ? '8px' : '0',
                color: isDanger ? '#ff8fa3' : isActive ? 'white' : 'rgba(255,255,255,0.75)',
                background: isActive ? (isDanger ? 'rgba(220,53,69,0.3)' : 'rgba(255,255,255,0.2)') : isDanger ? 'rgba(220,53,69,0.1)' : 'transparent',
                border: isDanger ? '1px solid rgba(220,53,69,0.25)' : 'none',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isDanger || isActive ? '600' : '500',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(220,53,69,0.2)',
            border: '1px solid rgba(220,53,69,0.3)',
            color: '#ff8fa3',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Desktop Sidebar */}
      <div style={{
        width: '240px',
        background: 'linear-gradient(180deg, #0056B3 0%, #003d82 100%)',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 40,
        display: 'none',
      }} className="desktop-sidebar">
        <NavContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {/* Mobile sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: mobileOpen ? '0' : '-260px',
        width: '260px',
        height: '100vh',
        background: 'linear-gradient(180deg, #0056B3 0%, #003d82 100%)',
        zIndex: 50,
        transition: 'left 0.3s ease',
      }}>
        <div style={{ position: 'absolute', top: '16px', right: '-56px', zIndex: 51 }}>
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} style={{ width: '48px', height: '48px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <X size={22} color="#0056B3" />
            </button>
          )}
        </div>
        <NavContent />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '0' }} className="main-content">
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e9ecef',
          padding: '0 20px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f4f8',
              border: '2px solid #dee2e6',
              borderRadius: '10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            <Menu size={26} color="#0056B3" strokeWidth={2.5} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hotel size={20} color="#0056B3" />
            <span style={{ fontWeight: '800', color: '#0056B3', fontSize: '16px' }}>Rex Hotel</span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', background: '#0056B3',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{currentUser.fullName[0]}</span>
            </div>
            <div style={{ display: 'none' }} className="user-name-desktop">
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>{currentUser.fullName}</div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>{currentUser.role}</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .main-content { margin-left: 240px !important; }
          .user-name-desktop { display: block !important; }
        }
      `}</style>
    </div>
  );
}
