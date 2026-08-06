/*
  Role & permission middleware for FOT Hub
  ─────────────────────────────────────────
  super_admin   → full access (only role that manages elections, users, stats, lost & found, activity log)
  hostel_warden → announcements + complaints ONLY (nothing else)
  librarian     → announcements + complaints ONLY (nothing else)
  union_member  → announcements + complaints ONLY (nothing else) — same scope as hostel_warden/librarian
*/

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Admins only' });
};

const requireAdminType = (...types) => (req, res, next) => {
  if (req.user?.role === 'admin' && types.includes(req.user?.adminType)) return next();
  res.status(403).json({
    message: `Access denied: requires admin type (${types.join(' or ')})`,
  });
};

// Elections: super_admin ONLY
const canManageElections = requireAdminType('super_admin');

// Announcements: super_admin, hostel_warden, librarian, union_member (full access)
const canManageAnnouncements = requireAdminType('super_admin', 'hostel_warden', 'librarian', 'union_member');

// Complaints: super_admin, hostel_warden, librarian, union_member (full access)
const canManageComplaints = requireAdminType('super_admin', 'hostel_warden', 'librarian', 'union_member');

// Everything else (Users, Elections mgmt, Lost & Found, activity log):
// only super_admin. hostel_warden, librarian & union_member are all scoped strictly
// to announcements + complaints and nothing more.
const fullAccessOnly = requireAdminType('super_admin');

// Dashboard overview page: super_admin sees everything, limited staff see a
// scoped-down version (handled inside the controller) — so all admin types
// are allowed through here, just with different data returned.
const canViewDashboard = requireAdminType('super_admin', 'hostel_warden', 'librarian', 'union_member');

module.exports = {
  adminOnly,
  requireAdminType,
  canManageElections,
  canManageAnnouncements,
  canManageComplaints,
  fullAccessOnly,
  canViewDashboard,
};
