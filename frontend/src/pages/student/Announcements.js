import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAnnouncements } from '../../services/api';
import { Megaphone, AlertCircle, X, Calendar, User, Tag, ChevronRight, ImageIcon } from 'lucide-react';
import { ImageLightbox } from '../../components/ImageLightbox';

const ANN_HERO_BG = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&h=500&q=90';
const BASE_URL = 'http://localhost:5000';

const catColors = {
  General:   { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Academic:  { bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED' },
  Event:     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  Emergency: { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
  Election:  { bg: '#EEF2FF', text: '#3730A3', dot: '#6366F1' },
};
const priColors = {
  low:    { border: '#CBD5E1' },
  medium: { border: '#60A5FA' },
  high:   { border: '#F87171' },
};

/* ── Detail Modal ── */
const Modal = ({ ann, onClose }) => {
  const [zoomImg, setZoomImg] = useState(false);
  if (!ann) return null;
  const cat = catColors[ann.category] || catColors.General;
  const pri = priColors[ann.priority] || priColors.low;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          borderLeft: `4px solid ${pri.border}`,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.15)' }}>
          <X size={14} color="#fff" />
        </button>

        {/* Image — click to zoom */}
        {ann.imageUrl ? (
          <div
            className="relative cursor-zoom-in group"
            style={{ height: '220px', background: '#0d1b2a' }}
            onClick={() => setZoomImg(true)}>
            <img
              src={`${BASE_URL}${ann.imageUrl}`}
              alt={ann.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span className="text-white text-xs font-semibold">View full image</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-16 flex items-center justify-center gap-2"
            style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-muted)' }}>
            <ImageIcon size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No image</span>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: cat.bg, color: cat.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
              {ann.category}
            </span>
            {ann.priority === 'high' && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#EF4444' }}>
                <AlertCircle size={12} /> Urgent
              </span>
            )}
          </div>

          <h2 className="font-bold text-lg mb-3 leading-snug"
            style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display,serif' }}>
            {ann.title}
          </h2>

          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            {ann.content}
          </p>

          <div className="flex flex-wrap gap-4 pt-3 text-xs"
            style={{ borderTop: '1px solid var(--border-muted)', color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><User size={11} />{ann.createdBy?.name || 'Admin'}</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              {new Date(ann.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5"><Tag size={11} />Priority: {ann.priority || 'low'}</span>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomImg && ann.imageUrl && (
        <ImageLightbox
          src={`${BASE_URL}${ann.imageUrl}`}
          alt={ann.title}
          onClose={() => setZoomImg(false)}
        />
      )}
    </div>
  );
};

/* ── Main Page ── */
const Announcements = () => {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAnnouncements()
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-7 animate-fade-up"
        style={{ opacity: 0, height: '13rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={ANN_HERO_BG} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(7,13,24,0.78) 0%,rgba(13,27,42,0.65) 55%,rgba(13,27,42,0.50) 100%)' }} />
        <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-10">
          <div style={{ background: 'rgba(7,13,24,0.60)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '18px 22px', border: '1px solid rgba(255,255,255,0.07)', display: 'inline-block', maxWidth: '520px' }}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 w-fit"
            style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Megaphone size={11} /> Official Notices
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-2"
            style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Announcements</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)' }}>
            Official notices from FOT · Rajarata University of Sri Lanka
          </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right,rgba(201,168,76,0),var(--gold),rgba(201,168,76,0))' }} />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl animate-pulse" style={{ height: '80px', background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <Megaphone size={36} className="mx-auto mb-3" style={{ color: 'var(--border-card)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => {
            const cat = catColors[a.category] || catColors.General;
            const pri = priColors[a.priority] || priColors.low;
            return (
              <div
                key={a._id}
                onClick={() => setSelected(a)}
                className="rounded-xl overflow-hidden cursor-pointer animate-fade-up transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  animationDelay: `${i * 55}ms`, opacity: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderLeft: `3px solid ${pri.border}`,
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  minHeight: '90px',
                }}>

                {/* LEFT: Thumbnail image */}
                {a.imageUrl && (
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ width: '130px', minHeight: '90px', background: '#0d1b2a' }}>
                    <img
                      src={`${BASE_URL}${a.imageUrl}`}
                      alt={a.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      style={{ position: 'absolute', inset: 0 }}
                    />
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent 60%, rgba(0,0,0,0.25) 100%)' }} />
                  </div>
                )}

                {/* RIGHT: Text content */}
                <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: cat.bg, color: cat.text }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.dot }} />
                        {a.category}
                      </span>
                      {a.priority === 'high' && (
                        <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF1F2', color: '#BE123C' }}>
                          <AlertCircle size={9} /> Urgent
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {a.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal ann={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
};

export default Announcements;
