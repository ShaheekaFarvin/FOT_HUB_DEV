const Module = require('module');
const path = require('path');
const mongoose = require('mongoose');

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
// 1. Mocking Setup
// ---------------------------------------------------------------------------
const makeFakeVector = () => Array.from({ length: 768 }, (_, i) => Number((i * 0.001).toFixed(6)));

let generateContentCallCount = 0;
let lastPrompt = '';
let mockChatReply = 'This is a default mock response.';

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async ({ contents }) => {
        generateContentCallCount += 1;
        if (typeof contents === 'string') {
          lastPrompt = contents;
        } else if (Array.isArray(contents)) {
          lastPrompt = JSON.stringify(contents);
        }
        return { text: mockChatReply };
      },
      embedContent: async () => ({ embeddings: [{ values: makeFakeVector() }] }),
    };
  }
}

// In-Memory Database collections for test mocks
const USER_A_ID = '507f1f77bcf86cd799439001';
const USER_B_ID = '507f1f77bcf86cd799439002';
const COMPLAINT_A1_ID = '607f1f77bcf86cd799439011';
const COMPLAINT_A2_ID = '607f1f77bcf86cd799439012';
const COMPLAINT_B1_ID = '607f1f77bcf86cd799439021';
const COMPLAINT_B2_ID = '607f1f77bcf86cd799439022';

const mockComplaints = [
  { _id: COMPLAINT_A1_ID, title: 'WiFi Issue in Hostel A', submittedBy: USER_A_ID, status: 'Pending', createdAt: new Date() },
  { _id: COMPLAINT_A2_ID, title: 'Water Leak in Lab 1', submittedBy: USER_A_ID, status: 'In Progress', createdAt: new Date() },
  { _id: COMPLAINT_B1_ID, title: 'Library Book Missing', submittedBy: USER_B_ID, status: 'Resolved', createdAt: new Date() },
  { _id: COMPLAINT_B2_ID, title: 'AC Not Working in Hall B', submittedBy: USER_B_ID, status: 'Pending', createdAt: new Date() },
];

const mockAnnouncements = [
  { _id: '707f1f77bcf86cd799439001', title: 'Final Semester Timetable 2026', content: 'Exams begin next week.', isActive: true, createdAt: new Date('2026-08-10') },
  { _id: '707f1f77bcf86cd799439002', title: '2025 Sports Day Notice', content: 'Sports day was held in 2025.', isActive: true, createdAt: new Date('2025-05-15') },
];

const mockElections = [
  {
    _id: '807f1f77bcf86cd799439001',
    title: 'Student Union Election 2025',
    status: 'completed',
    department: 'All',
    candidates: [
      { name: 'Nimal Perera', position: 'President', manifesto: 'Focus on lab facilities and transparent communication.' },
      { name: 'Kasun Silva', position: 'Secretary', manifesto: 'Better hostel facilities.' },
    ],
    isDepartmentEligible: () => true,
  },
];

const mockLostFound = [
  { _id: '907f1f77bcf86cd799439001', title: 'Blue Umbrella', type: 'lost', location: 'Lab 02', category: 'Other', status: 'active', createdAt: new Date() },
];

const createMockModel = (dataArray) => ({
  find: (query = {}) => {
    let results = [...dataArray];
    if (query.submittedBy) {
      results = results.filter((item) => item.submittedBy === query.submittedBy);
    }
    if (query._id) {
      results = results.filter((item) => item._id === query._id.toString() || item._id === query._id);
    }
    if (query.isActive !== undefined) {
      results = results.filter((item) => item.isActive === query.isActive);
    }
    if (query.status) {
      results = results.filter((item) => item.status === query.status);
    }
    return {
      sort: () => ({
        limit: (num) => results.slice(0, num),
        then: (resolve) => resolve(results),
        catch: () => {},
      }),
      limit: (num) => results.slice(0, num),
      then: (resolve) => resolve(results),
    };
  },
  findById: async (id) => dataArray.find((item) => item._id === id.toString() || item._id === id) || null,
  create: async (doc) => ({ _id: 'new_id_123', ...doc }),
});

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@google/genai') {
    return { GoogleGenAI: FakeGoogleGenAI };
  }
  if (request.includes('models/Complaint')) {
    return createMockModel(mockComplaints);
  }
  if (request.includes('models/Announcement')) {
    return createMockModel(mockAnnouncements);
  }
  if (request.includes('models/Election')) {
    return createMockModel(mockElections);
  }
  if (request.includes('models/LostFound')) {
    return createMockModel(mockLostFound);
  }
  if (request.includes('models/KnowledgeDocument')) {
    return {
      aggregate: async () => [
        {
          source: 'election',
          sourceId: '807f1f77bcf86cd799439001',
          title: 'Student Union Election 2025',
          content: 'Election: Student Union Election 2025\nStatus: completed\nCandidate:\nName: Nimal Perera\nPosition: President\nManifesto: Focus on lab facilities.',
          metadata: { status: 'completed' },
          score: 0.71,
        },
      ],
    };
  }
  return originalLoad.apply(this, arguments);
};

// Import components under test after patches
const { executeTool } = require('../ai/tools/toolExecutor');
const { buildPrompt } = require('../ai/prompt/promptBuilder');
const { handleToolResult, formatDirectToolFallback } = require('../ai/tools/toolResultHandler');
const { buildElectionDocument } = require('../ai/knowledge/knowledgeDocumentBuilder');

async function runPostHardeningTests() {
  console.log('\n================================================');
  console.log('FOT HUB PHASE 4 POST-INTEGRATION HARDENING TEST SUITE');
  console.log('================================================\n');

  const userA = { _id: USER_A_ID, name: 'User A', role: 'student', department: 'ICT' };
  const userB = { _id: USER_B_ID, name: 'User B', role: 'student', department: 'ET' };

  // ---------------------------------------------------------------------------
  // SECTION A: User Data Isolation & Cross-ID Probing (H1)
  // ---------------------------------------------------------------------------
  console.log('--- Section A: User Isolation & Cross-ID Probing ---');

  const resA = await executeTool({ name: 'getComplaintStatus', arguments: {} }, userA);
  assert(resA.success === true, 'User A complaint query succeeds');
  assert(resA.data.length === 2, 'User A receives exactly their 2 complaints', `got ${resA.data.length}`);
  assert(resA.data.every((c) => c.submittedBy === USER_A_ID), 'All complaints returned belong strictly to User A');

  const resB = await executeTool({ name: 'getComplaintStatus', arguments: {} }, userB);
  assert(resB.success === true, 'User B complaint query succeeds');
  assert(resB.data.length === 2, 'User B receives exactly their 2 complaints', `got ${resB.data.length}`);
  assert(resB.data.every((c) => c.submittedBy === USER_B_ID), 'All complaints returned belong strictly to User B');

  // Cross-ID probing: User A requesting Complaint B1 by ID
  const probeA = await executeTool({ name: 'getComplaintStatus', arguments: { complaintId: COMPLAINT_B1_ID } }, userA);
  assert(probeA.success === true, 'Cross-ID probe query executes without crashing');
  assert(probeA.data.length === 0, 'User A requesting User B complaint ID returns empty array (blocked)');

  // Cross-ID probing: User B requesting Complaint A1 by ID
  const probeB = await executeTool({ name: 'getComplaintStatus', arguments: { complaintId: COMPLAINT_A1_ID } }, userB);
  assert(probeB.data.length === 0, 'User B requesting User A complaint ID returns empty array (blocked)');

  // Notifications isolation check
  const notifA = await executeTool({ name: 'getNotifications', arguments: {} }, userA);
  assert(notifA.data.complaintUpdates.every((c) => c.submittedBy === USER_A_ID), 'Notifications complaint updates belong strictly to User A');

  // ---------------------------------------------------------------------------
  // SECTION B: Date Awareness & Temporal Reasoning (H2)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section B: Date Awareness & Temporal Reasoning ---');

  const prompt = buildPrompt({ user: userA, conversation: [], currentMessage: 'What are the latest announcements?' }, [], []);
  const todayStr = new Date().toISOString().split('T')[0];

  assert(prompt.includes(`Current Date: ${todayStr}`), 'Prompt dynamically injects Current Date in YYYY-MM-DD format');
  assert(prompt.includes('# DATE AWARENESS & TEMPORAL RULES'), 'Prompt includes dedicated Date Awareness section');
  assert(prompt.includes('Do NOT describe a past event'), 'Prompt explicitly instructs model not to describe past events as current');
  assert(prompt.includes('explicitly identify that information as historical'), 'Prompt instructs model to label historical information');

  // ---------------------------------------------------------------------------
  // SECTION C: Candidate Manifesto Text Structuring (H3)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section C: Candidate Manifesto Text Structuring ---');

  const electionDoc = buildElectionDocument(mockElections[0]);
  assert(electionDoc.content.includes('Candidate:'), 'Election text block includes "Candidate:" header');
  assert(electionDoc.content.includes('Name: Nimal Perera'), 'Election text block formats candidate Name key');
  assert(electionDoc.content.includes('Position: President'), 'Election text block formats candidate Position key');
  assert(electionDoc.content.includes('Manifesto: Focus on lab facilities'), 'Election text block formats candidate Manifesto key');

  // ---------------------------------------------------------------------------
  // SECTION D: Tool Summary Stability & Safe Direct Fallback (H4)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section D: Tool Summary Stability & Direct Fallback ---');

  const fakeClient = new FakeGoogleGenAI();
  const summaryReply = await handleToolResult({
    client: fakeClient,
    model: 'gemini-3.5-flash-lite',
    prompt: 'test prompt',
    geminiResponse: { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'searchLostItems', args: {} } }] } }] },
    toolCall: { name: 'searchLostItems', arguments: {} },
    toolResult: { success: true, data: [{ title: 'Blue Umbrella', type: 'lost', location: 'Lab 02', category: 'Other' }] },
    functionDeclarations: [{ name: 'searchLostItems', description: 'Search items' }],
  });

  assert(typeof summaryReply === 'string' && summaryReply.length > 0, 'handleToolResult returns non-empty summary string');

  // Test direct safe fallback formatter
  const fallbackStr = formatDirectToolFallback('searchLostItems', { success: true, data: [{ title: 'Blue Umbrella', type: 'lost', location: 'Lab 02', category: 'Other' }] });
  assert(fallbackStr.includes('Blue Umbrella'), 'Direct fallback includes item title');
  assert(!fallbackStr.includes('_id') && !fallbackStr.includes('__v'), 'Direct fallback strips internal database fields');

  // ---------------------------------------------------------------------------
  // SECTION E: Vote Tally Grounding & Confidentiality Rules (H5)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section E: Vote Tally Grounding Rules ---');

  assert(prompt.includes('Candidate Vote Tallies & Secrecy'), 'Prompt includes candidate vote tallies secrecy section');
  assert(prompt.includes('strictly excluded from public retrieval knowledge'), 'Prompt states vote counts are excluded from RAG knowledge');
  assert(prompt.includes('explain that candidate vote tally information is confidential'), 'Prompt directs model to explain vote tallies are confidential');

  // ---------------------------------------------------------------------------
  // SECTION F: Anti-Boilerplate Response Guidelines (H6)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section F: Anti-Boilerplate Guidelines ---');

  assert(prompt.includes('Direct Answers & Anti-Boilerplate'), 'Prompt contains direct answers anti-boilerplate section');
  assert(prompt.includes('Do NOT automatically append repetitive closing sentences'), 'Prompt explicitly prohibits repetitive closing phrases');

  // ---------------------------------------------------------------------------
  // SECTION G: Full Phase 3 Regression Suite (H7)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section G: Phase 3 Full Regression Suite ---');

  const checkVote = await executeTool({ name: 'checkVotingEligibility', arguments: {} }, userA);
  assert(checkVote.success === true, 'checkVotingEligibility tool executes cleanly');

  const searchAnn = await executeTool({ name: 'searchAnnouncements', arguments: { query: 'exam' } }, userA);
  assert(searchAnn.success === true, 'searchAnnouncements tool executes cleanly');

  const searchLost = await executeTool({ name: 'searchLostItems', arguments: { query: 'umbrella' } }, userA);
  assert(searchLost.success === true, 'searchLostItems tool executes cleanly');

  const submitComp = await executeTool({ name: 'submitComplaint', arguments: { title: 'Test Complaint', description: 'Test description' } }, userA);
  assert(submitComp.success === true, 'submitComplaint tool creates new complaint cleanly');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================');
  console.log(`TOTAL PASSED: ${passCount} | TOTAL FAILED: ${failCount}`);
  console.log('================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPostHardeningFixes().catch((err) => {
  console.error('Fatal error in post-hardening test suite:', err);
  process.exit(1);
});
