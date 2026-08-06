import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useElection } from '../../context/ElectionContext';
import { getAnnouncements, getLostFound, getAllComplaints } from '../../services/api';
import { ArrowRight, ChevronRight, Calendar, MapPin, AlertCircle, Bell, Search, Vote, BookOpen, Users, Award, Globe, Mail, Phone, ExternalLink } from 'lucide-react';
import CountdownTimer from '../../components/CountdownTimer';

/* HD Unsplash Images — Free, High Quality, Suitable*/
// Hero / campus sliders — modern university campus aerial & building shots
const FOT_HERO      = '/back.jpeg'; // University campus aerial wide (local public image)
const SLIDE2        = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1400&h=600&q=90'; // Lecture hall interior
const SLIDE3        = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1400&h=600&q=90'; // Library books study
const SLIDE4        = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&h=600&q=90'; // Campus students walking
const SLIDE5        = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&h=600&q=90'; // University building modern
const SLIDE6        = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&h=600&q=90'; // Students group studying
const SLIDE7        = 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&h=600&q=90'; // Campus green trees building

// Campus building — full modern university exterior
const CAMPUS_BUILDING = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=500&q=90';

// ICT Department banner — computer lab / technology
const ICT_BANNER    = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&h=500&q=90';

// ICT Computer Lab — students using computers
const ICT_LAB       = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&h=500&q=90';
const ICT_LAB2      = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&h=500&q=90';

// Activity / events — campus events, graduation, activities
const ACTIVITY_IMG  = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&h=400&q=90';
const STUDENT_IMG   = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&h=400&q=90';

// Election image — voting / ballot box
const ELECTION_IMG  = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&h=400&q=90';

// ICT students industry visit
const ICT_VISIT     = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&h=400&q=90';
const ICT_VISIT2    = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&h=400&q=90';

// Workshop / lecture hall
const WORKSHOP_IMG  = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&h=400&q=90';

// EET field visit — engineering / outdoor
const EET_FIELD     = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&h=400&q=90';

/* ── Feature image assignments ─────────────────────── */
const ANN_IMG       = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&h=300&q=90';  // Announcements → megaphone/speaker
const LF_IMG        = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&h=300&q=90'; // Lost & Found → search/items
const COMP_IMG      = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&h=300&q=90'; // Complaints → professional feedback desk
const VOTE_CARD_IMG = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&h=400&q=90'; // Voting card → election booth

const QA_ANN        = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&h=400&q=90'; // Quick access — Announcements
const QA_COMP       = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&h=400&q=90'; // Quick access — Complaints
const QA_LF         = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&h=400&q=90'; // Quick access — Lost & Found
const QA_VOTE       = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&h=400&q=90'; // Quick access — My Votes

const BASE_URL      = 'http://localhost:5000';

/* ── Status Badge ───────────────────────────────────── */
const StatusBadge = ({ s }) => {
  if (s === 'ongoing')  return <span className="badge-ongoing">● Live</span>;
  if (s === 'upcoming') return <span className="badge-upcoming">◷ Soon</span>;
  if (s === 'pending')  return <span className="badge-pending">Pending</span>;
  if (s === 'lost')     return <span className="badge-ongoing" style={{ background: 'var(--badge-lost-bg)', color: 'var(--badge-lost-text)' }}>Lost</span>;
  if (s === 'found')    return <span className="badge-ongoing" style={{ background: 'var(--badge-fnd-bg)',  color: 'var(--badge-fnd-text)' }}>Found</span>;
  return <span className="badge-completed">Done</span>;
};

/* ── Section Header ─────────────────────────────────── */
const SectionHead = ({ title, sub, to, navigate, delay, icon: Icon }) => (
  <div className="flex items-end justify-between mb-4 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-2.5">
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
          <Icon size={15} style={{ color: 'var(--text-secondary)' }}/>
        </div>
      )}
      <div>
        <h2 className="text-sm font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
    <button onClick={() => navigate(to)} className="btn-outline text-xs flex items-center gap-1">
      View all <ArrowRight size={11}/>
    </button>
  </div>
);

/* ── Quick Access Card ──────────────────────────────── */
const QuickCard = ({ img, label, to, delay, navigate, icon: Icon }) => (
  <button onClick={() => navigate(to)}
    className="group relative overflow-hidden rounded-2xl animate-fade-up"
    style={{
      animationDelay: `${delay}ms`, aspectRatio: '3/2',
      border: '1px solid var(--border-card)',
      boxShadow: 'var(--shadow-card)',
    }}>
    <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy"/>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,27,42,0.9) 0%, rgba(13,27,42,0.25) 60%, transparent 100%)' }}/>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: 'rgba(201,168,76,0.08)' }}/>
    {Icon && (
      <div className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
        <Icon size={13} style={{ color: '#fff' }}/>
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-white font-semibold text-xs" style={{ fontFamily: 'Playfair Display, serif' }}>{label}</p>
      <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <span className="text-xs font-medium" style={{ color: 'var(--gold-light)' }}>Open</span>
        <ChevronRight size={10} style={{ color: 'var(--gold-light)' }}/>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }}/>
  </button>
);

/* ── Skeleton ───────────────────────────────────────── */
const Skeleton = ({ h = 'h-16', count = 3 }) => (
  <>{Array.from({ length: count }).map((_, i) => (
    <div key={i} className={`${h} rounded-2xl animate-pulse mb-2`} style={{ background: 'var(--bg-muted)' }}/>
  ))}</>
);

/* ════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { elections, fetchElections, loading: elLoading } = useElection();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [lostFound,     setLostFound]     = useState([]);
  const [complaints,    setComplaints]    = useState([]);
  const [dataLoading,   setDataLoading]   = useState(true);
  const [heroLoaded,    setHeroLoaded]    = useState(false);

  useEffect(() => {
    fetchElections();
    Promise.all([getAnnouncements(), getLostFound(), getAllComplaints()])
      .then(([a, l, c]) => {
        setAnnouncements(a.data.slice(0, 3));
        setLostFound(l.data.slice(0, 4));
        setComplaints(c.data.slice(0, 3));
      }).finally(() => setDataLoading(false));
  }, [fetchElections]);

  const activeElections = elections.filter(e => e.status === 'ongoing' || e.status === 'upcoming').slice(0, 4);

  const quickLinks = [
    { img: QA_ANN,  label: 'Announcements', to: '/announcements', icon: Bell        },
    { img: QA_COMP, label: 'Complaints',    to: '/complaints',    icon: AlertCircle },
    { img: QA_LF,   label: 'Lost & Found',  to: '/lost-found',    icon: Search      },
    { img: QA_VOTE, label: 'My Votes',      to: '/my-votes',      icon: Vote        },
  ];

  const priorityBorder = { high: '#ef4444', medium: '#3b82f6', low: 'var(--border-card)' };

  return (
    <Layout>

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden mb-7 animate-fade-up"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
        <div style={{ position: 'relative', minHeight: '240px' }}>
        {!heroLoaded && (
          <div className="w-full animate-pulse" style={{ height: '240px', background: 'linear-gradient(135deg, #070d18, #0d1b2a)' }}/>
        )}
        <img
          src={FOT_HERO}
          alt="Faculty of Technology — Rajarata University of Sri Lanka"
          onLoad={() => setHeroLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: 'center 35%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.88) 0%, rgba(13,27,42,0.72) 55%, rgba(13,27,42,0.55) 100%)' }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,13,24,0.60) 0%, rgba(7,13,24,0.20) 50%, transparent 80%)' }}/>

        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(201,168,76,0.1)', filter: 'blur(48px)' }}/>
        <div className="absolute -top-8 right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'rgba(201,168,76,0.06)', filter: 'blur(40px)' }}/>

        <div className="relative z-10 p-5 sm:p-8 lg:p-10">
          <div className="animate-fade-up flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4" style={{ animationDelay: '200ms' }}>

            {/* ── Welcome Text ── */}
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
                style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.30)', backdropFilter: 'blur(8px)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--gold)' }}/>
                <span className="hidden sm:inline">Faculty of Technology · Rajarata University</span>
                <span className="sm:hidden">FOT · RUSL</span>
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1.5 leading-tight" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)' }}>
                Welcome back,{' '}
                <span style={{ color: '#e8c96a' }}>{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-xs sm:text-sm mb-1" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,1)' }}>
                {user?.department} · {user?.year} · Student Portal
              </p>
              <p className="text-xs italic mt-1 hidden sm:block" style={{ color: 'rgba(201,168,76,0.95)', fontFamily: 'Playfair Display, serif', textShadow: '0 1px 6px rgba(0,0,0,1)' }}>
                "Empowering students through technology &amp; democracy."
              </p>
              <div className="flex gap-4 sm:gap-6 mt-4">
                {[
                  { v: activeElections.length, l: 'Elections' },
                  { v: announcements.length,   l: 'Notices' },
                  { v: complaints.length,      l: 'Complaints' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="font-bold text-lg sm:text-xl leading-none" style={{ color: '#e8c96a', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>{s.v}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.90)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Election Countdown ── */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              {activeElections.filter(e => e.status === 'ongoing').slice(0,1).map(e => (
                <div key={e._id}
                  onClick={() => navigate(`/elections/${e._id}`)}
                  className="flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                  style={{ background: 'rgba(7,13,24,0.65)', border: '1px solid rgba(34,197,94,0.45)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '16px', padding: '12px 16px' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#22c55e' }}/>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4ade80', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Live Election</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{e.title}</p>
                  <CountdownTimer targetDate={e.endDate} label="Ends in" />
                </div>
              ))}
              {activeElections.filter(e => e.status === 'upcoming').length > 0 && activeElections.filter(e => e.status === 'ongoing').length === 0 && (
                activeElections.filter(e => e.status === 'upcoming').slice(0,1).map(e => (
                  <div key={e._id}
                    onClick={() => navigate(`/elections/${e._id}`)}
                    className="flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                    style={{ background: 'rgba(7,13,24,0.65)', border: '1px solid rgba(167,139,250,0.45)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '16px', padding: '12px 16px' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#a78bfa' }}/>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c4b5fd', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Upcoming Election</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{e.title}</p>
                    <CountdownTimer targetDate={e.startDate} label="Starts in" />
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
        </div>
      </div>

      {/* ══ QUICK ACCESS ════════════════════════════════════ */}
      <div className="mb-7 animate-fade-up" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, var(--border-card))' }}/>
          <span className="text-xs font-semibold uppercase tracking-widest px-3" style={{ color: 'var(--text-muted)' }}>Quick Access</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, var(--border-card))' }}/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((q, i) => (
            <QuickCard key={q.to} {...q} delay={80 + i * 55} navigate={navigate}/>
          ))}
        </div>
      </div>

      {/* ══ ANNOUNCEMENTS ═══════════════════════════════════ */}
      <div className="mb-7">
        <SectionHead title="Announcements" sub="Latest from FOT administration" to="/announcements" navigate={navigate} delay={300} icon={Bell}/>

        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '7rem' }}>
          <img src={ANN_IMG} alt="Announcements" className="w-full h-full object-cover" style={{ objectPosition: 'center 60%' }}/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82), rgba(13,27,42,0.3))' }}/>
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)' }}>Faculty Notices</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Stay updated with official announcements from FOT</p>
          </div>
          {/* Carousel dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map(d => (
              <span key={d} className="rounded-full transition-all duration-200"
                style={{ width: d === 0 ? '14px' : '5px', height: '5px', background: d === 0 ? 'var(--gold, #e8c96a)' : 'rgba(255,255,255,0.35)' }}/>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {dataLoading ? <Skeleton count={3}/> :
           announcements.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: '7rem' }}>
              <img src={SLIDE3} alt="" className="w-full h-full object-cover opacity-20"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>No announcements yet</p>
              </div>
            </div>
           ) :
           announcements.map((a, i) => {
            const catPill = {
              General:   { bg: 'rgba(107,114,128,0.12)', c: '#6b7280' },
              Academic:  { bg: 'rgba(21,101,216,0.12)',  c: '#c9a84c' },
              Event:     { bg: 'rgba(16,185,129,0.12)',  c: '#059669' },
              Election:  { bg: 'rgba(124,58,237,0.12)',  c: '#7c3aed' },
              Emergency: { bg: 'rgba(239,68,68,0.12)',   c: '#dc2626' },
            }[a.category] || { bg: 'var(--bg-muted)', c: 'var(--text-muted)' };
            const iconBg = { General: '#6b7280', Academic: '#c9a84c', Event: '#059669', Election: '#7c3aed', Emergency: '#dc2626' }[a.category] || '#c9a84c';
            return (
            <div key={a._id} onClick={() => navigate('/announcements')}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer animate-fade-up transition-all duration-200"
              style={{
                animationDelay: `${i*60+320}ms`,
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(21,101,216,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.transform = ''; }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: iconBg + '18' }}>
                <Calendar size={13} style={{ color: iconBg }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: catPill.bg, color: catPill.c }}>{a.category || 'General'}</span>
                  {a.priority === 'medium' && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(21,101,216,0.10)', color: '#c9a84c' }}>Medium</span>}
                  {a.priority === 'high' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>High</span>}
                </div>
                <p className="font-semibold text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  By {a.createdBy?.name || 'Admin'} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/>
            </div>
          );})}
        </div>
      </div>

      {/* ══ LOST & FOUND ════════════════════════════════════ */}
      <div className="mb-7">
        <SectionHead title="Lost & Found" sub="Recent items reported on campus" to="/lost-found" navigate={navigate} delay={370} icon={Search}/>

        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '7rem' }}>
          <img src={LF_IMG} alt="Lost and Found" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82), rgba(13,27,42,0.3))' }}/>
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)' }}>Campus Lost & Found</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Report or claim lost items across the FOT campus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {dataLoading ? (
            <><Skeleton count={4} h="h-20"/></>
           ) :
           lostFound.length === 0 ? (
            <div className="col-span-full relative rounded-2xl overflow-hidden" style={{ height: '7rem' }}>
              <img src={SLIDE6} alt="" className="w-full h-full object-cover opacity-20"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>No active items</p>
              </div>
            </div>
           ) :
           lostFound.map((item, i) => (
            <div key={item._id} onClick={() => navigate('/lost-found')}
              className="flex gap-2.5 p-2.5 rounded-xl cursor-pointer animate-fade-up transition-all duration-200 overflow-hidden"
              style={{
                animationDelay: `${i*55+390}ms`,
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.transform = ''; }}>
              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                {item.imageUrl
                  ? <img src={`${BASE_URL}${item.imageUrl}`} alt="" className="w-full h-full object-cover"/>
                  : <img src={ICT_LAB} alt="" className="w-full h-full object-cover opacity-60"/>}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <StatusBadge s={item.type}/>
                <p className="font-semibold text-xs leading-tight truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-xs flex items-center gap-0.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={9}/>{item.location}
                </p>
              </div>
            </div>
           ))}
        </div>
      </div>

      {/* ══ ELECTIONS ═══════════════════════════════════════ */}
      <div className="mb-7">
        <SectionHead title="Active Elections" sub="Cast your vote and make a difference" to="/elections" navigate={navigate} delay={450} icon={Vote}/>

        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '7rem' }}>
          <img src={VOTE_CARD_IMG} alt="Elections" className="w-full h-full object-cover" style={{ objectPosition: 'center 55%' }}/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82), rgba(13,27,42,0.3))' }}/>
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)' }}>Student Council Elections</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Exercise your democratic right — every vote counts</p>
          </div>
        </div>

        {elLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton count={2} h="h-20"/>
          </div>
        ) : activeElections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl animate-fade-up"
            style={{ animationDelay: '480ms', background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
            <Vote size={28} style={{ color: 'var(--text-muted)' }}/>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No active elections right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {activeElections.map((e, i) => (
              <div key={e._id} onClick={() => navigate(`/elections/${e._id}`)}
                className="flex gap-2.5 p-2.5 rounded-xl cursor-pointer animate-fade-up transition-all duration-200 overflow-hidden"
                style={{
                  animationDelay: `${i*55+470}ms`,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={ev => {
                  ev.currentTarget.style.borderColor = e.status === 'ongoing' ? 'rgba(34,197,94,0.35)' : 'rgba(201,168,76,0.3)';
                  ev.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={ev => {
                  ev.currentTarget.style.borderColor = 'var(--border-card)';
                  ev.currentTarget.style.transform = '';
                }}>

                {/* Square thumbnail */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                  <img
                    src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=200&h=200&q=90"
                    alt="election"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 55%' }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <StatusBadge s={e.status}/>
                  <p className="font-semibold text-xs leading-tight truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {e.title}
                  </p>
                  <div className="mt-0.5">
                    {e.status === 'ongoing' && (
                      <CountdownTimer targetDate={e.endDate} label="Ends in" compact />
                    )}
                    {e.status === 'upcoming' && (
                      <CountdownTimer targetDate={e.startDate} label="Starts in" compact />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ COMPLAINTS ══════════════════════════════════════ */}
      <div className="mb-8">
        <SectionHead title="Recent Complaints" sub="What students are reporting" to="/complaints" navigate={navigate} delay={550} icon={AlertCircle}/>

        <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: '7rem' }}>
          <img src={COMP_IMG} alt="Complaints" className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }}/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,13,24,0.82), rgba(13,27,42,0.3))' }}/>
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)' }}>Student Complaints</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Submit and track your complaints to the faculty</p>
          </div>
        </div>

        <div className="space-y-2">
          {dataLoading ? <Skeleton count={2}/> :
           complaints.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '580ms', height: '8rem' }}>
              <img src={SLIDE4} alt="" className="w-full h-full object-cover opacity-15"/>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <AlertCircle size={20} style={{ color: 'var(--text-muted)' }}/>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No complaints yet</p>
              </div>
            </div>
           ) :
           complaints.map((c, i) => {
            const catPill = {
              Academic:       { bg: 'rgba(21,101,216,0.12)',  c: '#c9a84c' },
              Facility:       { bg: 'rgba(16,185,129,0.12)',  c: '#059669' },
              Staff:          { bg: 'rgba(124,58,237,0.12)',  c: '#7c3aed' },
              Administration: { bg: 'rgba(239,68,68,0.12)',   c: '#dc2626' },
              Other:          { bg: 'rgba(107,114,128,0.12)', c: '#6b7280' },
            }[c.category] || { bg: 'var(--bg-muted)', c: 'var(--text-muted)' };
            const iconBg = { Academic: '#c9a84c', Facility: '#059669', Staff: '#7c3aed', Administration: '#dc2626', Other: '#6b7280' }[c.category] || '#c9a84c';
            const stBadge = {
              pending:       'badge-pending',
              'in-progress': 'badge-progress',
              resolved:      'badge-resolved',
              rejected:      'badge-rejected',
            };
            return (
              <div key={c._id} onClick={() => navigate('/complaints')}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer animate-fade-up transition-all duration-200"
                style={{
                  animationDelay: `${i*55+570}ms`,
                  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                  boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(21,101,216,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.transform = ''; }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: iconBg + '18' }}>
                  <AlertCircle size={13} style={{ color: iconBg }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: catPill.bg, color: catPill.c }}>{c.category || 'Other'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stBadge[c.status] || 'badge-pending'}`}>{c.status}</span>
                  </div>
                  <p className="font-semibold text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    By {c.submittedBy?.anonymous ? 'Anonymous' : (c.submittedBy?.name || 'Unknown')} · {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/>
              </div>
            );
           })}
        </div>
      </div>

      {/* ══ ABOUT US ════════════════════════════════════════ */}
      <div className="mb-2 animate-fade-up" style={{ animationDelay: '650ms' }}>

        {/* About Header Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-5" style={{ boxShadow: 'var(--shadow-hover)' }}>
          <div className="relative" style={{ height: '10rem' }}>
            <img src={CAMPUS_BUILDING} alt="Faculty of Technology" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}/>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(7,13,24,0.95) 0%, rgba(13,27,42,0.75) 60%, rgba(13,27,42,0.4) 100%)' }}/>
            <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 w-fit"
                style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                <BookOpen size={11}/> About This Portal
              </span>
              <h2 className="text-xl lg:text-2xl font-bold text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                FOT Student Hub
              </h2>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Faculty of Technology · Rajarata University of Sri Lanka · Mihintale
              </p>
            </div>
          </div>
          <div className="h-[2px]" style={{ background: 'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
        </div>

        {/* About Description */}
        <div className="p-5 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>FOT Student Hub</span> is the official digital portal for students of the Faculty of Technology, Rajarata University of Sri Lanka. It provides a unified platform to participate in student council elections, access faculty announcements, report lost &amp; found items, and submit complaints — all in one secure place.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
            Built to uphold transparency and democratic participation, the portal ensures every registered student has a fair, one-person one-vote experience for all official student elections.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { icon: Vote,        title: 'Fair Elections',   desc: 'Secure, anonymous student council voting with live results.' },
            { icon: Bell,        title: 'Announcements',    desc: 'Official notices from the FOT administration in real time.' },
            { icon: Search,      title: 'Lost & Found',     desc: 'Campus-wide lost and found reporting and recovery system.' },
            { icon: AlertCircle, title: 'Complaints',       desc: 'Submit and track academic or facility complaints easily.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="p-4 rounded-2xl flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <Icon size={16} style={{ color: 'var(--gold)' }}/>
              </div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Users,  value: '1,200+', label: 'Registered Students' },
            { icon: Award,  value: '5',      label: 'Departments'         },
            { icon: Globe,  value: '100%',   label: 'Secure & Encrypted'  },
          ].map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="p-4 rounded-2xl text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ background: 'var(--bg-muted)' }}>
                <Icon size={14} style={{ color: 'var(--text-secondary)' }}/>
              </div>
              <p className="font-bold text-base leading-none" style={{ color: 'var(--gold-light)', fontFamily: 'Playfair Display, serif' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Contact & Links */}
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Contact &amp; Links</p>
          <div className="flex flex-col gap-2.5">
            <a href="https://fot.rjt.ac.lk" target="_blank" rel="noreferrer"
              className="flex items-center gap-3 text-xs transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Globe size={13} style={{ flexShrink: 0 }}/> fot.rjt.ac.lk
              <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: 0.4 }}/>
            </a>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={13} style={{ flexShrink: 0 }}/> Faculty of Technology, RUSL, Mihintale, Sri Lanka
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Mail size={13} style={{ flexShrink: 0 }}/> info@fot.rjt.ac.lk
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Phone size={13} style={{ flexShrink: 0 }}/> +94 25 2266 429
            </div>
          </div>
        </div>

        {/* Bottom copyright strip */}
        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} FOT Student Hub · Rajarata University of Sri Lanka · All rights reserved
          </p>
        </div>

      </div>

    </Layout>
  );
};

export default Dashboard;
