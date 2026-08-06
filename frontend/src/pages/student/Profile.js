import React, { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateProfile, changePassword } from '../../services/api';
import {
  User, Mail, Hash, BookOpen, GraduationCap,
  Camera, Lock, Eye, EyeOff, Shield, Save, KeyRound,
  Home, CreditCard,
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// 1st year → 3 groups; senior → 5 departments
const DEPT_OPTIONS_1ST    = ['ICT', 'ENT', 'BST'];
const DEPT_OPTIONS_SENIOR = ['ICT', 'EET', 'MTT', 'BPT', 'FDT'];

const DEPT_FULL = {
  ICT: 'Information & Communication Technology',
  EET: 'Electrical Engineering Technology',
  MTT: 'Mechatronics Technology',
  BPT: 'Bioprocess Technology',
  FDT: 'Food & Drug Technology',
  ENT: 'Engineering Technology',
  BST: 'Biosystems Technology',
};

const HERO_IMG = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&h=400&q=85';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontWeight: 500,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const readonlyStyle = {
  ...inputStyle,
  background: 'var(--bg-muted)',
  cursor: 'not-allowed',
  color: 'var(--text-muted)',
};

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-muted)' }}>
      <Icon size={11} />{label}
    </label>
    {children}
  </div>
);

/* ════════════════════════════════════════════════════ */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();
  const { showToast } = useToast();

  const [year,       setYear]       = useState(user?.year || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPrev, setAvatarPrev] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const [curPwd,  setCurPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [chgPwd,  setChgPwd]  = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  /* ── year change → reset department ── */
  const handleYearChange = (newYear) => {
    setYear(newYear);
    setDepartment(''); // force re-select
  };

  /* ── avatar ── */
  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPrev(URL.createObjectURL(file));
  };

  /* ── save (only year + department + avatar) ── */
  const handleSave = async () => {
    if (!year)       return showToast('Please select a year', 'error');
    if (!department) return showToast('Please select a department', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',       user?.name || '');
      fd.append('year',       year);
      fd.append('department', department);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await updateProfile(fd);
      updateUser(data);
      setAvatarFile(null);
      showToast('Profile updated!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── password ── */
  const handleChangePassword = async () => {
    if (!curPwd || !newPwd || !confPwd) return showToast('Fill all password fields', 'error');
    if (newPwd !== confPwd)             return showToast('New passwords do not match', 'error');
    if (newPwd.length < 6)             return showToast('Password must be at least 6 chars', 'error');
    setChgPwd(true);
    try {
      await changePassword({ currentPassword: curPwd, newPassword: newPwd });
      setCurPwd(''); setNewPwd(''); setConfPwd('');
      showToast('Password changed!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setChgPwd(false);
    }
  };

  const avatarSrc = avatarPrev || (user?.avatar ? `${BASE_URL}${user.avatar}` : null);
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const deptOptions = year === '1st Year' ? DEPT_OPTIONS_1ST : DEPT_OPTIONS_SENIOR;

  const tabBtn = (active) => ({
    padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, #c9a84c, #e8c96a)' : 'transparent',
    color: active ? '#0d1b2a' : 'var(--text-muted)',
    boxShadow: active ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
  });

  return (
    <Layout>

      {/* ══ HERO HEADER ═══════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden mb-6 animate-fade-up"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.22)', minHeight: '200px' }}>

        {/* Hero image */}
        <img src={HERO_IMG} alt="FOT Campus"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }} />

        {/* Overlays */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.88) 0%, rgba(13,27,42,0.70) 60%, rgba(13,27,42,0.50) 100%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(7,13,24,0.80) 0%, transparent 50%)' }} />

        {/* Content — avatar + info inside the hero */}
        <div className="relative z-10 flex items-end gap-5 px-6 pt-10 pb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-xl shadow-lg"
              style={{
                background: avatarSrc ? 'var(--bg-muted)' : 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                color: '#0d1b2a', border: '3px solid rgba(255,255,255,0.20)',
              }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <button onClick={() => fileRef.current.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a)' }}>
              <Camera size={13} style={{ color: '#0d1b2a' }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>

          {/* Name & badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight"
              style={{ fontFamily: 'Playfair Display, serif', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {user?.name}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {user?.email}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {DEPT_FULL[user?.department] || user?.department}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {user?.year}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(201,168,76,0.30)', color: '#e8c96a', border: '1px solid rgba(201,168,76,0.40)' }}>
                🎓 Student
              </span>
            </div>
          </div>
        </div>

        {/* Gold bottom bar */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, #c9a84c, #e8c96a, #c9a84c)' }} />
      </div>

      {/* ══ TABS ══════════════════════════════════════════ */}
      <div className="flex gap-2 p-1.5 rounded-2xl mb-5 animate-fade-up"
        style={{ animationDelay: '80ms', background: 'var(--bg-card)', border: '1px solid var(--border-card)', display: 'inline-flex' }}>
        <button style={tabBtn(activeTab === 'info')} onClick={() => setActiveTab('info')}>
          <span className="flex items-center gap-1.5"><User size={13}/>Personal Info</span>
        </button>
        <button style={tabBtn(activeTab === 'security')} onClick={() => setActiveTab('security')}>
          <span className="flex items-center gap-1.5"><Shield size={13}/>Security</span>
        </button>
      </div>

      {/* ══ PERSONAL INFO TAB ═════════════════════════════ */}
      {activeTab === 'info' && (
        <div className="rounded-3xl p-6 animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
              <User size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold"
                style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                Personal Information
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Only Year & Department can be changed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Full Name — readonly */}
            <div className="sm:col-span-2">
              <Field label="Full Name" icon={User}>
                <input value={user?.name || ''} readOnly style={readonlyStyle} />
              </Field>
            </div>

            {/* Email — readonly */}
            <Field label="Email Address" icon={Mail}>
              <input value={user?.email || ''} readOnly style={readonlyStyle} />
            </Field>

            {/* Student ID — readonly */}
            <Field label="Student ID" icon={Hash}>
              <input value={user?.studentId || user?.indexNumber || ''} readOnly style={readonlyStyle} />
            </Field>

            {/* Reg Number — readonly */}
            <Field label="Registration Number" icon={CreditCard}>
              <input value={user?.registrationNumber || ''} readOnly style={readonlyStyle} />
            </Field>

            {/* Hostel — readonly */}
            <Field label="Hostel" icon={Home}>
              <input
                value={user?.isHosteller ? (user?.hostelName || 'Hosteller') : 'Day Scholar'}
                readOnly style={readonlyStyle} />
            </Field>

            {/* ── Year — EDITABLE ── */}
            <Field label="Academic Year" icon={GraduationCap}>
              <select value={year} onChange={e => handleYearChange(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>

            {/* ── Department — changes based on year ── */}
            <Field label="Department" icon={BookOpen}>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                disabled={!year}
                style={{ ...inputStyle, cursor: year ? 'pointer' : 'not-allowed',
                  background: !year ? 'var(--bg-muted)' : 'var(--bg-input)' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}>
                <option value="">Select dept.</option>
                {deptOptions.map(d => (
                  <option key={d} value={d}>{d}{DEPT_FULL[d] ? ` — ${DEPT_FULL[d]}` : ''}</option>
                ))}
              </select>
              {year === '1st Year' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  ICT · ENT (EET+MTT) · BST (BPT+FDT)
                </p>
              )}
            </Field>

          </div>

          {/* Save */}
          <div className="flex justify-end mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: saving ? 'var(--bg-muted)' : 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                color: saving ? 'var(--text-muted)' : '#0d1b2a',
                boxShadow: saving ? 'none' : '0 4px 14px rgba(201,168,76,0.35)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ══ SECURITY TAB ══════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="rounded-3xl p-6 animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
              <Lock size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold"
                style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                Change Password
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keep your account secure</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl mb-5"
            style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
            <Shield size={14} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Use at least <strong>6 characters</strong> with a mix of letters and numbers.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <Field label="Current Password" icon={KeyRound}>
              <div className="relative">
                <input type={showCur ? 'text' : 'password'} value={curPwd}
                  onChange={e => setCurPwd(e.target.value)} placeholder="Enter current password"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                <button onClick={() => setShowCur(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <Field label="New Password" icon={Lock}>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Enter new password"
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                <button onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {newPwd.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: newPwd.length >= i*2
                        ? newPwd.length >= 8 ? '#10b981' : newPwd.length >= 6 ? '#f59e0b' : '#ef4444'
                        : 'var(--bg-muted)' }} />
                  ))}
                </div>
              )}
            </Field>

            <Field label="Confirm New Password" icon={Lock}>
              <div className="relative">
                <input type={showCon ? 'text' : 'password'} value={confPwd}
                  onChange={e => setConfPwd(e.target.value)} placeholder="Re-enter new password"
                  style={{ ...inputStyle, paddingRight: '40px',
                    borderColor: confPwd && confPwd !== newPwd ? '#ef4444' : 'var(--border-input)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => { e.target.style.borderColor = confPwd && confPwd !== newPwd ? '#ef4444' : 'var(--border-input)'; }} />
                <button onClick={() => setShowCon(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confPwd && confPwd !== newPwd && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
              )}
            </Field>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={handleChangePassword} disabled={chgPwd}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: chgPwd ? 'var(--bg-muted)' : 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                color: chgPwd ? 'var(--text-muted)' : '#0d1b2a',
                boxShadow: chgPwd ? 'none' : '0 4px 14px rgba(201,168,76,0.35)',
                cursor: chgPwd ? 'not-allowed' : 'pointer',
              }}>
              <KeyRound size={14} />
              {chgPwd ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Profile;
