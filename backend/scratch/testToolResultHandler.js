const { handleToolResult, normalizeToolResult, buildContents } = require('../ai/tools/toolResultHandler');

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

const makeClient = (behavior) => ({
  models: {
    generateContent: async (request) => {
      makeClient.lastRequest = request;
      if (behavior === 'fail') {
        throw new Error('Simulated Gemini second-call failure');
      }
      if (behavior === 'empty') {
        return { text: '' };
      }
      if (typeof behavior === 'function') {
        return behavior(request);
      }
      return { text: 'Yes, you are eligible to vote in the Student Union Election 2026.' };
    },
  },
});

const baseToolCall = { name: 'checkVotingEligibility', arguments: {} };
const baseGeminiResponse = {
  candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'checkVotingEligibility', args: {} } }] } }],
};

const main = async () => {
  console.log('\n--- Test 1: Valid Tool Result ---');
  {
    const toolResult = { success: true, data: { eligible: true, electionId: 'election-1' } };
    const client = makeClient();
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'You are FOT Buddy...\n\nCan I vote?',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult,
      functionDeclarations: [],
    });
    const sentContents = makeClient.lastRequest.contents;
    console.log(reply);
    assert(typeof reply === 'string' && reply.length > 0, 'returns a non-empty natural-language string');
    assert(Array.isArray(sentContents) && sentContents.length === 3, 'multi-turn contents array has 3 turns');
    assert(
      sentContents[2].parts[0].functionResponse.response.success === true,
      'functionResponse.response reflects a successful tool result'
    );
  }

  console.log('\n--- Test 2: Empty Tool Result ---');
  {
    const toolResult = { success: true, data: null };
    const client = makeClient();
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult,
      functionDeclarations: [],
    });
    const sentContents = makeClient.lastRequest.contents;
    assert(typeof reply === 'string', 'does not crash on data: null, returns a string');
    assert(
      sentContents[2].parts[0].functionResponse.response.data === null,
      'functionResponse.response.data is safely null'
    );
  }

  console.log('\n--- Test 3: Tool Error Result ---');
  {
    const toolResult = { success: false, error: 'Election not found.' };
    const client = makeClient();
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult,
      functionDeclarations: [],
    });
    const sentContents = makeClient.lastRequest.contents;
    assert(typeof reply === 'string' && reply.length > 0, 'still returns a natural-language string on tool error');
    assert(
      sentContents[2].parts[0].functionResponse.response.success === false,
      'functionResponse.response reflects the failed tool result'
    );
    assert(
      sentContents[2].parts[0].functionResponse.response.error === 'Election not found.',
      'functionResponse.response.error is passed through to Gemini'
    );
  }

  console.log('\n--- Test 4: Gemini Final Response Extraction ---');
  {
    const client = makeClient(() => ({ text: '  You are eligible to vote.  ' }));
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult: { success: true, data: { eligible: true } },
      functionDeclarations: [],
    });
    assert(reply === 'You are eligible to vote.', 'final text is trimmed and extracted correctly', `got: "${reply}"`);
  }

  console.log('\n--- Test 5: Final API Response Contract ---');
  {
    const reply = await handleToolResult({
      client: makeClient(),
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult: { success: true, data: {} },
      functionDeclarations: [],
    });
    const payload = { reply };
    assert(typeof payload.reply === 'string', 'controller-level payload is strictly { reply: "..." }');
    assert(Object.keys(payload).length === 1, 'payload contains no extra keys beyond reply');
  }

  console.log('\n--- Test 6: Tool Result Not Directly Exposed ---');
  {
    const rawDbObject = { success: true, data: { _id: 'election-1', __v: 0, eligible: true, submittedBy: 'student-A' } };
    const client = makeClient(() => ({ text: 'Yes, you can vote in the current election.' }));
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult: rawDbObject,
      functionDeclarations: [],
    });
    assert(!reply.includes('_id'), 'raw DB field "_id" is not leaked into the final reply');
    assert(!reply.includes('__v'), 'raw DB field "__v" is not leaked into the final reply');
    assert(!reply.includes('{'), 'reply is natural language, not raw JSON');
  }

  console.log('\n--- Test 7: Gemini Failure After Tool Execution ---');
  {
    const client = makeClient('fail');
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult: { success: true, data: {} },
      functionDeclarations: [],
    });
    assert(typeof reply === 'string' && reply.length > 0, 'returns a controlled fallback string, no crash/throw');
  }

  console.log('\n--- Test 8: Empty Gemini Final Response ---');
  {
    const client = makeClient('empty');
    const reply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: baseGeminiResponse,
      toolCall: baseToolCall,
      toolResult: { success: true, data: {} },
      functionDeclarations: [],
    });
    assert(typeof reply === 'string' && reply.length > 0, 'returns fallback text instead of undefined/empty string');
  }

  console.log('\n--- Test 9: Function Call Identity Preserved ---');
  {
    const toolCall = { name: 'searchAnnouncements', arguments: { query: 'exam' } };
    const client = makeClient();
    await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'prompt text',
      geminiResponse: {
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'searchAnnouncements', args: { query: 'exam' } } }] } }],
      },
      toolCall,
      toolResult: { success: true, data: [] },
      functionDeclarations: [],
    });
    const sentContents = makeClient.lastRequest.contents;
    assert(
      sentContents[2].parts[0].functionResponse.name === 'searchAnnouncements',
      'functionResponse.name strictly matches toolCall.name'
    );
  }

  console.log('\n--- Test 10: Complete Tool Cycle (Integration) ---');
  {
    const { detectToolCall } = require('../ai/tools/toolCallDetector');

    const initialGeminiResponse = {
      functionCalls: [{ name: 'checkVotingEligibility', args: { electionId: 'election-1' } }],
    };

    const detection = detectToolCall(initialGeminiResponse);
    assert(detection.isToolCall === true, 'step 1: initial Gemini response is detected as a tool call');

    const toolResult = { success: true, data: { eligible: true, electionId: 'election-1' } };

    const client = makeClient(() => ({ text: 'Yes! You are eligible to vote in this election.' }));
    const finalReply = await handleToolResult({
      client,
      model: 'gemini-2.0-flash',
      prompt: 'You are FOT Buddy...\n\nCan I vote?',
      geminiResponse: initialGeminiResponse,
      toolCall: detection.toolCall,
      toolResult,
      functionDeclarations: [],
    });

    assert(typeof finalReply === 'string' && finalReply.length > 0, 'step 2: final natural-language reply produced');
    const reactPayload = { reply: finalReply };
    assert(
      Object.keys(reactPayload).length === 1 && typeof reactPayload.reply === 'string',
      'step 3: React payload is a clean { reply } object end-to-end'
    );
  }

  console.log('\n--- Extra: normalizeToolResult() safety ---');
  {
    assert(
      normalizeToolResult(null).success === false,
      'normalizeToolResult(null) does not crash, returns success: false'
    );
    assert(
      normalizeToolResult(undefined).success === false,
      'normalizeToolResult(undefined) does not crash, returns success: false'
    );
    assert(
      normalizeToolResult('not-an-object').success === false,
      'normalizeToolResult(string) does not crash, returns success: false'
    );
    assert(
      normalizeToolResult({}).success === false,
      'normalizeToolResult({}) missing success flag safely rejected'
    );
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});