const Election = require('../models/Election');

exports.getElections = async (req, res) => {
  try {
    let elections = await Election.find().sort({ createdAt: -1 });
    elections.forEach(e => e.refreshStatus());
    // Students only see elections their department is eligible to vote in.
    // Admins (any type) still see every election for management/oversight.
    if (req.user?.role === 'student') {
      elections = elections.filter(e => e.isDepartmentEligible(req.user.department));
    }
    res.json(elections);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getElectionById = async (req, res) => {
  try {
    const e = await Election.findById(req.params.id);
    if (!e) return res.status(404).json({ message: 'Election not found' });
    e.refreshStatus();
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.castVote = async (req, res) => {
  const { candidateId } = req.body;
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    election.refreshStatus();
    if (election.status !== 'ongoing')
      return res.status(400).json({ message: 'Election is not active' });

    // Department restriction: only eligible departments may vote.
    if (!election.isDepartmentEligible(req.user.department))
      return res.status(403).json({ message: 'Students from your department are not eligible to vote in this election' });

    const candidate = election.candidates.id(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // One vote per position: a student can vote once for President, once for
    // Secretary, etc. — but not twice for the same position.
    const alreadyVotedForPosition = election.votes.find(
      v => v.voter.toString() === req.user._id.toString() && v.position === candidate.position
    );
    if (alreadyVotedForPosition)
      return res.status(400).json({ message: `You have already voted for ${candidate.position} in this election` });

    election.votes.push({ voter: req.user._id, candidateId, position: candidate.position });
    candidate.votes += 1;
    await election.save();
    res.json({ message: 'Vote cast successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyVotes = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    const myVotes = election.votes.filter(v => v.voter.toString() === req.user._id.toString());
    const result = myVotes.map(v => ({
      candidate: election.candidates.id(v.candidateId),
      position: v.position,
      votedAt: v.votedAt,
      electionTitle: election.title,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    election.refreshStatus();
    if (election.status !== 'completed')
      return res.status(400).json({ message: 'Results available after election ends' });

    // Group results by position so each contested seat has its own ranking.
    const positions = election.getPositions();
    const resultsByPosition = positions.map(position => {
      const candidatesForPosition = election.candidates
        .filter(c => c.position === position)
        .sort((a, b) => b.votes - a.votes)
        .map(c => ({
          candidate: { _id: c._id, name: c.name, avatar: c.avatar, manifesto: c.manifesto },
          votes: c.votes,
        }));
      return { position, results: candidatesForPosition };
    });

    // Flat list kept for backward compatibility with any existing UI.
    const sorted = [...election.candidates].sort((a, b) => b.votes - a.votes);
    const results = sorted.map(c => ({
      candidate: { _id: c._id, name: c.name, avatar: c.avatar, manifesto: c.manifesto },
      votes: c.votes,
    }));
    res.json({ election: { _id: election._id, title: election.title }, results, resultsByPosition });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
