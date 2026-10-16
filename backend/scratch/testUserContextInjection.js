const { buildPrompt } = require('../ai/prompt/promptBuilder');
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

console.log('\n--- Test Case 1: Student Context Injection ---');
{
  const context = {
    user: { name: 'John Perera', role: 'Student', department: 'ICT' },
    conversation: [],
    currentMessage: 'Can I vote?',
  };
  const prompt = buildPrompt(context, []);
  console.log(prompt);

  assert(prompt.includes('Name: John Perera'), 'Name injected correctly');
  assert(prompt.includes('Role: Student'), 'Role injected correctly');
  assert(prompt.includes('Department: ICT'), 'Department injected correctly');
}

console.log('\n--- Test Case 2: Admin Context Injection ---');
{
  const context = {
    user: { name: 'Nimal Silva', role: 'Admin', department: 'Administration' },
    conversation: [],
    currentMessage: 'Show pending complaints',
  };
  const prompt = buildPrompt(context, []);
  console.log(prompt);

  assert(prompt.includes('Name: Nimal Silva'), 'Name injected correctly');
  assert(prompt.includes('Role: Admin'), 'Role injected correctly');
  assert(prompt.includes('Department: Administration'), 'Department injected correctly');
}

console.log('\n--- Test Case 3: Current Message Separation ---');
{
  const context = {
    user: { name: 'John Perera', role: 'Student', department: 'ICT' },
    conversation: [],
    currentMessage: 'Can I vote?',
  };
  const prompt = buildPrompt(context, []);

  const currentUserIndex = prompt.indexOf('Current User\n');
  const currentUserMessageIndex = prompt.indexOf('Current User Message\n');
  assert(currentUserIndex !== -1, '"Current User" section header present');
  assert(currentUserMessageIndex !== -1, '"Current User Message" section header present');
  assert(
    currentUserIndex < currentUserMessageIndex,
    '"Current User" section appears before "Current User Message" section'
  );
  assert(
    prompt.trim().endsWith('Can I vote?'),
    'the current message text appears under its own dedicated section, at the end'
  );
}

console.log('\n--- Test Case 4: Strict Boundary (No Extra User Data) ---');
{
  const dirtyUser = {
    name: 'Sanduni Fernando',
    role: 'Student',
    department: 'ICT',
    userId: 'u-999',
    email: 'sanduni@example.com',
    phone: '0771234567',
    password: 'super-secret-hash',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token',
    permissions: ['read', 'write', 'delete'],
    accountStatus: 'active',
  };
  const context = {
    user: dirtyUser,
    conversation: [],
    currentMessage: 'What is my complaint status?',
  };
  const prompt = buildPrompt(context, []);
  console.log(prompt);

  assert(prompt.includes('Name: Sanduni Fernando'), 'allowed field "name" is present');
  assert(prompt.includes('Role: Student'), 'allowed field "role" is present');
  assert(prompt.includes('Department: ICT'), 'allowed field "department" is present');

  assert(!prompt.includes('u-999'), 'userId value is NOT present in prompt');
  assert(!prompt.includes('sanduni@example.com'), 'email value is NOT present in prompt');
  assert(!prompt.includes('0771234567'), 'phone value is NOT present in prompt');
  assert(!prompt.includes('super-secret-hash'), 'password value is NOT present in prompt');
  assert(!prompt.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'jwt value is NOT present in prompt');
  assert(!prompt.includes('permissions'), 'literal word "permissions" is NOT present in prompt');
  assert(!prompt.includes('accountStatus'), 'literal word "accountStatus" is NOT present in prompt');
  assert(!prompt.includes('active'), 'accountStatus value "active" is NOT present in prompt');
}

console.log('\n--- Test Case 5: Context Builder Consistency ---');
{
  const rawUser = {
    _id: 'db-id-001',
    name: 'Kasun Bandara',
    role: 'Student',
    department: 'Civil',
    email: 'kasun@example.com',
    password: 'hashed-pw',
  };

  const context = buildContext(rawUser, 'When do elections close?', []);
  const prompt = buildPrompt(context, []);
  console.log(prompt);

  assert(prompt.includes('Name: Kasun Bandara'), 'name flows unchanged from Context Builder into the prompt');
  assert(prompt.includes('Role: Student'), 'role flows unchanged from Context Builder into the prompt');
  assert(prompt.includes('Department: Civil'), 'department flows unchanged from Context Builder into the prompt');
  assert(!prompt.includes('kasun@example.com'), 'email does not leak through the Context Builder -> Prompt Builder pipeline');
  assert(!prompt.includes('hashed-pw'), 'password does not leak through the Context Builder -> Prompt Builder pipeline');
}

console.log('\n--- Test Case 6: Environment & Service Independence ---');
{
  const context = {
    user: { name: 'Tharindu', role: 'Admin', department: 'ICT', adminType: 'SuperAdmin' },
    conversation: [],
    currentMessage: 'List all complaints',
  };

  const start = Date.now();
  const prompt = buildPrompt(context, []);
  const elapsed = Date.now() - start;

  assert(typeof prompt === 'string', 'buildPrompt runs synchronously and returns a string');
  assert(elapsed < 50, 'no network/DB/API wait time', `elapsed: ${elapsed}ms`);

  const prompt2 = buildPrompt(context, []);
  assert(prompt === prompt2, 'repeated calls with identical input are deterministic');
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);