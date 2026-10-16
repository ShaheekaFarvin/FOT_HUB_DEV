const {
  buildAnnouncementDocument,
  buildElectionDocument,
  buildLostFoundDocument,
  buildKnowledgeDocument,
  buildKnowledgeBatch,
} = require('../ai/knowledge/knowledgeDocumentBuilder');

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

const fakeObjectId = (hex) => ({ toString: () => hex });

console.log('\n--- Test 1: Valid Active Announcement ---');
{
  const record = {
    _id: fakeObjectId('ann1000000000000000001'),
    title: 'Exam Schedule Released',
    content: 'The final exam timetable has been published on the portal.',
    category: 'Academic',
    priority: 'high',
    isActive: true,
    createdBy: fakeObjectId('user1000000000000000001'),
    imageUrl: 'https://example.com/img.png',
    __v: 0,
    createdAt: new Date('2026-08-10T10:00:00.000Z'),
    updatedAt: new Date('2026-08-10T10:00:00.000Z'),
  };
  const doc = buildAnnouncementDocument(record);
  console.log(doc);

  assert(doc !== null, 'active announcement produces a document');
  assert(doc.source === 'announcement', 'source is "announcement"');
  assert(doc.sourceId === 'ann1000000000000000001', 'sourceId is a controlled string, not the raw ObjectId');
  assert(doc.title === 'Exam Schedule Released', 'title preserved');
  assert(doc.content.includes('Title: Exam Schedule Released'), 'content includes formatted Title line');
  assert(doc.content.includes('Category: Academic'), 'content includes formatted Category line');
  assert(doc.content.includes('Priority: high'), 'content includes formatted Priority line');
  assert(doc.content.includes('Content: The final exam timetable'), 'content includes formatted Content line');
  assert(!doc.content.includes('createdBy'), 'createdBy is excluded from content');
  assert(!doc.content.includes('imageUrl'), 'imageUrl is excluded from content');
  assert(!JSON.stringify(doc).includes('__v'), '__v is excluded entirely');
  assert(doc.metadata.category === 'Academic' && doc.metadata.priority === 'high', 'metadata has category and priority');
}

console.log('\n--- Test 2: Inactive Announcement Excluded ---');
{
  const record = { _id: fakeObjectId('ann2'), title: 'Old notice', content: 'x', isActive: false };
  const doc = buildAnnouncementDocument(record);
  assert(doc === null, 'inactive announcement (isActive: false) returns null');
}

console.log('\n--- Test 3: Valid Election (Votes Stripped) ---');
{
  const record = {
    _id: fakeObjectId('elec1000000000000000001'),
    title: 'Student Union Election 2026',
    type: 'University Level',
    department: 'All',
    eligibleDepartments: ['ICT', 'EET'],
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-02T00:00:00.000Z'),
    status: 'upcoming',
    candidates: [
      { name: 'Nimal Silva', position: 'President', manifesto: 'Better facilities for all.', votes: 120 },
      { name: 'Kasun Perera', position: 'Secretary', manifesto: 'Transparent communication.', votes: 98 },
    ],
    votes: [
      { voter: fakeObjectId('student1'), candidateId: fakeObjectId('cand1'), position: 'President' },
    ],
    createdBy: fakeObjectId('admin1'),
  };
  const doc = buildElectionDocument(record);
  console.log(doc);

  assert(doc !== null, 'eligible-status election produces a document');
  assert(doc.source === 'election', 'source is "election"');
  assert(doc.sourceId === 'elec1000000000000000001', 'sourceId is controlled string');
  assert(doc.content.includes('Nimal Silva'), 'candidate name included in content');
  assert(doc.content.includes('Better facilities for all.'), 'candidate manifesto included in content');
  assert(!doc.content.includes('120') && !doc.content.includes('98'), 'candidate vote counts are NOT in content');
  assert(!JSON.stringify(doc).includes('voter'), 'votes subdocument array is fully excluded from the output');
  assert(!doc.content.includes('student1'), 'no voter ObjectId leaks into content');
  assert(doc.metadata.candidateCount === 2, 'metadata.candidateCount reflects candidate array length');
  assert(
    JSON.stringify(doc.metadata.eligibleDepartments) === JSON.stringify(['ICT', 'EET']),
    'metadata.eligibleDepartments preserved'
  );
  assert(!('votes' in doc.metadata), 'metadata has no votes field');
}

console.log('\n--- Test 4: Election With Ineligible Status Excluded ---');
{
  const record = { _id: fakeObjectId('elec2'), title: 'Draft Election', status: 'draft', candidates: [] };
  const doc = buildElectionDocument(record);
  assert(doc === null, 'election with status "draft" (not in allowed list) returns null');
}

console.log('\n--- Test 5: Valid Active LostFound ---');
{
  const record = {
    _id: fakeObjectId('lf1000000000000000000001'),
    title: 'Lost black wallet',
    description: 'Lost near the library entrance, contains student ID.',
    type: 'lost',
    category: 'Other',
    location: 'Main Library',
    date: new Date('2026-08-14T00:00:00.000Z'),
    contactInfo: '0771234567',
    status: 'active',
    submittedBy: fakeObjectId('student2'),
    createdAt: new Date('2026-08-14T08:30:00.000Z'),
  };
  const doc = buildLostFoundDocument(record);
  console.log(doc);

  assert(doc !== null, 'active lost item produces a document');
  assert(doc.source === 'lostFound', 'source is "lostFound"');
  assert(doc.content.includes('Location: Main Library'), 'content includes formatted Location line');
  assert(doc.content.includes('Contact: 0771234567'), 'content includes formatted Contact line');
  assert(!doc.content.includes('submittedBy'), 'submittedBy is excluded from content');
  assert(!JSON.stringify(doc).includes('student2'), 'submitter ObjectId does not leak anywhere in the document');
  assert(doc.metadata.type === 'lost' && doc.metadata.category === 'Other', 'metadata has type and category');
}

console.log('\n--- Test 6: Non-Active LostFound Excluded ---');
{
  const claimed = buildLostFoundDocument({ _id: fakeObjectId('lf2'), title: 'x', status: 'claimed' });
  const closed = buildLostFoundDocument({ _id: fakeObjectId('lf3'), title: 'y', status: 'closed' });
  assert(claimed === null, 'status "claimed" is excluded');
  assert(closed === null, 'status "closed" is excluded');
}

console.log('\n--- Test 7: buildKnowledgeDocument Dispatcher ---');
{
  const annDoc = buildKnowledgeDocument(
    { _id: fakeObjectId('a1'), title: 'A', content: 'B', isActive: true },
    'announcement'
  );
  assert(annDoc?.source === 'announcement', 'dispatches to buildAnnouncementDocument for source "announcement"');

  const elecDoc = buildKnowledgeDocument(
    { _id: fakeObjectId('e1'), title: 'E', status: 'ongoing', candidates: [] },
    'election'
  );
  assert(elecDoc?.source === 'election', 'dispatches to buildElectionDocument for source "election"');

  const lfDoc = buildKnowledgeDocument({ _id: fakeObjectId('l1'), title: 'L', status: 'active' }, 'lostFound');
  assert(lfDoc?.source === 'lostFound', 'dispatches to buildLostFoundDocument for source "lostFound"');

  const unknownDoc = buildKnowledgeDocument({ _id: fakeObjectId('x1') }, 'complaint');
  assert(unknownDoc === null, 'unknown/excluded source (e.g. "complaint") returns null, no crash');
}

console.log('\n--- Test 8: buildKnowledgeBatch ---');
{
  const records = [
    { _id: fakeObjectId('b1'), title: 'Active 1', content: 'x', isActive: true },
    { _id: fakeObjectId('b2'), title: 'Inactive', content: 'x', isActive: false },
    { _id: fakeObjectId('b3'), title: 'Active 2', content: 'x', isActive: true },
  ];
  const batch = buildKnowledgeBatch(records, 'announcement');
  assert(Array.isArray(batch), 'buildKnowledgeBatch returns an array');
  assert(batch.length === 2, 'null (ineligible) results are filtered out of the batch', `got: ${batch.length}`);
  assert(batch.every((doc) => doc.source === 'announcement'), 'all batch entries have correct source');

  const emptyBatch = buildKnowledgeBatch('not-an-array', 'announcement');
  assert(Array.isArray(emptyBatch) && emptyBatch.length === 0, 'non-array input safely returns an empty array, no crash');
}

console.log('\n--- Test 9: Raw _id / __v Never Leak Into Content String ---');
{
  const record = {
    _id: fakeObjectId('leaktest0000000000000001'),
    __v: 3,
    title: 'Leak check',
    content: 'Body text',
    isActive: true,
  };
  const doc = buildAnnouncementDocument(record);
  assert(!doc.content.includes('leaktest0000000000000001'), 'raw ObjectId string never appears inside content block');
  assert(!('__v' in doc), '__v is not a top-level field on the output document');
}

console.log('\n--- Test 10: Null/Undefined Record Safety ---');
{
  assert(buildAnnouncementDocument(null) === null, 'buildAnnouncementDocument(null) does not crash');
  assert(buildAnnouncementDocument(undefined) === null, 'buildAnnouncementDocument(undefined) does not crash');
  assert(buildElectionDocument(null) === null, 'buildElectionDocument(null) does not crash');
  assert(buildLostFoundDocument(null) === null, 'buildLostFoundDocument(null) does not crash');
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);