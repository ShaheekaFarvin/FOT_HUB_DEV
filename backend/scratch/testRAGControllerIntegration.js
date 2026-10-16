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
// Mocks
// ---------------------------------------------------------------------------
const makeFakeVector = () => Array.from({ length: 768 }, (_, i) => Number((i * 0.001).toFixed(6)));

let aggregateCallCount = 0;
let mockKnowledgeResults = [];

let generateContentCallCount = 0;
let mockChatReply = 'Mock reply.';

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async ({ contents }) => {
        generateContentCallCount += 1;
        lastPrompt = contents;
        return { text: mockChatReply };
      },
      embedContent: async () => ({ embeddings: [{ values: makeFakeVector() }] }),
    };
  }
}

let lastPrompt = null;

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@google/genai') {
    return { GoogleGenAI: FakeGoogleGenAI };
  }
  if (request.includes('models/KnowledgeDocument')) {
    return {
      aggregate: async () => {
        aggregateCallCount += 1;
        return mockKnowledgeResults;
      },
    };
  }
  if (request.includes('models/Announcement')) {
    return { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) };
  }
  if (request.includes('models/Election')) {
    return { find: () => Promise.resolve([]), findById: async () => null };
  }
  if (request.includes('models/LostFound')) {
    return { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) };
  }
  if (request.includes('models/Complaint')) {
    return {
      find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }),
      create: async (data) => ({ _id: 'mock-complaint-id', ...data }),
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.GEMINI_API_KEY = 'test-key-for-rag-controller-tests';

const { sendMessage } = require(path.join(__dirname, '..', 'controllers', 'aiChatController.js'));
const { clearSession } = require(path.join(__dirname, '..', 'ai', 'memory', 'conversationMemory'));

const makeUser = (overrides = {}) => ({
  _id: 'rag-test-user',
  name: 'Kavindu',
  role: 'Student',
  department: 'ICT',
  ...overrides,
});

const createMockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const invoke = async (user, message) => {
  const req = { user, body: { message } };
  const res = createMockRes();
  await sendMessage(req, res);
  return res;
};

const announcementDoc = {
  source: 'announcement',
  sourceId: '507f1f77bcf86cd799439011',
  title: 'Assignment Submission Deadline Extended',
  content: 'Title: Assignment Submission Deadline Extended\nContent: The submission deadline for ICT 3202 has been extended by 3 days.',
  metadata: { category: 'Academic' },
  score: 0.87,
};

(async () => {
  console.log('\n--- Scenario 1: RAG Knowledge Request Test ---');
  {
    aggregateCallCount = 0;
    mockKnowledgeResults = [announcementDoc];
    mockChatReply = 'The ICT 3202 deadline was extended by 3 days.';
    clearSession('rag-test-user');

    const res = await invoke(makeUser(), 'What announcement discussed the examination schedule?');

    assert(aggregateCallCount === 1, 'semantic retrieval ($vectorSearch) was executed for a knowledge query');
    assert(lastPrompt.includes('Retrieved Knowledge:'), 'prompt sent to Gemini includes the Retrieved Knowledge section');
    assert(lastPrompt.includes('Assignment Submission Deadline Extended'), 'retrieved document content was injected into the prompt');
    assert(res.statusCode === 200 && res.body.reply === mockChatReply, 'controller returns the grounded Gemini reply');
  }

  console.log('\n--- Scenario 2: Phase 3 Tool Request Test (RAG must NOT run) ---');
  {
    aggregateCallCount = 0;
    mockChatReply = 'You are eligible to vote in the ongoing election.';
    clearSession('rag-test-user');

    const res = await invoke(makeUser(), 'Can I vote?');

    assert(aggregateCallCount === 0, 'semantic retrieval was skipped for a Phase 3 tool-handled query (checkVotingEligibility)');
    assert(res.statusCode === 200, 'tool-path request still returns 200');
  }

  console.log('\n--- Scenario 3: Normal Conversation / Greeting Test (RAG must NOT run) ---');
  {
    aggregateCallCount = 0;
    mockChatReply = 'Hello! How can I help you today?';
    clearSession('rag-test-user');

    const res = await invoke(makeUser(), 'Hello, good morning!');

    assert(aggregateCallCount === 0, 'semantic retrieval was skipped for a greeting');
    assert(lastPrompt.includes('No relevant campus knowledge documents were retrieved'), 'prompt shows the empty-retrieval fallback for a greeting');
    assert(res.statusCode === 200 && res.body.reply === mockChatReply, 'controller returns the direct greeting reply');
  }

  console.log('\n--- Scenario 4: No-Result Knowledge Request Test ---');
  {
    aggregateCallCount = 0;
    mockKnowledgeResults = []; // nothing clears the similarity threshold
    mockChatReply = "I'm not sure about that — you may want to check with the faculty office.";
    clearSession('rag-test-user');

    const res = await invoke(makeUser(), 'What is the policy for astronaut training in FOT?');

    assert(aggregateCallCount === 1, 'semantic retrieval still runs for an out-of-scope knowledge question');
    assert(lastPrompt.includes('No relevant campus knowledge documents were retrieved'), 'empty retrieval produces the fallback context block, not fabricated content');
    assert(res.statusCode === 200 && res.body.reply === mockChatReply, 'controller returns the honest no-hallucination reply');
  }

  console.log('\n--- Scenario 5: Existing Phase 3 Tools Preserved (checkVotingEligibility still executes) ---');
  {
    // Simulate Gemini requesting the checkVotingEligibility tool by having
    // generateContent return a functionCall on the first call, then a
    // plain text reply on the follow-up call made by toolResultHandler.
    let callNum = 0;
    class FakeGoogleGenAIWithToolCall {
      constructor() {
        this.models = {
          generateContent: async ({ contents }) => {
            callNum += 1;
            if (callNum === 1) {
              lastPrompt = contents;
              return {
                text: undefined,
                functionCalls: () => [{ name: 'checkVotingEligibility', args: {} }],
                candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'checkVotingEligibility', args: {} } }] } }],
              };
            }
            return { text: 'You are eligible to vote.' };
          },
          embedContent: async () => ({ embeddings: [{ values: makeFakeVector() }] }),
        };
      }
    }
    Module._load = function patchedLoad2(request, parent, isMain) {
      if (request === '@google/genai') {
        return { GoogleGenAI: FakeGoogleGenAIWithToolCall };
      }
      if (request.includes('models/KnowledgeDocument')) {
        return { aggregate: async () => { aggregateCallCount += 1; return []; } };
      }
      if (request.includes('models/Election')) {
        return { find: () => Promise.resolve([]), findById: async () => null };
      }
      if (request.includes('models/Announcement')) {
        return { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) };
      }
      if (request.includes('models/LostFound')) {
        return { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) };
      }
      if (request.includes('models/Complaint')) {
        return {
          find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }),
          create: async (data) => ({ _id: 'mock-complaint-id', ...data }),
        };
      }
      return originalLoad.call(this, request, parent, isMain);
    };

    // Re-require with fresh mocks (modules already cached, so we call the
    // orchestrator's exported pieces directly instead of re-requiring).
    delete require.cache[require.resolve(path.join(__dirname, '..', 'ai', 'tools', 'toolExecutor.js'))];
    const { executeTool } = require(path.join(__dirname, '..', 'ai', 'tools', 'toolExecutor.js'));
    const result = await executeTool({ name: 'checkVotingEligibility', arguments: {} }, makeUser());
    assert(result.success === true, 'checkVotingEligibility tool still executes successfully through the shared toolExecutor');
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
})();