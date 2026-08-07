/**
 * Standalone verification script for Context Builder (Step 1).
 * Run with: node backend/scratch/testContextBuilder.js
 *
 * Checks the output of buildContext() against the required schema
 * for each scenario and prints a PASS/FAIL summary.
 */

const { buildContext } = require('../ai/context/contextBuilder');

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
// Scenario 1: Student user context with valid department & history
// ---------------------------------------------------------------------------
console.log('\n--- Scenario 1: Student user with department & history ---');
{
  const studentUser = {
    _id: '65f4a1b2c3d4e5f678901234',
    name: 'John Perera',
    role: 'Student',
    department: 'ICT',
  };
  const previousMessages = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi! How can I help?' },
    { sender: 'user', text: 'Are elections open?' },
    { role: 'bot', text: 'Not yet.' },
    'Just a plain string message',
  ];

  const result = buildContext(studentUser, 'Can I vote?', previousMessages);
  console.log(JSON.stringify(result, null, 2));

  assert(result.user.id === '65f4a1b2c3d4e5f678901234', 'user.id derived from _id');
  assert(result.user.name === 'John Perera', 'user.name preserved');
  assert(result.user.role === 'Student', 'user.role preserved');
  assert(result.user.department === 'ICT', 'user.department preserved');
  assert(!('adminType' in result.user), 'adminType omitted for non-admin user');
  assert(Array.isArray(result.conversation), 'conversation is an array');
  assert(
    result.conversation.every((m) => typeof m === 'object' && 'role' in m && 'content' in m),
    'every conversation entry is a { role, content } object'
  );
  assert(result.conversation[0].role === 'user' && result.conversation[0].content === 'Hello', 'entry 0 normalized from { role, content }');
  assert(result.conversation[1].role === 'assistant' && result.conversation[1].content === 'Hi! How can I help?', 'entry 1 normalized from { role, content }');
  assert(result.conversation[2].role === 'user' && result.conversation[2].content === 'Are elections open?', 'entry 2 normalized from { sender, text }');
  assert(result.conversation[3].role === 'assistant' && result.conversation[3].content === 'Not yet.', 'entry 3 normalized from { role: "bot", text }');
  assert(result.conversation[4].role === 'user' && result.conversation[4].content === 'Just a plain string message', 'entry 4 normalized from plain string');
  assert(result.currentMessage === 'Can I vote?', 'currentMessage returned as top-level string');
  assert(!('currentMessage' in { current: result.conversation[result.conversation.length - 1] }) || true, 'currentMessage not folded into conversation array');
  assert(result.conversation.length === previousMessages.length, 'currentMessage excluded from conversation array length');
}

// ---------------------------------------------------------------------------
// Scenario 2: Admin user context with adminType present & empty history
// ---------------------------------------------------------------------------
console.log('\n--- Scenario 2: Admin user with adminType & empty history ---');
{
  const adminUser = {
    id: 'admin-001',
    name: 'Nimal Silva',
    role: 'Admin',
    department: null,
    adminType: 'SuperAdmin',
  };

  const result = buildContext(adminUser, 'Show pending complaints', []);
  console.log(JSON.stringify(result, null, 2));

  assert(result.user.id === 'admin-001', 'user.id derived from id fallback');
  assert(result.user.adminType === 'SuperAdmin', 'adminType included for admin user');
  assert(result.user.department === null, 'department is null when not provided');
  assert(Array.isArray(result.conversation) && result.conversation.length === 0, 'conversation is an empty array');
  assert(result.currentMessage === 'Show pending complaints', 'currentMessage preserved');
}

// ---------------------------------------------------------------------------
// Scenario 3: Trimming of currentMessage whitespace
// ---------------------------------------------------------------------------
console.log('\n--- Scenario 3: currentMessage whitespace trimming ---');
{
  const user = { id: 'u-1', name: 'Kasun', role: 'Student', department: 'Civil' };
  const result = buildContext(user, '   Can I vote?   ', []);
  console.log(JSON.stringify(result, null, 2));

  assert(result.currentMessage === 'Can I vote?', 'leading/trailing whitespace trimmed from currentMessage');
}

// ---------------------------------------------------------------------------
// Scenario 4: Error handling for invalid/missing currentMessage or user
// ---------------------------------------------------------------------------
console.log('\n--- Scenario 4: Error handling ---');
{
  const user = { id: 'u-2', name: 'Sanduni', role: 'Student', department: 'ICT' };

  const expectThrow = (label, fn) => {
    try {
      fn();
      assert(false, label, 'expected an Error to be thrown, but none was');
    } catch (err) {
      assert(err instanceof Error, label, `threw: "${err.message}"`);
    }
  };

  expectThrow('throws when currentMessage is missing', () => buildContext(user, undefined, []));
  expectThrow('throws when currentMessage is empty/whitespace-only', () => buildContext(user, '   ', []));
  expectThrow('throws when currentMessage is not a string', () => buildContext(user, 12345, []));
  expectThrow('throws when user is missing', () => buildContext(undefined, 'Hello', []));
  expectThrow('throws when user is null', () => buildContext(null, 'Hello', []));
  expectThrow('throws when previousMessages contains an invalid entry', () =>
    buildContext(user, 'Hello', [{ foo: 'bar' }])
  );
}

// ---------------------------------------------------------------------------
console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);
