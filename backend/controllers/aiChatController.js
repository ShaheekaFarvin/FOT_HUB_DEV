const { processUserRequest } = require('../ai/knowledge/ragOrchestrator');


exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters)' });
    }
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const trimmedMessage = message.trim();

    const { reply } = await processUserRequest(req.user, trimmedMessage);

    res.json({ reply });
  } catch (err) {
    console.error('FOT Buddy error:', err.message);
    if (err.statusCode === 502) {
      return res.status(502).json({ message: 'AI did not return a response. Try again.' });
    }
    res.status(500).json({ message: 'FOT Buddy is unavailable right now. Please try again shortly.' });
  }
};