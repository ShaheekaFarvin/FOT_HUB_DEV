const Module = require('module');
const path = require('path');

const makeVector = () => Array.from({ length: 768 }, (_, i) => Number((i * 0.001).toFixed(6)));

let embedBehavior = 'success';
const capturedTexts = [];

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      embedContent: async (request) => {
        capturedTexts.push(request.contents);
        if (embedBehavior === 'fail') {
          throw new Error('Simulated embedding failure');
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

process.env.GEMINI_API_KEY = 'test-key-for-vectorized-builder-tests';

const builderPath = path.join(__dirname, '..', 'ai', 'knowledge', 'vectorizedKnowledgeBuilder.js');
const { buildVectorizedDocument, buildVectorizedBatch } = require(builderPath);

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

const fakeObjectId = (hex) => ({ toString: () => hex });

const main = async () => {
  console.log('\n--- Test 1: Valid Announcement Vectorized ---');
  {
    embedBehavior = 'success';
    capturedTexts.length = 0;
    const record = {
      _id: fakeObjectId('ann123'),
      title: 'Assignment Deadline Extended',
      content: 'The submission deadline for ICT 3202 has been extended by 3 days.',
      category: 'Academic',
      priority: 'high',
      isActive: true,
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      updatedAt: new Date('2026-08-10T10:00:00.000Z'),
    };
    const doc = await buildVectorizedDocument(record, 'announcement');
    console.log(doc);

    assert(doc !== null, 'produces a vectorized document');
    assert(doc.source === 'announcement', 'source preserved from Topic 1');
    assert(doc.sourceId === 'ann123', 'sourceId preserved from Topic 1');
    assert(Array.isArray(doc.embedding) && doc.embedding.length === 768, 'embedding is a 768-dimensional vector');
    assert(doc.embedding.every((n) => typeof n === 'number'), 'embedding contains only numeric floats');
    assert(capturedTexts[0] === doc.content, 'exactly the Topic 1 content string was sent to the embedding model');
  }

  console.log('\n--- Test 2: Ineligible Record Returns Null, No Embedding Call ---');
  {
    capturedTexts.length = 0;
    const record = { _id: fakeObjectId('ann999'), title: 'Old', content: 'x', isActive: false };
    const doc = await buildVectorizedDocument(record, 'announcement');
    assert(doc === null, 'inactive announcement returns null');
    assert(capturedTexts.length === 0, 'embedding service was never called for an ineligible record');
  }

  console.log('\n--- Test 3: Embedding Failure Handled Gracefully ---');
  {
    embedBehavior = 'fail';
    const record = { _id: fakeObjectId('ann1'), title: 'Test', content: 'body', isActive: true };
    const doc = await buildVectorizedDocument(record, 'announcement');
    assert(doc === null, 'embedding API failure results in a safe null, not a crash/throw');
    embedBehavior = 'success';
  }

  console.log('\n--- Test 4: buildVectorizedBatch Filters Nulls ---');
  {
    embedBehavior = 'success';
    const records = [
      { _id: fakeObjectId('b1'), title: 'A', content: 'x', isActive: true },
      { _id: fakeObjectId('b2'), title: 'B', content: 'x', isActive: false },
      { _id: fakeObjectId('b3'), title: 'C', content: 'x', isActive: true },
    ];
    const batch = await buildVectorizedBatch(records, 'announcement');
    assert(Array.isArray(batch), 'returns an array');
    assert(batch.length === 2, 'ineligible record filtered out, only 2 vectorized docs remain', `got: ${batch.length}`);
    assert(batch.every((doc) => Array.isArray(doc.embedding) && doc.embedding.length === 768), 'every batch entry has a valid 768-dim embedding');
  }

  console.log('\n--- Test 5: Partial Batch Failure Does Not Crash Whole Batch ---');
  {
    let callIndex = 0;
    const savedEmbedContent = FakeGoogleGenAI.prototype;
    class FlakyGoogleGenAI {
      constructor() {
        this.models = {
          embedContent: async (request) => {
            callIndex += 1;
            if (callIndex === 2) {
              throw new Error('Simulated flaky failure on second call');
            }
            return { embeddings: [{ values: makeVector() }] };
          },
        };
      }
    }
    Module._load = function patchedFlakyLoad(request, parent, isMain) {
      if (request === '@google/genai') {
        return { GoogleGenAI: FlakyGoogleGenAI };
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    delete require.cache[require.resolve(builderPath)];
    delete require.cache[require.resolve(path.join(__dirname, '..', 'ai', 'knowledge', 'embeddingService.js'))];
    const freshBuilder = require(builderPath);

    const records = [
      { _id: fakeObjectId('c1'), title: 'A', content: 'x', isActive: true },
      { _id: fakeObjectId('c2'), title: 'B', content: 'y', isActive: true },
      { _id: fakeObjectId('c3'), title: 'C', content: 'z', isActive: true },
    ];
    const batch = await freshBuilder.buildVectorizedBatch(records, 'announcement');
    assert(Array.isArray(batch), 'batch call completes without throwing despite one embedding failure');
    assert(batch.length === 2, 'only the 2 successfully-embedded documents are returned', `got: ${batch.length}`);

    Module._load = function patchedLoad(request, parent, isMain) {
      if (request === '@google/genai') {
        return { GoogleGenAI: FakeGoogleGenAI };
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    delete require.cache[require.resolve(builderPath)];
    delete require.cache[require.resolve(path.join(__dirname, '..', 'ai', 'knowledge', 'embeddingService.js'))];
  }

  console.log('\n--- Test 6: Election — Votes Excluded From Embedded Text ---');
  {
    embedBehavior = 'success';
    capturedTexts.length = 0;
    const record = {
      _id: fakeObjectId('elec1'),
      title: 'Union Election 2026',
      type: 'University Level',
      department: 'All',
      eligibleDepartments: ['ICT'],
      status: 'ongoing',
      candidates: [{ name: 'Nimal Silva', position: 'President', manifesto: 'Better labs.', votes: 55 }],
      votes: [{ voter: fakeObjectId('student1'), candidateId: fakeObjectId('cand1'), position: 'President' }],
    };
    const doc = await buildVectorizedDocument(record, 'election');
    assert(doc !== null, 'eligible election is vectorized');
    assert(!capturedTexts[capturedTexts.length - 1].includes('55'), 'candidate vote count never sent to the embedding model');
    assert(!capturedTexts[capturedTexts.length - 1].includes('student1'), 'voter ObjectId never sent to the embedding model');
    assert(doc.embedding.length === 768, 'election document has a valid 768-dim embedding');
  }

  console.log('\n--- Test 7: LostFound — Vectorized Correctly ---');
  {
    embedBehavior = 'success';
    const record = {
      _id: fakeObjectId('lf1'),
      title: 'Lost umbrella',
      description: 'Black umbrella left in Lab 2',
      type: 'lost',
      category: 'Other',
      location: 'Lab 2',
      date: new Date('2026-08-01'),
      status: 'active',
      submittedBy: fakeObjectId('student2'),
    };
    const doc = await buildVectorizedDocument(record, 'lostFound');
    assert(doc !== null, 'active lost item is vectorized');
    assert(doc.source === 'lostFound', 'source is "lostFound"');
    assert(doc.embedding.length === 768, 'lost & found document has a valid 768-dim embedding');
  }

  console.log('\n--- Test 8: Unknown Source Returns Null, No Embedding Call ---');
  {
    capturedTexts.length = 0;
    const doc = await buildVectorizedDocument({ _id: fakeObjectId('x') }, 'complaint');
    assert(doc === null, 'unsupported/excluded source returns null');
    assert(capturedTexts.length === 0, 'embedding service is never called for an unsupported source');
  }

  console.log('\n--- Test 9: buildVectorizedBatch Non-Array Input Safety ---');
  {
    const result = await buildVectorizedBatch('not-an-array', 'announcement');
    assert(Array.isArray(result) && result.length === 0, 'non-array input safely returns an empty array, no crash');
  }

  console.log('\n--- Test 10: Vectorized Document Matches Topic 2.4 Schema ---');
  {
    embedBehavior = 'success';
    const record = {
      _id: fakeObjectId('ann500'),
      title: 'Assignment Submission Deadline Extended',
      content: 'The submission deadline for ICT 3202 has been extended by 3 days.',
      category: 'Academic',
      priority: 'high',
      isActive: true,
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      updatedAt: new Date('2026-08-10T10:00:00.000Z'),
    };
    const doc = await buildVectorizedDocument(record, 'announcement');
    const keys = Object.keys(doc).sort();
    assert(
      JSON.stringify(keys) === JSON.stringify(['content', 'embedding', 'metadata', 'source', 'sourceId', 'title'].sort()),
      'output document has exactly the fields defined in the Topic 2.4 schema',
      `got keys: ${JSON.stringify(keys)}`
    );
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});