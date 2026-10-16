const { getActiveAnnouncements } = require('./announcementService');
const { getUserComplaints } = require('./complaintService');

const extractUserId = (userContext) => {
  if (!userContext || typeof userContext !== 'object') return null;
  const rawId = userContext._id !== undefined && userContext._id !== null ? userContext._id : userContext.id;
  return rawId ? rawId.toString() : null;
};

/**
 * Aggregates personalized notifications for the current authenticated user:
 * 1. Global active campus announcements
 * 2. User-specific complaint status updates (strictly scoped to user)
 *
 * @param {object} userContext
 * @param {object} [options]
 * @param {boolean} [options.unreadOnly=false]
 * @param {number} [options.limit=5]
 * @returns {Promise<{ announcements: Array, complaintUpdates: Array }>}
 */
const getUserNotifications = async (userContext, { unreadOnly = false, limit = 5 } = {}) => {
  const userId = extractUserId(userContext);
  if (!userId) {
    throw new Error('A valid user context is required to retrieve notifications.');
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 5), 20);

  const [announcements, complaintUpdates] = await Promise.all([
    getActiveAnnouncements({ limit: safeLimit, populate: null }),
    getUserComplaints(userContext, { limit: safeLimit }),
  ]);

  return {
    announcements,
    complaintUpdates,
  };
};

module.exports = {
  getUserNotifications,
};
