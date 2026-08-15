const KnowledgeDocument = require('../../models/KnowledgeDocument');
const { generateEmbedding } = require('./embeddingService');



const VECTOR_INDEX_NAME = 'vector_index';
const TOP_K = 5;
const NUM_CANDIDATES = 50;
const SIMILARITY_THRESHOLD = 0.65;

/**
 * Builds the `$vectorSearch` aggregation pipeline.
 * @param {number[]} queryVector
 * @param {{ source?: string|string[] }} [filter]
 */
const buildPipeline = (queryVector, filter = {}) => {
  const vectorSearchStage = {
    $vectorSearch: {
      index: VECTOR_INDEX_NAME,
      path: 'embedding',
      queryVector,
      numCandidates: NUM_CANDIDATES,
      limit: TOP_K,
    },
  };

  // Optional pre-filter on the `source` field (must be declared as a
  // filter path on the Atlas vector_index — see Topic 3.5).
  if (filter.source) {
    vectorSearchStage.$vectorSearch.filter = {
      source: Array.isArray(filter.source) ? { $in: filter.source } : filter.source,
    };
  }

  return [
    vectorSearchStage,
    {
      $project: {
        _id: 0,
        source: 1,
        sourceId: 1,
        title: 1,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
};

/**
 * Runs semantic retrieval for a natural-language query.
 *
 * @param {string} query - Natural language user query.
 * @param {{ source?: string|string[], topK?: number, similarityThreshold?: number }} [options]
 * @returns {Promise<Array<{ source: string, sourceId: string, title: string, content: string, metadata: object, score: number }>>}
 */
const semanticSearch = async (query, options = {}) => {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('semanticSearchService.semanticSearch: query must be a non-empty string.');
  }

  const threshold = typeof options.similarityThreshold === 'number'
    ? options.similarityThreshold
    : SIMILARITY_THRESHOLD;

  const queryVector = await generateEmbedding(query.trim(), 'RETRIEVAL_QUERY');

  const pipeline = buildPipeline(queryVector, { source: options.source });
  if (options.topK) {
    pipeline[0].$vectorSearch.limit = options.topK;
  }

  const results = await KnowledgeDocument.aggregate(pipeline);

  return results
    .filter((doc) => typeof doc.score === 'number' && doc.score >= threshold)
    .map((doc) => ({
      source: doc.source,
      sourceId: doc.sourceId,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata || {},
      score: doc.score,
    }));
};

module.exports = {
  semanticSearch,
  VECTOR_INDEX_NAME,
  TOP_K,
  NUM_CANDIDATES,
  SIMILARITY_THRESHOLD,
};