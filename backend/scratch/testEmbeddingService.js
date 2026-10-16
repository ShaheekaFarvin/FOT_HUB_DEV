const Module = require('module');
const path = require('path');
const fs = require('fs');

const makeVector = (seed = 0.001) => Array.from({ length: 768 }, (_, i) => Number(((i + 1) * seed).toFixed(6)));

let embedBehavior = 'success';
let lastEmbedRequest = null;

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      embedContent: async (request) => {
        lastEmbedRequest = request;
        if (embedBehavior === 'fail') {
          throw new Error('Simulated embedding API failure');
        }
        if (embedBehavior === 'wrong-length') {
          return { embeddings: [{ values: [0.1, 0.2, 0.3] }] };
        }
        if (embedBehavior === 'non-numeric') {
          return { embeddings: [{ values: new Array(768).fill('not-a-number') }] };
        }
        if (embedBehavior === 'empty') {
          return { embeddings: [] };
        }
        return { embeddings: [{ values: makeVector() }] };
      },
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

process.env.GEMINI_API_KEY = 'test-key-for-embedding-tests';

const servicePath = path.join(__dirname, '..', 'ai', 'knowledge', 'embeddingService.js');
const { generateEmbedding, generateBatchEmbeddings, EMBEDDING_MODEL, EXPECTED_DIMENSIONS } = require(servicePath);

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

const expectThrow = async (label, fn) => {
  try {
    await fn();
    assert(false, label, 'expected a rejection, but none occurred');
  } catch (err) {
    assert(err instanceof Error, label, `threw: "${err.message}"`);
  }
};

const main = async () => {
  console.log('\n--- Test 1: Valid Embedding Generation ---');
  {
    embedBehavior = 'success';
    const vector = await generateEmbedding('Exam schedule released for all departments.');
    assert(Array.isArray(vector), 'returns an array');
    assert(vector.length === 768, 'vector has exactly 768 dimensions', `got: ${vector.length}`);
    assert(vector.every((n) => typeof n === 'number' && Number.isFinite(n)), 'all values are finite numbers');
    assert(EMBEDDING_MODEL === 'text-embedding-004', 'EMBEDDING_MODEL constant is "text-embedding-004"');
    assert(EXPECTED_DIMENSIONS === 768, 'EXPECTED_DIMENSIONS constant is 768');
  }

  console.log('\n--- Test 2: Correct Model & Task Type Sent ---');
  {
    embedBehavior = 'success';
    await generateEmbedding('Some retrieval text', 'RETRIEVAL_DOCUMENT');
    assert(lastEmbedRequest.model === 'text-embedding-004', 'request uses model "text-embedding-004"');
    assert(lastEmbedRequest.config.taskType === 'RETRIEVAL_DOCUMENT', 'default taskType is RETRIEVAL_DOCUMENT');

    await generateEmbedding('a search query', 'RETRIEVAL_QUERY');
    assert(lastEmbedRequest.config.taskType === 'RETRIEVAL_QUERY', 'taskType "RETRIEVAL_QUERY" is forwarded correctly');
  }

  console.log('\n--- Test 3: Empty/Invalid Text Rejected ---');
  {
    await expectThrow('rejects empty string', () => generateEmbedding(''));
    await expectThrow('rejects whitespace-only string', () => generateEmbedding('   '));
    await expectThrow('rejects non-string input (number)', () => generateEmbedding(12345));
    await expectThrow('rejects null', () => generateEmbedding(null));
  }

  console.log('\n--- Test 4: API Failure Handled Gracefully ---');
  {
    embedBehavior = 'fail';
    await expectThrow('API failure is caught and re-thrown as a controlled Error (no crash)', () =>
      generateEmbedding('some text')
    );
    embedBehavior = 'success';
  }

  console.log('\n--- Test 5: Invalid Vector Length Rejected ---');
  {
    embedBehavior = 'wrong-length';
    await expectThrow('vector with wrong length (not 768) is rejected', () => generateEmbedding('some text'));
    embedBehavior = 'success';
  }

  console.log('\n--- Test 6: Non-Numeric Vector Rejected ---');
  {
    embedBehavior = 'non-numeric';
    await expectThrow('vector containing non-numeric values is rejected', () => generateEmbedding('some text'));
    embedBehavior = 'success';
  }

  console.log('\n--- Test 7: Empty API Response Rejected ---');
  {
    embedBehavior = 'empty';
    await expectThrow('empty embeddings array from API is rejected safely', () => generateEmbedding('some text'));
    embedBehavior = 'success';
  }

  console.log('\n--- Test 8: Missing GEMINI_API_KEY ---');
  {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete require.cache[require.resolve(servicePath)];
    const freshService = require(servicePath);
    await expectThrow('throws a controlled error when GEMINI_API_KEY is missing', () =>
      freshService.generateEmbedding('some text')
    );
    process.env.GEMINI_API_KEY = original;
    delete require.cache[require.resolve(servicePath)];
  }

  console.log('\n--- Test 9: Batch Embeddings — All Succeed ---');
  {
    embedBehavior = 'success';
    const results = await generateBatchEmbeddings(['Text one', 'Text two', 'Text three']);
    assert(Array.isArray(results) && results.length === 3, 'returns one result per input text');
    assert(results.every((r) => r.success === true && r.embedding.length === 768), 'every item succeeded with a 768-dim vector');
  }

  console.log('\n--- Test 10: Batch Embeddings — Partial Failure Does Not Crash ---');
  {
    let callCount = 0;
    const OriginalClass = FakeGoogleGenAI;
    embedBehavior = 'success';

    const texts = ['Good text', '', 'Another good text'];
    const results = await generateBatchEmbeddings(texts);

    assert(Array.isArray(results) && results.length === 3, 'batch completes for all 3 items despite one invalid entry');
    assert(results[0].success === true, 'first (valid) text succeeded');
    assert(results[1].success === false && typeof results[1].error === 'string', 'second (empty) text failed with a controlled error, no crash');
    assert(results[2].success === true, 'third (valid) text still succeeded after the failure');
  }

  console.log('\n--- Test 11: Zero MongoDB / Zero Vector Search / Zero Chat Calls ---');
  {
    const source = fs.readFileSync(servicePath, 'utf8');
    assert(!/mongoose|mongodb/i.test(source), 'embeddingService.js has no MongoDB dependency');
    assert(!source.includes('$vectorSearch'), 'embeddingService.js performs no $vectorSearch');
    assert(!source.includes('generateContent'), 'embeddingService.js never calls the Gemini chat model (generateContent)');
    assert(!/require\(.*controllers|require\(.*routes|require\(.*middleware/.test(source), 'embeddingService.js does not import controllers, routes, or middleware');
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});