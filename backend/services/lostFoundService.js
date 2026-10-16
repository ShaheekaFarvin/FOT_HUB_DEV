const LostFound = require('../models/LostFound');

const extractUserId = (userContext) => {
  if (!userContext || typeof userContext !== 'object') return null;
  const rawId = userContext._id !== undefined && userContext._id !== null ? userContext._id : userContext.id;
  return rawId ? rawId.toString() : null;
};

/**
 * Searches active lost and found items with multi-field matching across title,
 * description, and category, and optional type/category filters.
 *
 * @param {object} options
 * @param {string} [options.query] - Search query.
 * @param {string} [options.type] - Type filter ('lost' or 'found').
 * @param {string} [options.category] - Category filter.
 * @param {number} [options.limit=10]
 * @returns {Promise<Array>}
 */
const searchLostFoundItems = async ({ query, type, category, limit = 10 } = {}) => {
  const filter = { status: 'active' };

  if (type && typeof type === 'string' && type.trim()) {
    filter.type = type.trim().toLowerCase();
  }

  if (category && typeof category === 'string' && category.trim()) {
    filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
  }

  if (query && typeof query === 'string' && query.trim()) {
    const q = query.trim();
    const qRegex = { $regex: q, $options: 'i' };
    const searchConditions = [
      { title: qRegex },
      { description: qRegex },
      { category: { $regex: q, $options: 'i' } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: searchConditions }];
    } else {
      filter.$or = searchConditions;
    }
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);
  return LostFound.find(filter)
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Retrieves active lost and found items.
 *
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {string} [options.populate='submittedBy']
 * @returns {Promise<Array>}
 */
const getActiveItems = async ({ limit = 50, populate = 'submittedBy' } = {}) => {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  let query = LostFound.find({ status: 'active' }).sort({ createdAt: -1 }).limit(safeLimit);

  if (populate) {
    query = query.populate(populate, 'name department');
  }

  return query;
};

/**
 * Submits a new lost or found item.
 *
 * @param {object} data
 * @param {object} userContext
 * @returns {Promise<object>}
 */
const submitItem = async (data, userContext) => {
  const userId = extractUserId(userContext);
  if (!userId) {
    throw new Error('A valid user context is required to submit a lost/found item.');
  }

  return LostFound.create({
    ...data,
    submittedBy: userId,
  });
};

/**
 * Updates a lost or found item if authorized.
 *
 * @param {string} itemId
 * @param {object} updateData
 * @param {object} userContext
 * @returns {Promise<object>}
 */
const updateItem = async (itemId, updateData, userContext) => {
  const userId = extractUserId(userContext);
  const item = await LostFound.findById(itemId);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }

  if (item.submittedBy.toString() !== userId && userContext.role !== 'admin') {
    const err = new Error('Not authorized to update this item');
    err.statusCode = 403;
    throw err;
  }

  const fields = ['title', 'description', 'type', 'category', 'location', 'date', 'contactInfo', 'status', 'imageUrl'];
  fields.forEach((field) => {
    if (updateData[field] !== undefined) {
      item[field] = updateData[field];
    }
  });

  return item.save();
};

/**
 * Deletes a lost or found item if authorized.
 *
 * @param {string} itemId
 * @param {object} userContext
 * @returns {Promise<object>}
 */
const deleteItem = async (itemId, userContext) => {
  const userId = extractUserId(userContext);
  const item = await LostFound.findById(itemId);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }

  if (item.submittedBy.toString() !== userId && userContext.role !== 'admin') {
    const err = new Error('Not authorized to delete this item');
    err.statusCode = 403;
    throw err;
  }

  await item.deleteOne();
  return { message: 'Deleted' };
};

module.exports = {
  searchLostFoundItems,
  getActiveItems,
  submitItem,
  updateItem,
  deleteItem,
};
