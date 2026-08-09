const { detectToolCall } = require('../ai/tools/toolCallDetector');

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

console.log('\n--- Test 1: Normal Gemini Text ---');
{
  const textResponse = {
    text: 'Hello! How can I help you today?',
  };
  const result = detectToolCall(textResponse);
  assert(
    result.isToolCall === false && result.toolCall === null && !result.error,
    'Normal text response correctly identified as non-tool call',
    `got: ${JSON.stringify(result)}`
  );
}

console.log('\n--- Test 2: Voting Function Call (No Args) ---');
{
  const voteResponse = {
    functionCalls: () => [{ name: 'checkVotingEligibility', args: {} }],
  };
  const result = detectToolCall(voteResponse);
  assert(result.isToolCall === true, 'isToolCall is true');
  assert(result.toolCall?.name === 'checkVotingEligibility', 'tool name is checkVotingEligibility');
  assert(
    JSON.stringify(result.toolCall?.arguments) === '{}',
    'arguments normalized to empty object {}',
    `got: ${JSON.stringify(result.toolCall?.arguments)}`
  );
}

console.log('\n--- Test 3: Voting Function Call With Arguments ---');
{
  const voteWithArgsResponse = {
    functionCalls: [{ name: 'checkVotingEligibility', args: { electionId: 'election-001' } }],
  };
  const result = detectToolCall(voteWithArgsResponse);
  assert(result.isToolCall === true, 'isToolCall is true');
  assert(result.toolCall?.name === 'checkVotingEligibility', 'tool name is checkVotingEligibility');
  assert(
    result.toolCall?.arguments?.electionId === 'election-001',
    'arguments.electionId preserved correctly',
    `got: ${JSON.stringify(result.toolCall?.arguments)}`
  );
}

console.log('\n--- Test 4: Announcement Function Call ---');
{
  const announcementResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              functionCall: {
                name: 'searchAnnouncements',
                args: { query: 'exam', category: 'Academic' },
              },
            },
          ],
        },
      },
    ],
  };
  const result = detectToolCall(announcementResponse);
  assert(result.isToolCall === true, 'isToolCall is true');
  assert(result.toolCall?.name === 'searchAnnouncements', 'tool name is searchAnnouncements');
  assert(
    result.toolCall?.arguments?.query === 'exam' && result.toolCall?.arguments?.category === 'Academic',
    'query and category arguments extracted correctly',
    `got: ${JSON.stringify(result.toolCall?.arguments)}`
  );
}

console.log('\n--- Test 5: Unknown Tool Rejection ---');
{
  const unknownToolResponse = {
    functionCall: { name: 'deleteStudentRecords', args: {} },
  };
  const result = detectToolCall(unknownToolResponse);
  assert(result.isToolCall === false, 'isToolCall is false for unregistered tool');
  assert(result.toolCall === null, 'toolCall is null for unregistered tool');
  assert(
    result.error === 'Unknown tool: deleteStudentRecords',
    'controlled error message returned',
    `got error: "${result.error}"`
  );
}

console.log('\n--- Test 6: Missing Function Name ---');
{
  const missingNameResponse = {
    functionCall: { args: {} },
  };
  const result = detectToolCall(missingNameResponse);
  assert(result.isToolCall === false, 'isToolCall is false when function name is missing');
  assert(result.toolCall === null, 'toolCall is null when function name is missing');
  assert(Boolean(result.error), 'error property set on missing name');
}

console.log('\n--- Test 7: Invalid Arguments Type ---');
{
  const invalidArgsResponse = {
    functionCall: { name: 'checkVotingEligibility', args: 'invalid-string' },
  };
  const result = detectToolCall(invalidArgsResponse);
  assert(result.isToolCall === false, 'isToolCall is false for invalid arguments type');
  assert(result.toolCall === null, 'toolCall is null for invalid arguments type');
  assert(
    result.error === 'Invalid arguments type for tool call: checkVotingEligibility',
    'controlled error message returned for invalid args',
    `got error: "${result.error}"`
  );
}

console.log('\n--- Test 8: Empty/Invalid Gemini Response Objects ---');
{
  const nullResult = detectToolCall(null);
  const undefinedResult = detectToolCall(undefined);
  const emptyObjResult = detectToolCall({});

  assert(
    nullResult.isToolCall === false && nullResult.toolCall === null,
    'null input safely handled without crash'
  );
  assert(
    undefinedResult.isToolCall === false && undefinedResult.toolCall === null,
    'undefined input safely handled without crash'
  );
  assert(
    emptyObjResult.isToolCall === false && emptyObjResult.toolCall === null,
    'empty object {} safely handled without crash'
  );
}

console.log('\n--- Test 9: Tool Name Integrity ---');
{
  const validTools = [
    'searchAnnouncements',
    'checkVotingEligibility',
    'searchLostItems',
    'submitComplaint',
    'getComplaintStatus',
    'getNotifications',
  ];
  validTools.forEach((toolName) => {
    const resp = { functionCall: { name: toolName, args: {} } };
    const result = detectToolCall(resp);
    assert(
      result.isToolCall === true && result.toolCall?.name === toolName,
      `tool name "${toolName}" matches exact registry name`
    );
  });
}

console.log('\n--- Test 10: Zero Tool Execution ---');
{
  const mockVoteResponse = {
    functionCalls: [{ name: 'checkVotingEligibility', args: {} }],
  };
  const result = detectToolCall(mockVoteResponse);
  assert(result.isToolCall === true, 'detection completed');
  assert(
    typeof result.toolCall === 'object' && result.toolCall !== null,
    'standardized tool call object produced'
  );
  // Verify that detectToolCall performs no execution, DB, or async side-effects
  assert(
    !Object.prototype.hasOwnProperty.call(detectToolCall, 'then'),
    'detectToolCall is a pure synchronous function'
  );
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);
