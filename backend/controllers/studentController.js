const Complaint    = require('../models/Complaint');
const LostFound    = require('../models/LostFound');
const Announcement = require('../models/Announcement');
const { maskComplaint, maskComplaints } = require('../utils/complaintVisibility');

exports.getMyComplaints    = async (req, res) => { try { res.json(await Complaint.find({ submittedBy: req.user._id }).sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ message: err.message }); } };
exports.submitComplaint    = async (req, res) => {
  try {
    const allowedTargets = ['hostel_warden', 'union_member', 'librarian', 'super_admin'];
    if (!allowedTargets.includes(req.body.targetAdminType))
      return res.status(400).json({ message: 'Please select who this complaint should be sent to (Warden, Union Member, Librarian or Super Admin)' });
    const data = { ...req.body, submittedBy: req.user._id };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json(await Complaint.create(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Complaints visible to every student, like announcements — but ONLY the
// ones the submitter marked as Public. Private complaints stay visible only
// to the submitter (My Complaints tab) and the addressed admin.
exports.getAllComplaintsPublic = async (req, res) => {
  try {
    const complaints = await Complaint.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'name department');
    res.json(maskComplaints(complaints, req.user));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getLostFoundItems  = async (req, res) => { try { res.json(await LostFound.find({ status: 'active' }).sort({ createdAt: -1 }).populate('submittedBy','name department')); } catch (err) { res.status(500).json({ message: err.message }); } };
exports.submitLostFound    = async (req, res) => {
  try {
    const data = { ...req.body, submittedBy: req.user._id };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json(await LostFound.create(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.getAnnouncements   = async (req, res) => { try { res.json(await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).populate('createdBy','name')); } catch (err) { res.status(500).json({ message: err.message }); } };

exports.updateLostFound    = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.submittedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    const { title, description, type, category, location, date, contactInfo, status } = req.body;
    if (title)       item.title       = title;
    if (description) item.description = description;
    if (type)        item.type        = type;
    if (category)    item.category    = category;
    if (location)    item.location    = location;
    if (date)        item.date        = date;
    if (contactInfo !== undefined) item.contactInfo = contactInfo;
    if (status)      item.status      = status;
    if (req.file)    item.imageUrl    = '/uploads/' + req.file.filename;
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLostFound    = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.submittedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await item.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
