import React, { createContext, useContext, useState, useCallback } from 'react';
import { getElections, getElectionById, castVote, getMyVotes } from '../services/api';

const ElectionContext = createContext();

export const ElectionProvider = ({ children }) => {
  const [elections, setElections]           = useState([]);
  const [currentElection, setCurrentElection] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error,   setError]                 = useState(null);

  const fetchElections = useCallback(async () => {
    setLoading(true);
    try { const { data } = await getElections(); setElections(data); }
    catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  const fetchElectionById = useCallback(async (id) => {
    setLoading(true);
    try { const { data } = await getElectionById(id); setCurrentElection(data); return data; }
    catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  const submitVote = async (electionId, candidateId) => {
    setLoading(true);
    try { const { data } = await castVote(electionId, { candidateId }); return data; }
    catch (err) { const m = err.response?.data?.message || 'Failed to cast vote'; setError(m); throw new Error(m); }
    finally { setLoading(false); }
  };

  const fetchMyVotes = async (id) => {
    try { const { data } = await getMyVotes(id); return data; }
    catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <ElectionContext.Provider value={{ elections, currentElection, loading, error, fetchElections, fetchElectionById, submitVote, fetchMyVotes }}>
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => useContext(ElectionContext);
