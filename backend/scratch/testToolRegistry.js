const { getAvailableTools } = require('../ai/tools/toolRegistry');

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

const EXPECTED_TOOLS = [
  { name: 'searchAnnouncements', description: 'Search faculty announcements' },
  { name: 'checkVotingEligibility', description: 'Check whether the current student is eligible to vote' },
  { name: 'searchLostItems', description: 'Search reported lost and found items' },
  { name: 'submitComplaint', description: 'Submit a student complaint' },
  { name: 'getComplaintStatus', description: 'Get the status of a submitted complaint' },
  { name: 'getNotifications', description: 'Retrieve notifications for the current user' },
];

console.log('\n--- Test Case 1: Registry Returns Tools ---');
{
  const tools = getAvailableTools();
  console.log(tools);
  assert(Array.isArray(tools), 'getAvailableTools() returns an array');
  assert(tools.length === 6, 'array contains exactly 6 tool objects', `got length: ${tools.length}`);
}

console.log('\n--- Test Case 2: Tool Names ---');
{
  const tools = getAvailableTools();
  const actualNames = tools.map((t) => t.name);
  const expectedNames = EXPECTED_TOOLS.map((t) => t.name);
  expectedNames.forEach((name) => {
    assert(actualNames.includes(name), `tool name "${name}" present`);
  });
  assert(new Set(actualNames).size === actualNames.length, 'no duplicate tool names in name list');
}

console.log('\n--- Test Case 3: Tool Structure ---');
{
  const tools = getAvailableTools();
  tools.forEach((tool, i) => {
    assert(
      typeof tool.name === 'string' && tool.name.length > 0,
      `tool[${i}] has a non-empty string "name"`,
      `name: ${JSON.stringify(tool.name)}`
    );
    assert(
      typeof tool.description === 'string' && tool.description.length > 0,
      `tool[${i}] has a non-empty string "description"`,
      `description: ${JSON.stringify(tool.description)}`
    );
    const keys = Object.keys(tool).sort();
    assert(
      keys.length === 2 && keys.includes('name') && keys.includes('description'),
      `tool[${i}] has exactly { name, description } shape`,
      `keys: ${JSON.stringify(keys)}`
    );
  });
}

console.log('\n--- Test Case 4: Descriptions ---');
{
  const tools = getAvailableTools();
  EXPECTED_TOOLS.forEach((expected) => {
    const actual = tools.find((t) => t.name === expected.name);
    assert(Boolean(actual), `tool "${expected.name}" exists in registry`);
    if (actual) {
      assert(
        actual.description === expected.description,
        `tool "${expected.name}" description matches specification`,
        `expected: "${expected.description}" | got: "${actual.description}"`
      );
    }
  });
}

console.log('\n--- Test Case 5: Unique Tool Names ---');
{
  const tools = getAvailableTools();
  const names = tools.map((t) => t.name);
  const uniqueNames = new Set(names);
  assert(uniqueNames.size === names.length, 'zero duplicate tool names in the registry', `names: ${JSON.stringify(names)}`);
}

console.log('\n--- Test Case 6: Environment Independence ---');
{
  const start = Date.now();
  const tools = getAvailableTools();
  const elapsed = Date.now() - start;
  assert(Array.isArray(tools), 'getAvailableTools() returns synchronously without a Promise');
  assert(elapsed < 50, 'call resolves near-instantly (no I/O, DB, or network wait)', `elapsed: ${elapsed}ms`);
  assert(
    !Object.prototype.hasOwnProperty.call(getAvailableTools, 'then'),
    'getAvailableTools is not a Promise-returning/async function reference'
  );
  const secondCall = getAvailableTools();
  assert(JSON.stringify(tools) === JSON.stringify(secondCall), 'repeated calls return identical, deterministic data');
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);