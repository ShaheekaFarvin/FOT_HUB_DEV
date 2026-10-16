const KnowledgeDocument = require('../../models/KnowledgeDocument');


/**
 * Saves or updates a single vectorized document, keyed by
 * (source, sourceId).
 * @param {{ source: string, sourceId: string, title: string, content: string, metadata?: object, embedding: number[] }} doc
 */
const upsertDocument = async (doc) => {
  return KnowledgeDocument.findOneAndUpdate(
    { source: doc.source, sourceId: doc.sourceId },
    {
      $set: {
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata || {},
        embedding: doc.embedding,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
};

/**
 * Bulk upserts multiple vectorized documents using MongoDB `bulkWrite`.
 * @param {Array<{ source: string, sourceId: string, title: string, content: string, metadata?: object, embedding: number[] }>} docs
 * @returns {Promise<{ inserted: number, updated: number }>}
 */
const upsertBatch = async (docs) => {
  if (!Array.isArray(docs) || docs.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { source: doc.source, sourceId: doc.sourceId },
      update: {
        $set: {
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata || {},
          embedding: doc.embedding,
        },
      },
      upsert: true,
    },
  }));

  const result = await KnowledgeDocument.bulkWrite(operations, { ordered: false });

  return {
    inserted: result.upsertedCount || 0,
    updated: result.modifiedCount || 0,
  };
};

/**
 * Retrieves a specific knowledge record by source identity.
 * @param {'announcement'|'election'|'lostFound'} source
 * @param {string} sourceId
 */
const getBySourceId = async (source, sourceId) => {
  return KnowledgeDocument.findOne({ source, sourceId });
};

/**
 * Removes a knowledge document when the source item is deleted/deactivated.
 * @param {'announcement'|'election'|'lostFound'} source
 * @param {string} sourceId
 */
const deleteBySourceId = async (source, sourceId) => {
  return KnowledgeDocument.deleteOne({ source, sourceId });
};

/**
 * Returns the current total count of indexed knowledge documents.
 * @param {object} [filter]
 */
const countDocuments = async (filter = {}) => {
  return KnowledgeDocument.countDocuments(filter);
};

module.exports = {
  upsertDocument,
  upsertBatch,
  getBySourceId,
  deleteBySourceId,
  countDocuments,
};