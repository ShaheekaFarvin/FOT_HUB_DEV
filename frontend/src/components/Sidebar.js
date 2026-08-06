import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';

const BASE_URL = 'http://localhost:5000';
import {
  LayoutDashboard, Vote,
  Bell, User, Menu, X, Megaphone,
  MessageSquare, Search, ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);


  // hostel_warden / librarian / union_member admins previewing the student
  // portal don't get to see the Elections section at all.
  const isLimitedStaffAdmin = user?.role === 'admin' &&
    ['hostel_warden', 'librarian', 'union_member'].includes(user?.adminType);

  const navItems = [
    { to: '/dashboard',     icon: <LayoutDashboard size={17}/>, label: 'Dashboard' },
    { to: '/elections',     icon: <Vote size={17}/>,            label: 'Elections',      show: !isLimitedStaffAdmin },
    { to: '/announcements', icon: <Megaphone size={17}/>,       label: 'Announcements' },
    { to: '/complaints',    icon: <MessageSquare size={17}/>,   label: 'Complaints' },
    { to: '/lost-found',    icon: <Search size={17}/>,          label: 'Lost & Found' },
    { to: '/notifications', icon: <Bell size={17}/>,            label: 'Notifications' },
  ].filter(item => item.show !== false);

  const SidebarInner = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <BrandMark size={44} shadow="shadow-lg" />
          <div>
            <p className="font-bold text-sm text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>FOT Student Hub</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(201,168,76,0.75)' }}>Rajarata University</p>
          </div>
        </div>
      </div>

      {/* User card — click → /profile */}
      <div className="px-3 pt-3">
        <button
          onClick={() => { navigate(user?.role === 'admin' ? '/admin/profile' : '/profile'); setOpen(false); }}
          className="w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 group"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a)', color: '#0d1b2a' }}>
              {user?.avatar
                ? <img src={`${BASE_URL}${user.avatar}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.department} · {user?.year}</p>
            </div>
            <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: '#c9a84c' }}/>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-[#0d1b2a]'
                  : 'text-white/55 hover:text-white'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg, #c9a84c, #e8c96a)', boxShadow: '0 4px 12px rgba(201,168,76,0.3)' }
              : {}
            }
            onMouseEnter={e => { if (!e.currentTarget.className.includes('text-[#0d1b2a]')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!e.currentTarget.className.includes('text-[#0d1b2a]')) e.currentTarget.style.background = ''; }}>
            <span className="flex items-center gap-3">{item.icon}{item.label}</span>
            {item.badge === 'Soon' ? (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                Soon
              </span>
            ) : item.to === '/notifications' && unreadCount > 0 ? (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: '#ef4444', color: '#fff' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity"/>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Motivational card */}
      <div className="px-3 pb-2">
        <div className="rounded-xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, rgba(201,168,76,0.14), rgba(255,255,255,0.04))', border: '1px solid rgba(201,168,76,0.18)' }}>
          <span className="text-2xl">🎓</span>
          <p className="text-white text-xs font-bold mt-2 leading-snug">Empowering Students.<br/>Building Community.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-center text-xs font-medium flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }}/>
          FOT Student Hub v2.0
        </p>
      </div>
    </div>
  );

  const sidebarStyle = {
    width: '232px',
    background: 'linear-gradient(180deg, #070d18 0%, #0d1b2a 50%, #070d18 100%)',
    boxShadow: 'var(--shadow-sidebar)',
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30" style={sidebarStyle}>
        <SidebarInner/>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4 shadow-lg"
        style={{ background: '#0d1b2a' }}>
        <div className="flex items-center gap-2">
          <BrandMark size={32} radius="rounded-lg" />
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>Student Hub</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white p-1.5 rounded-lg transition"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col" style={sidebarStyle}>
            <SidebarInner/>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
