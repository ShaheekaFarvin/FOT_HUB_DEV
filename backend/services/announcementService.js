const Announcement = require('../models/Announcement');

/**
 * Searches active faculty announcements with optional query and category filters.
 *
 * @param {object} options
 * @param {string} [options.query] - Keyword to search within title or content.
 * @param {string} [options.category] - Category filter (case-insensitive).
 * @param {number} [options.limit=25] - Maximum number of announcements to return.
 * @returns {Promise<Array>}
 */
const searchAnnouncements = async ({ query, category, limit = 25 } = {}) => {
  const filter = { isActive: true };

  if (category && typeof category === 'string' && category.trim()) {
    filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
  }

  if (query && typeof query === 'string' && query.trim()) {
    const qRegex = { $regex: query.trim(), $options: 'i' };
    filter.$or = [{ title: qRegex }, { content: qRegex }];
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 25), 50);
  return Announcement.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit);
};

/**
 * Retrieves active announcements, optionally populating the author.
 *
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {string} [options.populate='createdBy']
 * @returns {Promise<Array>}
 */
const getActiveAnnouncements = async ({ limit = 50, populate = 'createdBy' } = {}) => {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  let query = Announcement.find({ isActive: true }).sort({ createdAt: -1, _id: -1 }).limit(safeLimit);

  if (populate) {
    query = query.populate(populate, 'name department');
  }

  return query;
};

/**
 * Creates a new faculty announcement.
 *
 * @param {object} data
 * @param {object} userContext
 * @returns {Promise<object>}
 */
const createAnnouncement = async (data, userContext) => {
  const userId = userContext?._id || userContext?.id;
  return Announcement.create({
    ...data,
    createdBy: userId,
  });
};

module.exports = {
  searchAnnouncements,
  getActiveAnnouncements,
  createAnnouncement,
};
