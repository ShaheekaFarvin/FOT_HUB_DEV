import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getRegConfigs, upsertRegConfig, deleteRegConfig,
  getAdminLimits, updateAdminLimits,
} from '../../services/api';
import {
  Plus, Trash2, Save, Edit2, X, Users, Home,
  ShieldCheck, AlertCircle, CheckCircle2, Loader2, Settings, BookOpen,
} from 'lucide-react';

const DEPARTMENTS = ['ICT', 'ENT', 'BST'];
const YEARS       = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// ── 3 Faculty groupings ─────────────────────────────────────────────
const FACULTY_GROUPS = [
  {
    id:      'ICT',
    label:   'ICT — Information & Communication Technology',
    sub:     'ICT',
    depts:   ['ICT'],
    color:   'text-blue-700',
    bg:      'bg-blue-50',
    border:  'border-blue-300',
    headBg:  'bg-blue-100',
  },
  {
    id:      'ENT',
    label:   'ENT — Engineering Technology',
    sub:     'EET · MTT',
    depts:   ['ENT'],
    color:   'text-amber-700',
    bg:      'bg-amber-50',
    border:  'border-amber-300',
    headBg:  'bg-amber-100',
  },
  {
    id:      'BST',
    label:   'BST — Biosystems Technology',
    sub:     'BPT · FDT',
    depts:   ['BST'],
    color:   'text-green-700',
    bg:      'bg-green-50',
    border:  'border-green-300',
    headBg:  'bg-green-100',
  },
];

const YEAR_COLOR = {
  '1st Year': { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  '2nd Year': { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  '3rd Year': { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  '4th Year': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

// ── empty form state ──
const EMPTY = { department: '', year: '', prefix: '', minSeq: 1, maxSeq: '', isActive: true };

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-bold text-primary mb-1">
      {label}{hint && <span className="ml-1 text-muted font-normal text-xs">({hint})</span>}
    </label>
    {children}
  </div>
);

const RegistrationConfig = () => {
  const { user } = useAuth();

  const [configs,  setConfigs]  = useState([]);
  const [limits,   setLimits]   = useState({ wardenLimit: 10, unionLimit: 20, librarianLimit: 5, wardenCount: 0, unionCount: 0, librarianCount: 0 });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [limSaving,setLimSaving]= useState(false);

  // form for dept+year config
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null); // not used for upsert but for highlight
  const [showForm, setShowForm] = useState(false);

  // local limits form
  const [limForm, setLimForm]   = useState({ wardenLimit: 10, unionLimit: 20, librarianLimit: 5 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, limRes] = await Promise.all([getRegConfigs(), getAdminLimits()]);
      setConfigs(cfgRes.data);
      setLimits(limRes.data);
      setLimForm({ wardenLimit: limRes.data.wardenLimit, unionLimit: limRes.data.unionLimit, librarianLimit: limRes.data.librarianLimit });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Submit dept+year config ──
  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertRegConfig({
        ...form,
        minSeq: Number(form.minSeq),
        maxSeq: Number(form.maxSeq),
      });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  };

  // ── Edit: pre-fill form ──
  const handleEdit = cfg => {
    setForm({
      department: cfg.department,
      year:       cfg.year,
      prefix:     cfg.prefix,
      minSeq:     cfg.minSeq,
      maxSeq:     cfg.maxSeq,
      isActive:   cfg.isActive,
    });
    setEditId(cfg._id);
    setShowForm(true);
    setTimeout(() => document.getElementById('reg-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // ── Delete ──
  const handleDelete = async id => {
    if (!window.confirm('Delete this configuration?')) return;
    await deleteRegConfig(id);
    await load();
  };

  // ── Save admin limits ──
  const handleLimSave = async e => {
    e.preventDefault();
    setLimSaving(true);
    try {
      await updateAdminLimits(limForm);
      await load();
    } finally { setLimSaving(false); }
  };

  // ── Auto-derive prefix suggestion ──
  const derivedPrefix = form.department && form.year
    ? `${form.department}/${new Date().getFullYear()}`
    : '';

  if (user?.adminType !== 'super_admin') {
    return (
      <AdminLayout title="Registration Config" subtitle="Access restricted">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldCheck size={40} className="text-muted mx-auto mb-3 opacity-40" />
            <p className="text-primary font-bold">Super Admin access required</p>
            <p className="text-muted text-sm mt-1">Only Super Admins can manage registration settings.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Group configs by individual department code
  const byDept = DEPARTMENTS.reduce((acc, d) => {
    acc[d] = configs.filter(c => c.department === d);
    return acc;
  }, {});

  return (
    <AdminLayout title="Registration Settings" subtitle="Control registration number ranges and admin account limits">

      {/* ══ Admin Count Limits ══════════════════════════════════════════ */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#0d1b2a] flex items-center justify-center">
            <Settings size={17} className="text-[#c9a84c]" />
          </div>
          <div>
            <h2 className="font-bold text-primary" style={{ fontFamily: 'Playfair Display,serif' }}>Admin Account Limits</h2>
            <p className="text-xs text-muted">Maximum number of each admin type allowed to register</p>
          </div>
        </div>

        <form onSubmit={handleLimSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

            {/* Warden limit */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Home size={16} className="text-blue-600" />
                <p className="font-bold text-blue-800 text-sm">Hostel Wardens</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-blue-600 font-medium block mb-1">Max allowed</label>
                  <input type="number" min={limits.wardenCount} value={limForm.wardenLimit}
                    onChange={e => setLimForm(f => ({ ...f, wardenLimit: e.target.value }))}
                    className="input-field text-center font-bold text-lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-500 mb-1">Currently</p>
                  <div className={`text-2xl font-black ${limits.wardenCount >= limForm.wardenLimit ? 'text-red-600' : 'text-blue-700'}`}>
                    {limits.wardenCount}
                  </div>
                  <p className="text-xs text-blue-400">registered</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 rounded-full bg-blue-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (limits.wardenCount / (limForm.wardenLimit || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-blue-500 mt-1 text-right">
                {Math.max(0, limForm.wardenLimit - limits.wardenCount)} slots remaining
              </p>
            </div>

            {/* Union limit */}
            <div className="p-4 rounded-2xl border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-green-600" />
                <p className="font-bold text-green-800 text-sm">Union Members</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-green-600 font-medium block mb-1">Max allowed</label>
                  <input type="number" min={limits.unionCount} value={limForm.unionLimit}
                    onChange={e => setLimForm(f => ({ ...f, unionLimit: e.target.value }))}
                    className="input-field text-center font-bold text-lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-500 mb-1">Currently</p>
                  <div className={`text-2xl font-black ${limits.unionCount >= limForm.unionLimit ? 'text-red-600' : 'text-green-700'}`}>
                    {limits.unionCount}
                  </div>
                  <p className="text-xs text-green-400">registered</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-green-200 overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (limits.unionCount / (limForm.unionLimit || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-green-500 mt-1 text-right">
                {Math.max(0, limForm.unionLimit - limits.unionCount)} slots remaining
              </p>
            </div>

            {/* Librarian limit */}
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-purple-600" />
                <p className="font-bold text-purple-800 text-sm">Librarians</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-purple-600 font-medium block mb-1">Max allowed</label>
                  <input type="number" min={limits.librarianCount} value={limForm.librarianLimit}
                    onChange={e => setLimForm(f => ({ ...f, librarianLimit: e.target.value }))}
                    className="input-field text-center font-bold text-lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-purple-500 mb-1">Currently</p>
                  <div className={`text-2xl font-black ${limits.librarianCount >= limForm.librarianLimit ? 'text-red-600' : 'text-purple-700'}`}>
                    {limits.librarianCount}
                  </div>
                  <p className="text-xs text-purple-400">registered</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-purple-200 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (limits.librarianCount / (limForm.librarianLimit || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-purple-500 mt-1 text-right">
                {Math.max(0, limForm.librarianLimit - limits.librarianCount)} slots remaining
              </p>
            </div>
          </div>

          <button type="submit" disabled={limSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition"
            style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c' }}>
            {limSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Limits
          </button>
        </form>
      </div>

      {/* ══ Dept + Year Configs ═════════════════════════════════════════ */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d1b2a] flex items-center justify-center">
              <ShieldCheck size={17} className="text-[#c9a84c]" />
            </div>
            <div>
              <h2 className="font-bold text-primary" style={{ fontFamily: 'Playfair Display,serif' }}>Registration Number Ranges</h2>
              <p className="text-xs text-muted">Set valid reg number ranges per department & batch year</p>
            </div>
          </div>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(s => !s); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition"
            style={{ background: showForm ? '#fee2e2' : 'linear-gradient(135deg,#0d1b2a,#243b6a)',
                     color: showForm ? '#dc2626' : '#c9a84c' }}>
            {showForm ? <><X size={14} />Cancel</> : <><Plus size={14} />Add Config</>}
          </button>
        </div>

        {/* ── Form ── */}
        {showForm && (
          <form id="reg-form" onSubmit={handleSave}
            className="mb-6 p-5 rounded-2xl border-2 border-[#c9a84c]/30 bg-gradient-to-br from-[#0d1b2a]/5 to-transparent">
            <p className="font-bold text-primary text-sm mb-4">
              {editId ? '✏️ Edit Configuration' : '➕ New Configuration'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Department">
                <select className="input-field" value={form.department} required
                  onChange={e => {
                    const dept = e.target.value;
                    const autoPrefix = dept ? `${dept}/${new Date().getFullYear()}` : '';
                    setForm(f => ({ ...f, department: dept, prefix: f.prefix || autoPrefix }));
                  }}>
                  <option value="">Select department</option>
                  <option value="ICT">ICT</option>
                  <option value="ENT">ENT</option>
                  <option value="BST">BST</option>
                </select>
              </Field>
              <Field label="Year / Batch">
                <select className="input-field" value={form.year} required
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Prefix" hint={`e.g. ${derivedPrefix || 'ICT/2024'}`}>
                <input className="input-field" value={form.prefix} required
                  placeholder={derivedPrefix || 'ICT/2024'}
                  onChange={e => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} />
                <p className="text-xs text-muted mt-1">
                  → Reg numbers will be <strong>{form.prefix || derivedPrefix}/001</strong> to <strong>{form.prefix || derivedPrefix}/{String(form.maxSeq || 'N').padStart(3,'0')}</strong>
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Seq" hint="usually 1">
                  <input type="number" min={1} className="input-field" value={form.minSeq} required
                    onChange={e => setForm(f => ({ ...f, minSeq: e.target.value }))} />
                </Field>
                <Field label="Max Seq" hint="e.g. 124">
                  <input type="number" min={2} className="input-field" value={form.maxSeq} required
                    placeholder="124"
                    onChange={e => setForm(f => ({ ...f, maxSeq: e.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-[#c9a84c]" />
              <label htmlFor="isActive" className="text-sm text-primary font-medium cursor-pointer">
                Active (enforce this rule during registration)
              </label>
            </div>
            {/* Preview */}
            {form.prefix && form.maxSeq && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs">
                  Students in <strong>{form.department || '?'} {form.year || '?'}</strong> must register with
                  numbers <strong>{form.prefix}/{String(form.minSeq).padStart(3,'0')}</strong> to <strong>{form.prefix}/{String(form.maxSeq).padStart(3,'0')}</strong>.
                  Total: <strong>{Math.max(0, form.maxSeq - form.minSeq + 1)}</strong> students allowed.
                </p>
              </div>
            )}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editId ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </form>
        )}

        {/* ── Configs grouped by Faculty ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />)}
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck size={36} className="text-muted opacity-30 mx-auto mb-3" />
            <p className="text-primary font-bold">No configurations yet</p>
            <p className="text-muted text-sm mt-1">Add a config to restrict registration numbers per batch</p>
          </div>
        ) : (
          <div className="space-y-6">
            {FACULTY_GROUPS.map(fg => {
              // collect all configs that belong to this faculty group
              const groupConfigs = fg.depts.flatMap(d => byDept[d] || []);
              if (groupConfigs.length === 0) return null;

              return (
                <div key={fg.id}>
                  {/* Faculty header */}
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3 ${fg.headBg} border ${fg.border}`}>
                    <span className={`text-sm font-black ${fg.color}`}>{fg.id}</span>
                    <span className={`text-xs font-medium ${fg.color} opacity-70`}>{fg.label.split('—')[1]?.trim()}</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${fg.color}`}>
                      {fg.sub}
                    </span>
                  </div>

                  {/* Cards — one per dept+year config inside this faculty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pl-2">
                    {fg.depts.map(dept =>
                      (byDept[dept] || []).map(cfg => {
                        const col = YEAR_COLOR[cfg.year] || YEAR_COLOR['1st Year'];
                        return (
                          <div key={cfg._id} className={`rounded-2xl border-2 p-4 ${col.bg} ${col.border} relative`}>
                            {!cfg.isActive && (
                              <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                            )}
                            {/* dept badge */}
                            <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-lg mb-2 bg-white/70 ${fg.color}`}>
                              {dept}
                            </span>
                            <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${col.text}`}>{cfg.year}</p>
                            <p className={`font-black text-sm ${col.text}`}>{cfg.prefix}</p>
                            <p className={`text-xs mt-1 ${col.text} opacity-80`}>
                              {String(cfg.minSeq).padStart(3,'0')} → {String(cfg.maxSeq).padStart(3,'0')}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${col.text}`}>
                              {cfg.maxSeq - cfg.minSeq + 1} seats
                            </p>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleEdit(cfg)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold ${col.text} bg-white/60 hover:bg-white transition`}>
                                <Edit2 size={11} /> Edit
                              </button>
                              <button onClick={() => handleDelete(cfg._id)}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RegistrationConfig;
