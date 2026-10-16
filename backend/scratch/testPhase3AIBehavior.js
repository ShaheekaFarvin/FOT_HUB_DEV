const Module = require('module');

// Mock Mongoose models before requiring toolExecutor
const mockAnnouncement = {
  find: () => ({
    sort: () => ({
      limit: () => Promise.resolve([{ _id: 'ann-1', title: 'Exam Schedule', isActive: true }]),
    }),
  }),
};

const mockElection = {
  find: () => Promise.resolve([
    { _id: 'elec-1', title: 'Student Council 2026', status: 'ongoing', isDepartmentEligible: () => true },
  ]),
  findById: (id) => Promise.resolve({
    _id: id, title: 'Student Council 2026', status: 'ongoing', isDepartmentEligible: () => true,
  }),
};

const mockLostFound = {
  find: () => ({
    sort: () => ({
      limit: () => Promise.resolve([{ _id: 'lf-1', title: 'Keys', status: 'active' }]),
    }),
  }),
};

const mockComplaint = {
  find: () => ({
    sort: () => ({
      limit: () => Promise.resolve([{ _id: 'cmp-1', title: 'WiFi Issue', status: 'Pending' }]),
    }),
  }),
  create: (data) => Promise.resolve({ _id: 'cmp-mock-1', ...data }),
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request.includes('models/Announcement')) return mockAnnouncement;
  if (request.includes('models/Election')) return mockElection;
  if (request.includes('models/LostFound')) return mockLostFound;
  if (request.includes('models/Complaint')) return mockComplaint;
  return originalLoad.call(this, request, parent, isMain);
};

const { buildPrompt } = require('../ai/prompt/promptBuilder');
const { getAvailableTools, getGeminiFunctionDeclarations } = require('../ai/tools/toolRegistry');
const { normalizeToolResult } = require('../ai/tools/toolResultHandler');
const { executeTool } = require('../ai/tools/toolExecutor');

let passCount = 0;
let failCount = 0;

const assert = (condition, label, details) => {
  if (condition) {
    passCount += 1;
    console.log(`[PASS] ${label}`);
  } else {
    failCount += 1;
    console.log(`[FAIL] ${label}${details ? `\n       ${details}` : ''}`);
  }
};

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Samitha Bandara',
  role: 'Student',
  department: 'ICT',
};

const main = async () => {
  console.log('\n--- Test 1: Optional Parameter Schema Descriptions in toolRegistry.js ---');
  {
    const availableTools = getAvailableTools();
    assert(Array.isArray(availableTools) && availableTools.length === 6, 'getAvailableTools() returns exactly 6 tools');
    assert(availableTools[1].description === 'Check whether the current student is eligible to vote', 'getAvailableTools() preserves exact Phase 2 tool descriptions');

    const fnDecls = getGeminiFunctionDeclarations();
    const votingDecl = fnDecls.find((fn) => fn.name === 'checkVotingEligibility');
    assert(
      votingDecl?.parameters?.properties?.electionId?.description?.includes('Optional election ID'),
      'checkVotingEligibility.electionId parameter has optional schema description'
    );

    const complaintDecl = fnDecls.find((fn) => fn.name === 'getComplaintStatus');
    assert(
      complaintDecl?.parameters?.properties?.complaintId?.description?.includes('Optional complaint ID'),
      'getComplaintStatus.complaintId parameter has optional schema description'
    );

    const notifDecl = fnDecls.find((fn) => fn.name === 'getNotifications');
    assert(
      notifDecl?.parameters?.properties?.unreadOnly?.description?.includes('Optional flag'),
      'getNotifications.unreadOnly parameter has optional schema description'
    );
  }

  console.log('\n--- Test 2: System Instructions for AI Behavior in promptBuilder.js ---');
  {
    const context = {
      user: mockUser,
      conversation: [],
      currentMessage: 'Can I vote?',
    };
    const prompt = buildPrompt(context, getAvailableTools());

    assert(prompt.includes('Optional Arguments Handling'), 'System prompt contains explicit Optional Arguments Handling rule');
    assert(prompt.includes('checkVotingEligibility'), 'System prompt explicitly names checkVotingEligibility rule');
    assert(prompt.includes('Result Interpretation'), 'System prompt contains Result Interpretation guidelines');
    assert(prompt.includes('Error Wording'), 'System prompt contains Error Wording guidelines');
    assert(prompt.includes('Markdown bullet lists'), 'System prompt contains Markdown bullet list formatting guidelines');
  }

  console.log('\n--- Test 3: Tool Execution with Empty Args for Optional Parameters ---');
  {
    const votingCall = { name: 'checkVotingEligibility', arguments: {} };
    const votingResult = await executeTool(votingCall, mockUser);
    assert(votingResult.success === true, 'checkVotingEligibility executes successfully with empty arguments {}');

    const complaintCall = { name: 'getComplaintStatus', arguments: {} };
    const complaintResult = await executeTool(complaintCall, mockUser);
    assert(complaintResult.success === true, 'getComplaintStatus executes successfully with empty arguments {}');

    const notifCall = { name: 'getNotifications', arguments: {} };
    const notifResult = await executeTool(notifCall, mockUser);
    assert(notifResult.success === true, 'getNotifications executes successfully with empty arguments {}');
  }

  console.log('\n--- Test 4: Error Sanitization in toolResultHandler.js ---');
  {
    const dbErrResult = {
      success: false,
      error: 'MongoServerError: connection failed at Cluster0.mongodb.net:27017 at NativeTopology.connect',
    };
    const sanitizedDbErr = normalizeToolResult(dbErrResult);
    assert(sanitizedDbErr.success === false, 'normalized result preserves success: false flag');
    assert(!sanitizedDbErr.error.includes('MongoServerError'), 'raw MongoDB error string is stripped from normalized error');
    assert(!sanitizedDbErr.error.includes('Cluster0'), 'internal database topology details are stripped');
    assert(sanitizedDbErr.error === 'Unable to retrieve information due to a temporary service issue.', 'raw DB error is sanitized to polite generic message');

    const genericErr = {
      success: false,
      error: 'Election not found.',
    };
    const sanitizedGeneric = normalizeToolResult(genericErr);
    assert(sanitizedGeneric.error === 'Election not found.', 'non-technical user-level errors are preserved intact');
  }

  console.log('\n--- Test 5: Successful Business Data Preservation ---');
  {
    const successData = {
      success: true,
      data: [
        { _id: 'c-101', title: 'Library Noise', status: 'Pending' },
      ],
    };
    const normalizedSuccess = normalizeToolResult(successData);
    assert(normalizedSuccess.success === true, 'normalized result preserves success: true flag');
    assert(Array.isArray(normalizedSuccess.data) && normalizedSuccess.data[0].title === 'Library Noise', 'business payload data is preserved intact without mutation');
  }

  console.log(`\n=== Behavioral Test Summary: ${passCount} passed, ${failCount} failed ===`);
  Module._load = originalLoad;
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  Module._load = originalLoad;
  console.error('Behavioral test crashed:', err);
  process.exit(1);
});
