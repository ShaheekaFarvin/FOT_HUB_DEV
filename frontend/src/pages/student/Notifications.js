import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAnnouncements } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, ArrowLeft, Megaphone, AlertCircle, Calendar, X, ChevronRight } from 'lucide-react';

const BASE_URL = 'http://localhost:5000';

const catColors = {
  General:   { bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6', border: 'rgba(59,130,246,0.2)'  },
  Academic:  { bg: 'rgba(124,58,237,0.08)',  text: '#7C3AED', border: 'rgba(124,58,237,0.2)'  },
  Event:     { bg: 'rgba(34,197,94,0.08)',   text: '#16A34A', border: 'rgba(34,197,94,0.2)'   },
  Emergency: { bg: 'rgba(239,68,68,0.08)',   text: '#DC2626', border: 'rgba(239,68,68,0.2)'   },
  Election:  { bg: 'rgba(201,168,76,0.08)',  text: 'var(--gold)', border: 'rgba(201,168,76,0.2)' },
};

/* ── Detail Modal ── */
const Modal = ({ item, onClose }) => {
  if (!item) return null;
  const cat = catColors[item.category] || catColors.General;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          border: `1px solid ${cat.border}`, maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-card)' }}>
          <X size={14} style={{ color: 'var(--text-muted)' }}/>
        </button>
        {item.imageUrl && (
          <img src={`${BASE_URL}${item.imageUrl}`} alt={item.title}
            className="w-full object-cover" style={{ maxHeight: '220px' }}/>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
              {item.category}
            </span>
            {item.priority === 'high' && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚡ High Priority
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg mb-2 leading-snug"
            style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            {item.content}
          </p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Calendar size={11}/>
            {new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Notification Card ── */
const NotifCard = ({ item, index, onClick, isUnread }) => {
  const cat = catColors[item.category] || catColors.General;
  return (
    <div onClick={() => onClick(item)}
      className="group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-250"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isUnread ? cat.border : 'var(--border-card)'}`,
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={ev => {
        ev.currentTarget.style.transform = 'translateY(-2px)';
        ev.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        ev.currentTarget.style.borderColor = cat.border;
      }}
      onMouseLeave={ev => {
        ev.currentTarget.style.transform = '';
        ev.currentTarget.style.boxShadow = 'var(--shadow-card)';
        ev.currentTarget.style.borderColor = isUnread ? cat.border : 'var(--border-card)';
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
        {item.category === 'Emergency' ? <AlertCircle size={16} style={{ color: cat.text }}/>
          : item.category === 'Election' ? <Bell size={16} style={{ color: cat.text }}/>
          : <Megaphone size={16} style={{ color: cat.text }}/>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm leading-snug line-clamp-2"
            style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
            {item.title}
          </p>
          {isUnread && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}>
              New
            </span>
          )}
        </div>
        <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.content}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: cat.bg, color: cat.text }}>
              {item.category}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={9}/>
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--gold)' }}/>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const Notifications = () => {
  const navigate = useNavigate();
  const { markAllRead } = useNotifications();        // only markAllRead — no items from context
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('All');
  const [readIds, setReadIds]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('fot_read_notifs') || '[]')); }
    catch { return new Set(); }
  });

  // Fetch directly — no context dependency loop
  const load = useCallback(() => {
    getAnnouncements()
      .then(r => {
        setItems(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Mark all read once after items load
  useEffect(() => {
    if (items.length === 0) return;
    // Update local readIds display
    const ids = items.map(i => i._id);
    setReadIds(prev => new Set([...prev, ...ids]));
    // Update context (badge count) — but don't depend on context items
    markAllRead();
  }, [items.length]); // only trigger when items first loads — eslint-disable-line

  const categories = ['All', 'General', 'Academic', 'Event', 'Emergency', 'Election'];
  const filtered   = filter === 'All' ? items : items.filter(i => i.category === filter);

  return (
    <Layout>
      {selected && <Modal item={selected} onClose={() => setSelected(null)}/>}

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-sm font-semibold transition-colors group"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Official announcements from the Faculty of Technology
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200"
            style={filter === c
              ? { background: 'var(--gold)', color: '#0d1b2a' }
              : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <Bell size={36} style={{ color: 'var(--text-muted)' }}/>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <NotifCard
              key={item._id}
              item={item}
              index={i}
              onClick={setSelected}
              isUnread={!readIds.has(item._id)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {items.length} notification{items.length !== 1 ? 's' : ''} total
        </p>
      </div>
    </Layout>
  );
};

export default Notifications;
