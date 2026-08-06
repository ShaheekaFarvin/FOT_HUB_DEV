import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetActivity } from '../../services/api';
import {
  Vote, Megaphone, MessageSquare, Search, Users,
  Activity, Clock, X, Filter, ChevronLeft, ChevronRight,
  Calendar, User, Tag, Info
} from 'lucide-react';

/* ── Helpers ── */
const CATEGORY_STYLE = {
  election:     { color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  light: '#eef2ff', Icon: Vote,          label: 'Election'     },
  announcement: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   light: '#fff1f2', Icon: Megaphone,     label: 'Announcement' },
  complaint:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  light: '#fffbeb', Icon: MessageSquare, label: 'Complaint'    },
  'lost-found': { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  light: '#ecfdf5', Icon: Search,        label: 'Lost & Found' },
  user:         { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  light: '#eff6ff', Icon: Users,         label: 'User'         },
};

const CATEGORIES = ['all', 'election', 'announcement', 'complaint', 'lost-found', 'user'];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fullDate(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/* ── Detail Drawer ── */
export const DetailDrawer = ({ item, onClose }) => {
  if (!item) return null;
  const style = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.user;
  const Icon = style.Icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.15s ease' }}
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-[var(--bg-card)] shadow-2xl"
        style={{ width: '100%', maxWidth: '420px', animation: 'slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: style.bg }}
            >
              <Icon size={16} style={{ color: style.color }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: style.color }}>{style.label}</p>
              <p className="text-sm font-bold text-primary">Activity Detail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-[var(--bg-card-hover)] transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Action */}
          <div
            className="rounded-2xl p-4"
            style={{ background: style.light, border: `1px solid ${style.color}22` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: style.color }}>Action</p>
            <p className="text-base font-bold text-primary">{item.action}</p>
            {item.detail && (
              <p className="text-sm text-secondary mt-1">— {item.detail}</p>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <InfoRow icon={<User size={14}/>} label="Performed by" value={item.admin?.name || 'Admin'} sub={item.admin?.email} />
            <InfoRow icon={<Tag size={14}/>}  label="Category"     value={style.label} />
            <InfoRow icon={<Calendar size={14}/>} label="Date & Time" value={fullDate(item.createdAt)} />
            <InfoRow icon={<Clock size={14}/>}    label="Relative"     value={timeAgo(item.createdAt)} />
          </div>

          {/* Category badge */}
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Category Tag</p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: style.bg, color: style.color }}
            >
              <Icon size={11}/> {style.label}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-card)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-secondary bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] transition"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </>
  );
};

const InfoRow = ({ icon, label, value, sub }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-muted)]">
    <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center text-muted flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-sm font-semibold text-primary mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  </div>
);

/* ── Main Page ── */
const AdminActivity = () => {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const cat = category === 'all' ? null : category;
      const res = await adminGetActivity(page, cat);
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (_) {}
    setLoading(false);
  }, [page, category]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [category]);

  return (
    <AdminLayout title="Activity History" subtitle="All admin actions across the system">

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-muted font-semibold mr-1">
          <Filter size={13}/> Filter:
        </div>
        {CATEGORIES.map(cat => {
          const st = cat !== 'all' ? CATEGORY_STYLE[cat] : null;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 capitalize"
              style={active
                ? { background: st ? st.color : '#0d1b2a', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { background: 'var(--bg-muted)', color: 'var(--text-secondary)' }
              }
            >
              {st && <st.Icon size={11}/>}
              {cat === 'all' ? 'All' : st?.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted font-medium">{total} records</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-card)] animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] flex-shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[var(--bg-muted)] rounded-full w-1/2"/>
                  <div className="h-2.5 bg-[var(--bg-muted)] rounded-full w-1/3"/>
                </div>
                <div className="h-2.5 bg-[var(--bg-muted)] rounded-full w-16"/>
              </div>
            ))}
          </div>
        ) : !logs.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity size={36} className="text-muted opacity-50 mb-3"/>
            <p className="text-muted font-medium">No activity found</p>
            <p className="text-muted opacity-70 text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <div>
            {logs.map((item, i) => {
              const st = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.user;
              const Icon = st.Icon;
              return (
                <button
                  key={item._id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors text-left group"
                  style={{ borderColor: 'var(--border-card)', animationDelay: `${i * 30}ms` }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: st.bg }}
                  >
                    <Icon size={15} style={{ color: st.color }}/>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {item.action}
                      {item.detail && <span className="font-normal text-muted"> — {item.detail}</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      by <span className="font-semibold text-secondary">{item.admin?.name || 'Admin'}</span>
                    </p>
                  </div>

                  {/* Category badge */}
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>

                  {/* Time */}
                  <span className="text-xs text-muted flex items-center gap-1 flex-shrink-0">
                    <Clock size={10}/>{timeAgo(item.createdAt)}
                  </span>

                  {/* Arrow hint */}
                  <Info size={14} className="text-muted opacity-60 group-hover:opacity-100 group-hover:text-secondary transition-colors flex-shrink-0"/>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16}/>
          </button>
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
              style={page === i + 1
                ? { background: '#0d1b2a', color: '#fff' }
                : { color: 'var(--text-secondary)', background: 'transparent' }
              }
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {/* Detail Drawer */}
      <DetailDrawer item={selected} onClose={() => setSelected(null)}/>
    </AdminLayout>
  );
};

export default AdminActivity;
