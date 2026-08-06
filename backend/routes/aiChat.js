const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { sendMessage } = require('../controllers/aiChatController');

router.post('/message', protect, sendMessage);

module.exports = router;