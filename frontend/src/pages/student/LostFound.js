import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getLostFound, submitLostFound, updateLostFound, deleteLostFound } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, MapPin, Calendar, X, Loader2, ImageIcon, Phone, User, Tag,
         Pencil, Trash2, ChevronDown, CheckCircle2, PackageOpen } from 'lucide-react';
import { ClickableImage } from '../../components/ImageLightbox';

const LF_HERO_BG = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&h=500&q=90';
const BASE_URL   = 'http://localhost:5000';

const STATUS_OPTIONS = [
  { value: 'active',  label: 'Active',  bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  { value: 'claimed', label: 'Claimed', bg: 'rgba(34,197,94,0.1)',   color: '#16a34a', border: 'rgba(34,197,94,0.25)'  },
  { value: 'closed',  label: 'Closed',  bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.25)'},
];
const getStatus = v => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];

const EMPTY_FORM = { title:'', description:'', type:'lost', category:'Other', location:'', date:'', contactInfo:'' };
const CATEGORIES = ['Electronics','Books','Clothing','ID Card','Keys','Bag','Other'];

/* ── Detail + Owner Actions Modal ── */
const DetailModal = ({ item, currentUserId, onClose, onEdit, onDelete, onStatusChange }) => {
  if (!item) return null;
  const isLost  = item.type === 'lost';
  const isOwner = item.submittedBy?._id === currentUserId || item.submittedBy === currentUserId;
  const st      = getStatus(item.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <X size={14} color="#fff"/>
        </button>

        {item.imageUrl ? (
          <ClickableImage src={`${BASE_URL}${item.imageUrl}`} alt={item.title}
            className="w-full object-cover" style={{ maxHeight: '240px', display: 'block' }}/>
        ) : (
          <div className="w-full flex items-center justify-center"
            style={{ height: '120px', background: isLost ? '#FFF1F2' : '#F0FDF4' }}>
            <ImageIcon size={36} color={isLost ? '#FDA4AF' : '#86EFAC'}/>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide"
              style={{ background: isLost ? '#FFF1F2' : '#F0FDF4', color: isLost ? '#BE123C' : '#15803D' }}>
              {item.type}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              {item.category}
            </span>
          </div>

          <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
            {item.title}
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>

          <div className="rounded-xl p-3 space-y-2 mb-4" style={{ background: 'var(--bg-muted)' }}>
            {[
              { icon: MapPin,   val: item.location },
              { icon: Calendar, val: new Date(item.date).toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' }) },
              item.contactInfo && { icon: Phone, val: item.contactInfo },
              item.submittedBy?.name && { icon: User, val: `${item.submittedBy.name} · ${item.submittedBy.department}` },
            ].filter(Boolean).map(({ icon: Icon, val }, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/> {val}
              </div>
            ))}
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="space-y-2 mb-3">
              {/* Status change */}
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Change Status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => onStatusChange(item, s.value)}
                    className="py-2 rounded-xl text-xs font-bold transition-all duration-200"
                    style={item.status === s.value
                      ? { background: s.bg, color: s.color, border: `2px solid ${s.border}` }
                      : { background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '2px solid transparent' }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Edit / Delete */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => { onClose(); onEdit(item); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}>
                  <Pencil size={14}/> Edit
                </button>
                <button onClick={() => onDelete(item)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          )}

          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Report / Edit Form Modal ── */
const FormModal = ({ initial, onClose, onSave, saving }) => {
  const [form, setForm]               = useState(initial || EMPTY_FORM);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const isEdit = !!initial?._id;

  const handleSubmit = e => { e.preventDefault(); onSave(form, imageFile); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="relative rounded-2xl w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', maxHeight: '90vh', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-card)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
            {isEdit ? 'Edit Item' : 'Report Item'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-muted)' }}>
            <X size={14} style={{ color: 'var(--text-muted)' }}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Type</label>
              <div className="relative">
                <select className="input-field w-full appearance-none pr-7" value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
              <div className="relative">
                <select className="input-field w-full appearance-none pr-7" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}/>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Title</label>
            <input className="input-field w-full" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Black Laptop Bag"/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea className="input-field w-full" rows={3} required value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the item..."/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Location</label>
              <input className="input-field w-full" required value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Library"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label>
              <input type="date" className="input-field w-full" required value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Contact (optional)</label>
            <input className="input-field w-full" value={form.contactInfo}
              onChange={e => setForm({ ...form, contactInfo: e.target.value })} placeholder="Phone or email"/>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Photo (optional)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl" style={{ border: '1px solid var(--border-card)' }}/>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md">
                  <X size={12} color="#EF4444"/>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl cursor-pointer"
                style={{ border: '2px dashed var(--border-card)', background: 'var(--bg-muted)' }}>
                <ImageIcon size={22} style={{ color: 'var(--text-muted)', marginBottom: '4px' }}/>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to upload photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                }}/>
              </label>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={15} className="animate-spin"/> Saving...</> : isEdit ? 'Save Changes' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [category, setCategory]   = useState('all');
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [selected, setSelected]   = useState(null);
  const [editItem, setEditItem]   = useState(null);
  const [showForm, setShowForm]   = useState(false);

  const load = () =>
    getLostFound()
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  /* Submit new */
  const handleSubmit = async (form, imageFile) => {
    setSaving(true);
    try {
      let payload = imageFile ? (() => {
        const fd = new FormData();
        Object.entries(form).forEach(([k,v]) => fd.append(k,v));
        fd.append('image', imageFile);
        return fd;
      })() : form;
      await submitLostFound(payload);
      setShowForm(false); load();
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* Edit existing */
  const handleEdit = async (form, imageFile) => {
    setSaving(true);
    try {
      let payload = imageFile ? (() => {
        const fd = new FormData();
        Object.entries(form).forEach(([k,v]) => fd.append(k,v));
        fd.append('image', imageFile);
        return fd;
      })() : form;
      await updateLostFound(editItem._id, payload);
      setEditItem(null); load();
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* Delete */
  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteLostFound(item._id);
      setSelected(null); load();
    } catch(err) { console.error(err); }
  };

  /* Status change */
  const handleStatusChange = async (item, status) => {
    try {
      await updateLostFound(item._id, { status });
      setSelected(null); load();
    } catch(err) { console.error(err); }
  };

  const filtered = items
    .filter(i => filter === 'all' || i.type === filter)
    .filter(i => category === 'all' || i.category === category)
    .filter(i => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    });

  return (
    <Layout>
      {/* HERO */}
      <div className="relative rounded-3xl overflow-hidden mb-7 animate-fade-up"
        style={{ height: '12rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={LF_HERO_BG} alt="Lost & Found" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.78) 0%, rgba(13,27,42,0.65) 55%, rgba(13,27,42,0.50) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-10">
          <div style={{ background: 'rgba(7,13,24,0.60)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', display: 'inline-block', maxWidth: '480px' }}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 w-fit"
            style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Search size={11}/> Campus Items
          </span>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Lost &amp; Found</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)' }}>Report or claim lost items across FOT campus</p>
          </div>
        </div>
        <div className="absolute top-5 right-6">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14}/> Report Item
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','lost','found'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{ background: filter===f ? 'var(--navy)' : 'var(--bg-card)', color: filter===f ? '#0d1b2a' : 'var(--text-secondary)', border: `1px solid ${filter===f ? 'var(--navy)' : 'var(--border-card)'}` }}>
            {f==='all' ? `All (${items.length})` : f==='lost' ? `Lost (${items.filter(i=>i.type==='lost').length})` : `Found (${items.filter(i=>i.type==='found').length})`}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-4 w-full sm:w-80">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, location or category..."
          className="input-field w-full pl-9 text-sm py-2.5"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={category===c
              ? { background: 'var(--gold)', color: '#0d1b2a', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }
              : { background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
            <Tag size={11}/> {c === 'all' ? `All Categories` : c}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl animate-pulse" style={{ height:'180px', background:'var(--bg-muted)' }}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-2xl"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
          <PackageOpen size={36} style={{ color:'var(--text-muted)' }}/>
          <p className="text-sm font-semibold" style={{ color:'var(--text-muted)' }}>
            {search.trim() || category !== 'all' ? 'No items match your search/filter.' : 'No items found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => {
            const isLost  = item.type === 'lost';
            const isOwner = item.submittedBy?._id === user?._id || item.submittedBy === user?._id;
            const st      = getStatus(item.status);
            return (
              <div key={item._id} onClick={() => setSelected(item)}
                className="flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-200"
                style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', boxShadow:'var(--shadow-card)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-hover)'; e.currentTarget.style.borderColor=isLost?'rgba(248,113,113,0.4)':'rgba(34,197,94,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-card)'; e.currentTarget.style.borderColor='var(--border-card)'; }}>

                {/* Image */}
                {item.imageUrl ? (
                  <div className="relative overflow-hidden" style={{ height:'150px' }}>
                    <img src={`${BASE_URL}${item.imageUrl}`} alt={item.title} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }}/>
                    <span className="absolute top-2.5 left-2.5 text-xs font-black px-2.5 py-1 rounded-full uppercase"
                      style={{ background:isLost?'#FFF1F2':'#F0FDF4', color:isLost?'#BE123C':'#15803D' }}>{item.type}</span>
                    {/* Owner badge */}
                    {isOwner && (
                      <span className="absolute top-2.5 right-2.5 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(201,168,76,0.9)', color:'#0d1b2a' }}>Mine</span>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center gap-1 relative"
                    style={{ height:'90px', background:isLost?'#FFF1F2':'#F0FDF4' }}>
                    <ImageIcon size={26} color={isLost?'#FDA4AF':'#86EFAC'}/>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full uppercase"
                      style={{ background:isLost?'#FEE2E2':'#DCFCE7', color:isLost?'#BE123C':'#15803D' }}>{item.type}</span>
                    {isOwner && (
                      <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(201,168,76,0.9)', color:'#0d1b2a' }}>Mine</span>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight line-clamp-1" style={{ color:'var(--text-primary)' }}>{item.title}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                      style={{ background:st.bg, color:st.color }}>{st.label}</span>
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color:'var(--text-muted)' }}>{item.description}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 text-xs"
                    style={{ borderTop:'1px solid var(--border-muted)', color:'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><MapPin size={9}/>{item.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={9}/>{new Date(item.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background:'var(--bg-muted)', color:'var(--text-secondary)' }}>
                      <Tag size={9}/>{item.category}
                    </span>
                  </div>
                  {/* Owner action hint */}
                  {isOwner && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Pencil size={9} style={{ color:'var(--gold)' }}/>
                      <span className="text-xs" style={{ color:'var(--gold)' }}>Tap to edit or change status</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          item={selected}
          currentUserId={user?._id}
          onClose={() => setSelected(null)}
          onEdit={item => setEditItem(item)}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* New Report Form */}
      {showForm && (
        <FormModal
          initial={null}
          onClose={() => setShowForm(false)}
          onSave={handleSubmit}
          saving={saving}
        />
      )}

      {/* Edit Form */}
      {editItem && (
        <FormModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleEdit}
          saving={saving}
        />
      )}
    </Layout>
  );
};

export default LostFound;
