const { buildPrompt } = require('../ai/prompt/promptBuilder');

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

const assertSectionSequence = (prompt, label) => {
  const order = ['Current User', 'Conversation History', 'Available Tools', 'Current User Message'];
  const indices = order.map((header) => prompt.indexOf(header));
  const allFound = indices.every((i) => i !== -1);
  const inOrder = indices.every((i, idx) => idx === 0 || i > indices[idx - 1]);
  assert(allFound && inOrder, label, `indices: ${JSON.stringify(indices)}`);
};

console.log('\n--- Scenario 1: Student user with history & tools ---');
{
  const context = {
    user: { id: '1', name: 'John Perera', role: 'Student', department: 'ICT' },
    conversation: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help?' },
    ],
    currentMessage: 'Can I vote?',
  };
  const tools = [
    { name: 'searchAnnouncements', description: 'Search faculty announcements' },
    { name: 'submitComplaint', description: 'Submit a student complaint' },
  ];

  const prompt = buildPrompt(context, tools);
  console.log(prompt);

  assertSectionSequence(prompt, 'sections appear in locked order');
  assert(prompt.includes('Name: John Perera'), 'Current User: name formatted');
  assert(prompt.includes('Role: Student'), 'Current User: role formatted');
  assert(prompt.includes('Department: ICT'), 'Current User: department formatted');
  assert(!prompt.includes('Admin Type'), 'Current User: admin type omitted for non-admin');
  assert(prompt.includes('User: Hello'), 'Conversation History: user entry mapped');
  assert(prompt.includes('Assistant: Hi! How can I help?'), 'Conversation History: assistant entry mapped');
  assert(prompt.includes('- searchAnnouncements: Search faculty announcements'), 'Available Tools: tool 1 formatted');
  assert(prompt.includes('- submitComplaint: Submit a student complaint'), 'Available Tools: tool 2 formatted');
  assert(prompt.trim().endsWith('Can I vote?'), 'Current User Message: current message appended last');
  assert(!prompt.includes('[object Object]'), 'no [object Object] artifacts');

  const prompt2 = buildPrompt(context, tools);
  assert(prompt === prompt2, 'deterministic: identical input produces identical output');
}

console.log('\n--- Scenario 2: Admin user with adminType & empty history ---');
{
  const context = {
    user: { id: 'admin-001', name: 'Nimal Silva', role: 'Admin', department: 'ICT', adminType: 'SuperAdmin' },
    conversation: [],
    currentMessage: 'Show pending complaints',
  };
  const tools = [
    { name: 'getComplaintStatus', description: "Get the current status of a student's submitted complaint." },
  ];

  const prompt = buildPrompt(context, tools);
  console.log(prompt);

  assertSectionSequence(prompt, 'sections appear in locked order');
  assert(prompt.includes('(Admin Type: SuperAdmin)'), 'Current User: admin type included and formatted');
  assert(prompt.includes('(No previous conversation)'), 'Conversation History: empty-history placeholder shown');
  assert(!prompt.includes('[object Object]'), 'no [object Object] artifacts');
}

console.log('\n--- Scenario 3: Empty conversation history, default tools arg ---');
{
  const context = {
    user: { id: 'u-2', name: 'Kasun', role: 'Student', department: 'Civil' },
    conversation: [],
    currentMessage: 'What time do elections close?',
  };

  const prompt = buildPrompt(context);
  console.log(prompt);

  assertSectionSequence(prompt, 'sections appear in locked order');
  assert(prompt.includes('(No previous conversation)'), 'Conversation History: empty-history placeholder shown');
  assert(prompt.includes('- None'), 'Available Tools: "- None" shown when tools omitted');
}

console.log('\n--- Scenario 4: Empty tool list ---');
{
  const context = {
    user: { id: 'u-3', name: 'Sanduni', role: 'Student', department: 'ICT' },
    conversation: [
      { role: 'user', content: 'Are elections open?' },
      { role: 'assistant', content: 'Not yet.' },
    ],
    currentMessage: 'When do they open?',
  };

  const prompt = buildPrompt(context, []);
  console.log(prompt);

  assertSectionSequence(prompt, 'sections appear in locked order');
  assert(prompt.includes('- None'), 'Available Tools: "- None" shown for explicit empty array');
  assert(prompt.includes('User: Are elections open?'), 'Conversation History: user entry mapped');
  assert(prompt.includes('Assistant: Not yet.'), 'Conversation History: assistant entry mapped');
}

console.log('\n--- Scenario 5: Error handling ---');
{
  const validUser = { id: 'u-4', name: 'Tharindu', role: 'Student', department: 'ICT' };

  const expectThrow = (label, fn) => {
    try {
      fn();
      assert(false, label, 'expected an Error to be thrown, but none was');
    } catch (err) {
      assert(err instanceof Error, label, `threw: "${err.message}"`);
    }
  };

  expectThrow('throws when context is missing', () => buildPrompt(undefined, []));
  expectThrow('throws when context.user is missing', () => buildPrompt({ currentMessage: 'Hi' }, []));
  expectThrow('throws when context.currentMessage is missing', () => buildPrompt({ user: validUser }, []));
  expectThrow('throws when context.currentMessage is empty/whitespace-only', () =>
    buildPrompt({ user: validUser, currentMessage: '   ', conversation: [] }, [])
  );
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);