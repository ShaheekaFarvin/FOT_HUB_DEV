const buildContext = (user, currentMessage, previousMessages = []) => {
  return {
    user: {
      id: user._id?.toString() || user.id,
      name: user.name,
      role: user.role,
      department: user.department || null,
    },
    conversation: [
      ...previousMessages.map((m) => (typeof m === 'string' ? m : m.text)),
      currentMessage,
    ],
  };
};

module.exports = { buildContext };