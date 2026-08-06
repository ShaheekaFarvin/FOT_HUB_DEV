const router = require('express').Router();
const { getElections, getElectionById, castVote, getMyVotes, getResults } = require('../controllers/electionController');
const { protect, studentOnly } = require('../middleware/auth');
router.get('/',             protect, getElections);
router.get('/:id',          protect, getElectionById);
router.post('/:id/vote',    protect, studentOnly, castVote);
router.get('/:id/my-votes', protect, studentOnly, getMyVotes);
router.get('/:id/results',  protect, getResults);
module.exports = router;
