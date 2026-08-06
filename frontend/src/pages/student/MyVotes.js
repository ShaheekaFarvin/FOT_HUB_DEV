import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useElection } from '../../context/ElectionContext';
import { ArrowLeft, CheckCircle2, Info, Vote, Lock, ShieldCheck, Calendar } from 'lucide-react';

const MyVotes = () => {
  const { elections, fetchElections, fetchMyVotes } = useElection();
  const [votedElectionIds, setVotedElectionIds] = useState(new Set());
  const [votedCounts, setVotedCounts] = useState({}); // { electionId: numberOfPositionsVoted }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      await fetchElections();
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (elections.length === 0) return;
    elections.forEach(async e => {
      const votes = await fetchMyVotes(e._id);
      if (votes?.length > 0) {
        setVotedElectionIds(prev => new Set([...prev, e._id]));
        setVotedCounts(prev => ({ ...prev, [e._id]: votes.length }));
      }
    });
  }, [elections]);

  // Distinct positions contested in an election (used to show "3/5 positions voted").
  const totalPositions = (election) =>
    new Set((election.candidates || []).map(c => c.position || 'Member')).size;

  const completedElections = elections.filter(e => e.status === 'completed' || e.status === 'ongoing' || e.status === 'upcoming');
  const votedCount = votedElectionIds.size;

  return (
    <Layout>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mb-6 text-sm font-semibold transition-colors group"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Dashboard
      </button>

      {/* Header */}
      <div className="mb-6 animate-fade-up" style={{}}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>My Votes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Elections you have participated in.</p>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 rounded-2xl p-4 mb-6 animate-fade-up" style={{ animationDelay: '60ms',
        background: 'rgba(201,168,76,0.07)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}>
        <Lock size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}/>
        <div>
          <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--gold)' }}>Ballot Secrecy Protected</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your specific vote choices are kept strictly confidential and are never displayed — not even to you after submission. This protects the integrity of the election and your privacy.
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && votedCount > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
            <p className="font-bold text-2xl leading-none" style={{ color: 'var(--gold-light)', fontFamily: 'Playfair Display, serif' }}>{votedCount}</p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Elections Voted</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
            <ShieldCheck size={22} className="mx-auto mb-1.5" style={{ color: 'var(--gold)' }}/>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vote Secured</p>
          </div>
        </div>
      )}

      {/* Election list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'var(--bg-muted)' }}/>
          ))}
        </div>
      ) : completedElections.length === 0 ? (
        <div className="p-14 rounded-2xl text-center animate-fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <Vote size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }}/>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>No elections available yet.</p>
          <button onClick={() => navigate('/elections')} className="btn-primary mt-4 text-xs">Browse Elections</button>
        </div>
      ) : (
        <div className="space-y-3">
          {completedElections.map((election, i) => {
            const voted = votedElectionIds.has(election._id);
            return (
              <div key={election._id}
                className="flex items-center gap-4 p-4 rounded-2xl animate-fade-up"
                style={{
                  animationDelay: `${i * 60 + 120}ms`,
                  background: 'var(--bg-card)',
                  border: `1px solid ${voted ? 'rgba(201,168,76,0.25)' : 'var(--border-card)'}`,
                  boxShadow: 'var(--shadow-card)',
                }}>
                {/* Status icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: voted ? 'rgba(201,168,76,0.12)' : 'var(--bg-muted)',
                    border: `1px solid ${voted ? 'rgba(201,168,76,0.3)' : 'var(--border-muted)'}`,
                  }}>
                  {voted
                    ? <CheckCircle2 size={20} style={{ color: 'var(--gold)' }}/>
                    : <Vote size={20} style={{ color: 'var(--text-muted)' }}/>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
                    {election.title}
                  </p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={9}/>
                    {election.status === 'upcoming'
                      ? `Starts ${new Date(election.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : `Ended ${new Date(election.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                </div>

                {/* Badge */}
                <div className="flex-shrink-0">
                  {voted ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' }}>
                      ✓ Voted {votedCounts[election._id] || 0}/{totalPositions(election)} positions
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
                      Not Voted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-6 text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
        <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Lock size={10}/> Ballot choices are permanently confidential and cannot be retrieved.
        </p>
      </div>
    </Layout>
  );
};

export default MyVotes;
