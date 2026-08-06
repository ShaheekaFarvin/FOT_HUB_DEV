const { GoogleGenAI } = require('@google/genai');



let ai = null;
const getClient = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in backend/.env');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

const SYSTEM_CONTEXT =
  'You are FOT Buddy, a friendly assistant for students of the Faculty of ' +
  'Technology, Rajarata University of Sri Lanka. Keep answers short, clear, ' +
  'and helpful.';

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // ── Request validation ──
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters)' });
    }

    const client = getClient();

    const response = await client.models.generateContent({
  model: 'gemini-3.6-flash',
  contents: `${SYSTEM_CONTEXT}\n\nStudent: ${message.trim()}`,
});

    const reply = response.text?.trim();
    if (!reply) {
      return res.status(502).json({ message: 'AI did not return a response. Try again.' });
    }

    // ── Basic logging ──
    console.log(`🤖 FOT Buddy | user:${req.user?._id || 'anon'} | msg len:${message.length}`);

    res.json({ reply });
  } catch (err) {
    console.error('FOT Buddy error:', err.message);
    res.status(500).json({ message: 'FOT Buddy is unavailable right now. Please try again shortly.' });
  }
};