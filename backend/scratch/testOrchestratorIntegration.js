const Module = require('module');
const path = require('path');

const capturedPrompts = [];
const capturedLogs = [];
let mockBehavior = 'success';
let mockReplyText = 'Mock reply from FOT Buddy.';

class FakeGoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async ({ contents }) => {
        capturedPrompts.push(contents);
        if (mockBehavior === 'fail') {
          throw new Error('Simulated Gemini failure');
        }
        return { text: mockReplyText };
      },
    };
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@google/genai') {
    return { GoogleGenAI: FakeGoogleGenAI };
  }
  if (request.includes('models/Announcement')) {
    return { find: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }) };
  }
  if (request.includes('models/Election')) {
    return {
      find: () => Promise.resolve([]),
      findById: async () => null,
    };
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

process.env.GEMINI_API_KEY = 'test-key-for-integration-tests';

const controllerPath = path.join(__dirname, '..', 'controllers', 'aiChatController.js');
const { sendMessage } = require(controllerPath);
const { getHistory, clearSession } = require('../ai/memory/conversationMemory');

const originalConsoleLog = console.log;
console.log = (...args) => {
  capturedLogs.push(args.join(' '));
};
const restoreConsole = () => {
  console.log = originalConsoleLog;
};

let passCount = 0;
let failCount = 0;

const log = (label, ok, details) => {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passCount += 1;
  else failCount += 1;
  restoreConsole();
  console.log(`[${status}] ${label}${details ? `\n       ${details}` : ''}`);
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
};

const assert = (condition, label, details) => {
  log(label, Boolean(condition), details);
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
  capturedLogs.length = 0;
  await sendMessage(req, res);
  return res;
};

const main = async () => {
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };

  restoreConsole();
  console.log('\n--- Test Case 1: Authenticated Student Chat Flow ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    mockBehavior = 'success';
    mockReplyText = 'Hi! How can I help you today?';
    const user = makeUser({ _id: 'session-1' });
    clearSession('session-1');
    const res = await invoke(user, 'Hello');
    assert(res.statusCode === 200, 'response status is 200');
    assert(res.body && res.body.reply === mockReplyText, 'response body contains { reply } matching Gemini output');
  }

  restoreConsole();
  console.log('\n--- Test Case 2: Student Context Reaches Prompt ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(lastPrompt.includes('Name: John Perera'), 'prompt includes student name');
    assert(lastPrompt.includes('Role: Student'), 'prompt includes student role');
    assert(lastPrompt.includes('Department: ICT'), 'prompt includes student department');
  }

  restoreConsole();
  console.log('\n--- Test Case 3: Intent Routing for All 6 Intents ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const intentMessages = [
      ['What are the latest announcements?', 'ANNOUNCEMENTS'],
      ['Can I vote?', 'VOTING_ELIGIBILITY'],
      ['I lost my wallet, can you help find a lost item?', 'LOST_AND_FOUND'],
      ['I want to submit a complaint.', 'SUBMIT_COMPLAINT'],
      ['Can I check my complaint status?', 'COMPLAINT_STATUS'],
      ['Show my notifications.', 'NOTIFICATIONS'],
    ];
    const user = makeUser({ _id: 'session-intents' });
    clearSession('session-intents');

    for (const [msg, expectedIntent] of intentMessages) {
      await invoke(user, msg);
      const matched = capturedLogs.some((line) => line.includes(`intent detected: ${expectedIntent}`));
      assert(matched, `intent "${expectedIntent}" detected for message: "${msg}"`);
      capturedLogs.length = 0;
    }
    clearSession('session-intents');
  }

  restoreConsole();
  console.log('\n--- Test Case 4: Tool Registry Presence in Prompt ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(lastPrompt.includes('searchAnnouncements'), 'prompt includes a registered tool name (searchAnnouncements)');
    assert(lastPrompt.includes('submitComplaint'), 'prompt includes a registered tool name (submitComplaint)');
  }

  restoreConsole();
  console.log('\n--- Test Case 5: First Turn (Empty History) ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const user = makeUser({ _id: 'session-first-turn' });
    clearSession('session-first-turn');
    await invoke(user, 'Hello there');
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(lastPrompt.includes('(No previous conversation)'), 'first turn prompt shows "(No previous conversation)"');
  }

  restoreConsole();
  console.log('\n--- Test Case 6: Second Turn (History Persistence) ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const user = makeUser({ _id: 'session-first-turn' });
    mockReplyText = 'Sure, let me check.';
    await invoke(user, 'Can I vote?');
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(lastPrompt.includes('User: Hello there'), 'second turn prompt includes first turn user message in history');
    assert(
      lastPrompt.includes('Assistant: Hi! How can I help you today?') ||
        lastPrompt.includes('Assistant: Sure, let me check.'),
      'second turn prompt includes an assistant reply in history'
    );
  }

  restoreConsole();
  console.log('\n--- Test Case 7: No Duplicate Current Message ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    const occurrences = lastPrompt.split('Can I vote?').length - 1;
    assert(
      occurrences === 1,
      'current message "Can I vote?" appears exactly once (Current User Message section only)',
      `occurrences found: ${occurrences}`
    );
  }

  restoreConsole();
  console.log('\n--- Test Case 8: Student vs Admin Role Recognition ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const student = makeUser({ _id: 'session-student-role', role: 'Student' });
    clearSession('session-student-role');
    await invoke(student, 'Hi');
    const studentPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(studentPrompt.includes('Role: Student'), 'student user prompt shows "Role: Student"');
    assert(!studentPrompt.includes('Admin Type'), 'student user prompt has no Admin Type line');

    const admin = makeUser({ _id: 'session-admin-role', role: 'Admin', adminType: 'SuperAdmin' });
    clearSession('session-admin-role');
    await invoke(admin, 'Hi');
    const adminPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(adminPrompt.includes('Role: Admin'), 'admin user prompt shows "Role: Admin"');
    assert(adminPrompt.includes('(Admin Type: SuperAdmin)'), 'admin user prompt shows adminType');
  }

  restoreConsole();
  console.log('\n--- Test Case 9: Session Isolation Between Two Distinct Users ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const userA = makeUser({ _id: 'session-user-A', name: 'User A' });
    const userB = makeUser({ _id: 'session-user-B', name: 'User B' });
    clearSession('session-user-A');
    clearSession('session-user-B');

    await invoke(userA, 'Message from A');
    await invoke(userB, 'Message from B');
    await invoke(userA, 'Second message from A');

    const historyA = getHistory('session-user-A');
    const historyB = getHistory('session-user-B');

    assert(historyA.length === 4, 'session A has exactly its own 4 entries (2 turns)', `got: ${historyA.length}`);
    assert(historyB.length === 2, 'session B has exactly its own 2 entries (1 turn)', `got: ${historyB.length}`);
    assert(
      !historyA.some((m) => m.content.includes('from B')),
      'session A history contains no session B content'
    );
    assert(
      !historyB.some((m) => m.content.includes('from A')),
      'session B history contains no session A content'
    );
  }

  restoreConsole();
  console.log('\n--- Test Case 10: Unknown Intent Routing ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const user = makeUser({ _id: 'session-unknown-intent' });
    clearSession('session-unknown-intent');
    await invoke(user, 'Help me write a Java program.');
    const matched = capturedLogs.some((line) => line.includes('intent detected: UNKNOWN'));
    assert(matched, 'unrelated message routes to UNKNOWN intent');
  }

  restoreConsole();
  console.log('\n--- Test Case 11: Sensitive Data Exclusion ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const dirtyUser = makeUser({
      _id: 'session-sensitive',
      email: 'john@example.com',
      password: 'super-secret-hash',
      jwt: 'eyJhbGciOiJIUzI1NiJ9.fake.token',
      phone: '0771234567',
    });
    clearSession('session-sensitive');
    await invoke(dirtyUser, 'What is my complaint status?');
    const lastPrompt = capturedPrompts[capturedPrompts.length - 1];
    assert(!lastPrompt.includes('john@example.com'), 'prompt excludes email');
    assert(!lastPrompt.includes('super-secret-hash'), 'prompt excludes password');
    assert(!lastPrompt.includes('eyJhbGciOiJIUzI1NiJ9'), 'prompt excludes jwt');
    assert(!lastPrompt.includes('0771234567'), 'prompt excludes phone');
  }

  restoreConsole();
  console.log('\n--- Test Case 12: Error Handling on Gemini Failure ---');
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
  };
  {
    const user = makeUser({ _id: 'session-error' });
    clearSession('session-error');
    mockBehavior = 'fail';

    const res = await invoke(user, 'This will fail');
    assert(res.statusCode === 500, 'response status is 500 on Gemini failure', `got: ${res.statusCode}`);
    assert(
      res.body && typeof res.body.message === 'string',
      'response body contains an error message, not a fake reply'
    );

    const history = getHistory('session-error');
    assert(history.length === 0, 'no user/assistant turn was stored in memory after a failed Gemini call', `got: ${history.length}`);

    mockBehavior = 'success';
  }

  restoreConsole();
  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  restoreConsole();
  console.error('Integration test script crashed:', err);
  process.exit(1);
});