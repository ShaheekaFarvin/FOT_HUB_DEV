const User         = require('../models/User');
const Election     = require('../models/Election');
const Announcement = require('../models/Announcement');
const Complaint    = require('../models/Complaint');
const LostFound    = require('../models/LostFound');
const ActivityLog  = require('../models/ActivityLog');
const { maskComplaints } = require('../utils/complaintVisibility');

// Helper: log an admin activity
const log = (adminId, action, category, detail = '', icon = 'activity') =>
  ActivityLog.create({ admin: adminId, action, category, detail, icon }).catch(() => {});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const isFullAccess = req.user?.adminType === 'super_admin';

    // ── Limited staff (hostel_warden / librarian / union_member) get a
    //    scoped-down dashboard: only complaint + announcement related data.
    //    No user registrations, no department stats, no full stat cards.
    if (!isFullAccess) {
      const recentComplaints = await Complaint.find({ targetAdminType: req.user.adminType }).sort({ createdAt: -1 }).limit(5).populate('submittedBy', 'name studentId department');
      const recentActivity   = await ActivityLog.find({ category: { $in: ['complaint', 'announcement'] } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('admin', 'name');

      return res.json({
        stats: null,
        deptStats: null,
        recentUsers: [],
        recentComplaints,
        recentActivity,
      });
    }

    const [totalUsers, totalElections, totalComplaints, totalLostFound, totalAnnouncements] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Election.countDocuments(),
      Complaint.countDocuments(),
      LostFound.countDocuments(),
      Announcement.countDocuments(),
    ]);
    const ongoingElections  = await Election.countDocuments({ status: 'ongoing' });
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const activeItems       = await LostFound.countDocuments({ status: 'active' });
    const recentUsers       = await User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('-password');
    const recentComplaints  = await Complaint.find().sort({ createdAt: -1 }).limit(5).populate('submittedBy','name studentId department');
    const recentActivity    = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('admin', 'name');

    // Department-wise student counts
    // ENT = EET + MTT, BST = BPT + FDT
    const [ict, eet, mtt, bpt, fdt] = await Promise.all([
      User.countDocuments({ role: 'student', department: 'ICT' }),
      User.countDocuments({ role: 'student', department: 'EET' }),
      User.countDocuments({ role: 'student', department: 'MTT' }),
      User.countDocuments({ role: 'student', department: 'BPT' }),
      User.countDocuments({ role: 'student', department: 'FDT' }),
    ]);
    const deptStats = { ICT: ict, ENT: eet + mtt, BST: bpt + fdt };

    res.json({
      stats: { totalUsers, totalElections, totalComplaints, totalLostFound, totalAnnouncements, ongoingElections, pendingComplaints, activeItems },
      deptStats,
      recentUsers,
      recentComplaints,
      recentActivity,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── USERS ────────────────────────────────────────────────────────────────────
exports.getAllUsers     = async (req, res) => { try { res.json(await User.find().select('-password').sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ message: err.message }); } };
exports.updateUserRole = async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    log(req.user._id, `Changed role to "${req.body.role}"`, 'user', u.name, 'user');
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.deleteUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);
    log(req.user._id, 'Deleted user', 'user', u?.name || req.params.id, 'user');
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Temporarily block a user's login for N days, with a reason.
exports.blockUser = async (req, res) => {
  try {
    const { days, reason } = req.body;
    const numDays = parseInt(days, 10);
    if (!numDays || numDays < 1) return res.status(400).json({ message: 'Please provide a valid number of days.' });
    if (!reason || !reason.trim()) return res.status(400).json({ message: 'A reason is required to block a user.' });

    const blockedUntil = new Date(Date.now() + numDays * 24 * 60 * 60 * 1000);
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, blockedUntil, blockReason: reason.trim() },
      { new: true }
    ).select('-password');
    if (!u) return res.status(404).json({ message: 'User not found' });

    log(req.user._id, `Blocked account for ${numDays} day(s)`, 'user', `${u.name} — ${reason.trim()}`, 'user');
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Manually lift a block before it expires.
exports.unblockUser = async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true, blockedUntil: null, blockReason: '' },
      { new: true }
    ).select('-password');
    if (!u) return res.status(404).json({ message: 'User not found' });

    log(req.user._id, 'Unblocked account', 'user', u.name, 'user');
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── ELECTIONS ───────────────────────────────────────────────────────────────
exports.createElection = async (req, res) => {
  try {
    const e = await Election.create({ ...req.body, createdBy: req.user._id });
    log(req.user._id, 'Created election', 'election', e.title, 'vote');
    res.status(201).json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.updateElection = async (req, res) => {
  try {
    const e = await Election.findByIdAndUpdate(req.params.id, req.body, { new: true });
    log(req.user._id, 'Updated election', 'election', e.title, 'vote');
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.deleteElection = async (req, res) => {
  try {
    const e = await Election.findById(req.params.id);
    await Election.findByIdAndDelete(req.params.id);
    log(req.user._id, 'Deleted election', 'election', e?.title || req.params.id, 'vote');
    res.json({ message: 'Election deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addCandidate = async (req, res) => {
  try {
    const e = await Election.findById(req.params.id);
    const candidateData = { ...req.body };
    if (req.file) candidateData.avatar = `/uploads/${req.file.filename}`;
    e.candidates.push(candidateData);
    await e.save();
    log(req.user._id, `Added candidate "${candidateData.name}"`, 'election', e.title, 'vote');
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.updateCandidate = async (req, res) => {
  try {
    const e = await Election.findById(req.params.electionId);
    const c = e.candidates.id(req.params.candidateId);
    if (!c) return res.status(404).json({ message: 'Candidate not found' });
    if (req.body.name) c.name = req.body.name;
    if (req.body.manifesto !== undefined) c.manifesto = req.body.manifesto;
    if (req.file) c.avatar = `/uploads/${req.file.filename}`;
    await e.save();
    log(req.user._id, `Updated candidate "${c.name}"`, 'election', e.title, 'vote');
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.removeCandidate = async (req, res) => {
  try {
    const e = await Election.findById(req.params.electionId);
    const c = e.candidates.id(req.params.candidateId);
    e.candidates = e.candidates.filter(c => c._id.toString() !== req.params.candidateId);
    await e.save();
    log(req.user._id, `Removed candidate "${c?.name}"`, 'election', e.title, 'vote');
    res.json(e);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
exports.getAnnouncements   = async (req, res) => { try { res.json(await Announcement.find().sort({ createdAt: -1 }).populate('createdBy','name')); } catch (err) { res.status(500).json({ message: err.message }); } };
exports.createAnnouncement = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
    const a = await Announcement.create(data);
    log(req.user._id, 'Posted announcement', 'announcement', a.title, 'megaphone');
    res.status(201).json(a);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.updateAnnouncement = async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;
    if (req.body.removeImage === 'true') update.imageUrl = '';
    const a = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true });
    log(req.user._id, 'Updated announcement', 'announcement', a.title, 'megaphone');
    res.json(a);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.deleteAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    await Announcement.findByIdAndDelete(req.params.id);
    log(req.user._id, 'Deleted announcement', 'announcement', a?.title || '', 'megaphone');
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── COMPLAINTS ──────────────────────────────────────────────────────────────
// super_admin sees every complaint. Every other admin type (hostel_warden,
// union_member, librarian) only sees complaints the student specifically
// addressed to their admin type.
exports.getAllComplaints      = async (req, res) => {
  try {
    const query = req.user.adminType === 'super_admin' ? {} : { targetAdminType: req.user.adminType };
    const complaints = await Complaint.find(query).sort({ createdAt: -1 }).populate('submittedBy','name studentId department email');
    res.json(maskComplaints(complaints, req.user));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Only super_admin, or the specific admin type the complaint was addressed
// to, may update its status / reply to it.
const canManageThisComplaint = (complaint, user) =>
  user.adminType === 'super_admin' || complaint.targetAdminType === user.adminType;

exports.updateComplaintStatus = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (!canManageThisComplaint(c, req.user))
      return res.status(403).json({ message: 'This complaint was not addressed to you' });
    c.status = req.body.status;
    await c.save();
    log(req.user._id, `Set complaint "${c.title}" → ${req.body.status}`, 'complaint', c.title, 'message-square');
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.replyToComplaint = async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (!canManageThisComplaint(c, req.user))
      return res.status(403).json({ message: 'This complaint was not addressed to you' });
    c.replies.push({ message: req.body.message, repliedBy: req.user._id });
    c.status = 'in-progress';
    await c.save();
    log(req.user._id, `Replied to complaint "${c.title}"`, 'complaint', c.title, 'message-square');
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── LOST & FOUND ────────────────────────────────────────────────────────────
exports.getAllLostFound        = async (req, res) => { try { res.json(await LostFound.find().sort({ createdAt: -1 }).populate('submittedBy','name studentId department')); } catch (err) { res.status(500).json({ message: err.message }); } };
exports.updateLostFoundStatus = async (req, res) => {
  try {
    const item = await LostFound.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    log(req.user._id, `Lost&Found "${item.title}" → ${req.body.status}`, 'lost-found', item.title, 'search');
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.deleteLostFound = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    await LostFound.findByIdAndDelete(req.params.id);
    log(req.user._id, 'Deleted lost/found item', 'lost-found', item?.title || '', 'search');
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
exports.getActivityLog = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const category = req.query.category || null;
    const filter = category ? { category } : {};
    const total = await ActivityLog.countDocuments(filter);
    const logs  = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('admin', 'name email');
    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
