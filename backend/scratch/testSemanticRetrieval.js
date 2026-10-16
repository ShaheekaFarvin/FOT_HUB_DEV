/**
 * Standalone verification script for Semantic Retrieval (Topic 4.5).
 * Run with: node backend/scratch/testSemanticRetrieval.js
 *
 * Runs fully offline: patches `@google/genai` so embeddings never hit
 * the real API, and patches `KnowledgeDocument.aggregate` so the
 * `$vectorSearch` stage never needs a live MongoDB Atlas cluster.
 * The mocked aggregate returns canned { ...doc, score } results based
 * on the query text, letting this script verify semanticSearchService's
 * own logic (threshold filtering, result shape, pipeline construction)
 * in isolation.
 */

const Module = require('module');
const path = require('path');

let passCount = 0;
let failCount = 0;

const log = (label, ok, details) => {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passCount += 1;
  else failCount += 1;
  console.log(`[${status}] ${label}${details ? `\n       ${details}` : ''}`);
};

const assert = (condition, label, details) => {
  log(label, Boolean(condition), details);
};

// ---------------------------------------------------------------------------
// Mock @google/genai so embeddingService never calls the real API.
// ---------------------------------------------------------------------------
const makeVector = () => Array.from({ length: 768 }, (_, i) => Number((i * 0.001).toFixed(6)));

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      embedContent: async () => ({ embeddings: [{ values: makeVector() }] }),
    };
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@google/genai') {
    return { GoogleGenAI: FakeGoogleGenAI };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.GEMINI_API_KEY = 'test-key-for-semantic-retrieval-tests';

// ---------------------------------------------------------------------------
// Mock KnowledgeDocument.aggregate — canned results per test scenario.
// ---------------------------------------------------------------------------
const KnowledgeDocument = require(path.join(__dirname, '..', 'models', 'KnowledgeDocument'));

let mockScenario = 'announcement-match';

const CANNED_RESULTS = {
  'announcement-match': [
    {
      source: 'announcement',
      sourceId: '507f1f77bcf86cd799439011',
      title: 'Assignment Submission Deadline Extended',
      content: 'Title: Assignment Submission Deadline Extended\nCategory: Academic\nPriority: high\nContent: The submission deadline for ICT 3202 has been extended by 3 days.',
      metadata: { category: 'Academic', priority: 'high', createdAt: '2026-08-10T10:00:00.000Z' },
      score: 0.8742,
    },
  ],
  'election-match': [
    {
      source: 'election',
      sourceId: '507f1f77bcf86cd799439022',
      title: 'Student Union Election 2026',
      content: 'Title: Student Union Election 2026\nType: University Level\nCandidates:\n- Nimal Perera (President)',
      metadata: { type: 'University Level', status: 'upcoming' },
      score: 0.79,
    },
  ],
  'lostfound-match': [
    {
      source: 'lostFound',
      sourceId: '507f1f77bcf86cd799439033',
      title: 'Wallet found near library',
      content: 'Title: Wallet found near library\nType: found\nLocation: Main Library',
      metadata: { type: 'found', category: 'Other', status: 'active' },
      score: 0.71,
    },
  ],
  'no-match': [
    // Below-threshold noise the DB's ANN search still returned as "candidates"
    { source: 'announcement', sourceId: 'x1', title: 'Unrelated', content: '...', metadata: {}, score: 0.31 },
    { source: 'lostFound', sourceId: 'x2', title: 'Also unrelated', content: '...', metadata: {}, score: 0.18 },
  ],
};

let lastPipeline = null;
KnowledgeDocument.aggregate = async (pipeline) => {
  lastPipeline = pipeline;
  return CANNED_RESULTS[mockScenario] || [];
};

const { semanticSearch, SIMILARITY_THRESHOLD, VECTOR_INDEX_NAME, TOP_K, NUM_CANDIDATES } =
  require(path.join(__dirname, '..', 'ai', 'knowledge', 'semanticSearchService'));

// ---------------------------------------------------------------------------
(async () => {
  console.log('\n--- Scenario 1: Semantic match (paraphrased query) ---');
  {
    mockScenario = 'announcement-match';
    const results = await semanticSearch('What happened to the ICT3202 submission deadline?');
    assert(Array.isArray(results), 'returns an array');
    assert(results.length === 1, 'returns exactly one matched document');
    assert(results[0].source === 'announcement', 'matched document source is "announcement"');
    assert(results[0].score >= SIMILARITY_THRESHOLD, `score ${results[0].score} meets similarity threshold`);
    assert(lastPipeline[0].$vectorSearch.index === VECTOR_INDEX_NAME, 'pipeline uses configured VECTOR_INDEX_NAME');
    assert(lastPipeline[0].$vectorSearch.numCandidates === NUM_CANDIDATES, 'pipeline uses configured NUM_CANDIDATES');
    assert(lastPipeline[0].$vectorSearch.limit === TOP_K, 'pipeline uses configured TOP_K as limit');
    assert(Array.isArray(lastPipeline[0].$vectorSearch.queryVector) && lastPipeline[0].$vectorSearch.queryVector.length === 768,
      'query embedding sent to $vectorSearch is a 768-dim vector');
  }

  console.log('\n--- Scenario 2: Domain-specific queries ---');
  {
    mockScenario = 'election-match';
    const electionResults = await semanticSearch('Who are the candidates for the upcoming election?');
    assert(electionResults.length === 1 && electionResults[0].source === 'election', 'election query returns an election document');

    mockScenario = 'lostfound-match';
    const lostFoundResults = await semanticSearch('Has anyone found a wallet near the library?');
    assert(lostFoundResults.length === 1 && lostFoundResults[0].source === 'lostFound', 'lost & found query returns a lostFound document');
  }

  console.log('\n--- Scenario 3: Low/no relevance query ---');
  {
    mockScenario = 'no-match';
    const results = await semanticSearch('What is the recipe for chocolate cake?');
    assert(Array.isArray(results), 'returns an array even when nothing is relevant');
    assert(results.length === 0, 'returns a clean empty array when all scores are below the threshold');
  }

  console.log('\n--- Scenario 4: Controlled result format ---');
  {
    mockScenario = 'announcement-match';
    const [result] = await semanticSearch('Was the ICT3202 deadline extended?');
    const requiredKeys = ['source', 'sourceId', 'title', 'content', 'metadata', 'score'];
    assert(requiredKeys.every((k) => k in result), 'result object has all required keys', JSON.stringify(Object.keys(result)));
    assert(typeof result.score === 'number', 'score is numeric');
    assert(!('embedding' in result), 'raw embedding vector is excluded from the result payload');
    assert(!('_id' in result), 'raw Mongo _id is excluded from the result payload');
    assert(!('__v' in result), '__v is excluded from the result payload');
  }

  console.log('\n--- Scenario 5: Input validation ---');
  {
    const expectThrow = async (label, fn) => {
      try {
        await fn();
        assert(false, label, 'expected an Error to be thrown, but none was');
      } catch (err) {
        assert(err instanceof Error, label, `threw: "${err.message}"`);
      }
    };

    await expectThrow('throws when query is an empty string', () => semanticSearch(''));
    await expectThrow('throws when query is whitespace-only', () => semanticSearch('   '));
    await expectThrow('throws when query is not a string', () => semanticSearch(12345));
  }

  console.log('\n--- Scenario 6: Optional source filter is forwarded to $vectorSearch ---');
  {
    mockScenario = 'lostfound-match';
    await semanticSearch('Has anyone found a wallet?', { source: 'lostFound' });
    assert(
      lastPipeline[0].$vectorSearch.filter && lastPipeline[0].$vectorSearch.filter.source === 'lostFound',
      'single-source filter is passed through to the $vectorSearch stage'
    );

    await semanticSearch('Has anyone found a wallet?', { source: ['lostFound', 'announcement'] });
    assert(
      lastPipeline[0].$vectorSearch.filter &&
        JSON.stringify(lastPipeline[0].$vectorSearch.filter.source) === JSON.stringify({ $in: ['lostFound', 'announcement'] }),
      'array source filter is converted to a MongoDB $in clause'
    );
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
})();