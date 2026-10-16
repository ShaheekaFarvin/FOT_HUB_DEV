const { getAvailableTools, getGeminiFunctionDeclarations } = require('../ai/tools/toolRegistry');
const fs = require('fs');
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

const EXPECTED_NAMES = [
  'searchAnnouncements',
  'checkVotingEligibility',
  'searchLostItems',
  'submitComplaint',
  'getComplaintStatus',
  'getNotifications',
];

console.log('\n--- Test 1: All 6 Registered Tools Exist ---');
{
  const declarations = getGeminiFunctionDeclarations();
  console.log(declarations.map((d) => d.name));
  assert(Array.isArray(declarations), 'getGeminiFunctionDeclarations() returns an array');
  assert(declarations.length === 6, 'array contains exactly 6 function declarations', `got: ${declarations.length}`);
}

console.log('\n--- Test 2: Tool Names Match Phase 2 Exactly ---');
{
  const declarations = getGeminiFunctionDeclarations();
  const actualNames = declarations.map((d) => d.name);
  EXPECTED_NAMES.forEach((name) => {
    assert(actualNames.includes(name), `function declaration "${name}" present`);
  });
  assert(new Set(actualNames).size === actualNames.length, 'no duplicate function names');
}

console.log('\n--- Test 3: Tool Descriptions Match Phase 2 Exactly ---');
{
  const declarations = getGeminiFunctionDeclarations();
  const availableTools = getAvailableTools();
  availableTools.forEach((tool) => {
    const decl = declarations.find((d) => d.name === tool.name);
    assert(Boolean(decl), `declaration exists for "${tool.name}"`);
    if (decl) {
      assert(
        decl.description === tool.description,
        `description for "${tool.name}" matches Phase 2 Tool Registry exactly`,
        `expected: "${tool.description}" | got: "${decl.description}"`
      );
    }
  });
}

console.log('\n--- Test 4: Valid type: "object" Parameter Schemas ---');
{
  const declarations = getGeminiFunctionDeclarations();
  declarations.forEach((decl) => {
    assert(
      decl.parameters && decl.parameters.type === 'object',
      `"${decl.name}" parameters.type is "object"`,
      `got: ${JSON.stringify(decl.parameters?.type)}`
    );
    assert(
      decl.parameters && typeof decl.parameters.properties === 'object',
      `"${decl.name}" parameters.properties is a valid object`
    );
  });
}

console.log('\n--- Test 5: checkVotingEligibility Is a Valid Declaration ---');
{
  const declarations = getGeminiFunctionDeclarations();
  const decl = declarations.find((d) => d.name === 'checkVotingEligibility');
  assert(Boolean(decl), 'checkVotingEligibility declaration exists');
  assert(decl && decl.parameters?.type === 'object', 'checkVotingEligibility has type: "object" parameters');
  assert(
    decl && typeof decl.parameters?.properties?.electionId === 'object' && decl.parameters.properties.electionId.type === 'string',
    'checkVotingEligibility defines optional "electionId" as a string property'
  );
}

console.log('\n--- Test 6: submitComplaint Required Properties ---');
{
  const declarations = getGeminiFunctionDeclarations();
  const decl = declarations.find((d) => d.name === 'submitComplaint');
  assert(Boolean(decl), 'submitComplaint declaration exists');
  assert(
    Array.isArray(decl?.parameters?.required),
    'submitComplaint parameters.required is an array'
  );
  assert(
    decl && JSON.stringify(decl.parameters.required) === JSON.stringify(['title', 'description']),
    'submitComplaint required is exactly ["title", "description"]',
    `got: ${JSON.stringify(decl?.parameters?.required)}`
  );
}

console.log('\n--- Test 7: Gemini Configuration Wiring ---');
{
  // As of Phase 4 / Topic 6.3, direct Gemini request wiring (including
  // function declarations) lives in ragOrchestrator.js — aiChatController.js
  // now only handles HTTP concerns and delegates to the orchestrator. See
  // "Implementations/Phase -04/6.RAG Controller Integration.md", Topic 6.3.
  const orchestratorPath = path.join(__dirname, '..', 'ai', 'knowledge', 'ragOrchestrator.js');
  const source = fs.readFileSync(orchestratorPath, 'utf8');
  assert(
    source.includes('getGeminiFunctionDeclarations'),
    'ragOrchestrator.js imports/uses getGeminiFunctionDeclarations'
  );
  assert(
    source.includes('config.tools') || source.includes('tools: [{ functionDeclarations }]') || source.includes('tools:'),
    'ragOrchestrator.js passes tools into the Gemini request config'
  );
  assert(
    /config:\s*{\s*tools:\s*\[\s*{\s*functionDeclarations\s*}\s*\]/.test(source.replace(/\s+/g, ' ')),
    'orchestrator wires config.tools[0].functionDeclarations exactly as specified'
  );

  const controllerPath = path.join(__dirname, '..', 'controllers', 'aiChatController.js');
  const controllerSource = fs.readFileSync(controllerPath, 'utf8');
  assert(
    controllerSource.includes('ragOrchestrator') && controllerSource.includes('processUserRequest'),
    'aiChatController.js delegates message processing to ragOrchestrator.processUserRequest'
  );
}

console.log('\n--- Test 8: Zero Tool Execution ---');
{
  const controllerPath = path.join(__dirname, '..', 'controllers', 'aiChatController.js');
  const registryPath = path.join(__dirname, '..', 'ai', 'tools', 'toolRegistry.js');
  const controllerSource = fs.readFileSync(controllerPath, 'utf8');
  const registrySource = fs.readFileSync(registryPath, 'utf8');

  const forbiddenPatterns = [
    'searchAnnouncements(',
    'checkVotingEligibility(',
    'searchLostItems(',
    'submitComplaint(',
    'getComplaintStatus(',
    'getNotifications(',
    '.functionCall',
    'executeFunction',
  ];
  forbiddenPatterns.forEach((pattern) => {
    assert(
      !controllerSource.includes(pattern),
      `controller does not invoke/execute "${pattern}"`
    );
  });

  assert(
    !registrySource.match(/mongoose|mongodb|\.save\(\)|\.find\(\)|\.create\(/),
    'toolRegistry.js contains no MongoDB/database mutation logic'
  );
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);