import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FotBuddy from './FotBuddy';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Sun, Moon, Shield, LogOut, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:5000';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen page-bg">
      <Sidebar/>

      <div className="flex-1 flex flex-col min-h-screen w-0 lg:ml-[232px]">

        {/* Topbar */}
        <header className="topbar sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-6 mt-14 lg:mt-0">
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--gold)' }}>◆</span>
            <span>Faculty of Technology · Rajarata University of Sri Lanka</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'var(--badge-pend-bg)', color: 'var(--badge-pend-text)', border: '1px solid var(--border-card)' }}>
                <Shield size={13}/> Admin Panel
              </button>
            )}

            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'dark'
                ? <Sun size={16} style={{ color: 'var(--gold)' }}/>
                : <Moon size={16}/>}
            </button>

            <button className="relative theme-toggle" aria-label="Notifications" onClick={() => navigate('/notifications')}>
              <Bell size={16}/>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center font-bold" style={{ fontSize: '8px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'var(--border-card)' }} />

            {/* Logout button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(185,28,28,0.12)', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.30)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.12)'; }}>
              <LogOut size={13}/> Logout
            </button>

            {/* Profile image only */}
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin/profile' : '/profile')}
              className="transition-all duration-200"
              style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(201,168,76,0.35)', width: '36px', height: '36px', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.75)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'}>
              {user?.avatar
                ? <img src={`${BASE_URL}${user.avatar}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--navy), #243b6a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
                    {user?.name?.charAt(0)}
                  </div>
              }
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        <footer className="py-3 px-4 lg:px-8 text-center text-xs" style={{ borderTop: '1px solid var(--border-muted)', color: 'var(--text-muted)' }}>
          © 2026 FOT Student Hub · Faculty of Technology, Rajarata University of Sri Lanka
        </footer>
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLogoutConfirm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="rounded-2xl p-6 w-80 animate-fade-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <LogOut size={26} style={{ color: '#f87171' }} />
              </div>
            </div>

            {/* Text */}
            <h2 className="text-center text-base font-bold mb-1"
              style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
              Are you sure you want to logout?
            </h2>
            <p className="text-center text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              You will be signed out of your account.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}>
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <LogOut size={14}/> Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <FotBuddy />

    </div>
  );
};

export default Layout;
