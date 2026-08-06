import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useElection } from '../../context/ElectionContext';
import {
  ArrowLeft, AlertCircle, CheckCircle2, Lock,
  Info, ChevronRight, Loader2, X, User, FileText, Award
} from 'lucide-react';
import { ImageLightbox } from '../../components/ImageLightbox';
import CountdownTimer from '../../components/CountdownTimer';

const VOTE_HERO_BG = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1400&h=500&q=90';
const BASE_URL = 'http://localhost:5000';

/* Group a flat candidate list into [{ position, candidates }] preserving
   first-seen position order. */
const groupByPosition = (candidates = []) => {
  const order = [];
  const map = {};
  candidates.forEach(c => {
    const pos = c.position || 'Member';
    if (!map[pos]) { map[pos] = []; order.push(pos); }
    map[pos].push(c);
  });
  return order.map(position => ({ position, candidates: map[position] }));
};

/* ─────────────────────────────────────────
   Candidate Detail Modal
───────────────────────────────────────── */
const CandidateModal = ({ candidate, onClose, onVote, canVote }) => {
  const [photoZoom, setPhotoZoom] = React.useState(false);
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up" style={{opacity:0}}>

      {/* Header with photo */}
      <div className="relative h-40 bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] flex items-end px-6 pb-5">
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
            <X size={16} className="text-white"/>
          </button>
        </div>
        {/* Large avatar — click to zoom */}
        <div
          className={`w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 mr-4 ${candidate.avatar ? 'cursor-zoom-in group' : ''}`}
          onClick={() => candidate.avatar && setPhotoZoom(true)}
        >
          {candidate.avatar
            ? <img src={`${BASE_URL}${candidate.avatar}`} alt={candidate.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
            : <span className="text-3xl font-bold text-[#0d1b2a]">{candidate.name.charAt(0)}</span>
          }
        </div>
        <div className="pb-1">
          <p className="text-white font-bold text-lg leading-tight">{candidate.name}</p>
          {candidate.position && <p className="text-[#c9a84c] text-xs font-bold mt-0.5">{candidate.position}</p>}
          {candidate.avatar && <p className="text-white/40 text-xs mt-0.5">Tap photo to enlarge</p>}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-[#c9a84c]"/>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Manifesto & Vision</p>
          </div>
          {candidate.manifesto ? (
            <p className="text-sm text-secondary leading-relaxed bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-card)]">
              {candidate.manifesto}
            </p>
          ) : (
            <p className="text-sm text-muted italic">No manifesto provided.</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--border-card)] text-secondary rounded-xl font-semibold text-sm hover:bg-[var(--bg-card-hover)] transition">
            Close
          </button>
          {canVote && (
            <button onClick={onVote}
              className="flex-1 py-2.5 rounded-xl bg-[#0d1b2a] text-white font-bold text-sm hover:bg-[#1a2f4a] transition flex items-center justify-center gap-2">
              <Lock size={13}/> Vote for {candidate.name.split(' ')[0]}
            </button>
          )}
        </div>
      </div>
    </div>
    {photoZoom && candidate.avatar && (
      <ImageLightbox src={`${BASE_URL}${candidate.avatar}`} alt={candidate.name} onClose={() => setPhotoZoom(false)}/>
    )}
  </div>
);};

/* ─────────────────────────────────────────
   Candidate Card (select step)
───────────────────────────────────────── */
const CandidateCard = ({ c, selected, onSelect, onViewProfile }) => (
  <div onClick={() => onSelect(c)}
    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${ 
      selected
        ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-lg shadow-[#c9a84c]/10'
        : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold)] hover:shadow-md'
    }`}>

    {/* Radio */}
    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-[#c9a84c] bg-[#c9a84c]' : 'border-[var(--border-card)]'}`}>
      {selected && <div className="w-2 h-2 rounded-full bg-white"/>}
    </div>

    {/* Photo + name */}
    <div className="flex items-center gap-3 mb-3 pr-6">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
        {c.avatar
          ? <img src={`${BASE_URL}${c.avatar}`} alt={c.name} className="w-full h-full object-cover"/>
          : c.name.charAt(0)
        }
      </div>
      <div>
        <p className="font-bold text-primary text-sm">{c.name}</p>
      </div>
    </div>

    {/* Manifesto preview */}
    <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-2">{c.manifesto}</p>

    {/* View profile button */}
    <button
      className="flex items-center gap-1.5 text-xs text-primary font-bold bg-[var(--bg-muted)] hover:bg-[#c9a84c]/15 px-2.5 py-1.5 rounded-lg transition"
      onClick={e => { e.stopPropagation(); onViewProfile(c); }}>
      <User size={11}/> View Full Profile
    </button>
  </div>
);

/* ─────────────────────────────────────────
   Candidate Tile (detail / overview step)
───────────────────────────────────────── */
const CandidateTile = ({ c, onView }) => (
  <div className="flex gap-3 p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-card)] hover:bg-[var(--bg-card-hover)] transition group">
    <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
      {c.avatar
        ? <img src={`${BASE_URL}${c.avatar}`} alt={c.name} className="w-full h-full object-cover"/>
        : c.name.charAt(0)
      }
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-bold text-primary text-sm mb-1">{c.name}</p>
      <p className="text-xs text-secondary line-clamp-2">{c.manifesto}</p>
    </div>
    <button
      onClick={() => onView(c)}
      className="flex-shrink-0 self-start mt-1 p-1.5 text-muted hover:text-primary hover:bg-[var(--bg-card-hover)] rounded-lg transition border border-transparent hover:border-[var(--border-card)]"
      title="View profile">
      <User size={14}/>
    </button>
  </div>
);

/* ─────────────────────────────────────────
   Main VotingPage
───────────────────────────────────────── */
const VotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentElection, fetchElectionById, submitVote, fetchMyVotes, loading } = useElection();

  const [step, setStep]             = useState('detail');
  // One vote per position: { [position]: candidateObject }
  const [selected, setSelected]     = useState({});
  // Positions the student has already voted for in this election: { [position]: candidateName }
  const [votedPositions, setVotedPositions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justVoted, setJustVoted]   = useState([]); // candidates voted for in the last submit, for the success screen

  // Candidate modal
  const [viewCandidate, setViewCandidate] = useState(null);

  useEffect(() => { fetchElectionById(id); }, [id]);

  useEffect(() => {
    let active = true;
    fetchMyVotes(id).then(votes => {
      if (!active || !votes) return;
      const map = {};
      votes.forEach(v => { map[v.position] = v.candidate?.name || 'a candidate'; });
      setVotedPositions(map);
    });
    return () => { active = false; };
  }, [id]);

  const positionGroups = groupByPosition(currentElection?.candidates);
  const remainingGroups = positionGroups.filter(g => !votedPositions[g.position]);
  const selectedEntries = Object.entries(selected); // [[position, candidate], ...]

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const voted = [];
      for (const [position, candidate] of selectedEntries) {
        await submitVote(id, candidate._id);
        voted.push(candidate);
      }
      setJustVoted(voted);
      setStep('success');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading && !currentElection) return (
    <Layout><div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary"/></div></Layout>
  );
  if (!currentElection) return null;

  const statusDot = { ongoing:'bg-emerald-500', upcoming:'bg-amber-500', completed:'bg-gray-400' };

  return (
    <Layout>
      {/* Back button */}
      <button
        onClick={() => {
          const prev = { select:'detail', review:'select', confirm:'review', success:'detail' };
          step === 'detail' ? navigate('/elections') : setStep(prev[step] || 'detail');
        }}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 text-sm font-semibold transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back
      </button>

      {/* ════════════ DETAIL STEP ════════════ */}
      {step === 'detail' && (
        <div className="animate-fade-up" style={{opacity:0}}>
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden mb-6"
            style={{ height:'13rem', boxShadow:'0 8px 32px rgba(0,0,0,0.22)' }}>
            <img src={VOTE_HERO_BG} alt="Elections" className="w-full h-full object-cover" style={{ objectPosition:'center 40%' }}/>
            <div className="absolute inset-0" style={{ background:'linear-gradient(to right, rgba(7,13,24,0.82) 0%, rgba(13,27,42,0.70) 55%, rgba(13,27,42,0.55) 100%)' }}/>
            <div className="absolute inset-0 flex flex-col justify-center px-7 lg:px-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 w-fit"
                style={{ color:'var(--gold)', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background:'var(--gold)' }}/>
                Student Elections · FOT
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-2"
                style={{ fontFamily:'Playfair Display, serif', textShadow:'0 2px 10px rgba(0,0,0,0.85)' }}>{currentElection.title}</h1>
              <div className="flex flex-wrap gap-4 text-xs" style={{ color:'rgba(255,255,255,0.92)' }}>
                <span>📋 {currentElection.type}</span>
                <span>📅 {new Date(currentElection.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                <span>⏰ Ends {new Date(currentElection.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              {/* Live countdown */}
              {currentElection.status === 'ongoing' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <CountdownTimer
                    targetDate={currentElection.endDate}
                    label="Ends in"
                  />
                </div>
              )}
              {currentElection.status === 'upcoming' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <CountdownTimer
                    targetDate={currentElection.startDate}
                    label="Starts in"
                  />
                </div>
              )}
            </div>
            <div className="absolute top-5 right-6">
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
                currentElection.status==='ongoing' ? 'bg-emerald-500/20 text-emerald-300'
                : currentElection.status==='upcoming' ? 'bg-amber-500/20 text-amber-300'
                : 'bg-gray-500/20 text-gray-300'}`}>
                <span className={`w-2 h-2 rounded-full ${statusDot[currentElection.status]}`}/>
                {currentElection.status}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background:'linear-gradient(to right, rgba(201,168,76,0), var(--gold), rgba(201,168,76,0))' }}/>
          </div>

          {/* Candidates grouped by position */}
          <div className="card p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-primary" style={{fontFamily:'Playfair Display,serif'}}>
                Candidates
              </h2>
              {currentElection.status === 'ongoing' && remainingGroups.length > 0 && (
                <button onClick={() => setStep('select')}
                  className="btn-primary flex items-center gap-1.5 py-2">
                  <Lock size={14}/> Vote Now
                </button>
              )}
            </div>

            {positionGroups.map(g => (
              <div key={g.position} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} className="text-[#c9a84c]"/>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">{g.position}</p>
                  {votedPositions[g.position] && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={9}/> Voted for {votedPositions[g.position]}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.candidates.map(c => (
                    <CandidateTile key={c._id} c={c} onView={setViewCandidate}/>
                  ))}
                </div>
              </div>
            ))}

            <p className="flex items-center gap-1 text-xs text-muted mt-4">
              <Info size={11}/> You can vote once per position ({positionGroups.map(g => g.position).join(', ') || 'no positions yet'}). Click the person icon to view full profile.
            </p>
          </div>
        </div>
      )}

      {/* ════════════ SELECT STEP ════════════ */}
      {step === 'select' && (
        <div className="card p-6 animate-fade-up" style={{opacity:0}}>
          <h2 className="text-2xl font-bold text-primary mb-2" style={{fontFamily:'Playfair Display,serif'}}>
            Select Your Candidates
          </h2>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700 font-medium">
              You can vote for <strong>one candidate per position</strong>. Pick as many positions as you like now — you can always come back and vote for the rest later.
            </p>
          </div>

          {remainingGroups.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-500"/>
              <p className="text-sm font-semibold text-primary">You've already voted for every position in this election.</p>
            </div>
          ) : (
            remainingGroups.map(g => (
              <div key={g.position} className="mb-7 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} className="text-[#c9a84c]"/>
                  <p className="text-sm font-bold text-primary">{g.position}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.candidates.map(c => (
                    <CandidateCard
                      key={c._id} c={c}
                      selected={selected[g.position]?._id === c._id}
                      onSelect={cand => setSelected(prev => ({ ...prev, [g.position]: cand }))}
                      onViewProfile={setViewCandidate}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => { setStep('detail'); setSelected({}); }} className="btn-outline">Cancel</button>
            <button onClick={() => selectedEntries.length > 0 && setStep('review')} disabled={selectedEntries.length === 0}
              className="btn-primary flex items-center gap-2">
              Review Vote{selectedEntries.length > 1 ? 's' : ''} <ChevronRight size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* ════════════ REVIEW STEP ════════════ */}
      {step === 'review' && selectedEntries.length > 0 && (
        <div className="max-w-md mx-auto card p-7 animate-fade-up" style={{opacity:0}}>
          <h2 className="text-2xl font-bold text-primary mb-2" style={{fontFamily:'Playfair Display,serif'}}>
            Review Your Vote{selectedEntries.length > 1 ? 's' : ''}
          </h2>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-blue-700">Please review carefully. You can go back to change your selections.</p>
          </div>
          <div className="space-y-3 mb-6">
            {selectedEntries.map(([position, cand]) => (
              <div key={position} className="p-5 border-2 border-[var(--border-card)] rounded-2xl bg-[var(--bg-muted)]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
                    {cand.avatar
                      ? <img src={`${BASE_URL}${cand.avatar}`} alt={cand.name} className="w-full h-full object-cover"/>
                      : cand.name.charAt(0)
                    }
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-semibold uppercase tracking-wide mb-0.5">{position}</p>
                    <p className="font-bold text-primary text-lg">{cand.name}</p>
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{cand.manifesto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('select')} className="btn-outline flex-1 flex items-center justify-center gap-1">
              <ArrowLeft size={15}/> Change
            </button>
            <button onClick={() => setStep('confirm')} className="btn-primary flex-1 flex items-center justify-center gap-1">
              Confirm <ChevronRight size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* ════════════ CONFIRM STEP ════════════ */}
      {step === 'confirm' && selectedEntries.length > 0 && (
        <div className="max-w-sm mx-auto card p-8 text-center animate-fade-up" style={{opacity:0}}>
          <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-red-500"/>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2" style={{fontFamily:'Playfair Display,serif'}}>Are you sure?</h2>
          <p className="text-secondary text-sm mb-6">Once submitted, your vote{selectedEntries.length > 1 ? 's' : ''} cannot be changed or undone.</p>
          <div className="space-y-2 mb-6 text-left">
            {selectedEntries.map(([position, cand]) => (
              <div key={position} className="flex items-center gap-3 bg-[var(--bg-muted)] rounded-2xl p-4 border border-[var(--border-card)]">
                <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                  {cand.avatar
                    ? <img src={`${BASE_URL}${cand.avatar}`} alt={cand.name} className="w-full h-full object-cover"/>
                    : cand.name.charAt(0)
                  }
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">{position}</p>
                  <p className="font-bold text-primary">{cand.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('review')} className="btn-outline flex-1">Go Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting
                ? <><Loader2 size={15} className="animate-spin"/> Submitting...</>
                : <>Confirm & Submit</>}
            </button>
          </div>
        </div>
      )}

      {/* ════════════ SUCCESS STEP ════════════ */}
      {step === 'success' && justVoted.length > 0 && (
        <div className="max-w-sm mx-auto card p-10 text-center animate-fade-up" style={{opacity:0}}>
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5 animate-pulse-slow">
            <CheckCircle2 size={44} className="text-emerald-500"/>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2" style={{fontFamily:'Playfair Display,serif'}}>Vote{justVoted.length > 1 ? 's' : ''} Submitted!</h2>
          <p className="text-secondary text-sm mb-6">Thank you for participating in the election.</p>
          <div className="bg-gradient-to-br from-[#0d1b2a] to-[#243b6a] rounded-2xl p-5 mb-6 space-y-3">
            <p className="text-white/60 text-xs">You voted for</p>
            {justVoted.map(cand => (
              <div key={cand._id} className="flex items-center gap-3 justify-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                  {cand.avatar
                    ? <img src={`${BASE_URL}${cand.avatar}`} alt={cand.name} className="w-full h-full object-cover"/>
                    : cand.name.charAt(0)
                  }
                </div>
                <div className="text-left">
                  <p className="text-white/50 text-[10px] uppercase tracking-wide">{cand.position}</p>
                  <p className="font-bold text-white">{cand.name}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="flex items-center justify-center gap-1 text-xs text-muted mb-6">
            <Info size={11}/> Your vote is recorded securely.
          </p>
          <button onClick={() => navigate('/elections')} className="btn-primary w-full py-3">
            Back to Elections
          </button>
        </div>
      )}

      {/* ════════════ CANDIDATE PROFILE MODAL ════════════ */}
      {viewCandidate && (
        <CandidateModal
          candidate={viewCandidate}
          onClose={() => setViewCandidate(null)}
          canVote={currentElection.status === 'ongoing' && step !== 'success' && !votedPositions[viewCandidate.position]}
          onVote={() => {
            setSelected(prev => ({ ...prev, [viewCandidate.position]: viewCandidate }));
            setViewCandidate(null);
            setStep('select');
          }}
        />
      )}
    </Layout>
  );
};

export default VotingPage;
