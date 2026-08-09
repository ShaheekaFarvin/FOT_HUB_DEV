const { GoogleGenAI } = require('@google/genai');

const { getHistory, addMessage } = require('../ai/memory/conversationMemory');
const { buildContext } = require('../ai/context/contextBuilder');
const { verifyRole } = require('../ai/roles/roleVerifier');
const { routeIntent } = require('../ai/routing/intentRouter');
const { getAvailableTools } = require('../ai/tools/toolRegistry');
const { buildPrompt } = require('../ai/prompt/promptBuilder');

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

const GEMINI_MODEL = 'gemini-2.5-flash';

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
    const sessionId = req.user._id?.toString() || req.user.id;

    console.log("[AI 1] Controller reached");

    const history = getHistory(sessionId);
    console.log("[AI 2] History retrieved:", history);

    const context = buildContext(req.user, trimmedMessage, history);
    console.log("[AI 3] Context built:", context);

    const roleInfo = verifyRole(req.user);
    console.log("[AI 4] Role verified:", roleInfo);

    const intentInfo = routeIntent(trimmedMessage);
    console.log("[AI 5] Intent:", intentInfo);

    const tools = getAvailableTools();
    console.log("[AI 6] Tools:", tools);

    const prompt = buildPrompt(context, tools);

    console.log("[AI 7] GENERATED PROMPT");
    console.log(prompt);
    console.log("[AI 7] END PROMPT");

    console.log("[AI 8] Calling Gemini...");

    const client = getClient();
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    console.log("[AI 9] Gemini response received");
    console.log(response);

    const reply = response.text?.trim();
    if (!reply) {
      return res.status(502).json({ message: 'AI did not return a response. Try again.' });
    }

    console.log("[AI 10] Reply:", reply);

    addMessage(sessionId, "user", trimmedMessage);
    addMessage(sessionId, "assistant", reply);

    console.log("[AI 11] Messages stored");

    return res.json({ reply });
  } catch (error) {
    console.error("[AI ERROR]", error);
    return res.status(500).json({
      message: "Unable to process AI request"
    });
  }
};