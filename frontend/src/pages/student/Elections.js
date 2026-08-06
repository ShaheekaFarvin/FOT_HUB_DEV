import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useElection } from '../../context/ElectionContext';
import { useAuth } from '../../context/AuthContext';
import { getResults } from '../../services/api';
import {
  Vote, Calendar, ChevronRight, Clock, CheckCircle2,
  Lock, ShieldCheck, BarChart2, Trophy, Users, Info, Loader2
} from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';

const VOTE_HERO = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1400&h=500&q=90';
const BASE_URL  = 'http://localhost:5000';

/* ── Status badge ── */
const StatusBadge = ({ s }) => {
  if (s === 'ongoing')   return <span style={{ background:'rgba(22,163,74,0.15)', color:'#16a34a', border:'1px solid rgba(22,163,74,0.3)', borderRadius:'999px', fontSize:'11px', fontWeight:700, padding:'3px 10px' }}>● Live</span>;
  if (s === 'upcoming')  return <span style={{ background:'rgba(234,179,8,0.12)',  color:'#ca8a04', border:'1px solid rgba(234,179,8,0.3)',  borderRadius:'999px', fontSize:'11px', fontWeight:700, padding:'3px 10px' }}>◷ Soon</span>;
  return <span style={{ background:'var(--bg-muted)', color:'var(--text-muted)', border:'1px solid var(--border-muted)', borderRadius:'999px', fontSize:'11px', fontWeight:700, padding:'3px 10px' }}>✓ Done</span>;
};

/* ══════════════════════════════════════
   TAB 1 — Elections list
══════════════════════════════════════ */
const ElectionCard = ({ e, i, navigate, onExpire }) => {
  const candidateCount = e.candidates?.length || 0;
  const preview = (e.candidates || []).slice(0, 4);

  return (
    <div
      onClick={() => navigate(`/elections/${e._id}`)}
      className="group overflow-hidden rounded-2xl cursor-pointer animate-fade-up transition-all duration-300"
      style={{ animationDelay:`${i*60}ms`, background:'var(--bg-card)', border:'1px solid var(--border-card)', boxShadow:'var(--shadow-card)' }}
      onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-4px)'; ev.currentTarget.style.boxShadow='var(--shadow-hover)'; ev.currentTarget.style.borderColor='rgba(201,168,76,0.35)'; }}
      onMouseLeave={ev => { ev.currentTarget.style.transform=''; ev.currentTarget.style.boxShadow='var(--shadow-card)'; ev.currentTarget.style.borderColor='var(--border-card)'; }}
    >
      <div className="relative overflow-hidden" style={{ height:'11rem' }}>
        <img src={VOTE_HERO} alt="election" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition:'center 55%' }}/>
        <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,rgba(7,13,24,0.1) 0%,rgba(7,13,24,0.55) 60%,rgba(7,13,24,0.92) 100%)' }}/>

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background:'rgba(7,13,24,0.55)', color:'rgba(255,255,255,0.9)', border:'1px solid rgba(255,255,255,0.18)', backdropFilter:'blur(6px)' }}>
            {(e.eligibleDepartments && e.eligibleDepartments.length > 0) ? e.eligibleDepartments.join(', ') : 'All Departments'}
          </span>
        </div>
        <div className="absolute top-3 right-3"><StatusBadge s={e.status}/></div>

        <div className="absolute bottom-3 left-3.5 right-3.5">
          <p className="font-bold text-white text-base leading-tight line-clamp-2 mb-2" style={{ fontFamily:'Playfair Display,serif', textShadow:'0 1px 10px rgba(0,0,0,0.95)' }}>{e.title}</p>

          <div className="flex items-center justify-between">
            {/* Candidate avatar stack */}
            <div className="flex items-center">
              {preview.map((c, ci) => (
                <div key={c._id || ci} className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#0d1b2a,#1a3a5c)', border:'2px solid rgba(7,13,24,0.9)', marginLeft: ci===0 ? 0 : '-8px', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>
                  {c.avatar ? <img src={`${BASE_URL}${c.avatar}`} alt={c.name} className="w-full h-full object-cover"/> : (c.name || '?').charAt(0)}
                </div>
              ))}
              {candidateCount > 0 && (
                <span className="text-[10px] font-semibold ml-2 flex items-center gap-1" style={{ color:'rgba(255,255,255,0.85)', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>
                  <Users size={10}/> {candidateCount} running
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3.5">
        <p className="text-xs flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
          {e.status === 'upcoming'  && <CountdownTimer targetDate={e.startDate} label="Starts in" compact onExpire={onExpire}/>}
          {e.status === 'ongoing'   && <CountdownTimer targetDate={e.endDate}   label="Ends in"   compact onExpire={onExpire}/>}
          {e.status === 'completed' && <><Calendar size={9}/> Ended {new Date(e.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</>}
        </p>
        <div className="flex items-center gap-1 text-xs font-bold transition-all duration-300 group-hover:gap-2" style={{ color:'var(--gold)' }}>
          {e.status==='ongoing' ? 'Cast Vote' : e.status==='upcoming' ? 'View Details' : 'See Results'}
          <ChevronRight size={12}/>
        </div>
      </div>
      <div className="h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background:'linear-gradient(to right,transparent,var(--gold),transparent)' }}/>
    </div>
  );
};

const ElectionsTab = ({ elections, loading, navigate, onExpire }) => {
  const ongoing  = elections.filter(e => e.status === 'ongoing');
  const upcoming = elections.filter(e => e.status === 'upcoming');
  const past     = elections.filter(e => e.status === 'completed');

  const Section = ({ title, icon: Icon, items, emptyMsg, delay=0 }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-4 animate-fade-up" style={{ animationDelay:`${delay}ms` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'var(--bg-muted)', border:'1px solid var(--border-muted)' }}>
          <Icon size={15} style={{ color:'var(--text-secondary)' }}/>
        </div>
        <h2 className="text-sm font-bold" style={{ fontFamily:'Playfair Display,serif', color:'var(--text-primary)' }}>{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'var(--bg-muted)', color:'var(--text-muted)' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-8 rounded-2xl text-sm" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', color:'var(--text-muted)' }}>{emptyMsg}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((e,i) => <ElectionCard key={e._id} e={e} i={i} navigate={navigate} onExpire={onExpire}/>)}
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {[1,2,3].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
          <div className="h-32" style={{ background:'var(--bg-muted)' }}/>
          <div className="p-4 space-y-2">
            <div className="h-3 rounded-full w-3/4" style={{ background:'var(--bg-muted)' }}/>
            <div className="h-3 rounded-full w-1/2" style={{ background:'var(--bg-muted)' }}/>
          </div>
        </div>
      ))}
    </div>
  );

  if (elections.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl mt-4" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
      <Vote size={36} style={{ color:'var(--text-muted)' }}/>
      <p className="font-semibold text-sm" style={{ color:'var(--text-muted)' }}>No elections available yet</p>
    </div>
  );

  return (
    <div className="mt-4">
      <Section title="Live Elections"     icon={Vote}     items={ongoing}  emptyMsg="No live elections right now"  delay={0}/>
      <Section title="Upcoming Elections" icon={Clock}    items={upcoming} emptyMsg="No upcoming elections"         delay={100}/>
      <Section title="Past Elections"     icon={Calendar} items={past}     emptyMsg="No past elections"             delay={200}/>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 2 — My Votes
══════════════════════════════════════ */
const MyVotesTab = ({ elections, loading, fetchMyVotes }) => {
  const [votedIds, setVotedIds] = useState(new Set());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (elections.length === 0) { setChecking(false); return; }
    let done = 0;
    elections.forEach(async e => {
      const votes = await fetchMyVotes(e._id);
      if (votes?.length > 0) setVotedIds(prev => new Set([...prev, e._id]));
      done++;
      if (done === elections.length) setChecking(false);
    });
  }, [elections]);

  const all = elections.filter(e => e.status !== 'upcoming' || true);
  const votedCount = votedIds.size;

  if (loading || checking) return (
    <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background:'var(--bg-muted)' }}/>)}</div>
  );

  return (
    <div className="mt-4">
      {/* Privacy banner */}
      <div className="flex items-start gap-3 rounded-2xl p-4 mb-5" style={{ background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.2)' }}>
        <Lock size={15} style={{ color:'var(--gold)', flexShrink:0, marginTop:1 }}/>
        <div>
          <p className="text-xs font-bold mb-0.5" style={{ color:'var(--gold)' }}>Ballot Secrecy Protected</p>
          <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>Your specific vote choices are strictly confidential and are never displayed — protecting the integrity of the election and your privacy.</p>
        </div>
      </div>

      {/* Stats row */}
      {votedCount > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 rounded-2xl text-center" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', boxShadow:'var(--shadow-card)' }}>
            <p className="font-bold text-2xl leading-none" style={{ color:'var(--gold-light)', fontFamily:'Playfair Display,serif' }}>{votedCount}</p>
            <p className="text-xs mt-1.5" style={{ color:'var(--text-muted)' }}>Elections Voted</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', boxShadow:'var(--shadow-card)' }}>
            <ShieldCheck size={22} className="mx-auto mb-1.5" style={{ color:'var(--gold)' }}/>
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>Vote Secured</p>
          </div>
        </div>
      )}

      {all.length === 0 ? (
        <div className="p-14 rounded-2xl text-center" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
          <Vote size={36} className="mx-auto mb-3" style={{ color:'var(--text-muted)' }}/>
          <p className="font-semibold text-sm" style={{ color:'var(--text-muted)' }}>No elections yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((election, i) => {
            const voted = votedIds.has(election._id);
            return (
              <div key={election._id} className="flex items-center gap-4 p-4 rounded-2xl animate-fade-up"
                style={{ animationDelay:`${i*55}ms`, background:'var(--bg-card)', border:`1px solid ${voted?'rgba(201,168,76,0.25)':'var(--border-card)'}`, boxShadow:'var(--shadow-card)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:voted?'rgba(201,168,76,0.12)':'var(--bg-muted)', border:`1px solid ${voted?'rgba(201,168,76,0.3)':'var(--border-muted)'}` }}>
                  {voted ? <CheckCircle2 size={20} style={{ color:'var(--gold)' }}/> : <Vote size={20} style={{ color:'var(--text-muted)' }}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight truncate" style={{ color:'var(--text-primary)', fontFamily:'Playfair Display,serif' }}>{election.title}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                    <Calendar size={9}/>
                    {election.status === 'upcoming'
                      ? `Starts ${new Date(election.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`
                      : `Ended ${new Date(election.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {voted ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background:'rgba(201,168,76,0.12)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.25)' }}>✓ Voted</span>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background:'var(--bg-muted)', color:'var(--text-muted)', border:'1px solid var(--border-muted)' }}>Not Voted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-5 text-center text-xs flex items-center justify-center gap-1.5" style={{ color:'var(--text-muted)' }}>
        <Lock size={10}/> Ballot choices are permanently confidential and cannot be retrieved.
      </p>
    </div>
  );
};

/* ══════════════════════════════════════
   TAB 3 — Results
══════════════════════════════════════ */
const ResultsTab = ({ elections, loading }) => {
  const completed = elections.filter(e => e.status === 'completed');
  const [results,    setResults]    = useState({});   // { [electionId]: data }
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [openId,     setOpenId]     = useState(null);

  const loadResult = useCallback(async (id) => {
    if (results[id]) { setOpenId(id); return; }
    setLoadingIds(prev => new Set([...prev, id]));
    try {
      const res = await getResults(id);
      setResults(prev => ({ ...prev, [id]: res.data }));
    } catch(e) {
      setResults(prev => ({ ...prev, [id]: null }));
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
    setOpenId(id);
  }, [results]);

  if (loading) return (
    <div className="space-y-3 mt-4">{[1,2].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background:'var(--bg-muted)' }}/>)}</div>
  );

  if (completed.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl mt-4" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
      <BarChart2 size={36} style={{ color:'var(--text-muted)' }}/>
      <p className="font-semibold text-sm" style={{ color:'var(--text-muted)' }}>No completed elections yet</p>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      {completed.map((e, i) => {
        const data    = results[e._id];
        const isOpen  = openId === e._id;
        const isLoading = loadingIds.has(e._id);
        const winner  = data?.results?.[0];
        const totalVotes = data?.results?.reduce((s, c) => s + (c.votes ?? 0), 0) || 0;

        return (
          <div key={e._id} className="rounded-2xl overflow-hidden animate-fade-up"
            style={{ animationDelay:`${i*60}ms`, background:'var(--bg-card)', border:'1px solid var(--border-card)', boxShadow:'var(--shadow-card)' }}>

            {/* Header row */}
            <button className="w-full flex items-center gap-4 p-4 text-left transition-all duration-200"
              style={{ background: isOpen ? 'rgba(201,168,76,0.04)' : 'transparent' }}
              onClick={() => isOpen ? setOpenId(null) : loadResult(e._id)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(201,168,76,0.10)', border:'1px solid rgba(201,168,76,0.20)' }}>
                <Trophy size={17} style={{ color:'var(--gold)' }}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color:'var(--text-primary)', fontFamily:'Playfair Display,serif' }}>{e.title}</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                  <Calendar size={9}/> Ended {new Date(e.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  {data && <> · <Users size={9}/> {totalVotes} votes</>}
                </p>
              </div>
              {isLoading
                ? <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color:'var(--gold)' }}/>
                : <ChevronRight size={16} className="flex-shrink-0 transition-transform duration-300" style={{ color:'var(--text-muted)', transform: isOpen ? 'rotate(90deg)' : 'none' }}/>
              }
            </button>

            {/* Expanded results */}
            {isOpen && data && (
              <div className="px-4 pb-5 animate-fade-up" style={{ opacity:0 }}>
                <div className="h-px mb-4" style={{ background:'var(--border-card)' }}/>

                {/* Winner banner */}
                {winner && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                    style={{ background:'linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.06))', border:'1px solid rgba(201,168,76,0.25)' }}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-bold text-white"
                      style={{ background:'linear-gradient(135deg,#0d1b2a,#1a3a5c)' }}>
                      {winner.candidate?.avatar
                        ? <img src={`${BASE_URL}${winner.candidate.avatar}`} alt={winner.candidate.name} className="w-full h-full object-cover"/>
                        : (winner.candidate?.name || 'W').charAt(0)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color:'var(--gold)' }}>🏆 Winner</p>
                      <p className="font-bold text-sm" style={{ color:'var(--text-primary)', fontFamily:'Playfair Display,serif' }}>{winner.candidate?.name}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{winner.votes} votes · {totalVotes ? Math.round(winner.votes/totalVotes*100) : 0}%</p>
                    </div>
                  </div>
                )}

                {/* All candidates bar chart */}
                <div className="space-y-3">
                  {data.results?.map((c, ci) => {
                    const pct = totalVotes ? Math.round((c.votes ?? 0) / totalVotes * 100) : 0;
                    const isWinner = ci === 0;
                    return (
                      <div key={c._id || ci}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                            style={{ background:'var(--bg-muted)' }}>
                            {c.candidate?.avatar
                              ? <img src={`${BASE_URL}${c.candidate.avatar}`} alt={c.candidate?.name} className="w-full h-full object-cover"/>
                              : (c.candidate?.name || '?').charAt(0)
                            }
                          </div>
                          <p className="flex-1 text-xs font-semibold truncate" style={{ color:'var(--text-primary)' }}>{c.candidate?.name}</p>
                          <p className="text-xs font-bold flex-shrink-0" style={{ color: isWinner ? 'var(--gold)' : 'var(--text-muted)' }}>
                            {c.votes} <span style={{ fontWeight:400 }}>({pct}%)</span>
                          </p>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height:'8px', background:'var(--bg-muted)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${pct}%`, background: isWinner ? 'linear-gradient(to right,var(--gold),#e8c96a)' : 'rgba(255,255,255,0.18)' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-center text-xs" style={{ color:'var(--text-muted)' }}>
                  Total votes cast: <strong style={{ color:'var(--text-secondary)' }}>{totalVotes}</strong>
                </p>
              </div>
            )}

            {isOpen && data === null && (
              <div className="px-4 pb-4 text-center">
                <p className="text-xs py-4" style={{ color:'var(--text-muted)' }}>Results not available yet.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════
   Main Elections Page
══════════════════════════════════════ */
const Elections = () => {
  const { elections, fetchElections, fetchMyVotes, loading } = useElection();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'elections';

  useEffect(() => { fetchElections(); }, [fetchElections]);

  const tabs = [
    { key:'elections', label:'Elections',  icon: Vote },
    { key:'my-votes',  label:'My Votes',   icon: CheckCircle2 },
    { key:'results',   label:'Results',    icon: BarChart2 },
  ];

  const setTab = (key) => setSearchParams({ tab: key });

  return (
    <Layout>
      {/* ── Hero banner ── */}
      <div className="relative rounded-3xl overflow-hidden mb-6 animate-fade-up"
        style={{ boxShadow:'0 8px 32px rgba(0,0,0,0.22)' }}>
        <div style={{ position:'relative', minHeight:'200px' }}>
          <img src={VOTE_HERO} alt="Elections" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition:'center 50%' }}/>
          <div className="absolute inset-0" style={{ background:'linear-gradient(to right,rgba(7,13,24,0.92) 0%,rgba(13,27,42,0.80) 55%,rgba(7,13,24,0.65) 100%)' }}/>
          <div className="absolute inset-0" style={{ background:'linear-gradient(to top,rgba(7,13,24,0.55) 0%,rgba(7,13,24,0.15) 50%,transparent 80%)' }}/>

          {/* glow orbs */}
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full pointer-events-none" style={{ background:'rgba(201,168,76,0.08)', filter:'blur(48px)' }}/>
          <div className="absolute -top-8 right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background:'rgba(201,168,76,0.05)', filter:'blur(40px)' }}/>

          <div className="relative z-10 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

              {/* ── LEFT: title + stats ── */}
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
                  style={{ color:'var(--gold)', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.32)', backdropFilter:'blur(8px)', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background:'var(--gold)' }}/>
                  <span className="hidden sm:inline">Student Council · FOT RUSL</span>
                  <span className="sm:hidden">FOT Elections</span>
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1.5 leading-tight"
                  style={{ fontFamily:'Playfair Display,serif', textShadow:'0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95)' }}>
                  Elections Hub
                </h1>
                <p className="text-xs sm:text-sm mb-1" style={{ color:'rgba(255,255,255,0.92)', textShadow:'0 1px 8px rgba(0,0,0,1)' }}>
                  Vote, track your ballot &amp; view results — all in one place
                </p>
                <p className="text-xs italic mt-1 hidden sm:block" style={{ color:'rgba(201,168,76,0.90)', fontFamily:'Playfair Display,serif', textShadow:'0 1px 6px rgba(0,0,0,1)' }}>
                  "Your vote shapes the future of FOT."
                </p>
                {/* Stats row */}
                <div className="flex gap-4 sm:gap-6 mt-4">
                  {[
                    { v: elections.filter(e=>e.status==='ongoing').length,   l:'Live',      c:'#4ade80' },
                    { v: elections.filter(e=>e.status==='upcoming').length,  l:'Upcoming',  c:'#e8c96a' },
                    { v: elections.filter(e=>e.status==='completed').length, l:'Completed', c:'rgba(255,255,255,0.70)' },
                  ].map((s,i) => (
                    <div key={i}>
                      <p className="font-bold text-lg sm:text-xl leading-none" style={{ color: s.c, textShadow:'0 1px 6px rgba(0,0,0,0.9)' }}>{s.v}</p>
                      <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.88)', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: countdown card ── */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                {elections.filter(e => e.status === 'ongoing').slice(0,1).map(e => (
                  <div key={e._id}
                    onClick={() => navigate(`/elections/${e._id}`)}
                    className="flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                    style={{ background:'rgba(7,13,24,0.65)', border:'1px solid rgba(34,197,94,0.45)', backdropFilter:'blur(12px)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', borderRadius:'16px', padding:'14px 18px' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background:'#22c55e' }}/>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'#4ade80', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>Live Election</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color:'#ffffff', textShadow:'0 1px 6px rgba(0,0,0,0.9)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{e.title}</p>
                    <CountdownTimer targetDate={e.endDate} label="Ends in" onExpire={fetchElections} />
                  </div>
                ))}
                {elections.filter(e => e.status === 'ongoing').length === 0 && elections.filter(e => e.status === 'upcoming').slice(0,1).map(e => (
                  <div key={e._id}
                    onClick={() => navigate(`/elections/${e._id}`)}
                    className="flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                    style={{ background:'rgba(7,13,24,0.65)', border:'1px solid rgba(167,139,250,0.45)', backdropFilter:'blur(12px)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', borderRadius:'16px', padding:'14px 18px' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:'#a78bfa' }}/>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'#c4b5fd', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>Upcoming Election</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color:'#ffffff', textShadow:'0 1px 6px rgba(0,0,0,0.9)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{e.title}</p>
                    <CountdownTimer targetDate={e.startDate} label="Starts in" onExpire={fetchElections} />
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background:'linear-gradient(to right,rgba(201,168,76,0),var(--gold),rgba(201,168,76,0))' }}/>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:'4px', padding:'4px', borderRadius:'18px', marginBottom:'8px', background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
        className="animate-fade-up">
        {tabs.map(t => {
          const active = activeTab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px 8px',
                borderRadius: '14px',
                fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: active ? '#c9a84c' : 'transparent',
                color: active ? '#0d1b2a' : 'var(--text-muted)',
                boxShadow: active ? '0 2px 12px rgba(201,168,76,0.35)' : 'none',
              }}>
              <t.icon size={15}/>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'elections' && <ElectionsTab elections={elections} loading={loading} navigate={navigate} onExpire={fetchElections}/>}
      {activeTab === 'my-votes'  && <MyVotesTab   elections={elections} loading={loading} fetchMyVotes={fetchMyVotes}/>}
      {activeTab === 'results'   && <ResultsTab   elections={elections} loading={loading}/>}
    </Layout>
  );
};

export default Elections;
