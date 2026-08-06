import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetComplaints, adminUpdateComplaint, adminReplyComplaint } from '../../services/api';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { ClickableImage } from '../../components/ImageLightbox';

const BASE_URL = 'http://localhost:5000';

/* FOT Official HD Images */
const COMP_ADMIN_BG = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&h=500&q=90';

const statusClass = { pending:'badge-pending', 'in-progress':'badge-progress', resolved:'badge-resolved', rejected:'badge-rejected' };

const RECIPIENT_LABELS = {
  hostel_warden: 'Warden',
  union_member:  'Union Member',
  librarian:     'Librarian',
  super_admin:   'Super Admin',
};

const AdminComplaints = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]   = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => adminGetComplaints().then(r=>{ setItems(r.data); setLoading(false); }).catch(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    await adminUpdateComplaint(id, { status }); load();
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try { await adminReplyComplaint(selected._id, { message: reply }); setReply(''); setSelected(null); load(); }
    catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const filtered = filter === 'all' ? items : items.filter(c => c.status === filter);
  const counts   = { all: items.length, pending: items.filter(c=>c.status==='pending').length, 'in-progress': items.filter(c=>c.status==='in-progress').length, resolved: items.filter(c=>c.status==='resolved').length };

  return (
    <AdminLayout title="Complaints Management" subtitle="View, respond and resolve student complaints">
      {/* HD Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-7"
        style={{ height: '11rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={COMP_ADMIN_BG} alt="Complaints Admin" className="w-full h-full object-cover" style={{ objectPosition: 'center 50%' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82) 0%, rgba(13,27,42,0.68) 60%, rgba(13,27,42,0.50) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col justify-center px-7">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Faculty of Technology · RUSL</p>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Complaints Management</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.90)' }}>Resolve student grievances · Transparent &amp; Fair</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap animate-fade-up" style={{opacity:0}}>
        {Object.entries(counts).map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter===k?'bg-[#0d1b2a] text-white shadow-md':'bg-[var(--bg-card)] border border-[var(--border-card)] text-secondary hover:border-[var(--gold)]'}`}>
            {k === 'all' ? `All (${v})` : `${k} (${v})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="bg-[var(--bg-card)] rounded-2xl h-28 animate-pulse border border-[var(--border-card)]"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center animate-fade-up" style={{opacity:0}}>
          <MessageSquare size={48} className="mx-auto mb-3 text-muted opacity-50"/>
          <p className="text-muted">No complaints found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <div key={c._id} className="card p-5 animate-fade-up" style={{animationDelay:`${i*50}ms`,opacity:0}}>
              <div className="flex items-start justify-between gap-4">
                {c.imageUrl && (
                  <ClickableImage src={`${BASE_URL}${c.imageUrl}`} alt={c.title}
                    containerClassName="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden" containerStyle={{ border: '1px solid var(--border-card)' }}
                    className="w-full h-full object-cover"/>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={statusClass[c.status]}>{c.status}</span>
                    <span className="text-xs text-muted bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{c.category}</span>
                    {c.isAnonymous && <span className="text-xs text-muted bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">Anonymous</span>}
                    <span className="text-xs text-muted bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{c.isPublic ? 'Public' : 'Admin Only'}</span>
                    {c.targetAdminType && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        To: {RECIPIENT_LABELS[c.targetAdminType] || c.targetAdminType}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-primary">{c.title}</h3>
                  <p className="text-sm text-secondary mt-1 line-clamp-2">{c.description}</p>
                  <p className="text-xs text-muted mt-1.5">
                    {c.submittedBy?.anonymous
                      ? 'Anonymous'
                      : `${c.submittedBy?.name || 'Unknown'}${c.submittedBy?.department ? ' · ' + c.submittedBy.department : ''}`} · {new Date(c.createdAt).toLocaleDateString()}
                    {c.replies?.length > 0 && <span className="ml-2 text-blue-500 font-semibold">· {c.replies.length} reply(ies)</span>}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <select value={c.status} onChange={e => handleStatus(c._id, e.target.value)}
                    className="text-xs border border-[var(--border-card)] rounded-xl px-2 py-1.5 focus:outline-none bg-[var(--bg-card)] text-primary font-semibold">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button onClick={() => setSelected(c)}
                    className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-[#0d1b2a] text-white rounded-xl hover:bg-[#243b6a] transition font-bold">
                    <Send size={12}/> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}/>
          <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-card)]">
              <h2 className="text-lg font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>Reply to Complaint</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-xl transition"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-card)]">
                <p className="font-bold text-primary mb-1">{selected.title}</p>
                <p className="text-sm text-secondary">{selected.description}</p>
              </div>
              {selected.replies?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase mb-2">Previous Replies</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} className="rounded-xl p-3 mb-2" style={{ background: 'var(--badge-prog-bg)', border: '1px solid var(--border-card)' }}>
                      <p className="text-sm" style={{ color: 'var(--badge-prog-text)' }}>{r.message}</p>
                      <p className="text-xs text-muted mt-1">{new Date(r.repliedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">Your Reply</label>
                <textarea className="input-field" rows={4} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your official response..."/>
              </div>
              <button onClick={handleReply} disabled={sending || !reply.trim()} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {sending?<><Loader2 size={15} className="animate-spin"/>Sending...</>:<><Send size={15}/>Send Reply</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminComplaints;
