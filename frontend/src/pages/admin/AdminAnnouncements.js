import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetAnnouncements, adminCreateAnn, adminDeleteAnn, adminUpdateAnn } from '../../services/api';
import { Plus, Trash2, Megaphone, X, Loader2, AlertCircle, ImageIcon, Edit2, Upload, Search, Pin, PinOff, LayoutGrid, GraduationCap, CalendarDays, Bell, Siren, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClickableImage } from '../../components/ImageLightbox';

const ANN_ADMIN_BG = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&h=400&q=90';
const BASE_URL = 'http://localhost:5000';

const catColors = {
  General:   'bg-gray-100 text-gray-700',
  Academic:  'bg-purple-100 text-purple-700',
  Event:     'bg-green-100 text-green-700',
  Emergency: 'bg-red-100 text-red-700',
  Election:  'bg-indigo-100 text-indigo-700',
};
const priColors = { low: 'border-l-gray-300', medium: 'border-l-blue-400', high: 'border-l-red-500' };

/* ── Modal shell ── */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-card)]">
        <h2 className="text-lg font-bold text-primary" style={{ fontFamily: 'Playfair Display,serif' }}>{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-xl transition" style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

/* ── Image upload field ── */
const ImageUploadField = ({ preview, onFileChange, onRemove, label = 'Banner Image' }) => (
  <div>
    <label className="block text-sm font-semibold text-primary mb-1.5">
      {label} <span className="text-muted font-normal">(optional)</span>
    </label>
    {preview ? (
      <div className="relative rounded-xl overflow-hidden border border-[var(--border-card)]">
        <img src={preview} alt="preview" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-end justify-end p-2">
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition shadow"
          >
            <X size={12} /> Remove Image
          </button>
        </div>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-card)] rounded-xl cursor-pointer hover:border-[#c9a84c] hover:bg-amber-50/30 transition group">
        <Upload size={22} className="text-muted group-hover:text-[#c9a84c] mb-1.5 transition" />
        <span className="text-sm text-muted group-hover:text-secondary transition">Click to upload image</span>
        <span className="text-xs text-muted mt-0.5">PNG, JPG, WEBP — max 5MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </label>
    )}
  </div>
);

/* ── Shared form fields ── */
const AnnFields = ({ f, setF }) => (
  <>
    <div>
      <label className="block text-sm font-semibold text-primary mb-1.5">Title</label>
      <input className="input-field" required value={f.title}
        onChange={e => setF({ ...f, title: e.target.value })} placeholder="Announcement title" />
    </div>
    <div>
      <label className="block text-sm font-semibold text-primary mb-1.5">Content</label>
      <textarea className="input-field" rows={4} required value={f.content}
        onChange={e => setF({ ...f, content: e.target.value })} placeholder="Write the announcement..." />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-semibold text-primary mb-1.5">Category</label>
        <select className="input-field" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          {['General', 'Academic', 'Event', 'Emergency', 'Election'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-primary mb-1.5">Priority</label>
        <select className="input-field" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  </>
);

const EMPTY = { title: '', content: '', category: 'General', priority: 'medium' };

const FILTER_TABS = [
  { key: 'All',       label: 'All',      Icon: LayoutGrid },
  { key: 'General',   label: 'General',  Icon: Bell },
  { key: 'Academic',  label: 'Academic', Icon: GraduationCap },
  { key: 'Event',     label: 'Events',   Icon: CalendarDays },
  { key: 'Election',  label: 'Election', Icon: Megaphone },
  { key: 'Emergency', label: 'Urgent',   Icon: Siren },
];

const PAGE_SIZE = 10;

/* ══════════════════ MAIN COMPONENT ══════════════════ */
const AdminAnnouncements = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  /* filter / search / pagination */
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pinned, setPinned]             = useState(() => {
    try { return JSON.parse(localStorage.getItem('fot-pinned-ann') || '[]'); } catch { return []; }
  });

  const togglePin = id => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fot-pinned-ann', JSON.stringify(next));
      return next;
    });
  };

  /* create state */
  const [showCreate, setShowCreate]     = useState(false);
  const [cForm, setCForm]               = useState(EMPTY);
  const [cImg, setCImg]                 = useState(null);
  const [cImgPrev, setCImgPrev]         = useState(null);

  /* edit state */
  const [editItem, setEditItem]         = useState(null);
  const [eForm, setEForm]               = useState(EMPTY);
  const [eImg, setEImg]                 = useState(null);       // new file chosen
  const [eImgPrev, setEImgPrev]         = useState(null);       // displayed preview
  const [eImgRemoved, setEImgRemoved]   = useState(false);      // user clicked "remove"

  const load = () =>
    adminGetAnnouncements()
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  /* ── Filter + search + sort (pinned first) + paginate ── */
  const filtered = items
    .filter(a => activeFilter === 'All' || a.category === activeFilter)
    .filter(a => !search.trim() || a.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (pinned.includes(b._id) ? 1 : 0) - (pinned.includes(a._id) ? 1 : 0));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [activeFilter, search]);

  /* helpers */
  const pickFile = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ── CREATE ── */
  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(cForm).forEach(([k, v]) => fd.append(k, v));
      if (cImg) fd.append('image', cImg);
      await adminCreateAnn(fd);
      setShowCreate(false); setCForm(EMPTY); setCImg(null); setCImgPrev(null);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── OPEN EDIT ── */
  const openEdit = a => {
    setEditItem(a);
    setEForm({ title: a.title, content: a.content, category: a.category, priority: a.priority });
    setEImg(null);
    setEImgPrev(a.imageUrl ? `${BASE_URL}${a.imageUrl}` : null);
    setEImgRemoved(false);
  };

  /* ── SAVE EDIT ── */
  const handleEdit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(eForm).forEach(([k, v]) => fd.append(k, v));
      if (eImg) fd.append('image', eImg);
      if (eImgRemoved) fd.append('removeImage', 'true');
      await adminUpdateAnn(editItem._id, fd);
      setEditItem(null); setEImg(null); setEImgPrev(null); setEImgRemoved(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── DELETE ── */
  const handleDelete = async id => {
    if (!window.confirm('Delete this announcement?')) return;
    await adminDeleteAnn(id); load();
  };

  return (
    <AdminLayout title="Announcements" subtitle="Post and manage campus announcements">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden mb-7"
        style={{ height: '11rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={ANN_ADMIN_BG} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(7,13,24,0.82) 0%,rgba(13,27,42,0.68) 60%,rgba(13,27,42,0.50) 100%)' }} />
        <div className="absolute inset-0 flex flex-col justify-center px-7">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Faculty of Technology · RUSL</p>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Announcement Management</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>{items.length} announcements posted</p>
        </div>
        <div className="absolute top-4 right-5">
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> New Announcement
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right,rgba(201,168,76,0),var(--gold),rgba(201,168,76,0))' }} />
      </div>

      {/* ── Filter tabs + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveFilter(t.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200"
              style={activeFilter === t.key
                ? { background: 'var(--gold)', color: '#0d1b2a', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }
                : { background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
              <t.Icon size={13}/> {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0 w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="input-field pl-9 text-sm py-2.5"
          />
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-28 animate-pulse border border-[var(--border-card)]" />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-14 text-center" style={{ opacity: 1 }}>
          <Megaphone size={48} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="text-muted">No announcements yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center" style={{ opacity: 1 }}>
          <Search size={40} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="text-muted">No announcements match your search/filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pageItems.map((a, i) => (
            <div key={a._id}
              className={`card p-0 overflow-hidden border-l-4 ${priColors[a.priority] || 'border-l-gray-300'} animate-fade-up`}
              style={{ animationDelay: `${i * 50}ms`, opacity: 0, display: 'flex', alignItems: 'stretch', minHeight: '84px' }}>

              {/* Thumbnail — clickable */}
              {a.imageUrl ? (
                <ClickableImage
                  src={`${BASE_URL}${a.imageUrl}`}
                  alt={a.title}
                  className="w-full h-full object-cover block"
                  containerClassName="flex-shrink-0"
                  containerStyle={{ width: '96px' }}
                />
              ) : (
                <div className="flex-shrink-0 flex items-center justify-center bg-[var(--bg-muted)] border-r border-[var(--border-card)]" style={{ width: '72px' }}>
                  <ImageIcon size={15} className="text-muted" />
                </div>
              )}

              <div className="flex flex-1 items-center justify-between gap-3 px-4 py-2.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColors[a.category]}`}>{a.category}</span>
                    {a.priority === 'high' && (
                      <span className="flex items-center gap-0.5 text-xs text-red-600 font-bold">
                        <AlertCircle size={10} /> High
                      </span>
                    )}
                    {a.priority === 'medium' && <span className="text-xs text-blue-600 font-semibold">Medium</span>}
                    {pinned.includes(a._id) && (
                      <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold-dim)' }}>
                        <Pin size={9}/> Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-primary truncate">{a.title}</h3>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    By {a.createdBy?.name || 'Admin'} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => togglePin(a._id)}
                    className="p-1.5 rounded-lg transition"
                    style={pinned.includes(a._id)
                      ? { background: 'rgba(201,168,76,0.18)', color: 'var(--gold-dim)' }
                      : { background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                    title={pinned.includes(a._id) ? 'Unpin' : 'Pin to top'}>
                    {pinned.includes(a._id) ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                    title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* ── Pagination ── */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} announcements
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft size={14}/>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition"
                    style={page === i + 1
                      ? { background: 'var(--gold)', color: '#0d1b2a' }
                      : { background: 'var(--bg-muted)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CREATE MODAL ══ */}
      {showCreate && (
        <Modal title="New Announcement" onClose={() => { setShowCreate(false); setCForm(EMPTY); setCImg(null); setCImgPrev(null); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <AnnFields f={cForm} setF={setCForm} />
            <ImageUploadField
              preview={cImgPrev}
              onFileChange={e => pickFile(e.target.files[0], setCImg, setCImgPrev)}
              onRemove={() => { setCImg(null); setCImgPrev(null); }}
            />
            <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={15} className="animate-spin" />Posting...</> : 'Post Announcement'}
            </button>
          </form>
        </Modal>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editItem && (
        <Modal title="Edit Announcement" onClose={() => { setEditItem(null); setEImg(null); setEImgPrev(null); }}>
          <form onSubmit={handleEdit} className="space-y-4">
            <AnnFields f={eForm} setF={setEForm} />
            <ImageUploadField
              preview={eImgPrev}
              onFileChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                setEImg(file);
                setEImgPrev(URL.createObjectURL(file));
                setEImgRemoved(false);
              }}
              onRemove={() => { setEImg(null); setEImgPrev(null); setEImgRemoved(true); }}
              label="Banner Image"
            />
            {eImgRemoved && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X size={11} /> Image will be removed on save
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditItem(null)}
                className="flex-1 py-3 border border-[var(--border-card)] text-secondary rounded-xl font-semibold hover:bg-[var(--bg-card-hover)] transition">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </AdminLayout>
  );
};

export default AdminAnnouncements;
