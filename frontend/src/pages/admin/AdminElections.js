import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getElections, adminCreateElection, adminUpdateElection, adminDeleteElection,
  adminAddCandidate, adminUpdateCandidate, adminRemoveCandidate
} from '../../services/api';
import { Plus, Trash2, UserPlus, X, Vote, Calendar, Loader2, Edit2, Edit3 } from 'lucide-react';
import { ImageLightbox } from '../../components/ImageLightbox';

const BASE_URL = 'http://localhost:5000';
const ELEC_ADMIN_BG = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1400&h=400&q=90';
const DEPARTMENTS = ['BPT', 'EET', 'FDT', 'ICT', 'MTT', 'ENT', 'BST'];

/* Toggleable department chip list — used when creating/editing an election
   to restrict which departments' students may vote in it. Empty selection
   means "no restriction" (all departments eligible). */
const DepartmentPicker = ({ selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {DEPARTMENTS.map(d => {
      const active = selected.includes(d);
      return (
        <button key={d} type="button"
          onClick={() => onChange(active ? selected.filter(x => x !== d) : [...selected, d])}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            active ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]' : 'bg-[var(--bg-muted)] text-secondary border-[var(--border-card)] hover:border-[var(--gold)]'
          }`}>
          {d}
        </button>
      );
    })}
  </div>
);

/* Candidate card for admin — clickable photo */
const CandidateAdminCard = ({ c, onEdit, onRemove }) => {
  const [lightbox, setLightbox] = React.useState(false);
  return (
    <>
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Photo — click to zoom */}
        <div
          className="relative w-full cursor-zoom-in group"
          style={{ height: '110px', background: 'linear-gradient(135deg,#0d1b2a,#243b6a)' }}
          onClick={() => c.avatar && setLightbox(true)}
        >
          {c.avatar ? (
            <>
              <img
                src={`${BASE_URL}${c.avatar}`}
                alt={c.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <svg className="opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold opacity-60">{c.name.charAt(0)}</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-2.5">
          <p className="text-xs font-bold text-primary truncate mb-1">{c.name}</p>
          {c.position && (
            <p className="text-[10px] font-semibold text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded-full mb-1.5 truncate max-w-full">{c.position}</p>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
            ><Edit3 size={10}/> Edit</button>
            <button
              onClick={onRemove}
              className="p-1 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition"
            ><X size={12}/></button>
          </div>
        </div>
      </div>
      {lightbox && c.avatar && (
        <ImageLightbox
          src={`${BASE_URL}${c.avatar}`}
          alt={c.name}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
};



const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-card)]">
        <h2 className="text-lg font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-xl transition"><X size={18}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const AdminElections = () => {
  const [elections, setElections]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  // Create election modal
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm] = useState({ title:'', type:'University Level', department:'All', startDate:'', endDate:'', eligibleDepartments:[] });

  // Edit election modal
  const [editElection, setEditElection]   = useState(null); // holds election object
  const [editForm, setEditForm]           = useState({ title:'', type:'University Level', department:'All', startDate:'', endDate:'', eligibleDepartments:[] });

  // Add candidate modal
  const [showCandidate, setShowCandidate] = useState(null); // holds election _id
  const [cForm, setCForm] = useState({ name:'', position:'', manifesto:'' });
  const [candidatePhoto, setCandidatePhoto] = useState(null);
  const [candidatePhotoPreview, setCandidatePhotoPreview] = useState(null);

  // Edit candidate modal
  const [editCandidate, setEditCandidate] = useState(null); // { electionId, candidate }
  const [ecForm, setEcForm] = useState({ name:'', position:'', manifesto:'' });
  const [ecPhoto, setEcPhoto]             = useState(null);
  const [ecPhotoPreview, setEcPhotoPreview] = useState(null);

  const load = () => getElections().then(r => { setElections(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  /* ── CREATE ELECTION ── */
  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await adminCreateElection(form);
      setShowCreate(false);
      setForm({ title:'', type:'University Level', department:'All', startDate:'', endDate:'', eligibleDepartments:[] });
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── EDIT ELECTION ── */
  const openEditElection = (el) => {
    setEditElection(el);
    // Convert stored date strings to datetime-local format
    const toLocal = (d) => d ? new Date(d).toISOString().slice(0,16) : '';
    setEditForm({
      title: el.title,
      type: el.type,
      department: el.department || 'All',
      startDate: toLocal(el.startDate),
      endDate: toLocal(el.endDate),
      eligibleDepartments: el.eligibleDepartments || [],
    });
  };
  const handleEditElection = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await adminUpdateElection(editElection._id, editForm);
      setEditElection(null);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── DELETE ELECTION ── */
  const handleDelete = async id => {
    if (!window.confirm('Delete this election? This cannot be undone.')) return;
    await adminDeleteElection(id); load();
  };

  /* ── ADD CANDIDATE ── */
  const handleAddCandidate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', cForm.name);
      fd.append('position', cForm.position);
      fd.append('manifesto', cForm.manifesto);
      if (candidatePhoto) fd.append('photo', candidatePhoto);
      await adminAddCandidate(showCandidate, fd);
      setShowCandidate(null);
      setCForm({ name:'', position:'', manifesto:'' });
      setCandidatePhoto(null); setCandidatePhotoPreview(null);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── EDIT CANDIDATE ── */
  const openEditCandidate = (electionId, candidate) => {
    setEditCandidate({ electionId, candidate });
    setEcForm({ name: candidate.name, position: candidate.position || '', manifesto: candidate.manifesto || '' });
    setEcPhoto(null);
    setEcPhotoPreview(candidate.avatar ? `http://localhost:5000${candidate.avatar}` : null);
  };
  const handleEditCandidate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', ecForm.name);
      fd.append('position', ecForm.position);
      fd.append('manifesto', ecForm.manifesto);
      if (ecPhoto) fd.append('photo', ecPhoto);
      await adminUpdateCandidate(editCandidate.electionId, editCandidate.candidate._id, fd);
      setEditCandidate(null);
      setEcPhoto(null); setEcPhotoPreview(null);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  /* ── REMOVE CANDIDATE ── */
  const handleRemoveCandidate = async (eId, cId) => {
    if (!window.confirm('Remove this candidate?')) return;
    await adminRemoveCandidate(eId, cId); load();
  };

  const statusClass = { ongoing:'badge-ongoing', upcoming:'badge-upcoming', completed:'badge-completed' };

  return (
    <AdminLayout title="Elections Management" subtitle="Create and manage student elections">
      {/* HD Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-7"
        style={{ height: '11rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={ELEC_ADMIN_BG} alt="Elections Admin" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82) 0%, rgba(13,27,42,0.68) 60%, rgba(13,27,42,0.50) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col justify-center px-7">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Faculty of Technology · RUSL</p>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Elections Management</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.90)' }}>{elections.length} total elections · Secure &amp; Transparent</p>
        </div>
        <div className="absolute top-4 right-5">
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/>Create Election</button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="bg-[var(--bg-card)] rounded-2xl h-36 animate-pulse border border-[var(--border-card)]"/>)}</div>
      ) : elections.length === 0 ? (
        <div className="card p-14 text-center animate-fade-up" style={{opacity:0}}>
          <Vote size={48} className="mx-auto mb-3 text-muted opacity-50"/>
          <p className="text-muted font-medium">No elections yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((e, i) => (
            <div key={e._id} className="card p-5 animate-fade-up" style={{animationDelay:`${i*60}ms`,opacity:0}}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-primary text-lg mb-1" style={{fontFamily:'Playfair Display,serif'}}>{e.title}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={statusClass[e.status]}>{e.status}</span>
                    <span className="text-xs text-muted">{e.type}</span>
                    <span className="text-xs text-muted flex items-center gap-1"><Calendar size={11}/>{new Date(e.startDate).toLocaleDateString()} — {new Date(e.endDate).toLocaleDateString()}</span>
                    <span className="text-xs text-muted">{e.candidates.length} candidates · {e.votes.length} votes</span>
                    <span className="text-xs text-muted">
                      {(!e.eligibleDepartments || e.eligibleDepartments.length === 0)
                        ? 'All departments eligible'
                        : `Eligible: ${e.eligibleDepartments.join(', ')}`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => setShowCandidate(e._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition">
                    <UserPlus size={13}/> Add Candidate
                  </button>
                  <button onClick={() => openEditElection(e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition">
                    <Edit2 size={13}/> Edit
                  </button>
                  <button onClick={() => handleDelete(e._id)} className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"><Trash2 size={15}/></button>
                </div>
              </div>

              {e.candidates.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Candidates</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {e.candidates.map(c => (
                      <CandidateAdminCard
                        key={c._id} c={c}
                        onEdit={() => openEditCandidate(e._id, c)}
                        onRemove={() => handleRemoveCandidate(e._id, c._id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE ELECTION MODAL ── */}
      {showCreate && (
        <Modal title="Create New Election" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Election Title</label>
              <input className="input-field" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Union Election 2024"/></div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Type</label>
              <select className="input-field" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option>University Level</option><option>Department Level</option>
              </select></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-primary mb-1.5">Start Date & Time</label>
                <input type="datetime-local" className="input-field" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
              <div><label className="block text-sm font-semibold text-primary mb-1.5">End Date & Time</label>
                <input type="datetime-local" className="input-field" required value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Eligible Departments</label>
              <DepartmentPicker selected={form.eligibleDepartments} onChange={d=>setForm({...form,eligibleDepartments:d})}/>
              <p className="text-xs text-muted mt-1.5">Leave all unselected to allow every department to vote. Select specific departments to restrict voting to only students from those departments.</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {saving?<><Loader2 size={15} className="animate-spin"/>Creating...</>:'Create Election'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── EDIT ELECTION MODAL ── */}
      {editElection && (
        <Modal title="Edit Election" onClose={() => setEditElection(null)}>
          <form onSubmit={handleEditElection} className="space-y-4">
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Election Title</label>
              <input className="input-field" required value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="e.g. Union Election 2024"/></div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Type</label>
              <select className="input-field" value={editForm.type} onChange={e=>setEditForm({...editForm,type:e.target.value})}>
                <option>University Level</option><option>Department Level</option>
              </select></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-primary mb-1.5">Start Date & Time</label>
                <input type="datetime-local" className="input-field" required value={editForm.startDate} onChange={e=>setEditForm({...editForm,startDate:e.target.value})}/></div>
              <div><label className="block text-sm font-semibold text-primary mb-1.5">End Date & Time</label>
                <input type="datetime-local" className="input-field" required value={editForm.endDate} onChange={e=>setEditForm({...editForm,endDate:e.target.value})}/></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Eligible Departments</label>
              <DepartmentPicker selected={editForm.eligibleDepartments} onChange={d=>setEditForm({...editForm,eligibleDepartments:d})}/>
              <p className="text-xs text-muted mt-1.5">Leave all unselected to allow every department to vote.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditElection(null)} className="flex-1 py-3 border border-[var(--border-card)] text-secondary rounded-xl font-semibold hover:bg-[var(--bg-card-hover)] transition">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                {saving?<><Loader2 size={15} className="animate-spin"/>Saving...</>:'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── ADD CANDIDATE MODAL ── */}
      {showCandidate && (
        <Modal title="Add Candidate" onClose={() => { setShowCandidate(null); setCandidatePhoto(null); setCandidatePhotoPreview(null); }}>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Candidate Photo <span className="text-muted font-normal">(optional)</span></label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-muted)] border-2 border-dashed border-[var(--border-card)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {candidatePhotoPreview
                    ? <img src={candidatePhotoPreview} alt="preview" className="w-full h-full object-cover"/>
                    : <span className="text-2xl text-muted">📷</span>}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-muted)] border border-[var(--border-card)] rounded-xl text-sm font-medium text-secondary hover:bg-[var(--bg-card-hover)] transition">
                    <input type="file" accept="image/*" className="hidden" onChange={ev => {
                      const file = ev.target.files[0]; if (!file) return;
                      setCandidatePhoto(file); setCandidatePhotoPreview(URL.createObjectURL(file));
                    }}/> Choose Photo
                  </label>
                  {candidatePhoto && <p className="text-xs text-muted mt-1 truncate">{candidatePhoto.name}</p>}
                </div>
              </div>
            </div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
              <input className="input-field" required value={cForm.name} onChange={e=>setCForm({...cForm,name:e.target.value})} placeholder="Candidate full name"/></div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Position</label>
              <input className="input-field" required value={cForm.position} onChange={e=>setCForm({...cForm,position:e.target.value})} placeholder="e.g. President, Secretary, Treasurer"/>
              <p className="text-xs text-muted mt-1">Students will vote once per position. Candidates sharing the same position compete against each other.</p>
            </div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Manifesto / Vision</label>
              <textarea className="input-field" rows={4} value={cForm.manifesto} onChange={e=>setCForm({...cForm,manifesto:e.target.value})} placeholder="Candidate's vision and manifesto..."/></div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {saving?<><Loader2 size={15} className="animate-spin"/>Adding...</>:'Add Candidate'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── EDIT CANDIDATE MODAL ── */}
      {editCandidate && (
        <Modal title="Edit Candidate" onClose={() => { setEditCandidate(null); setEcPhoto(null); setEcPhotoPreview(null); }}>
          <form onSubmit={handleEditCandidate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Candidate Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-muted)] border-2 border-dashed border-[var(--border-card)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {ecPhotoPreview
                    ? <img src={ecPhotoPreview} alt="preview" className="w-full h-full object-cover"/>
                    : <span className="text-2xl text-muted">📷</span>}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-muted)] border border-[var(--border-card)] rounded-xl text-sm font-medium text-secondary hover:bg-[var(--bg-card-hover)] transition">
                    <input type="file" accept="image/*" className="hidden" onChange={ev => {
                      const file = ev.target.files[0]; if (!file) return;
                      setEcPhoto(file); setEcPhotoPreview(URL.createObjectURL(file));
                    }}/> Change Photo
                  </label>
                  {ecPhoto && <p className="text-xs text-muted mt-1 truncate">{ecPhoto.name}</p>}
                </div>
              </div>
            </div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
              <input className="input-field" required value={ecForm.name} onChange={e=>setEcForm({...ecForm,name:e.target.value})} placeholder="Candidate full name"/></div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Position</label>
              <input className="input-field" required value={ecForm.position} onChange={e=>setEcForm({...ecForm,position:e.target.value})} placeholder="e.g. President, Secretary, Treasurer"/></div>
            <div><label className="block text-sm font-semibold text-primary mb-1.5">Manifesto / Vision</label>
              <textarea className="input-field" rows={4} value={ecForm.manifesto} onChange={e=>setEcForm({...ecForm,manifesto:e.target.value})} placeholder="Candidate's vision and manifesto..."/></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditCandidate(null)} className="flex-1 py-3 border border-[var(--border-card)] text-secondary rounded-xl font-semibold hover:bg-[var(--bg-card-hover)] transition">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                {saving?<><Loader2 size={15} className="animate-spin"/>Saving...</>:'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default AdminElections;
