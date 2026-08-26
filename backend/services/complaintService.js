const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { maskComplaints, maskComplaint } = require('../utils/complaintVisibility');

const ALLOWED_TARGET_ADMINS = ['hostel_warden', 'union_member', 'librarian', 'super_admin'];

const extractUserId = (userContext) => {
  if (!userContext || typeof userContext !== 'object') return null;
  const rawId = userContext._id !== undefined && userContext._id !== null ? userContext._id : userContext.id;
  return rawId ? rawId.toString() : null;
};

/**
 * Submits a new student complaint with authorization and target validation.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {string} data.description
 * @param {string} [data.category]
 * @param {string} [data.targetAdminType]
 * @param {boolean} [data.isAnonymous]
 * @param {string} [data.imageUrl]
 * @param {object} userContext
 * @returns {Promise<object>}
 */
const submitComplaint = async (data, userContext) => {
  const userId = extractUserId(userContext);
  if (!userId) {
    throw new Error('A valid user context is required to submit a complaint.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Complaint data is required.');
  }

  const title = (data.title || '').trim();
  const description = (data.description || '').trim();

  if (!title) {
    throw new Error('Complaint title is required.');
  }
  if (!description) {
    throw new Error('Complaint description is required.');
  }

  let targetAdminType = data.targetAdminType;
  if (!targetAdminType || !ALLOWED_TARGET_ADMINS.includes(targetAdminType)) {
    targetAdminType = 'super_admin';
  }

  const complaintPayload = {
    title,
    description,
    category: data.category || 'Other',
    targetAdminType,
    isAnonymous: Boolean(data.isAnonymous),
    isPublic: Boolean(data.isPublic),
    submittedBy: userId,
  };

  if (data.imageUrl) {
    complaintPayload.imageUrl = data.imageUrl;
  }

  return Complaint.create(complaintPayload);
};

/**
 * Retrieves complaints submitted strictly by the authenticated user.
 * Guarantees cross-user data isolation.
 *
 * @param {object} userContext
 * @param {object} [options]
 * @param {string} [options.complaintId]
 * @param {number} [options.limit=50]
 * @returns {Promise<Array>}
 */
const getUserComplaints = async (userContext, { complaintId, limit = 50 } = {}) => {
  const userId = extractUserId(userContext);
  if (!userId) {
    throw new Error('A valid user context is required to view complaints.');
  }

  const filter = { submittedBy: userId };

  if (complaintId && typeof complaintId === 'string' && complaintId.trim()) {
    const trimmedId = complaintId.trim();
    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return [];
    }
    filter._id = trimmedId;
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  return Complaint.find(filter)
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Retrieves all public complaints with masking applied based on requester role.
 *
 * @param {object} userContext
 * @returns {Promise<Array>}
 */
const getPublicComplaints = async (userContext) => {
  const complaints = await Complaint.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name department');

  return maskComplaints(complaints, userContext);
};

module.exports = {
  submitComplaint,
  getUserComplaints,
  getPublicComplaints,
  ALLOWED_TARGET_ADMINS,
};
