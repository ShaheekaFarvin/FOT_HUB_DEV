const sessions = new Map();

const getHistory = (userId) => sessions.get(userId) || [];

const addMessage = (userId, role, content) => {
  const history = sessions.get(userId) || [];
  history.push({ role, content });
  sessions.set(userId, history);
};

/**
 * Builds the request object for the current turn.
 * @returns { history: [...], current_message: string }
 */
const buildConversationRequest = (userId, currentMessage) => {
  const history = getHistory(userId);
  return {
    history,
    current_message: currentMessage,
  };
};

const clearSession = (userId) => sessions.delete(userId);

module.exports = { getHistory, addMessage, buildConversationRequest, clearSession };