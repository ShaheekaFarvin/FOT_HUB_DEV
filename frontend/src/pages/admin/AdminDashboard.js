import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminStats } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Vote, Megaphone, MessageSquare, Search,
  AlertCircle, ChevronRight,
  Activity, Clock, Shield as ShieldIcon, BadgeCheck as BadgeCheckIcon,
  Zap, Heart, MoreHorizontal, LayoutDashboard as LayoutDashboardIcon,
  FlaskConical, Cpu
} from 'lucide-react';

/* ── Category icon + color map ── */
const CATEGORY_STYLE = {
  election:     { color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  Icon: Vote },
  announcement: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   Icon: Megaphone },
  complaint:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  Icon: MessageSquare },
  'lost-found': { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  Icon: Search },
  user:         { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  Icon: Users },
};

/* ── Time-ago helper ── */
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)      return `${diff}s ago`;
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Activity Item ── */
const ActivityItem = ({ item, index, onClick }) => {
  const style = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.user;
  const Icon = style.Icon;
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full flex items-start gap-3 py-3 border-b last:border-b-0 animate-fade-up text-left hover:bg-[var(--bg-card-hover)] rounded-xl px-2 -mx-2 transition-colors group"
      style={{ borderColor: 'var(--border-card)', animationDelay: `${index * 40}ms`, opacity: 0 }}
    >
      {/* Icon bubble */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: style.bg }}
      >
        <Icon size={14} style={{ color: style.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary leading-snug">
          {item.action}
          {item.detail && (
            <span className="font-normal text-secondary"> — {item.detail}</span>
          )}
        </p>
        <p className="text-xs text-muted mt-0.5">
          by <span className="font-semibold text-secondary">{item.admin?.name || 'Admin'}</span>
        </p>
      </div>

      {/* Time */}
      <span
        className="text-xs font-medium flex-shrink-0 flex items-center gap-1 mt-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Clock size={10} />
        {timeAgo(item.createdAt)}
      </span>
    </button>
  );
};

/* ── Main Dashboard ── */
const AdminDashboard = () => {
  const { user }                = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate                = useNavigate();

  // hostel_warden / librarian / union_member get a scoped-down dashboard —
  // just Recent Complaints + Admin Activity (announcements/complaints only).
  const isLimitedStaff = ['hostel_warden', 'librarian', 'union_member'].includes(user?.adminType);

  useEffect(() => {
    adminStats().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusColors = { pending:'badge-pending', 'in-progress':'badge-progress', resolved:'badge-resolved', rejected:'badge-rejected' };

  return (
    <AdminLayout
      title="Dashboard Overview"
      subtitle={isLimitedStaff ? 'Announcements & Complaints overview' : 'Faculty of Technology — Rajarata University'}
    >

      {/* Students by Department */}
      {!loading && data?.deptStats && (
        <div className="mb-8 animate-fade-up" style={{animationDelay:'80ms',opacity:0}}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} style={{color:'var(--text-secondary)'}}/>
            <h3 className="font-bold text-primary text-base" style={{fontFamily:'Playfair Display,serif'}}>Students by Department</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'ICT', sub: 'Information & Communication Technology', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', count: data.deptStats.ICT, Icon: LayoutDashboardIcon },
              { label: 'ENT', sub: 'Engineering Technology (SP) – (NDT)',    color: '#7c3aed', bg: 'rgba(124,58,237,0.10)', count: data.deptStats.ENT, Icon: FlaskConical },
              { label: 'BST', sub: 'Bioprocess Technology (SP) – (ND)',      color: '#10b981', bg: 'rgba(16,185,129,0.10)', count: data.deptStats.BST, Icon: Cpu },
            ].map(({ label, sub, color, bg, count, Icon }, i) => (
              <div key={label} className="card p-5 relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: color}}>
                    <Icon size={20} className="text-white"/>
                  </div>
                  <button className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:bg-[var(--bg-muted)] transition">
                    <MoreHorizontal size={15}/>
                  </button>
                </div>
                <p className="text-2xl font-black" style={{color:'var(--text-primary)'}}>{count}</p>
                <p className="text-sm font-bold text-primary">{label}</p>
                <p className="text-xs text-muted mt-0.5">{sub}</p>
                {/* Mini sparkline */}
                <svg viewBox="0 0 100 24" className="absolute right-4 top-16 w-20 h-6 opacity-60" preserveAspectRatio="none">
                  <polyline points="0,18 15,12 30,16 45,6 60,10 75,4 100,8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section: tables + activity feed */}
      <div className={`grid grid-cols-1 gap-6 ${isLimitedStaff ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>

        {/* Recent Users — super_admin only */}
        {!isLimitedStaff && (
          <div className="card p-5 animate-fade-up" style={{animationDelay:'200ms',opacity:0}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>Recent Registrations</h3>
              <button onClick={() => navigate('/admin/users')} className="text-xs text-primary font-bold hover:text-[#c9a84c] transition-colors flex items-center gap-1">
                View All <ChevronRight size={13}/>
              </button>
            </div>
            {!data?.recentUsers?.length ? (
              <p className="text-muted text-sm text-center py-8">No users yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{u.name}</p>
                      <p className="text-xs text-muted">{u.studentId} · {u.department}</p>
                    </div>
                    <span className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Complaints */}
        <div className="card p-5 animate-fade-up" style={{animationDelay:'300ms',opacity:0}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>Recent Complaints</h3>
            <button onClick={() => navigate('/admin/complaints')} className="text-xs text-primary font-bold hover:text-[#c9a84c] transition-colors flex items-center gap-1">
              View All <ChevronRight size={13}/>
            </button>
          </div>
          {!data?.recentComplaints?.length ? (
            <p className="text-muted text-sm text-center py-8">No complaints yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentComplaints.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={17} className="text-amber-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{c.title}</p>
                    <p className="text-xs text-muted">{c.submittedBy?.name||'Anonymous'} · {c.category}</p>
                  </div>
                  <span className={statusColors[c.status]}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Activity Feed ── */}
        <div className="card p-5 animate-fade-up" style={{animationDelay:'400ms',opacity:0}}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#0d1b2a]/8 flex items-center justify-center">
              <Activity size={14} className="text-primary"/>
            </div>
            <div className="flex items-center justify-between flex-1">
              <h3 className="font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>Admin Activity</h3>
              {!isLimitedStaff && (
                <button onClick={() => navigate('/admin/activity')} className="text-xs text-primary font-bold hover:text-[#c9a84c] transition-colors flex items-center gap-1">
                  View All <ChevronRight size={13}/>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-muted)] flex-shrink-0"/>
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 bg-[var(--bg-muted)] rounded-full w-3/4"/>
                    <div className="h-2.5 bg-[var(--bg-muted)] rounded-full w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recentActivity?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity size={28} className="text-muted opacity-50 mb-2"/>
              <p className="text-muted text-sm font-medium">No activity yet</p>
              <p className="text-muted opacity-70 text-xs mt-1">Actions will appear here</p>
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
              {data.recentActivity.map((item, i) => (
                <ActivityItem key={item._id} item={item} index={i} onClick={setSelected}/>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Trust bar footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {[
          { Icon: ShieldIcon,   t: '100% Secure',      s: 'Your data is protected', color: '#c9a84c', bg: 'rgba(21,101,216,0.10)' },
          { Icon: BadgeCheckIcon, t: 'Official Portal', s: 'University verified',   color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
          { Icon: Zap,          t: 'Real-time Updates', s: 'Live system updates',   color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
          { Icon: Heart,        t: 'Student First',     s: 'Built for students',    color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
        ].map((f, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.bg }}>
              <f.Icon size={16} style={{ color: f.color }}/>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary truncate">{f.t}</p>
              <p className="text-xs text-muted truncate">{f.s}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
