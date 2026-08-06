import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getMyComplaints, getAllComplaints, submitComplaint } from '../../services/api';
import { Plus, MessageSquare, X, CheckCircle2, Loader2, Lock, Globe, Shield, ChevronDown, Users, ImageIcon } from 'lucide-react';
import { ClickableImage } from '../../components/ImageLightbox';

const BASE_URL = 'http://localhost:5000';

const COMP_HERO_BG = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&h=500&q=90';

const statusStyle = {
  pending:     { bg: 'rgba(234,179,8,0.1)',   color: '#ca8a04', border: 'rgba(234,179,8,0.3)',   label: 'Pending'     },
  'in-progress':{ bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.3)',  label: 'In Progress' },
  resolved:    { bg: 'rgba(34,197,94,0.1)',    color: '#16a34a', border: 'rgba(34,197,94,0.3)',   label: 'Resolved'    },
  rejected:    { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626', border: 'rgba(239,68,68,0.3)',   label: 'Rejected'    },
};

const CATEGORIES = ['Academic', 'Facility', 'Staff', 'Administration', 'Other'];

const RECIPIENTS = [
  { value: 'hostel_warden', label: 'Warden' },
  { value: 'union_member',  label: 'Union Member' },
  { value: 'librarian',     label: 'Librarian' },
  { value: 'super_admin',   label: 'Super Admin' },
];

const Complaints = () => {
  const [tab, setTab]           = useState('mine'); // 'mine' | 'all'
  const [items, setItems]       = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    title: '', description: '', category: 'Other',
    isAnonymous: false,
    isPublic: true,   // default: visible to everyone, like announcements
    targetAdminType: '', // who this complaint should be sent to
  });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const load = () =>
    getMyComplaints()
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  const loadAll = () =>
    getAllComplaints()
      .then(r => { setAllItems(r.data); setAllLoading(false); })
      .catch(() => setAllLoading(false));

  useEffect(() => { load(); loadAll(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.targetAdminType) return;
    setSaving(true);
    try {
      const payload = imageFile ? (() => {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('image', imageFile);
        return fd;
      })() : form;
      await submitComplaint(payload);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'Other', isAnonymous: false, isPublic: true, targetAdminType: '' });
      setImageFile(null); setImagePreview(null);
      load(); loadAll();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <Layout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative rounded-3xl overflow-hidden mb-7 animate-fade-up"
        style={{ height: '12rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={COMP_HERO_BG} alt="Complaints" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.78) 0%, rgba(13,27,42,0.65) 55%, rgba(13,27,42,0.50) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-10">
          <div style={{ background: 'rgba(7,13,24,0.60)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', display: 'inline-block', maxWidth: '480px' }}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 w-fit"
            style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <MessageSquare size={11}/> Student Voice
          </span>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Complaints</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)' }}>Submit and track your complaints · Faculty of Technology</p>
          </div>
        </div>
        <div className="absolute top-5 right-6">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14}/> New Complaint
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
      </div>

      {/* ══ TABS ══ */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setTab('mine')}
          className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200"
          style={tab === 'mine'
            ? { background: 'var(--gold)', color: '#0d1b2a' }
            : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
          <MessageSquare size={13}/> My Complaints
        </button>
        <button onClick={() => setTab('all')}
          className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200"
          style={tab === 'all'
            ? { background: 'var(--gold)', color: '#0d1b2a' }
            : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
          <Users size={13}/> All Complaints
        </button>
      </div>

      {/* ══ COMPLAINT LIST ══ */}
      {(tab === 'mine' ? loading : allLoading) ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'var(--bg-card)' }}/>)}
        </div>
      ) : (tab === 'mine' ? items : allItems).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <MessageSquare size={36} style={{ color: 'var(--text-muted)' }}/>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {tab === 'mine' ? 'No complaints submitted yet' : 'No complaints yet'}
          </p>
          {tab === 'mine' && <button onClick={() => setShowForm(true)} className="btn-primary text-xs mt-1">Submit First Complaint</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {(tab === 'mine' ? items : allItems).map((c, i) => {
            const st = statusStyle[c.status] || statusStyle.pending;
            return (
              <div key={c._id} className="p-5 rounded-2xl animate-fade-up"
                style={{ animationDelay: `${i*60}ms`, background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-start justify-between gap-3">
                  {c.imageUrl && (
                    <ClickableImage src={`${BASE_URL}${c.imageUrl}`} alt={c.title}
                      containerClassName="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden" containerStyle={{ border: '1px solid var(--border-card)' }}
                      className="w-full h-full object-cover"/>
                  )}
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
                        {c.category}
                      </span>
                      {c.isAnonymous && (
                        <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
                          <Shield size={9}/> Anonymous
                        </span>
                      )}
                      {/* Visibility badge */}
                      <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={c.isPublic
                          ? { background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }
                          : { background: 'rgba(201,168,76,0.08)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {c.isPublic ? <Globe size={9}/> : <Lock size={9}/>}
                        {c.isPublic ? 'Public' : 'Admin Only'}
                      </span>
                      {c.targetAdminType && (
                        <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <Users size={9}/> To: {RECIPIENTS.find(r => r.value === c.targetAdminType)?.label || c.targetAdminType}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
                      {c.title}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{c.description}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {tab === 'all' && (
                        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {c.submittedBy?.anonymous ? 'Anonymous' : (c.submittedBy?.name || 'Unknown')}{c.submittedBy?.department ? ` · ${c.submittedBy.department}` : ''}
                        </span>
                      )}
                      {tab === 'all' && ' · '}
                      {new Date(c.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {/* Admin reply */}
                    {c.replies?.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl"
                        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: '#3b82f6' }}>
                          <CheckCircle2 size={11}/> Admin Reply
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {c.replies[c.replies.length - 1].message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ SUBMIT FORM MODAL ══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowForm(false)}/>
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border-card)' }}>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
                Submit Complaint
              </h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-card)' }}>
                <X size={14} style={{ color: 'var(--text-muted)' }}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Title</label>
                <input className="input-field w-full" required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief title of your complaint"/>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
                <div className="relative">
                  <select className="input-field w-full appearance-none pr-8"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}/>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input-field w-full" rows={4} required value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your complaint in detail..."/>
              </div>

              {/* Photo */}
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
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to attach evidence photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                    }}/>
                  </label>
                )}
              </div>

              {/* ── RECIPIENT (SEND TO) ── */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Send To</label>
                <div className="relative">
                  <select className="input-field w-full appearance-none pr-8" required
                    value={form.targetAdminType}
                    onChange={e => setForm({ ...form, targetAdminType: e.target.value })}>
                    <option value="" disabled>Select who should receive this complaint</option>
                    {RECIPIENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}/>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Only the admin you pick here (plus the Super Admin) will be able to see and act on this complaint.
                </p>
              </div>

              {/* ── VISIBILITY OPTION ── */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Admin Only */}
                  <button type="button"
                    onClick={() => setForm({ ...form, isPublic: false })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl transition-all duration-200 text-left"
                    style={!form.isPublic
                      ? { background: 'rgba(201,168,76,0.12)', border: '2px solid var(--gold)' }
                      : { background: 'var(--bg-muted)', border: '2px solid transparent' }}>
                    <Lock size={18} style={{ color: !form.isPublic ? 'var(--gold)' : 'var(--text-muted)' }}/>
                    <div className="text-center">
                      <p className="text-xs font-bold" style={{ color: !form.isPublic ? 'var(--gold)' : 'var(--text-primary)' }}>
                        Admin Only
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Only admin can see this
                      </p>
                    </div>
                  </button>

                  {/* Public */}
                  <button type="button"
                    onClick={() => setForm({ ...form, isPublic: true })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl transition-all duration-200 text-left"
                    style={form.isPublic
                      ? { background: 'rgba(34,197,94,0.1)', border: '2px solid #16a34a' }
                      : { background: 'var(--bg-muted)', border: '2px solid transparent' }}>
                    <Globe size={18} style={{ color: form.isPublic ? '#16a34a' : 'var(--text-muted)' }}/>
                    <div className="text-center">
                      <p className="text-xs font-bold" style={{ color: form.isPublic ? '#16a34a' : 'var(--text-primary)' }}>
                        Public
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        All students can see
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Anonymous toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={form.isAnonymous}
                    onChange={e => setForm({ ...form, isAnonymous: e.target.checked })}/>
                  <div className="w-9 h-5 rounded-full transition-colors duration-200"
                    style={{ background: form.isAnonymous ? 'var(--gold)' : 'var(--border-card)' }}/>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: form.isAnonymous ? 'translateX(16px)' : 'translateX(0)' }}/>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Submit anonymously</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your name won't be shown to anyone</p>
                </div>
              </label>

              {/* Submit */}
              <button type="submit" disabled={saving}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={15} className="animate-spin"/> Submitting...</> : 'Submit Complaint'}
              </button>

            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Complaints;
