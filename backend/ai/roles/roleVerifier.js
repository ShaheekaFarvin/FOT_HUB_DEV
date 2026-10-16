const verifyRole = (user) => {
  if (!user || typeof user !== 'object') {
    throw new Error('Role Verifier: a valid user object is required.');
  }

  const rawId = user._id !== undefined && user._id !== null ? user._id : user.id;
  if (rawId === undefined || rawId === null || rawId === '') {
    throw new Error('Role Verifier: user must have a valid _id or id.');
  }
  const userId = rawId.toString();

  if (typeof user.role !== 'string' || !user.role.trim()) {
    throw new Error('Role Verifier: user must have a non-empty role.');
  }
  const normalizedRole = user.role.toLowerCase();

  if (normalizedRole === 'student') {
    return {
      userId,
      role: 'Student',
      roleType: 'STUDENT',
    };
  }

  if (normalizedRole === 'admin') {
    const result = {
      userId,
      role: 'Admin',
      roleType: 'ADMIN',
    };
    if (user.adminType !== undefined && user.adminType !== null && user.adminType !== '') {
      result.adminType = user.adminType;
    }
    return result;
  }

  throw new Error('Role Verifier: Unsupported role');
};

module.exports = { verifyRole };