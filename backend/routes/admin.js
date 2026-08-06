const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  adminOnly,
  canManageElections,
  canManageAnnouncements,
  canManageComplaints,
  fullAccessOnly,
  canViewDashboard,
} = require('../middleware/role');
const upload = require('../middleware/upload');
const ctrl   = require('../controllers/adminController');

router.use(protect, adminOnly);

// ── Dashboard → all admin types (super_admin gets full stats, limited
//    staff get a scoped-down view — handled inside the controller) ──
router.get('/stats',              canViewDashboard, ctrl.getDashboardStats);

// ── Users → super_admin only ──
router.get('/users',              fullAccessOnly, ctrl.getAllUsers);
router.put('/users/:id/role',     fullAccessOnly, ctrl.updateUserRole);
router.put('/users/:id/block',    fullAccessOnly, ctrl.blockUser);
router.put('/users/:id/unblock',  fullAccessOnly, ctrl.unblockUser);
router.delete('/users/:id',       fullAccessOnly, ctrl.deleteUser);

// ── Elections → super_admin only ──
router.post('/elections',           canManageElections, ctrl.createElection);
router.put('/elections/:id',        canManageElections, ctrl.updateElection);
router.delete('/elections/:id',     canManageElections, ctrl.deleteElection);
router.post('/elections/:id/candidates', canManageElections, upload.single('photo'), ctrl.addCandidate);
router.put('/elections/:electionId/candidates/:candidateId', canManageElections, upload.single('photo'), ctrl.updateCandidate);
router.delete('/elections/:electionId/candidates/:candidateId', canManageElections, ctrl.removeCandidate);

// ── Announcements → super_admin, hostel_warden, librarian, union_member ──
router.get('/announcements',         canManageAnnouncements, ctrl.getAnnouncements);
router.post('/announcements',        canManageAnnouncements, upload.single('image'), ctrl.createAnnouncement);
router.put('/announcements/:id',     canManageAnnouncements, upload.single('image'), ctrl.updateAnnouncement);
router.delete('/announcements/:id',  canManageAnnouncements, ctrl.deleteAnnouncement);

// ── Complaints → super_admin, hostel_warden, librarian, union_member ──
router.get('/complaints',            canManageComplaints, ctrl.getAllComplaints);
router.put('/complaints/:id/status', canManageComplaints, ctrl.updateComplaintStatus);
router.post('/complaints/:id/reply', canManageComplaints, ctrl.replyToComplaint);

// ── Activity & Lost+Found → super_admin only ──
router.get('/activity',              fullAccessOnly, ctrl.getActivityLog);
router.get('/lost-found',            fullAccessOnly, ctrl.getAllLostFound);
router.put('/lost-found/:id/status', fullAccessOnly, ctrl.updateLostFoundStatus);
router.delete('/lost-found/:id',     fullAccessOnly, ctrl.deleteLostFound);

module.exports = router;
