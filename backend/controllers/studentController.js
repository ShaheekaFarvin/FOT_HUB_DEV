const { getUserComplaints, submitComplaint, getPublicComplaints, ALLOWED_TARGET_ADMINS } = require('../services/complaintService');
const { getActiveItems, submitItem, updateItem, deleteItem } = require('../services/lostFoundService');
const { getActiveAnnouncements } = require('../services/announcementService');

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await getUserComplaints(req.user);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitComplaint = async (req, res) => {
  try {
    if (!ALLOWED_TARGET_ADMINS.includes(req.body.targetAdminType)) {
      return res.status(400).json({
        message: 'Please select who this complaint should be sent to (Warden, Union Member, Librarian or Super Admin)',
      });
    }

    const payload = { ...req.body };
    if (req.file) {
      payload.imageUrl = `/uploads/${req.file.filename}`;
    }

    const complaint = await submitComplaint(payload, req.user);
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllComplaintsPublic = async (req, res) => {
  try {
    const publicComplaints = await getPublicComplaints(req.user);
    res.json(publicComplaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLostFoundItems = async (req, res) => {
  try {
    const items = await getActiveItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitLostFound = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.imageUrl = `/uploads/${req.file.filename}`;
    }
    const item = await submitItem(payload, req.user);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await getActiveAnnouncements({ populate: 'createdBy' });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLostFound = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.imageUrl = `/uploads/${req.file.filename}`;
    }
    const item = await updateItem(req.params.id, payload, req.user);
    res.json(item);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.deleteLostFound = async (req, res) => {
  try {
    const result = await deleteItem(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};
