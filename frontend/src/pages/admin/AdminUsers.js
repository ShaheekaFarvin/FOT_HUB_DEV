import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { adminGetUsers, adminUpdateRole, adminDeleteUser, adminBlockUser, adminUnblockUser } from '../../services/api';
import { Users, Trash2, Search, Shield, ShieldCheck, Ban, Lock, Unlock, X } from 'lucide-react';

const DEPT_COLORS = {
  ICT: 'bg-blue-100 text-blue-700',
  EET: 'bg-amber-100 text-amber-700',
  BPT: 'bg-green-100 text-green-700',
  FDT: 'bg-purple-100 text-purple-700',
  MTT: 'bg-rose-100 text-rose-700',
};

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [blockTarget, setBlockTarget] = useState(null); // user being blocked (opens modal)
  const [blockDays,   setBlockDays]   = useState(7);
  const [blockReason, setBlockReason] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError,  setBlockError]  = useState('');

  // ── super_admin only ──────────────────────────────────────────────
  if (me?.adminType !== 'super_admin') {
    return (
      <AdminLayout title="User Management" subtitle="Access restricted">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldCheck size={40} className="text-muted mx-auto mb-3 opacity-40" />
            <p className="text-primary font-bold">Super Admin access required</p>
            <p className="text-muted text-sm mt-1">Only Super Admins can manage user accounts.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const load = () =>
    adminGetUsers()
      .then(r => { setUsers(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleRole = async (id, role) => {
    if (!window.confirm(`Change role to ${role}?`)) return;
    await adminUpdateRole(id, { role });
    load();
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;
    await adminDeleteUser(id);
    load();
  };

  const openBlockModal = (u) => {
    setBlockTarget(u);
    setBlockDays(7);
    setBlockReason('');
    setBlockError('');
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setBlockError('');
    if (!blockReason.trim()) { setBlockError('Please provide a reason.'); return; }
    setBlockSaving(true);
    try {
      await adminBlockUser(blockTarget._id, { days: blockDays, reason: blockReason.trim() });
      setBlockTarget(null);
      load();
    } catch (err) {
      setBlockError(err.response?.data?.message || 'Failed to block user.');
    } finally {
      setBlockSaving(false);
    }
  };

  const handleUnblock = async (id) => {
    if (!window.confirm('Unblock this user? They will be able to log in immediately.')) return;
    await adminUnblockUser(id);
    load();
  };

  const isBlocked = (u) => u.blockedUntil && new Date(u.blockedUntil) > new Date();
  const daysLeft  = (u) => Math.max(1, Math.ceil((new Date(u.blockedUntil) - new Date()) / (1000 * 60 * 60 * 24)));

  const filtered = users.filter(u =>
    `${u.name} ${u.email} ${u.registrationNumber || ''} ${u.department || ''}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="User Management" subtitle="View and manage all registered users">
      <div className="flex items-center gap-3 mb-6 animate-fade-up" style={{ opacity: 0 }}>
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, reg. number or department..."
            className="input-field pl-10" />
        </div>
        <div className="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl text-sm font-bold text-secondary whitespace-nowrap">
          {filtered.length} users
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-16 animate-pulse border border-[var(--border-card)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center animate-fade-up" style={{ opacity: 0 }}>
          <Users size={48} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="text-muted">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-fade-up" style={{ opacity: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-card)]">
                  {['User', 'ID / Email', 'Department', 'Year', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-secondary uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-b border-[var(--border-card)] hover:bg-[var(--bg-card-hover)] transition">
                    {/* Name + avatar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-primary whitespace-nowrap">{u.name}</p>
                      </div>
                    </td>

                    {/* ID + email */}
                    <td className="px-5 py-3">
                      <p className="text-xs font-mono font-bold text-primary">
                        {u.registrationNumber || u.wardenId || u.unionId || '—'}
                      </p>
                      <p className="text-xs text-muted truncate max-w-[180px]">{u.email}</p>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3">
                      {u.department
                        ? <span className={`text-xs px-2 py-1 rounded-lg font-bold ${DEPT_COLORS[u.department] || 'bg-gray-100 text-gray-600'}`}>{u.department}</span>
                        : <span className="text-xs text-muted">—</span>}
                    </td>

                    {/* Year */}
                    <td className="px-5 py-3 text-xs text-secondary">{u.year || '—'}</td>

                    {/* Role badge */}
                    <td className="px-5 py-3">
                      {u.role === 'admin'
                        ? <span className="flex items-center gap-1 text-xs font-bold text-[#c9a84c] bg-[#0d1b2a] px-2 py-1 rounded-lg whitespace-nowrap">
                            <Shield size={10} />{u.adminType?.replace('_',' ') || 'Admin'}
                          </span>
                        : <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">Student</span>}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      {isBlocked(u) ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg whitespace-nowrap"
                          title={u.blockReason || ''}>
                          <Ban size={10} /> Blocked · {daysLeft(u)}d left
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {isBlocked(u) ? (
                          <button onClick={() => handleUnblock(u._id)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="Unblock user">
                            <Unlock size={14} />
                          </button>
                        ) : (
                          <button onClick={() => openBlockModal(u)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                            title="Block user">
                            <Lock size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(u._id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Delete user">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => !blockSaving && setBlockTarget(null)}>
          <div onClick={e => e.stopPropagation()}
            className="rounded-2xl p-6 w-96 animate-fade-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)' }}>
                  <Ban size={16} style={{ color: '#d97706' }} />
                </div>
                <h2 className="text-base font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                  Block {blockTarget.name}
                </h2>
              </div>
              <button onClick={() => setBlockTarget(null)} className="p-1 rounded-lg text-muted hover:bg-[var(--bg-muted)] transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Block for how many days?
                </label>
                <input
                  type="number" min="1" value={blockDays}
                  onChange={e => setBlockDays(e.target.value)}
                  className="input-field text-sm" required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Reason
                </label>
                <textarea
                  value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  rows={3} placeholder="Why is this account being blocked?"
                  className="input-field text-sm resize-none" required
                />
                <p className="text-xs text-muted mt-1">The user will see this reason when they try to log in.</p>
              </div>

              {blockError && (
                <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{blockError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setBlockTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={blockSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                  <Lock size={14} /> {blockSaving ? 'Blocking…' : 'Block User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
