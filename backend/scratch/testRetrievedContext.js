/**
 * Standalone verification script for Retrieved Context Integration (Topic 5.5).
 * Run with: node backend/scratch/testRetrievedContext.js
 *
 * Pure unit test — no MongoDB, no Gemini API, no mocking required, since
 * contextFormatter and promptBuilder are both pure string-formatting
 * modules with no external dependencies.
 */

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

const { formatRetrievedKnowledge } = require(path.join(__dirname, '..', 'ai', 'knowledge', 'contextFormatter'));
const { buildPrompt } = require(path.join(__dirname, '..', 'ai', 'prompt', 'promptBuilder'));

const announcementResult = {
  source: 'announcement',
  sourceId: '507f1f77bcf86cd799439011',
  title: 'Assignment Submission Deadline Extended',
  content: 'Title: Assignment Submission Deadline Extended\nCategory: Academic\nPriority: high\nContent: The submission deadline for ICT 3202 has been extended by 3 days.',
  metadata: { category: 'Academic', priority: 'high', createdAt: '2026-08-10T10:00:00.000Z' },
  score: 0.8742,
};

const electionResult = {
  source: 'election',
  sourceId: '507f1f77bcf86cd799439022',
  title: 'Faculty Student Representative Election',
  content: 'Election Title: Faculty Student Representative Election\nElection Type: Department Level\nDepartment: ICT\nCandidates:\n- Name: Nimal Perera, Position: President, Manifesto: Focus on lab facilities',
  metadata: { type: 'Department Level', status: 'ongoing' },
  score: 0.79,
};

const sampleContext = {
  user: { id: 'u1', name: 'Kavindu', role: 'student', department: 'ICT' },
  conversation: [{ role: 'user', content: 'hi' }],
  currentMessage: 'What announcements discuss the exam schedule?',
};

const sampleTools = [{ name: 'searchAnnouncements', description: 'Search faculty announcements' }];

(async () => {
  console.log('\n--- Scenario 1: Context Formatter — single result ---');
  {
    const block = formatRetrievedKnowledge([announcementResult]);
    assert(block.startsWith('Retrieved Knowledge:\n\n'), 'single-result block starts with the "Retrieved Knowledge:" header');
    assert(block.includes('[Source: Announcement]'), 'single-result block uses the bracketed source label');
    assert(block.includes('Title: Assignment Submission Deadline Extended'), 'single-result block includes the title');
    assert(block.includes('Content:\n'), 'single-result block includes a Content: line');
    assert(!block.includes('--- Result'), 'single-result block does NOT use numbered "--- Result N ---" headers');
  }

  console.log('\n--- Scenario 2: Context Formatter — multiple results ---');
  {
    const block = formatRetrievedKnowledge([announcementResult, electionResult]);
    assert(block.includes('--- Result 1 ---'), 'multi-result block numbers the first result');
    assert(block.includes('--- Result 2 ---'), 'multi-result block numbers the second result');
    assert(block.includes('Source: Announcement'), 'multi-result block includes plain "Source: Announcement" line');
    assert(block.includes('Source: Election'), 'multi-result block includes plain "Source: Election" line');
    const firstIndex = block.indexOf('--- Result 1 ---');
    const secondIndex = block.indexOf('--- Result 2 ---');
    assert(firstIndex >= 0 && secondIndex > firstIndex, 'results appear in the order they were passed in');
  }

  console.log('\n--- Scenario 3: Context Formatter — empty retrieval ---');
  {
    const block = formatRetrievedKnowledge([]);
    assert(block === 'Retrieved Knowledge:\n(No relevant campus knowledge documents were retrieved from the database for this query.)',
      'empty array produces the exact fallback message', block);

    const blockFromUndefined = formatRetrievedKnowledge(undefined);
    assert(blockFromUndefined === block, 'undefined input is handled the same as an empty array, no crash');
  }

  console.log('\n--- Scenario 4: Prompt Builder integration ---');
  {
    const prompt = buildPrompt(sampleContext, sampleTools, [announcementResult]);
    assert(prompt.includes('Retrieved Knowledge:'), 'buildPrompt output includes the Retrieved Knowledge section');
    assert(prompt.includes('Assignment Submission Deadline Extended'), 'buildPrompt output includes the retrieved document content');
    assert(prompt.includes('Current User'), 'existing Current User section still present (Phase 2 preserved)');
    assert(prompt.includes('Conversation History'), 'existing Conversation History section still present (Phase 2 preserved)');
    assert(prompt.includes('Available Tools'), 'existing Available Tools section still present (Phase 3 preserved)');
    assert(prompt.includes('searchAnnouncements'), 'tool declarations still passed through correctly');
    assert(prompt.trim().endsWith(sampleContext.currentMessage), 'Current User Message remains the final section');
    assert(prompt.includes('RAG GROUNDING RULES'), 'system prompt includes the new RAG grounding rules');

    // Search from after SYSTEM_ROLE so grounding-rules prose (which also
    // mentions "Retrieved Knowledge:" and "Available Tools") isn't matched.
    const bodyStart = prompt.indexOf('================================================');
    const toolsIndex = prompt.indexOf('Available Tools', bodyStart);
    const knowledgeIndex = prompt.indexOf('================================================\nRetrieved Knowledge:', bodyStart);
    const messageIndex = prompt.indexOf('Current User Message', bodyStart);
    assert(toolsIndex < knowledgeIndex && knowledgeIndex < messageIndex,
      'Retrieved Knowledge section sits between Available Tools and Current User Message, per the architecture diagram');
  }

  console.log('\n--- Scenario 5: Backward compatibility — no retrievedKnowledge argument ---');
  {
    const prompt = buildPrompt(sampleContext, sampleTools);
    assert(prompt.includes('Retrieved Knowledge:'), 'omitting the 3rd argument still produces a Retrieved Knowledge section (defaults to [])');
    assert(prompt.includes('No relevant campus knowledge documents were retrieved'), 'defaults to the empty-retrieval fallback message');
  }

  console.log('\n--- Scenario 6: Privacy & internals leakage ---');
  {
    const dirtyResult = {
      source: 'announcement',
      title: 'Test',
      content: 'Some content',
      _id: '507f1f77bcf86cd799439099',
      __v: 0,
      embedding: [0.1, 0.2, 0.3],
      score: 0.91,
      metadata: { password: 'should-never-appear', internalNote: 'secret' },
    };
    const block = formatRetrievedKnowledge([dirtyResult]);
    assert(!block.includes('507f1f77bcf86cd799439099'), 'raw _id does not leak into the formatted block');
    assert(!block.includes('__v'), '__v does not leak into the formatted block');
    assert(!block.includes('0.1,') && !block.includes('embedding'), 'raw embedding vector does not leak into the formatted block');
    assert(!block.includes('should-never-appear'), 'metadata fields (e.g. password) do not leak into the formatted block');
    assert(!block.includes('0.91'), 'similarity score does not leak into the formatted block');
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
})();