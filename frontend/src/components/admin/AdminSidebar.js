import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../BrandMark';
import {
  LayoutDashboard, Vote, Megaphone, MessageSquare,
  Search, Users, Menu, X, ChevronRight,
  Home, Crown, Settings, BookOpen,
} from 'lucide-react';

const ADMIN_TYPE_META = {
  super_admin:   { label: 'Super Admin',   icon: Crown,    color: '#c9a84c' },
  hostel_warden: { label: 'Hostel Warden', icon: Home,     color: '#3b82f6' },
  librarian:     { label: 'Librarian',     icon: BookOpen, color: '#7c3aed' },
  union_member:  { label: 'Union Member',  icon: Users,    color: '#22c55e' },
};

const AdminSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const adminType = user?.adminType;
  const meta = ADMIN_TYPE_META[adminType] || { label: 'Administrator', icon: Shield, color: '#c9a84c' };
  const MetaIcon = meta.icon;

  // super_admin = full access (elections, dashboard, users, lost & found, reg settings)
  const isFullAccess = !adminType || adminType === 'super_admin';
  // hostel_warden, librarian & union_member → announcements + complaints ONLY, nothing else
  const isLimitedStaff = adminType === 'hostel_warden' || adminType === 'librarian' || adminType === 'union_member';

  const allNavItems = [
    { to: '/admin',               icon: <LayoutDashboard size={17}/>, label: 'Dashboard',     end: true, show: isFullAccess || isLimitedStaff },
    { to: '/admin/elections',     icon: <Vote size={17}/>,            label: 'Elections',              show: isFullAccess },
    { to: '/admin/announcements', icon: <Megaphone size={17}/>,       label: 'Announcements',          show: isFullAccess || isLimitedStaff },
    { to: '/admin/complaints',    icon: <MessageSquare size={17}/>,   label: 'Complaints',             show: isFullAccess || isLimitedStaff },
    { to: '/admin/lost-found',    icon: <Search size={17}/>,          label: 'Lost & Found',           show: isFullAccess },
    { to: '/admin/users',         icon: <Users size={17}/>,           label: 'Users',                  show: isFullAccess },
    { to: '/admin/reg-settings',  icon: <Settings size={17}/>,        label: 'Reg Settings',           show: adminType === 'super_admin' },
  ];

  const navItems = allNavItems.filter(i => i.show);

  const Inner = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="relative px-5 py-5 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30"/>
        <div className="relative flex items-center gap-3">
          <BrandMark size={44} radius="rounded-2xl" shadow="shadow-lg" />
          <div>
            <p className="text-white font-bold text-sm" style={{fontFamily:'Playfair Display,serif'}}>Admin Panel</p>
            <p className="text-[#c9a84c] text-xs">FOT · Rajarata University</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200"
        style={{ background: meta.color + '18', borderColor: meta.color + '30' }}
        onClick={() => navigate('/admin/profile')}
        onMouseEnter={e => { e.currentTarget.style.background = meta.color + '28'; }}
        onMouseLeave={e => { e.currentTarget.style.background = meta.color + '18'; }}>
        <p className="text-xs font-bold flex items-center gap-1.5 mb-0.5" style={{ color: meta.color }}>
          <MetaIcon size={11}/>{meta.label}
        </p>
        <p className="text-white/60 text-xs truncate">{user?.name}</p>
        {adminType === 'hostel_warden' && user?.wardenHostel && (
          <p className="text-white/40 text-xs mt-0.5 truncate">📍 {user.wardenHostel}</p>
        )}
        {adminType === 'union_member' && user?.unionPosition && (
          <p className="text-white/40 text-xs mt-0.5 truncate">🏛 {user.unionPosition}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0d1b2a] shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}>
            <span className="flex items-center gap-3">{item.icon}{item.label}</span>
            <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-2">
        <div className="rounded-xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, rgba(201,168,76,0.14), rgba(255,255,255,0.04))', border: '1px solid rgba(201,168,76,0.18)' }}>
          <span className="text-2xl">🎓</span>
          <p className="text-white text-xs font-bold mt-2 leading-snug">Empowering Students.<br/>Building Community.</p>
        </div>
      </div>

      <div className="p-3 border-t border-white/10">
        <p className="text-center text-xs font-medium flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }}/>
          FOT Student Hub v2.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col bg-gradient-to-b from-[#0d1b2a] via-[#0f2035] to-[#0d1b2a] h-screen fixed left-0 top-0 z-30 shadow-2xl" style={{width:'232px'}}>
        <Inner/>
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d1b2a] z-30 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-2">
          <MetaIcon size={18} style={{ color: meta.color }}/>
          <span className="text-white font-bold text-sm">{meta.label}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white p-1.5 hover:bg-white/10 rounded-lg transition">
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 bg-gradient-to-b from-[#0d1b2a] to-[#0f2035] shadow-2xl" style={{width:'232px'}}>
            <Inner/>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
