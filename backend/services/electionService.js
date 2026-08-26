const mongoose = require('mongoose');
const Election = require('../models/Election');

/**
 * Evaluates student voting eligibility for a specific election or all ongoing elections.
 *
 * @param {object} userContext
 * @param {object} [options]
 * @param {string} [options.electionId]
 * @returns {Promise<object|Array>}
 */
const checkStudentVotingEligibility = async (userContext, { electionId } = {}) => {
  const department = userContext?.department;

  if (electionId && typeof electionId === 'string' && electionId.trim()) {
    const trimmedId = electionId.trim();
    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      const err = new Error('Election not found.');
      err.statusCode = 404;
      throw err;
    }

    const election = await Election.findById(trimmedId);
    if (!election) {
      const err = new Error('Election not found.');
      err.statusCode = 404;
      throw err;
    }

    return {
      electionId: trimmedId,
      title: election.title,
      status: election.status,
      eligible: election.isDepartmentEligible(department),
    };
  }

  const ongoingElections = await Election.find({ status: 'ongoing' });
  return ongoingElections
    .filter((election) => election.isDepartmentEligible(department))
    .map((election) => ({
      id: election._id?.toString(),
      title: election.title,
      status: election.status,
    }));
};

/**
 * Retrieves ongoing elections available for voting.
 *
 * @returns {Promise<Array>}
 */
const getOngoingElections = async () => {
  return Election.find({ status: 'ongoing' }).sort({ startDate: -1 });
};

module.exports = {
  checkStudentVotingEligibility,
  getOngoingElections,
};
