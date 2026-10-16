const { GoogleGenAI } = require('@google/genai');

const { getHistory, addMessage } = require('../memory/conversationMemory');
const { buildContext } = require('../context/contextBuilder');
const { routeIntent } = require('../routing/intentRouter');
const { getAvailableTools, getGeminiFunctionDeclarations } = require('../tools/toolRegistry');
const { detectToolCall } = require('../tools/toolCallDetector');
const { executeTool } = require('../tools/toolExecutor');
const { handleToolResult } = require('../tools/toolResultHandler');
const { buildPrompt } = require('../prompt/promptBuilder');
const { semanticSearch } = require('./semanticSearchService');

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

let client = null;
const getClient = () => {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('ragOrchestrator: GEMINI_API_KEY is not set.');
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

// All live database operational intents that have authoritative tools
const TOOL_HANDLED_INTENTS = new Set([
  'COMPLAINT_STATUS',
  'SUBMIT_COMPLAINT',
  'VOTING_ELIGIBILITY',
  'NOTIFICATIONS',
  'ANNOUNCEMENTS',
  'LOST_AND_FOUND',
]);

const GREETING_PATTERN = /^(hi|hello|hey|good\s?(morning|afternoon|evening)|who are you|what can you do|thanks|thank you|bye|goodbye)\b/i;

/**
 * Decides whether semantic retrieval should run for this message.
 *
 * - Greetings/small talk → never.
 * - Intents served by live database tools (announcements, complaints,
 *   lost & found, elections, notifications) → false (tools are authoritative).
 * - General inquiries (e.g. "What is Nimal's manifesto?", "Faculty history", etc.)
 *   → RAG eligible.
 *
 * @param {string} message
 * @returns {boolean}
 */
const isRagEligible = (message) => {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return false;
  }
  if (GREETING_PATTERN.test(trimmed)) {
    return false;
  }

  const { intent } = routeIntent(trimmed);
  if (TOOL_HANDLED_INTENTS.has(intent)) {
    return false;
  }
  // UNKNOWN intent, non-greeting → treat as a general knowledge question.
  return true;
};

/**
 * Runs semantic retrieval for RAG-eligible messages. Never throws.
 *
 * @param {string} message
 * @returns {Promise<Array>}
 */
const retrieveKnowledge = async (message) => {
  if (!isRagEligible(message)) {
    return [];
  }
  try {
    return await semanticSearch(message);
  } catch (err) {
    console.error('[RAG ORCHESTRATOR] semantic retrieval failed, continuing with empty context:', err.message);
    return [];
  }
};

/**
 * Processes one full user chat turn end to end.
 *
 * @param {object} user - the authenticated user (req.user).
 * @param {string} message - the trimmed, validated user message.
 * @returns {Promise<{ reply: string }>}
 */
const processUserRequest = async (user, message) => {
  const sessionId = user._id?.toString() || user.id;
  console.log(`[AI ORCHESTRATOR] session: ${sessionId}`);

  const history = getHistory(sessionId);
  console.log(`[AI ORCHESTRATOR] history: ${history.length} previous message(s)`);

  const context = buildContext(user, message, history);
  console.log(`[AI ORCHESTRATOR] context built for user: ${context.user.name} (${context.user.role})`);

  const { intent } = routeIntent(message);
  const ragEligible = isRagEligible(message);
  console.log(`[AI ORCHESTRATOR] intent detected: ${intent} | RAG eligible: ${ragEligible}`);

  const retrievedKnowledge = await retrieveKnowledge(message);
  console.log(`[RAG ORCHESTRATOR] retrieved ${retrievedKnowledge.length} knowledge document(s)`);

  const tools = getAvailableTools();
  console.log(`[AI ORCHESTRATOR] tools available: ${tools.length}`);

  const prompt = buildPrompt(context, tools, retrievedKnowledge);
  console.log(`[AI ORCHESTRATOR] prompt built (${prompt.length} chars)`);

  const functionDeclarations = getGeminiFunctionDeclarations();

  const geminiClient = getClient();
  const response = await geminiClient.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { tools: [{ functionDeclarations }] },
  });

  const detection = detectToolCall(response);

  if (detection.isToolCall) {
    console.log('[TOOL CALL DETECTOR] Function call detected');
    console.log(`[TOOL CALL DETECTOR] Name: ${detection.toolCall.name}`);
    console.log(`[TOOL CALL DETECTOR] Arguments: ${JSON.stringify(detection.toolCall.arguments)}`);

    const toolResult = await executeTool(detection.toolCall, user);
    console.log(`[TOOL EXECUTOR] Result: ${JSON.stringify(toolResult)}`);

    const finalReply = await handleToolResult({
      client: geminiClient,
      model: GEMINI_MODEL,
      prompt,
      geminiResponse: response,
      toolCall: detection.toolCall,
      toolResult,
      functionDeclarations,
    });

    addMessage(sessionId, 'user', message);
    addMessage(sessionId, 'assistant', finalReply);
    console.log('[AI ORCHESTRATOR] turn stored in Conversation Memory (tool cycle complete)');
    return { reply: finalReply };
  }
  if (detection.error) {
    console.log(`[TOOL CALL DETECTOR] ${detection.error}`);
  }

  const reply = response.text?.trim();
  if (!reply) {
    const err = new Error('ragOrchestrator: AI did not return a response.');
    err.statusCode = 502;
    throw err;
  }
  console.log(`[AI ORCHESTRATOR] gemini responded (${reply.length} chars)`);

  addMessage(sessionId, 'user', message);
  addMessage(sessionId, 'assistant', reply);
  console.log('[AI ORCHESTRATOR] turn stored in Conversation Memory');
  console.log(`🤖 FOT Buddy | user:${sessionId} | intent:${intent} | msg len:${message.length}`);

  return { reply };
};

module.exports = {
  processUserRequest,
  isRagEligible,
  retrieveKnowledge,
};