import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import { LogOut, Search, GraduationCap, Bell, Users, Megaphone, MessageSquare, Vote, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  adminGetUsers, adminGetAnnouncements, adminGetComplaints,
  adminGetLostFound, getElections,
} from '../../services/api';

const BASE_URL = 'http://localhost:5000';

const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isFullAccess   = !user?.adminType || user?.adminType === 'super_admin';

  /* ── Global search ─────────────────────────────────────────────── */
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const [searchData, setSearchData] = useState(null); // lazily-loaded lists to search over
  const searchBoxRef = useRef(null);

  // Load searchable data once, scoped to what this admin type can see.
  useEffect(() => {
    const loaders = [
      adminGetAnnouncements().then(r => ({ announcements: r.data })).catch(() => ({ announcements: [] })),
      adminGetComplaints().then(r => ({ complaints: r.data })).catch(() => ({ complaints: [] })),
    ];
    if (isFullAccess) {
      loaders.push(
        adminGetUsers().then(r => ({ users: r.data })).catch(() => ({ users: [] })),
        getElections().then(r => ({ elections: r.data })).catch(() => ({ elections: [] })),
        adminGetLostFound().then(r => ({ lostFound: r.data })).catch(() => ({ lostFound: [] })),
      );
    }
    Promise.all(loaders).then(parts => {
      setSearchData(Object.assign({ announcements: [], complaints: [], users: [], elections: [], lostFound: [] }, ...parts));
    });
  }, [isFullAccess]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e) => { if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const buildResults = useCallback(() => {
    if (!searchData || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const groups = [];

    const usersMatch = (searchData.users || [])
      .filter(u => `${u.name} ${u.email} ${u.registrationNumber || ''}`.toLowerCase().includes(q)).slice(0, 4)
      .map(u => ({ id: u._id, icon: Users, label: u.name, sub: u.email, route: '/admin/users' }));
    if (usersMatch.length) groups.push({ label: 'Users', items: usersMatch });

    const annMatch = (searchData.announcements || [])
      .filter(a => `${a.title} ${a.content || ''}`.toLowerCase().includes(q)).slice(0, 4)
      .map(a => ({ id: a._id, icon: Megaphone, label: a.title, sub: a.category || 'Announcement', route: '/admin/announcements' }));
    if (annMatch.length) groups.push({ label: 'Announcements', items: annMatch });

    const compMatch = (searchData.complaints || [])
      .filter(c => `${c.title} ${c.category || ''} ${c.submittedBy?.name || ''}`.toLowerCase().includes(q)).slice(0, 4)
      .map(c => ({ id: c._id, icon: MessageSquare, label: c.title, sub: c.submittedBy?.name || 'Complaint', route: '/admin/complaints' }));
    if (compMatch.length) groups.push({ label: 'Complaints', items: compMatch });

    const elecMatch = (searchData.elections || [])
      .filter(e => `${e.title}`.toLowerCase().includes(q)).slice(0, 4)
      .map(e => ({ id: e._id, icon: Vote, label: e.title, sub: e.status || 'Election', route: '/admin/elections' }));
    if (elecMatch.length) groups.push({ label: 'Elections', items: elecMatch });

    const lfMatch = (searchData.lostFound || [])
      .filter(l => `${l.title} ${l.description || ''}`.toLowerCase().includes(q)).slice(0, 4)
      .map(l => ({ id: l._id, icon: MapPin, label: l.title, sub: l.type === 'found' ? 'Found item' : 'Lost item', route: '/admin/lost-found' }));
    if (lfMatch.length) groups.push({ label: 'Lost & Found', items: lfMatch });

    return groups;
  }, [searchData, query]);

  const resultGroups = buildResults();
  const hasResults   = resultGroups.length > 0;

  const goTo = (route) => { setOpen(false); setQuery(''); navigate(route); };

  return (
    <div className="flex min-h-screen page-bg">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-h-screen w-0 lg:ml-[232px]">
        <header className="topbar sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-3 mt-14 lg:mt-0 shadow-sm">
          <div className="min-w-0 flex-shrink-0">
            <h1 className="text-lg font-bold text-primary truncate" style={{ fontFamily: 'Playfair Display,serif' }}>{title}</h1>
            {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
          </div>

          {/* Search bar */}
          <div className="flex w-full order-3 md:order-none md:w-auto md:flex-1 md:max-w-xs relative mt-1 md:mt-0" ref={searchBoxRef}>
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--text-muted)' }}/>
            <input
              type="text" placeholder="Search anything..."
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => query && setOpen(true)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-card)', color: 'var(--text-primary)' }}
            />

            {/* Results dropdown */}
            {open && query.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-30 max-h-96 overflow-y-auto"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}>
                {!hasResults ? (
                  <p className="text-sm text-muted text-center py-6">No results for "{query}"</p>
                ) : (
                  resultGroups.map(group => (
                    <div key={group.label} className="py-1.5">
                      <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{group.label}</p>
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => goTo(item.route)}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] transition">
                          <item.icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{item.label}</p>
                            <p className="text-xs text-muted truncate">{item.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: '#0d1b2a', color: '#fff', boxShadow: '0 1px 6px rgba(13,27,42,0.25)' }}>
              <GraduationCap size={13} /> Student Portal
            </button>

            {/* Alerts bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: '#ef4444' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={() => setShowConfirm(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(185,28,28,0.12)', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.30)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.12)'; }}>
              <LogOut size={13}/> Logout
            </button>

            {/* Profile image */}
            <button
              onClick={() => navigate('/admin/profile')}
              className="transition-all duration-200"
              style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(201,168,76,0.35)', width: '36px', height: '36px', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.75)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'}>
              {user?.avatar
                ? <img src={`${BASE_URL}${user.avatar}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0d1b2a, #243b6a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
                    {user?.name?.charAt(0)}
                  </div>
              }
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>

        <footer className="border-t border-[var(--border-card)] py-3 px-4 lg:px-8 text-center text-xs text-muted">
          © 2026 FOT Student Hub · Faculty of Technology, Rajarata University of Sri Lanka
        </footer>
      </div>

      {/* Logout Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowConfirm(false)}>
          <div onClick={e => e.stopPropagation()}
            className="rounded-2xl p-6 w-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(185,28,28,0.12)', border: '1px solid rgba(185,28,28,0.25)' }}>
                <LogOut size={26} style={{ color: '#b91c1c' }} />
              </div>
            </div>
            <h2 className="text-center text-base font-bold mb-1"
              style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
              Are you sure you want to logout?
            </h2>
            <p className="text-center text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              You will be signed out of your admin account.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}>
                Cancel
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #991b1b, #b91c1c)', color: '#fff', boxShadow: '0 4px 14px rgba(185,28,28,0.35)' }}>
                <LogOut size={14}/> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
