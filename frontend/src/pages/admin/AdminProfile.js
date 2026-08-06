import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateProfile, changePassword } from '../../services/api';
import {
  User, Mail, Hash, Camera, Lock, Eye, EyeOff,
  Shield, Save, KeyRound, Home, Crown, Users, Building2, BookOpen,
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000';

const ADMIN_META = {
  super_admin:   { label: 'Super Admin',   Icon: Crown,    color: '#c9a84c' },
  hostel_warden: { label: 'Hostel Warden', Icon: Home,     color: '#3b82f6' },
  librarian:     { label: 'Librarian',     Icon: BookOpen, color: '#7c3aed' },
  union_member:  { label: 'Union Member',  Icon: Users,    color: '#22c55e' },
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '12px',
  background: 'var(--bg-input)', border: '1px solid var(--border-input)',
  color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500,
  outline: 'none', transition: 'border-color 0.2s',
};
const readonlyStyle = { ...inputStyle, background: 'var(--bg-muted)', cursor: 'not-allowed', color: 'var(--text-muted)' };

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-muted)' }}>
      <Icon size={11} />{label}
    </label>
    {children}
  </div>
);

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileRef = React.useRef();

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPrev, setAvatarPrev] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState('info');

  const [curPwd,  setCurPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [chgPwd,  setChgPwd]  = useState(false);

  const meta = ADMIN_META[user?.adminType] || { label: 'Administrator', Icon: Shield, color: '#c9a84c' };
  const { label: roleLabel, Icon: RoleIcon, color: roleColor } = meta;

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPrev(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', user?.name || '');
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

  const tabBtn = (active) => ({
    padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, #c9a84c, #e8c96a)' : 'transparent',
    color: active ? '#0d1b2a' : 'var(--text-muted)',
    boxShadow: active ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
  });

  return (
    <AdminLayout title="My Profile" subtitle="View and manage your admin account">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl overflow-hidden mb-6 animate-fade-up"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.22)', minHeight: '180px' }}>

        {/* Campus background image */}
        <img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&h=400&q=85"
          alt="FOT Campus" className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }} />

        {/* Overlays */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.88) 0%, rgba(13,27,42,0.70) 60%, rgba(13,27,42,0.50) 100%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(7,13,24,0.80) 0%, transparent 50%)' }} />

        <div className="relative z-10 flex items-end gap-5 px-6 pt-10 pb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-xl shadow-lg"
              style={{ background: avatarSrc ? 'var(--bg-muted)' : `linear-gradient(135deg, ${roleColor}99, ${roleColor})`, color: '#fff', border: '3px solid rgba(255,255,255,0.20)' }}>
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
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: roleColor + '30', color: roleColor, border: `1px solid ${roleColor}40` }}>
                <RoleIcon size={10}/> {roleLabel}
              </span>
              {user?.adminType === 'hostel_warden' && user?.wardenHostel && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  📍 {user.wardenHostel}
                </span>
              )}
              {user?.adminType === 'union_member' && user?.unionPosition && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  🏛 {user.unionPosition}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-[2px]" style={{ background: `linear-gradient(to right, ${roleColor}, #e8c96a, ${roleColor})` }} />
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 p-1.5 rounded-2xl mb-5 animate-fade-up"
        style={{ animationDelay: '80ms', background: 'var(--bg-card)', border: '1px solid var(--border-card)', display: 'inline-flex' }}>
        <button style={tabBtn(activeTab === 'info')} onClick={() => setActiveTab('info')}>
          <span className="flex items-center gap-1.5"><User size={13}/>Admin Info</span>
        </button>
        <button style={tabBtn(activeTab === 'security')} onClick={() => setActiveTab('security')}>
          <span className="flex items-center gap-1.5"><Shield size={13}/>Security</span>
        </button>
      </div>

      {/* ── INFO TAB ── */}
      {activeTab === 'info' && (
        <div className="rounded-3xl p-6 animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
              <User size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                Admin Information
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your registered account details</p>
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

            {/* Admin Type — readonly */}
            <Field label="Admin Role" icon={Shield}>
              <input value={roleLabel} readOnly style={readonlyStyle} />
            </Field>

            {/* hostel_warden fields */}
            {user?.adminType === 'hostel_warden' && (<>
              <Field label="Warden ID" icon={Hash}>
                <input value={user?.wardenId || ''} readOnly style={readonlyStyle} />
              </Field>
              <Field label="Managed Hostel" icon={Building2}>
                <input value={user?.wardenHostel || ''} readOnly style={readonlyStyle} />
              </Field>
            </>)}

            {/* union_member fields */}
            {user?.adminType === 'union_member' && (<>
              <Field label="Union ID" icon={Hash}>
                <input value={user?.unionId || ''} readOnly style={readonlyStyle} />
              </Field>
              <Field label="Union Position" icon={Users}>
                <input value={user?.unionPosition || ''} readOnly style={readonlyStyle} />
              </Field>
            </>)}

            {/* librarian fields */}
            {user?.adminType === 'librarian' && (
              <Field label="Library ID" icon={Hash}>
                <input value={user?.libraryId || ''} readOnly style={readonlyStyle} />
              </Field>
            )}

          </div>

          {/* Save avatar */}
          {avatarFile && (
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
                {saving ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <div className="rounded-3xl p-6 animate-fade-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
              <Lock size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                Change Password
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keep your admin account secure</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            {[
              { label: 'Current Password', val: curPwd, set: setCurPwd, show: showCur, setShow: setShowCur, icon: KeyRound },
              { label: 'New Password',     val: newPwd, set: setNewPwd, show: showNew, setShow: setShowNew, icon: Lock },
              { label: 'Confirm New Password', val: confPwd, set: setConfPwd, show: showCon, setShow: setShowCon, icon: Lock },
            ].map(({ label, val, set, show, setShow, icon }) => (
              <Field key={label} label={label} icon={icon}>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={val}
                    onChange={e => set(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`}
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                  <button onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            ))}
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

    </AdminLayout>
  );
};

export default AdminProfile;
