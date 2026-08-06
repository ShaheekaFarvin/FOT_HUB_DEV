const verifyRole = (user) => {
  const roleType = user.role === 'student' ? 'STUDENT' : 'ADMIN';

  return {
    userId: user._id?.toString() || user.id,
    role: user.role,
    roleType,
  };
};

module.exports = { verifyRole };