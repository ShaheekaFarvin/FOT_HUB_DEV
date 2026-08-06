import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../../components/BrandMark';
import {
  AlertCircle, Loader2, CheckCircle2, GraduationCap, Shield,
  ChevronRight, Eye, EyeOff, Home, Users, Crown, ChevronLeft,
  Mail, RefreshCw, BookOpen,
} from 'lucide-react';

// ── Constants ───────────────────────────────────────────────────────────────
const EMAIL_DOMAIN = '@tec.rjt.ac.lk';

const DEPARTMENTS = ['BPT', 'EET', 'FDT', 'ICT', 'MTT'];

// 1st year: 3 faculty groups shown as ICT / ENT / BST
const FACULTY_GROUPS_1ST = [
  { id: 'ICT', label: 'ICT',  depts: ['ICT'] },
  { id: 'ENT', label: 'ENT',  depts: ['EET', 'MTT'] },
  { id: 'BST', label: 'BST',  depts: ['BPT', 'FDT'] },
];

// 2nd–4th year: all 5 actual departments
const FACULTY_GROUPS_SENIOR = [
  { id: 'ICT', label: 'ICT (Information & Communication Technology)', depts: ['ICT'] },
  { id: 'EET', label: 'EET (Electrical Engineering Technology)',       depts: ['EET'] },
  { id: 'MTT', label: 'MTT (Mechatronics Technology)',                depts: ['MTT'] },
  { id: 'BPT', label: 'BPT (Biosystems & Plant Technology)',          depts: ['BPT'] },
  { id: 'FDT', label: 'FDT (Food & Dairy Technology)',                depts: ['FDT'] },
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const HOSTELS = [
  'Mihinthale Hostel',
  'Vijitha Hostel',
  'Thilaka Hostel',
  'Sumedha Hostel',
  'Ladies Hostel A',
  'Ladies Hostel B',
];

const UNION_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Sports Secretary',
  'Cultural Secretary',
  'Editor',
  'Committee Member',
];

// Admin type definitions — icon, label, description, what they can/cannot do
const ADMIN_TYPES = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    desc: 'Full system access — all modules',
    icon: Crown,
    color: '#c9a84c',
    bg: 'from-[#0d1b2a] to-[#1a2f4a]',
    border: 'border-[#c9a84c]',
    can: ['Announcements', 'Complaints', 'Elections', 'User management'],
    cannot: [],
  },
  {
    id: 'hostel_warden',
    label: 'Hostel Warden',
    desc: 'Manages hostel announcements & complaints',
    icon: Home,
    color: '#2563eb',
    bg: 'from-blue-900 to-blue-800',
    border: 'border-blue-500',
    can: ['Announcements', 'Complaints'],
    cannot: ['Elections'],
  },
  {
    id: 'librarian',
    label: 'Librarian',
    desc: 'Manages library announcements & complaints',
    icon: BookOpen,
    color: '#7c3aed',
    bg: 'from-purple-900 to-purple-800',
    border: 'border-purple-500',
    can: ['Announcements', 'Complaints'],
    cannot: ['Elections'],
  },
  {
    id: 'union_member',
    label: 'Union Member',
    desc: 'Full access — all modules',
    icon: Users,
    color: '#16a34a',
    bg: 'from-green-900 to-green-800',
    border: 'border-green-500',
    can: ['Elections', 'Announcements', 'Complaints'],
    cannot: [],
  },
];

// ── Small helpers ────────────────────────────────────────────────────────────
const Field = ({ label, hint, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-primary mb-1.5">
      {label}
      {hint && <span className="ml-1 text-muted font-normal">({hint})</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
        <AlertCircle size={10} />{error}
      </p>
    )}
  </div>
);

const Select = ({ children, ...props }) => (
  <select className="input-field" {...props}>{children}</select>
);

// ── Step indicator (4 steps now) ─────────────────────────────────────────────
const Steps = ({ step }) => {
  const labels = ['Role', 'Type / Details', 'Confirm', 'Verify Email'];
  return (
    <div className="flex items-center justify-center gap-1 mb-7">
      {labels.map((lbl, i) => {
        const s = i + 1;
        const done = step > s;
        const active = step === s;
        return (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
              active ? 'bg-[#0d1b2a] text-[#c9a84c]'
              : done  ? 'bg-green-50 text-green-700'
              : 'bg-[var(--bg-muted)] text-muted'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-black ${
                done   ? 'bg-green-500 text-white'
                : active ? 'bg-[#c9a84c] text-[#0d1b2a]'
                : 'bg-[var(--bg-muted)] text-muted'
              }`}>
                {done ? '✓' : s}
              </span>
              <span className="hidden sm:inline">{lbl}</span>
            </div>
            {s < labels.length && (
              <div className={`w-5 h-0.5 rounded-full transition-all duration-300 ${step > s ? 'bg-green-400' : 'bg-[var(--bg-muted)]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Role Card (Step 1) ────────────────────────────────────────────────────────
const RoleCard = ({ roleId, selected, onClick }) => {
  const isAdmin = roleId === 'admin';
  return (
    <button type="button" onClick={onClick}
      className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        selected
          ? isAdmin
            ? 'border-[#c9a84c] bg-gradient-to-br from-[#0d1b2a] to-[#1a2f4a]'
            : 'border-blue-500 bg-blue-50'
          : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold)]'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            selected ? isAdmin ? 'bg-[#c9a84c]' : 'bg-blue-500' : 'bg-[var(--bg-muted)]'
          }`}>
            {isAdmin
              ? <Shield size={20} className={selected ? 'text-[#0d1b2a]' : 'text-muted'} />
              : <GraduationCap size={20} className={selected ? 'text-white' : 'text-muted'} />}
          </div>
          <div>
            <p className={`font-bold text-sm ${selected && isAdmin ? 'text-white' : 'text-primary'}`}>
              {isAdmin ? 'Admin' : 'Student'}
            </p>
            <p className={`text-xs mt-0.5 ${selected && isAdmin ? 'text-white/60' : 'text-muted'}`}>
              {isAdmin ? 'Staff / Administrator' : 'Undergraduate student'}
            </p>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected
            ? isAdmin ? 'border-[#c9a84c] bg-[#c9a84c]' : 'border-blue-500 bg-blue-500'
            : 'border-[var(--border-card)]'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
};

// ── Admin Type Card (Step 2 for admins) ──────────────────────────────────────
const AdminTypeCard = ({ type, selected, onClick }) => {
  const Icon = type.icon;
  return (
    <button type="button" onClick={onClick}
      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        selected
          ? `${type.border} bg-gradient-to-br ${type.bg}`
          : 'border-[var(--border-card)] bg-[var(--bg-card)]'
      }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          selected ? 'bg-white/20' : 'bg-[var(--bg-muted)]'
        }`}>
          <Icon size={18} className={selected ? 'text-white' : 'text-muted'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${selected ? 'text-white' : 'text-primary'}`}>{type.label}</p>
          <p className={`text-xs mt-0.5 ${selected ? 'text-white/70' : 'text-muted'}`}>{type.desc}</p>
          {/* Access badges — only shown when selected */}
          {selected && (
            <div className="flex flex-wrap gap-1 mt-2">
              {type.can.map(c => (
                <span key={c} className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-400/30 text-green-200">
                  ✓ {c}
                </span>
              ))}
              {type.cannot.map(c => (
                <span key={c} className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-red-400/20 text-red-200">
                  ✗ {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          selected ? 'border-white bg-white' : 'border-[var(--border-card)]'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full" style={{ background: type.color }} />}
        </div>
      </div>
    </button>
  );
};

// ── Password strength ────────────────────────────────────────────────────────
const PwStrength = ({ pw }) => {
  if (!pw) return null;
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
          pw.length >= i * 3
            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
            : 'bg-[var(--bg-muted)]'
        }`} />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Register Component
// ═══════════════════════════════════════════════════════════════════════════════
const Register = () => {
  const [step, setStep]         = useState(1);
  const [role, setRole]         = useState('');
  const [adminType, setAdminType] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [indexErr, setIndexErr] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [otp, setOtp]           = useState('');
  const [countdown, setCountdown] = useState(0);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    registrationNumber: '', indexNumber: '',
    department: '', year: '',
    isHosteller: false, hostelName: '',
    wardenId: '', wardenHostel: '',
    unionId: '', unionPosition: '',
    libraryId: '',
  });

  const { sendRegisterOtp, verifyRegisterOtp, resendOtp, loading, error } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onChange = e => {
    const { name, value, type: t, checked } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: t === 'checkbox' ? checked : value };
      // Auto-derive email from registration number (student)
      // ITT/2023/001 → itt2023001@tec.rjt.ac.lk
      if (name === 'registrationNumber') {
        const derived = value.replace(/\//g, '').toLowerCase();
        updated.email = derived ? `${derived}${EMAIL_DOMAIN}` : '';
      }
      // Auto-derive email from warden ID (hostel_warden)
      // WDN/2024/001 → wdn2024001@tec.rjt.ac.lk
      if (name === 'wardenId') {
        const derived = value.replace(/\//g, '').toLowerCase();
        updated.email = derived ? `${derived}${EMAIL_DOMAIN}` : '';
      }
      // Auto-derive email from library ID (librarian)
      // LIB/2024/001 → lib2024001@tec.rjt.ac.lk
      if (name === 'libraryId') {
        const derived = value.replace(/\//g, '').toLowerCase();
        updated.email = derived ? `${derived}${EMAIL_DOMAIN}` : '';
      }
      return updated;
    });
    if (name === 'indexNumber') {
      setIndexErr(value && !/^\d{4}$/.test(value)
        ? 'Index number must be exactly 4 digits (e.g. 2406)' : '');
    }
  };

  // ── Step navigation ──
  const goStep2 = () => {
    if (!role) return;
    setStep(2);
  };

  const goStep3 = () => {
    if (role === 'admin' && !adminType) return;
    setStep(3);
  };

  // ── Submit — now sends OTP, moves to step 4 ──
  const handleSubmit = async e => {
    e.preventDefault();
    if (emailErr || indexErr) return;
    try {
      const FIRST_YEAR_DEPT_MAP = { ENT: 'EET', BST: 'BPT', ICT: 'ICT' };
      const resolvedDept = form.year === '1st Year'
        ? (FIRST_YEAR_DEPT_MAP[form.department] || form.department)
        : form.department;
      const data = await sendRegisterOtp({ ...form, department: resolvedDept, role, adminType: role === 'admin' ? adminType : undefined });
      setSentEmail(data.email || form.email);
      setStep(4);
      setCountdown(60);
    } catch {}
  };

  // ── OTP verification ──
  const handleVerifyOtp = async e => {
    e.preventDefault();
    try {
      await verifyRegisterOtp(sentEmail, otp.trim());
      navigate('/dashboard');
    } catch {}
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      await resendOtp(sentEmail);
      setCountdown(60);
      setOtp('');
    } catch {}
  };

  // ── Computed ──
  const selectedAdminType = ADMIN_TYPES.find(t => t.id === adminType);

  // ── Badge at top of step 2/3 ──
  const RoleBadge = () => (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <button type="button" onClick={() => { setStep(1); setRole(''); setAdminType(''); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
          role === 'admin' ? 'bg-[#0d1b2a] text-[#c9a84c]' : 'bg-blue-50 text-blue-700'
        }`}>
        {role === 'admin' ? <Shield size={12} /> : <GraduationCap size={12} />}
        {role === 'admin' ? 'Admin' : 'Student'}
        <span className="ml-0.5 opacity-60 font-normal underline">change</span>
      </button>
      {role === 'admin' && adminType && step === 3 && (
        <button type="button" onClick={() => setStep(2)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: selectedAdminType?.color + '22', color: selectedAdminType?.color }}>
          {selectedAdminType && <selectedAdminType.icon size={12} />}
          {selectedAdminType?.label}
          <span className="ml-0.5 opacity-60 font-normal underline">change</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: 'DM Sans,system-ui,sans-serif', background: 'var(--bg-page)' }}>

      {/* BG blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#0d1b2a]/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#c9a84c]/5 blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-up" style={{ opacity: 0 }}>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <BrandMark size={56} radius="rounded-2xl" variant="navy" />
          </div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display,serif' }}>
            Create Account
          </h1>
          <p className="text-secondary text-sm mt-1">FOT Student Hub · Rajarata University</p>
        </div>

        <Steps step={step} />

        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-card)] p-6">

          {/* ══ STEP 1 — Role select ══ */}
          {step === 1 && (
            <div>
              <p className="text-sm font-bold text-primary mb-4 text-center">I am registering as a…</p>
              <div className="space-y-3 mb-6">
                <RoleCard roleId="student" selected={role === 'student'} onClick={() => setRole('student')} />
                <RoleCard roleId="admin"   selected={role === 'admin'}   onClick={() => setRole('admin')} />
              </div>
              <button type="button" disabled={!role} onClick={goStep2}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={role ? {
                  background: 'linear-gradient(135deg,#0d1b2a,#243b6a)',
                  color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)',
                } : { background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                Continue as {role || '…'} <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ══ STEP 2 — Admin type picker OR student detail form ══ */}
          {step === 2 && (
            <div>
              <RoleBadge />

              {/* Email notice */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs">
                  Only <strong>{EMAIL_DOMAIN}</strong> campus emails are permitted.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              {/* ── ADMIN: pick admin type first ── */}
              {role === 'admin' && (
                <div>
                  <p className="text-xs font-bold text-primary mb-3">Select your admin role:</p>
                  <div className="space-y-3 mb-5">
                    {ADMIN_TYPES.map(t => (
                      <AdminTypeCard key={t.id} type={t} selected={adminType === t.id}
                        onClick={() => setAdminType(t.id)} />
                    ))}
                  </div>
                  <button type="button" disabled={!adminType} onClick={goStep3}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={adminType ? {
                      background: 'linear-gradient(135deg,#0d1b2a,#243b6a)',
                      color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)',
                    } : { background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {/* ── STUDENT: fill all details here ── */}
              {role === 'student' && (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Full name */}
                  <Field label="Full Name">
                    <input name="name" value={form.name} onChange={onChange} required
                      placeholder="e.g. Mohamed Siyam" className="input-field" />
                  </Field>

                  {/* Registration Number — email auto-derived from this */}
                  <Field label="Registration Number">
                    <input name="registrationNumber" value={form.registrationNumber}
                      onChange={onChange} required placeholder="e.g. ITT/2022/001"
                      className="input-field uppercase" style={{ textTransform: 'uppercase' }} />
                  </Field>

                  {/* Campus email — auto-filled, read-only */}
                  <Field label="Campus Email">
                    <div className={`input-field flex items-center gap-2 pr-3 ${form.email ? 'bg-green-50 border-green-400' : 'bg-[var(--bg-muted)]'}`}
                      style={{ cursor: 'default' }}>
                      <span className={`flex-1 text-sm truncate ${form.email ? 'text-green-700 font-medium' : 'text-muted'}`}>
                        {form.email || `Auto-filled from registration number`}
                      </span>
                      {form.email && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
                    </div>

                  </Field>

                  {/* Index Number */}
                  <Field label="Index Number" error={indexErr}>
                    <input
                      name="indexNumber"
                      value={form.indexNumber}
                      onChange={onChange}
                      required
                      maxLength={4}
                      inputMode="numeric"
                      pattern="\d{4}"
                      placeholder="e.g. 2406"
                      className={`input-field ${indexErr ? 'border-red-400 bg-red-50' : form.indexNumber.length === 4 && !indexErr ? 'border-green-400' : ''}`}
                    />
                    {!indexErr && form.indexNumber.length === 4 && (
                      <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 size={10} />Valid index number
                      </p>
                    )}
                  </Field>

                  {/* Year + Department — year first, dept options depend on year */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Year">
                      <Select name="year" value={form.year} onChange={e => {
                        setForm(f => ({ ...f, year: e.target.value, department: '' }));
                      }} required>
                        <option value="">Select year</option>
                        {YEARS.map(y => <option key={y}>{y}</option>)}
                      </Select>
                    </Field>
                    <Field label="Department">
                      <Select name="department" value={form.department} onChange={onChange} required disabled={!form.year}>
                        <option value="">Select dept.</option>
                        {form.year === '1st Year' ? (
                          <>
                            <option value="ICT">ICT</option>
                            <option value="ENT">ENT</option>
                            <option value="BST">BST</option>
                          </>
                        ) : form.year ? (
                          <>
                            <option value="ICT">ICT</option>
                            <option value="EET">EET</option>
                            <option value="MTT">MTT</option>
                            <option value="BPT">BPT</option>
                            <option value="FDT">FDT</option>
                          </>
                        ) : null}
                      </Select>
                    </Field>
                  </div>

                  {/* Hosteller toggle */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-muted)] rounded-xl">
                    <input type="checkbox" id="isHosteller" name="isHosteller"
                      checked={form.isHosteller} onChange={onChange}
                      className="w-4 h-4 accent-[#c9a84c] cursor-pointer" />
                    <label htmlFor="isHosteller" className="text-sm font-medium text-primary cursor-pointer select-none">
                      I am a hosteller
                    </label>
                  </div>

                  {/* Hostel name — shown only if hosteller */}
                  {form.isHosteller && (
                    <Field label="Hostel Name">
                      <Select name="hostelName" value={form.hostelName} onChange={onChange} required>
                        <option value="">Select hostel</option>
                        {HOSTELS.map(h => <option key={h}>{h}</option>)}
                      </Select>
                    </Field>
                  )}

                  {/* Password */}
                  <Field label="Password">
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'}
                        name="password" value={form.password} onChange={onChange} required
                        placeholder="Minimum 6 characters" className="input-field pr-10" />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PwStrength pw={form.password} />
                  </Field>

                  <button type="submit" disabled={loading || !!emailErr || !!indexErr}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-2"
                    style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" />Creating Account…</>
                      : <>Create Student Account</>}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ══ STEP 3 — Admin detail form (after picking adminType) ══ */}
          {step === 3 && role === 'admin' && (
            <div>
              <RoleBadge />

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full name */}
                <Field label="Full Name">
                  <input name="name" value={form.name} onChange={onChange} required
                    placeholder="e.g. Dr. Pradeep Silva" className="input-field" />
                </Field>

                {/* Campus email — auto for warden/librarian, manual for others */}
                {(adminType === 'hostel_warden' || adminType === 'librarian') ? (
                  <Field label="Campus Email">
                    <div className={`input-field flex items-center gap-2 pr-3 ${form.email ? 'bg-green-50 border-green-400' : 'bg-[var(--bg-muted)]'}`}
                      style={{ cursor: 'default' }}>
                      <span className={`flex-1 text-sm truncate ${form.email ? 'text-green-700 font-medium' : 'text-muted'}`}>
                        {form.email || `Auto-filled from ${adminType === 'librarian' ? 'Library ID' : 'Warden ID'}`}
                      </span>
                      {form.email && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted mt-1"> Derived automatically from {adminType === 'librarian' ? 'Library ID' : 'Warden ID'}</p>
                  </Field>
                ) : (
                  <Field label="Campus Email" error={emailErr}>
                    <input type="email" name="email" value={form.email} onChange={onChange} required
                      placeholder={`yourname${EMAIL_DOMAIN}`}
                      className={`input-field ${emailErr ? 'border-red-400 bg-red-50' : ''}`} />
                    {!emailErr && form.email.endsWith(EMAIL_DOMAIN) && (
                      <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 size={10} />Valid campus email
                      </p>
                    )}
                  </Field>
                )}

                {/* ── Hostel Warden fields ── */}
                {adminType === 'hostel_warden' && (
                  <>
                    <Field label="Warden ID" hint="unique — email auto-derived from this">
                      <input name="wardenId" value={form.wardenId} onChange={onChange} required
                        placeholder="e.g. WDN/2024/001"
                        className="input-field" style={{ textTransform: 'uppercase' }} />
                    </Field>
                  </>
                )}

                {/* ── Union Member fields ── */}
                {adminType === 'union_member' && (
                  <>
                    <Field label="Union Member ID" hint="unique">
                      <input name="unionId" value={form.unionId} onChange={onChange} required
                        placeholder="e.g. UNI/2024/001" className="input-field" />
                    </Field>
                    <Field label="Position in Union">
                      <Select name="unionPosition" value={form.unionPosition} onChange={onChange} required>
                        <option value="">Select position</option>
                        {UNION_POSITIONS.map(p => <option key={p}>{p}</option>)}
                      </Select>
                    </Field>
                  </>
                )}

                {/* ── Librarian fields ── */}
                {adminType === 'librarian' && (
                  <Field label="Library ID" hint="unique — email auto-derived from this">
                    <input name="libraryId" value={form.libraryId} onChange={onChange} required
                      placeholder="e.g. LIB/2024/001"
                      className="input-field" style={{ textTransform: 'uppercase' }} />
                  </Field>
                )}

                {/* Hostel managed — after email so order is: wardenId → email → hostel */}
                {adminType === 'hostel_warden' && (
                  <Field label="Hostel Managed">
                    <Select name="wardenHostel" value={form.wardenHostel} onChange={onChange} required>
                      <option value="">Select hostel</option>
                      {HOSTELS.map(h => <option key={h}>{h}</option>)}
                    </Select>
                  </Field>
                )}

                {/* ── Super Admin — no extra fields needed ── */}
                {adminType === 'super_admin' && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                    <p className="text-amber-700 text-xs">
                      Super Admin has full system access. Make sure this account is for an authorized staff member.
                    </p>
                  </div>
                )}

                {/* Password */}
                <Field label="Password">
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'}
                      name="password" value={form.password} onChange={onChange} required
                      placeholder="Minimum 6 characters" className="input-field pr-10" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <PwStrength pw={form.password} />
                </Field>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center gap-1 px-4 py-3 rounded-xl border border-[var(--border-card)] text-sm font-medium text-secondary hover:bg-[var(--bg-muted)] transition">
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="submit" disabled={loading || !!emailErr}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" />Creating…</>
                      : <>Create {selectedAdminType?.label} Account</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══ STEP 4 — OTP Verification ══ */}
          {step === 4 && (
            <div>
              {/* Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a2f4a)' }}>
                  <Mail size={26} style={{ color: '#c9a84c' }}/>
                </div>
                <h2 className="text-xl font-bold text-center mb-1" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                  Verify Your Email
                </h2>
                <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                  A 6-digit OTP was sent to
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: '#c9a84c' }}>{sentEmail}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">Enter OTP Code</label>
                  <input
                    type="text" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} inputMode="numeric" pattern="\d{6}"
                    placeholder="• • • • • •"
                    className="input-field text-center text-2xl font-bold"
                    style={{ letterSpacing: '0.4em' }}
                  />
                  {otp.length === 6 && (
                    <p className="flex items-center gap-1 text-xs text-green-600 mt-1.5">
                      <CheckCircle2 size={11}/> OTP entered — tap Verify to create account
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0d1b2a,#243b6a)', color: '#c9a84c', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin"/>Verifying…</>
                    : <>Verify & Create Account</>}
                </button>
              </form>

              {/* Resend */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={handleResendOtp} disabled={countdown > 0 || loading}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-40"
                  style={{ color: countdown > 0 ? 'var(--text-muted)' : '#c9a84c' }}>
                  <RefreshCw size={13}/>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-secondary mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--navy)] font-bold hover:text-[#c9a84c] transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          Faculty of Technology · Rajarata University of Sri Lanka
        </p>
      </div>
    </div>
  );
};

export default Register;
