import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetLostFound, adminUpdateLostFound, adminDeleteLostFound } from '../../services/api';
import { Search, Trash2, MapPin, Calendar, ImageIcon, Tag } from 'lucide-react';

/* FOT Official HD Images */
const LF_ADMIN_BG = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&h=400&q=90';

const BASE_URL = 'http://localhost:5000';
const CATEGORIES = ['Electronics','Books','Clothing','ID Card','Keys','Bag','Other'];

const AdminLostFound = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => adminGetLostFound().then(r=>{ setItems(r.data); setLoading(false); }).catch(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => { await adminUpdateLostFound(id, { status }); load(); };
  const handleDelete = async id => { if (!window.confirm('Delete?')) return; await adminDeleteLostFound(id); load(); };

  const filtered = items
    .filter(i => filter === 'all' || i.type === filter || i.status === filter)
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
    <AdminLayout title="Lost & Found Management" subtitle="Manage campus lost and found items">
      {/* HD Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-7"
        style={{ height: '11rem', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <img src={LF_ADMIN_BG} alt="Lost & Found Admin" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82) 0%, rgba(13,27,42,0.68) 60%, rgba(13,27,42,0.50) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col justify-center px-7">
          <div style={{ background: 'rgba(7,13,24,0.60)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', display: 'inline-block', maxWidth: '480px' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Faculty of Technology · RUSL</p>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>Lost &amp; Found Management</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 6px rgba(0,0,0,1)' }}>{items.length} items reported on campus</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap animate-fade-up" style={{opacity:0}}>
        {[
          {k:'all',   label:`All (${items.length})`},
          {k:'lost',  label:`Lost (${items.filter(i=>i.type==='lost').length})`},
          {k:'found', label:`Found (${items.filter(i=>i.type==='found').length})`},
          {k:'active',label:`Active (${items.filter(i=>i.status==='active').length})`},
          {k:'claimed',label:`Claimed (${items.filter(i=>i.status==='claimed').length})`},
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter===f.k?'bg-[#0d1b2a] text-white shadow-md':'bg-[var(--bg-card)] border border-[var(--border-card)] text-secondary hover:border-[var(--gold)]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 w-full sm:w-72">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, location or category..."
          className="input-field w-full pl-9 text-sm py-2.5"
        />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={category===c
              ? { background: 'var(--gold)', color: '#0d1b2a', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }
              : { background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
            <Tag size={11}/> {c === 'all' ? 'All Categories' : c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-[var(--bg-card)] rounded-2xl h-44 animate-pulse border border-[var(--border-card)]"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center animate-fade-up" style={{opacity:0}}>
          <Search size={48} className="mx-auto mb-3 text-muted opacity-50"/>
          <p className="text-muted">{search.trim() || category !== 'all' ? 'No items match your search/filter.' : 'No items found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <div key={item._id} className="card p-0 flex flex-col overflow-hidden animate-fade-up" style={{animationDelay:`${i*50}ms`,opacity:0}}>
              {item.imageUrl ? (
                <img src={`${BASE_URL}${item.imageUrl}`} alt={item.title} className="w-full h-40 object-cover"/>
              ) : (
                <div className="w-full h-40 bg-[var(--bg-muted)] flex items-center justify-center">
                  <ImageIcon size={32} className="text-muted"/>
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${item.type==='lost'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>{item.type}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${item.status==='active'?'badge-ongoing':item.status==='claimed'?'badge-progress':'badge-completed'}`}>{item.status}</span>
                    {item.category && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:'var(--bg-muted)', color:'var(--text-secondary)' }}>
                        <Tag size={10}/>{item.category}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={15}/></button>
                </div>
                <div>
                  <h3 className="font-bold text-primary">{item.title}</h3>
                  <p className="text-sm text-secondary mt-0.5 line-clamp-2">{item.description}</p>
                </div>
                <div className="space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1.5"><MapPin size={11}/>{item.location}</p>
                  <p className="flex items-center gap-1.5"><Calendar size={11}/>{new Date(item.date).toLocaleDateString()}</p>
                  <p>By: {item.submittedBy?.name||'Unknown'} · {item.submittedBy?.department}</p>
                </div>
                <select value={item.status} onChange={e => handleStatus(item._id, e.target.value)}
                  className="input-field text-sm font-semibold mt-auto">
                  <option value="active">Active</option>
                  <option value="claimed">Claimed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLostFound;
