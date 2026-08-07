/**
 * Context Builder — Step 1 of the AI Orchestrator.
 *
 * Single Responsibility: aggregate and normalize authenticated user
 * identity, conversation history, and the current message into a
 * standardized context object.
 *
 * It does NOT call Gemini, assemble prompt strings, inspect/execute
 * tools, or otherwise transform message content beyond normalization.
 */

/**
 * Normalize a role/sender label to either "user" or "assistant".
 * Falls back to "user" for anything unrecognized.
 */
const normalizeRole = (rawRole) => {
  const role = String(rawRole || '').toLowerCase();
  if (['assistant', 'bot', 'ai', 'system'].includes(role)) {
    return 'assistant';
  }
  return 'user';
};

/**
 * Normalize a single previous-message entry into a standard
 * { role, content } shape. Supports:
 *  - plain strings                        -> treated as a user message
 *  - { role, content }                    -> already standard shape
 *  - { role, text }                       -> text aliased to content
 *  - { sender, text }                     -> sender aliased to role
 */
const normalizeMessage = (message) => {
  if (typeof message === 'string') {
    return { role: 'user', content: message.trim() };
  }

  if (message && typeof message === 'object') {
    if (typeof message.content === 'string') {
      return { role: normalizeRole(message.role), content: message.content.trim() };
    }
    if (typeof message.text === 'string') {
      const rawRole = message.role !== undefined ? message.role : message.sender;
      return { role: normalizeRole(rawRole), content: message.text.trim() };
    }
  }

  throw new Error('Context Builder: invalid message entry in previousMessages.');
};

/**
 * Normalize the previousMessages array into a standard conversation array.
 */
const normalizeConversation = (previousMessages) => {
  if (!Array.isArray(previousMessages)) {
    throw new Error('Context Builder: previousMessages must be an array.');
  }
  return previousMessages.map(normalizeMessage);
};

/**
 * Normalize the authenticated user object.
 */
const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    throw new Error('Context Builder: a valid user object is required.');
  }

  const normalized = {
    id: user._id?.toString() || user.id || null,
    name: user.name || null,
    role: user.role || null,
    department: user.department || null,
  };

  if (user.adminType !== undefined && user.adminType !== null) {
    normalized.adminType = user.adminType;
  }

  return normalized;
};

/**
 * Build the standardized context object consumed downstream by the
 * Prompt Builder (Step 2 of the AI Orchestrator).
 *
 * @param {object} user - authenticated user record.
 * @param {string} currentMessage - the user's current chat message.
 * @param {Array}  previousMessages - prior conversation entries.
 * @returns {{ user: object, conversation: Array, currentMessage: string }}
 */
const buildContext = (user, currentMessage, previousMessages = []) => {
  const normalizedUser = normalizeUser(user);

  if (typeof currentMessage !== 'string' || !currentMessage.trim()) {
    throw new Error('Context Builder: currentMessage is required and must be a non-empty string.');
  }

  const conversation = normalizeConversation(previousMessages);

  return {
    user: normalizedUser,
    conversation,
    currentMessage: currentMessage.trim(),
  };
};

module.exports = { buildContext };
