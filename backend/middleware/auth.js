const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  res.status(401).json({ message: 'Not authorized, no token' });
};

// Voting is a student-only action — admins (super_admin, hostel_warden,
// librarian, union_member) never cast votes, only manage/view elections.
const studentOnly = (req, res, next) => {
  if (req.user?.role === 'student') return next();
  res.status(403).json({ message: 'Access denied: Students only' });
};

module.exports = { protect, studentOnly };
