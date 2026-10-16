const Module = require('module');
const path = require('path');

const callLog = [];
let responseQueue = [];

const nextResponse = () => {
  const next = responseQueue.shift() || { type: 'success', text: 'Default mock response.' };
  if (next.type === 'fail') {
    throw new Error('Simulated Gemini API failure');
  }
  if (next.type === 'functionCall') {
    return {
      text: undefined,
      functionCalls: [{ name: next.name, args: next.args || {} }],
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ functionCall: { name: next.name, args: next.args || {} } }],
          },
        },
      ],
    };
  }
  return { text: next.text };
};

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async (request) => {
        callLog.push(request);
        return nextResponse();
      },
    };
  }
}

const dbCalls = { Announcement: 0, Election: 0, LostFound: 0, Complaint: 0 };
let dbBehavior = 'default';

const resetDbCalls = () => {
  dbCalls.Announcement = 0;
  dbCalls.Election = 0;
  dbCalls.LostFound = 0;
  dbCalls.Complaint = 0;
};

const mockAnnouncement = {
  find: () => {
    dbCalls.Announcement += 1;
    return {
      sort: () => ({
        limit: () =>
          Promise.resolve([
            { _id: 'ann-1', title: 'Exam Schedule Released', content: 'Final exams start Monday', isActive: true },
          ]),
      }),
    };
  },
};

const mockElection = {
  find: () => {
    dbCalls.Election += 1;
    return Promise.resolve([
      { _id: 'elec-1', title: 'Student Union Election 2026', status: 'ongoing', isDepartmentEligible: () => true },
    ]);
  },
  findById: async (id) => {
    dbCalls.Election += 1;
    if (dbBehavior === 'dbError') {
      throw new Error('Simulated database failure while reading Election');
    }
    return {
      _id: id,
      title: 'Student Union Election 2026',
      status: 'ongoing',
      isDepartmentEligible: () => true,
    };
  },
};

const mockLostFound = {
  find: () => {
    dbCalls.LostFound += 1;
    return { sort: () => ({ limit: () => Promise.resolve([{ _id: 'lf-1', title: 'Black Wallet', status: 'active' }]) }) };
  },
};

const mockComplaint = {
  find: () => {
    dbCalls.Complaint += 1;
    return { sort: () => ({ limit: () => Promise.resolve([]) }) };
  },
  create: async (data) => {
    dbCalls.Complaint += 1;
    return { _id: 'complaint-mock-1', __v: 0, ...data };
  },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@google/genai') {
    return { GoogleGenAI: FakeGoogleGenAI };
  }
  if (request.includes('models/Announcement')) return mockAnnouncement;
  if (request.includes('models/Election')) return mockElection;
  if (request.includes('models/LostFound')) return mockLostFound;
  if (request.includes('models/Complaint')) return mockComplaint;
  return originalLoad.call(this, request, parent, isMain);
};

process.env.GEMINI_API_KEY = 'test-key-for-controller-integration-tests';

const controllerPath = path.join(__dirname, '..', 'controllers', 'aiChatController.js');
const { sendMessage } = require(controllerPath);
const { getHistory, clearSession } = require('../ai/memory/conversationMemory');
const contextBuilder = require('../ai/context/contextBuilder');
const promptBuilder = require('../ai/prompt/promptBuilder');
const roleVerifier = require('../ai/roles/roleVerifier');
const intentRouter = require('../ai/routing/intentRouter');
const conversationMemory = require('../ai/memory/conversationMemory');
const toolRegistry = require('../ai/tools/toolRegistry');

let passCount = 0;
let failCount = 0;

const originalConsoleLog = console.log;
const capturedLogs = [];
console.log = (...args) => {
  capturedLogs.push(args.join(' '));
};
const restoreConsole = () => {
  console.log = originalConsoleLog;
};
const silenceConsole = () => {
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
};

const section = (title) => {
  restoreConsole();
  console.log(`\n--- ${title} ---`);
  silenceConsole();
};

const assert = (condition, label, details) => {
  const ok = Boolean(condition);
  if (ok) passCount += 1;
  else failCount += 1;
  restoreConsole();
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${details ? `\n       ${details}` : ''}`);
  silenceConsole();
};

const makeUser = (overrides = {}) => ({
  _id: 'user-001',
  name: 'John Perera',
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
  callLog.length = 0;
  await sendMessage(req, res);
  return res;
};

const main = async () => {
  section('Test 1: Normal Gemini Response (no tool call)');
  {
    responseQueue = [{ type: 'success', text: 'Hi! How can I help you today?' }];
    resetDbCalls();
    const user = makeUser({ _id: 'session-normal' });
    clearSession('session-normal');

    const res = await invoke(user, 'Hello there');

    assert(res.statusCode === 200, 'response status is 200');
    assert(res.body && res.body.reply === 'Hi! How can I help you today?', 'reply matches Gemini natural-language text');
    assert(callLog.length === 1, 'only a single Gemini call was made (no tool cycle triggered)', `got: ${callLog.length}`);
    assert(
      dbCalls.Announcement === 0 && dbCalls.Election === 0 && dbCalls.LostFound === 0 && dbCalls.Complaint === 0,
      'Tool Executor was never invoked for a plain text response'
    );
  }

  section('Test 2: Function Call Detection');
  let toolCycleReply;
  {
    responseQueue = [
      { type: 'functionCall', name: 'searchAnnouncements', args: { query: 'exam' } },
      { type: 'success', text: 'Here is the latest announcement about exams.' },
    ];
    resetDbCalls();
    const user = makeUser({ _id: 'session-toolcall' });
    clearSession('session-toolcall');

    const res = await invoke(user, 'Any announcements about exams?');
    toolCycleReply = res.body?.reply;

    assert(res.statusCode === 200, 'response status is 200 for a tool-call turn');
    assert(callLog.length === 2, 'the function-calling pipeline triggered a second Gemini call', `got: ${callLog.length}`);
    assert(res.body && res.body.reply === 'Here is the latest announcement about exams.', 'final reply is the post-tool natural-language text');
  }

  section('Test 3: Correct Tool Execution');
  {
    assert(dbCalls.Announcement === 1, 'executeTool dispatched to the Announcement model exactly once', `got: ${dbCalls.Announcement}`);
    assert(
      dbCalls.Election === 0 && dbCalls.LostFound === 0 && dbCalls.Complaint === 0,
      'executeTool did not touch unrelated backend models'
    );
  }

  section('Test 4: Tool Result Returned to Gemini');
  {
    const secondCallContents = callLog[1].contents;
    assert(Array.isArray(secondCallContents) && secondCallContents.length === 3, 'second Gemini request has a 3-turn contents array');
    const functionResponsePart = secondCallContents[2]?.parts?.[0]?.functionResponse;
    assert(functionResponsePart?.name === 'searchAnnouncements', 'functionResponse.name matches the detected tool call');
    assert(functionResponsePart?.response?.success === true, 'functionResponse.response carries the tool result payload');
  }

  section('Test 5: Final Gemini Response');
  {
    assert(
      typeof toolCycleReply === 'string' && toolCycleReply === 'Here is the latest announcement about exams.',
      'final natural-language response generated from the tool result is returned'
    );
  }

  section('Test 6: Conversation Memory (Tool Cycle)');
  {
    const history = getHistory('session-toolcall');
    assert(history.length === 2, 'exactly one user/assistant turn was stored after the tool cycle', `got: ${history.length}`);
    assert(history[0].role === 'user' && history[0].content === 'Any announcements about exams?', 'stored turn has the correct user message');
    assert(
      history[1].role === 'assistant' && history[1].content === 'Here is the latest announcement about exams.',
      'stored turn has the correct final assistant reply'
    );
  }

  section('Test 7: Normal Response Memory');
  {
    const history = getHistory('session-normal');
    assert(history.length === 2, 'normal (non-tool) turns are saved just like Phase 2', `got: ${history.length}`);
    assert(history[0].role === 'user' && history[1].role === 'assistant', 'normal turn stores a user message followed by an assistant reply');
  }

  section('Test 8: Unknown Tool Handling');
  {
    responseQueue = [{ type: 'functionCall', name: 'deleteAllUsers', args: {} }];
    resetDbCalls();
    const user = makeUser({ _id: 'session-unknown-tool' });
    clearSession('session-unknown-tool');

    const res = await invoke(user, 'Do something dangerous');

    assert(callLog.length === 1, 'no second Gemini call was made for an unregistered tool', `got: ${callLog.length}`);
    assert(
      dbCalls.Announcement === 0 && dbCalls.Election === 0 && dbCalls.LostFound === 0 && dbCalls.Complaint === 0,
      'no backend logic was executed for an unregistered tool'
    );
    assert(res.statusCode === 502, 'controller responds with a controlled error status, not a crash', `got: ${res.statusCode}`);
    assert(getHistory('session-unknown-tool').length === 0, 'no turn was stored in memory for a rejected unknown tool call');
  }

  section('Test 9: Tool Execution Error Handling');
  {
    dbBehavior = 'dbError';
    responseQueue = [
      { type: 'functionCall', name: 'checkVotingEligibility', args: { electionId: 'elec-1' } },
      { type: 'success', text: 'Sorry, I could not check your voting eligibility right now.' },
    ];
    const user = makeUser({ _id: 'session-tool-error' });
    clearSession('session-tool-error');

    const res = await invoke(user, 'Can I vote?');

    assert(res.statusCode === 200, 'a backend operation error is handled gracefully, not a 500 crash', `got: ${res.statusCode}`);
    assert(typeof res.body?.reply === 'string' && res.body.reply.length > 0, 'a controlled natural-language reply is still returned');
    assert(!res.body.reply.includes('Simulated database failure'), 'raw error message is not leaked to the client');

    dbBehavior = 'default';
  }

  section('Test 10: Gemini Final Response Failure');
  {
    responseQueue = [{ type: 'functionCall', name: 'searchLostItems', args: { query: 'wallet' } }, { type: 'fail' }];
    resetDbCalls();
    const user = makeUser({ _id: 'session-second-call-fail' });
    clearSession('session-second-call-fail');

    const res = await invoke(user, 'Did anyone find my wallet?');

    assert(res.statusCode === 200, 'second-turn Gemini failure does not crash the request', `got: ${res.statusCode}`);
    assert(typeof res.body?.reply === 'string' && res.body.reply.length > 0, 'a controlled fallback reply is returned instead of fake data');
    assert(!/error|stack|exception/i.test(res.body.reply), 'fallback reply does not leak error/stack details');
  }

  section('Test 11: API Response Contract');
  {
    responseQueue = [{ type: 'success', text: 'Plain text reply.' }];
    const textUser = makeUser({ _id: 'session-contract-text' });
    clearSession('session-contract-text');
    const textRes = await invoke(textUser, 'Hi');
    assert(
      textRes.body && Object.keys(textRes.body).length === 1 && typeof textRes.body.reply === 'string',
      'plain-text response body is strictly { reply: "..." }'
    );

    responseQueue = [
      { type: 'functionCall', name: 'getNotifications', args: {} },
      { type: 'success', text: 'You have no new notifications.' },
    ];
    const toolUser = makeUser({ _id: 'session-contract-tool' });
    clearSession('session-contract-tool');
    const toolRes = await invoke(toolUser, 'Any notifications?');
    assert(
      toolRes.body && Object.keys(toolRes.body).length === 1 && typeof toolRes.body.reply === 'string',
      'tool-cycle response body is strictly { reply: "..." }'
    );
  }

  section('Test 12: No Phase 2 Modification');
  {
    assert(typeof contextBuilder.buildContext === 'function', 'contextBuilder still exports buildContext unchanged');
    assert(typeof promptBuilder.buildPrompt === 'function', 'promptBuilder still exports buildPrompt unchanged');
    assert(typeof roleVerifier.verifyRole === 'function', 'roleVerifier still exports verifyRole unchanged');
    assert(typeof intentRouter.routeIntent === 'function', 'intentRouter still exports routeIntent unchanged');
    assert(
      typeof conversationMemory.getHistory === 'function' && typeof conversationMemory.addMessage === 'function',
      'conversationMemory still exports getHistory/addMessage unchanged'
    );
    assert(
      typeof toolRegistry.getAvailableTools === 'function' && typeof toolRegistry.getGeminiFunctionDeclarations === 'function',
      'toolRegistry still exports getAvailableTools/getGeminiFunctionDeclarations unchanged'
    );
  }

  restoreConsole();
  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  Module._load = originalLoad;
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  restoreConsole();
  Module._load = originalLoad;
  console.error('Controller integration test script crashed:', err);
  process.exit(1);
});