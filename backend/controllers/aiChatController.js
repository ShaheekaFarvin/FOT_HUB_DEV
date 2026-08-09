const { GoogleGenAI } = require('@google/genai');

const { getHistory, addMessage } = require('../ai/memory/conversationMemory');
const { buildContext } = require('../ai/context/contextBuilder');
const { verifyRole } = require('../ai/roles/roleVerifier');
const { routeIntent } = require('../ai/routing/intentRouter');
const { getAvailableTools, getGeminiFunctionDeclarations } = require('../ai/tools/toolRegistry');
const { detectToolCall } = require('../ai/tools/toolCallDetector');
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

const GEMINI_MODEL = 'gemini-2.0-flash';

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
    console.log(`[AI ORCHESTRATOR] session: ${sessionId}`);

    const history = getHistory(sessionId);
    console.log(`[AI ORCHESTRATOR] history: ${history.length} previous message(s)`);

    const context = buildContext(req.user, trimmedMessage, history);
    console.log(`[AI ORCHESTRATOR] context built for user: ${context.user.name} (${context.user.role})`);

    const roleInfo = verifyRole(req.user);
    console.log(`[AI ORCHESTRATOR] role verified: ${roleInfo.role} (${roleInfo.roleType})${roleInfo.adminType ? ` [${roleInfo.adminType}]` : ''}`);

    const intentInfo = routeIntent(trimmedMessage);
    console.log(`[AI ORCHESTRATOR] intent detected: ${intentInfo.intent}`);

    const tools = getAvailableTools();
    console.log(`[AI ORCHESTRATOR] tools available: ${tools.length}`);

    const prompt = buildPrompt(context, tools);
    console.log(`[AI ORCHESTRATOR] prompt built (${prompt.length} chars)`);

    const functionDeclarations = getGeminiFunctionDeclarations();
    console.log(`[AI 6] Tools: ${functionDeclarations.map((fn) => fn.name).join(', ')}`);

    const client = getClient();
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ functionDeclarations }],
      },
    });

    const reply = response.text?.trim();

    const detection = detectToolCall(response);
    if (detection.isToolCall) {
      console.log('[TOOL CALL DETECTOR] Function call detected');
      console.log(`[TOOL CALL DETECTOR] Name: ${detection.toolCall.name}`);
      console.log(`[TOOL CALL DETECTOR] Arguments: ${JSON.stringify(detection.toolCall.arguments)}`);

      const holdingReply = `I found a matching action (${detection.toolCall.name}), but I can't complete that yet — this capability is coming soon. Please try again later or contact the faculty office directly.`;
      addMessage(sessionId, 'user', trimmedMessage);
      addMessage(sessionId, 'assistant', holdingReply);
      console.log('[AI ORCHESTRATOR] turn stored in Conversation Memory (tool-call boundary reply)');
      return res.json({ reply: holdingReply });
    }
    if (detection.error) {
      console.log(`[TOOL CALL DETECTOR] ${detection.error}`);
    }

    if (!reply) {
      return res.status(502).json({ message: 'AI did not return a response. Try again.' });
    }
    console.log(`[AI ORCHESTRATOR] gemini responded (${reply.length} chars)`);

    addMessage(sessionId, 'user', trimmedMessage);
    addMessage(sessionId, 'assistant', reply);
    console.log('[AI ORCHESTRATOR] turn stored in Conversation Memory');

    console.log(`🤖 FOT Buddy | user:${sessionId} | intent:${intentInfo.intent} | msg len:${trimmedMessage.length}`);

    res.json({ reply });
  } catch (err) {
    console.error('FOT Buddy error:', err.message);
    res.status(500).json({ message: 'FOT Buddy is unavailable right now. Please try again shortly.' });
  }
};