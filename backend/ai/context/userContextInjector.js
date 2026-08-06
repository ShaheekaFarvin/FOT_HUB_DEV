const injectUserContext = (user, userQuestion) => {
  return (
    `System / Context:\n` +
    `Current User:\n` +
    `- Name: ${user.name}\n` +
    `- Role: ${user.role}\n` +
    `- Department: ${user.department || 'N/A'}\n\n` +
    `User Question:\n${userQuestion}`
  );
};

module.exports = { injectUserContext };