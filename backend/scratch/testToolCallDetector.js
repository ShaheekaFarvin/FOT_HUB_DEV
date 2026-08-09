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
  const textResponse = { text: 'Hello! How can I help you today?' };
  const result = detectToolCall(textResponse);
  assert(result.isToolCall === false && result.toolCall === null && !result.error, 'Normal text', `got: ${JSON.stringify(result)}`);
}

console.log('\n--- Test 2: Voting Function Call (No Args) ---');
{
  const voteResponse = { functionCalls: () => [{ name: 'checkVotingEligibility', args: {} }] };
  const result = detectToolCall(voteResponse);
  assert(result.isToolCall === true, 'isToolCall true');
  assert(result.toolCall?.name === 'checkVotingEligibility', 'name matches');
  assert(JSON.stringify(result.toolCall?.arguments) === '{}', 'args {}');
}

console.log('\n--- Test 3: Voting Function Call With Arguments ---');
{
  const r = detectToolCall({ functionCalls: [{ name: 'checkVotingEligibility', args: { electionId: 'election-001' } }] });
  assert(r.isToolCall === true, 'isToolCall true');
  assert(r.toolCall?.arguments?.electionId === 'election-001', 'electionId preserved');
}

console.log('\n--- Test 4: Announcement Function Call ---');
{
  const r = detectToolCall({ candidates: [{ content: { parts: [{ functionCall: { name: 'searchAnnouncements', args: { query: 'exam', category: 'Academic' } } }] } }] });
  assert(r.isToolCall === true, 'isToolCall true');
  assert(r.toolCall?.arguments?.query === 'exam' && r.toolCall?.arguments?.category === 'Academic', 'args extracted');
}

console.log('\n--- Test 5: Unknown Tool Rejection ---');
{
  const r = detectToolCall({ functionCall: { name: 'deleteStudentRecords', args: {} } });
  assert(r.isToolCall === false, 'false');
  assert(r.toolCall === null, 'null');
  assert(r.error === 'Unknown tool: deleteStudentRecords', 'error text', `got: "${r.error}"`);
}

console.log('\n--- Test 6: Missing Function Name ---');
{
  const r = detectToolCall({ functionCall: { args: {} } });
  assert(r.isToolCall === false, 'false');
  assert(r.toolCall === null, 'null');
  assert(Boolean(r.error), 'error set');
}

console.log('\n--- Test 7: Invalid Arguments Type ---');
{
  const r = detectToolCall({ functionCall: { name: 'checkVotingEligibility', args: 'invalid-string' } });
  assert(r.isToolCall === false, 'false');
  assert(r.toolCall === null, 'null');
  assert(r.error === 'Invalid arguments type for tool call: checkVotingEligibility', 'error text', `got: "${r.error}"`);
}

console.log('\n--- Test 8: Empty/Invalid Gemini Response ---');
{
  assert(detectToolCall(null).isToolCall === false, 'null');
  assert(detectToolCall(undefined).isToolCall === false, 'undefined');
  assert(detectToolCall({}).isToolCall === false, 'empty obj');
}

console.log('\n--- Test 9: Tool Name Integrity ---');
{
  ['searchAnnouncements','checkVotingEligibility','searchLostItems','submitComplaint','getComplaintStatus','getNotifications'].forEach((t) => {
    const r = detectToolCall({ functionCall: { name: t, args: {} } });
    assert(r.isToolCall === true && r.toolCall?.name === t, `name ${t}`);
  });
}

console.log('\n--- Test 10: Zero Tool Execution ---');
{
  const r = detectToolCall({ functionCalls: [{ name: 'checkVotingEligibility', args: {} }] });
  assert(r.isToolCall === true, 'detection completed');
  assert(typeof r.toolCall === 'object', 'object produced');
  assert(!Object.prototype.hasOwnProperty.call(detectToolCall, 'then'), 'pure sync function');
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);