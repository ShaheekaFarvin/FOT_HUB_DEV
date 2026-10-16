const { buildKnowledgeDocument } = require('./knowledgeDocumentBuilder');
const { generateEmbedding } = require('./embeddingService');

const buildVectorizedDocument = async (record, source) => {
  const knowledgeDoc = buildKnowledgeDocument(record, source);
  if (!knowledgeDoc) {
    return null;
  }

  try {
    const embedding = await generateEmbedding(knowledgeDoc.content, 'RETRIEVAL_DOCUMENT');
    return { ...knowledgeDoc, embedding };
  } catch (err) {
    return null;
  }
};

const buildVectorizedBatch = async (records, source) => {
  if (!Array.isArray(records)) {
    return [];
  }

  const results = await Promise.all(records.map((record) => buildVectorizedDocument(record, source)));
  return results.filter((doc) => doc !== null);
};

module.exports = { buildVectorizedDocument, buildVectorizedBatch };