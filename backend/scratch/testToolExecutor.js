const Module = require('module');
const path = require('path');

const mockDb = {
  announcements: [
    { _id: 'ann-1', title: 'Exam Schedule Released', content: 'Final exam timetable is out.', category: 'Academic', isActive: true, createdAt: new Date('2026-01-01') },
    { _id: 'ann-2', title: 'Sports Day', content: 'Annual sports meet next week.', category: 'Event', isActive: true, createdAt: new Date('2026-01-02') },
  ],
  elections: [
    {
      _id: 'election-1',
      title: 'Student Union Election 2026',
      status: 'ongoing',
      eligibleDepartments: ['ICT', 'EET'],
      isDepartmentEligible(dept) {
        return this.eligibleDepartments.length === 0 || this.eligibleDepartments.includes(dept);
      },
    },
    {
      _id: 'election-2',
      title: 'All-Faculty Referendum',
      status: 'ongoing',
      eligibleDepartments: [],
      isDepartmentEligible() {
        return true;
      },
    },
  ],
  lostFound: [
    { _id: 'lf-1', title: 'Lost black wallet', type: 'lost', category: 'Other', status: 'active', createdAt: new Date('2026-01-01') },
  ],
  complaints: [
    { _id: 'c-1', title: 'Broken chair', description: 'Chair in room 204 is broken', submittedBy: 'student-A', status: 'pending', updatedAt: new Date('2026-01-01') },
    { _id: 'c-2', title: 'Wifi issue', description: 'Wifi not working in hostel', submittedBy: 'student-B', status: 'pending', updatedAt: new Date('2026-01-01') },
  ],
  errorMode: null,
  createdComplaints: [],
};

const makeChain = (resultFn) => {
  const chain = {
    sort: () => chain,
    limit: () => chain,
    populate: () => chain,
    select: () => chain,
    then: (resolve, reject) => {
      try {
        return Promise.resolve(resultFn()).then(resolve, reject);
      } catch (err) {
        return Promise.reject(err).catch(reject);
      }
    },
    catch: (reject) => Promise.resolve().then(resultFn).catch(reject),
  };
  return chain;
};

const matchesFilter = (doc, filter) => {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') {
      return value.some((subFilter) => matchesFilter(doc, subFilter));
    }
    if (value && typeof value === 'object' && value.$regex) {
      const re = new RegExp(value.$regex, value.$options || '');
      return re.test(doc[key] || '');
    }
    return doc[key] === value;
  });
};

const AnnouncementMock = {
  find: (filter = {}) =>
    makeChain(() => {
      if (mockDb.errorMode === 'searchAnnouncements') {
        throw new Error('Simulated Announcement DB failure');
      }
      return mockDb.announcements.filter((a) => matchesFilter(a, filter));
    }),
};

const ElectionMock = {
  find: (filter = {}) =>
    makeChain(() => {
      if (mockDb.errorMode === 'checkVotingEligibility') {
        throw new Error('Simulated Election DB failure');
      }
      return mockDb.elections.filter((e) => matchesFilter(e, filter));
    }),
  findById: async (id) => {
    if (mockDb.errorMode === 'checkVotingEligibility') {
      throw new Error('Simulated Election DB failure');
    }
    return mockDb.elections.find((e) => e._id === id) || null;
  },
};

const LostFoundMock = {
  find: (filter = {}) =>
    makeChain(() => {
      if (mockDb.errorMode === 'searchLostItems') {
        throw new Error('Simulated LostFound DB failure');
      }
      return mockDb.lostFound.filter((item) => matchesFilter(item, filter));
    }),
};

const ComplaintMock = {
  find: (filter = {}) =>
    makeChain(() => {
      if (mockDb.errorMode === 'getComplaintStatus' || mockDb.errorMode === 'getNotifications') {
        throw new Error('Simulated Complaint DB failure');
      }
      return mockDb.complaints
        .concat(mockDb.createdComplaints)
        .filter((c) => matchesFilter(c, filter));
    }),
  create: async (data) => {
    if (mockDb.errorMode === 'submitComplaint') {
      throw new Error('Simulated Complaint create failure');
    }
    const doc = { _id: `c-new-${mockDb.createdComplaints.length + 1}`, status: 'pending', ...data };
    mockDb.createdComplaints.push(doc);
    return doc;
  },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request.includes('models/Announcement')) return AnnouncementMock;
  if (request.includes('models/Election')) return ElectionMock;
  if (request.includes('models/LostFound')) return LostFoundMock;
  if (request.includes('models/Complaint')) return ComplaintMock;
  return originalLoad.call(this, request, parent, isMain);
};

const executorPath = path.join(__dirname, '..', 'ai', 'tools', 'toolExecutor.js');
const { executeTool } = require(executorPath);

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

const studentA = { _id: 'student-A', role: 'Student', department: 'ICT' };
const studentB = { _id: 'student-B', role: 'Student', department: 'EET' };

const main = async () => {
  console.log('\n--- Test 1: searchAnnouncements ---');
  {
    const result = await executeTool({ name: 'searchAnnouncements', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(Array.isArray(result.data) && result.data.length === 2, 'returns active announcements', `got: ${result.data?.length}`);
  }

  console.log('\n--- Test 2: checkVotingEligibility ---');
  {
    const result = await executeTool({ name: 'checkVotingEligibility', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(Array.isArray(result.data), 'returns list of eligible ongoing elections');
    assert(
      result.data.some((e) => e.id === 'election-1'),
      'ICT student is eligible for department-restricted election-1'
    );
  }

  console.log('\n--- Test 3: searchLostItems ---');
  {
    const result = await executeTool({ name: 'searchLostItems', arguments: { query: 'wallet' } }, studentA);
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(result.data.length === 1 && result.data[0]._id === 'lf-1', 'query filter returns matching item');
  }

  console.log('\n--- Test 4: submitComplaint ---');
  {
    const result = await executeTool(
      { name: 'submitComplaint', arguments: { title: 'Broken tap', description: 'Tap leaking in hostel bathroom' } },
      studentA
    );
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(result.data.submittedBy === 'student-A', 'complaint bound to authenticated user');
    assert(result.data.title === 'Broken tap', 'complaint title stored correctly');
  }

  console.log('\n--- Test 5: getComplaintStatus ---');
  {
    const result = await executeTool({ name: 'getComplaintStatus', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(
      result.data.every((c) => c.submittedBy === 'student-A'),
      'only returns complaints owned by the authenticated user'
    );
  }

  console.log('\n--- Test 6: getNotifications ---');
  {
    const result = await executeTool({ name: 'getNotifications', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === true, 'success is true');
    assert(Array.isArray(result.data.announcements), 'announcements array present');
    assert(Array.isArray(result.data.complaintUpdates), 'complaintUpdates array present');
  }

  console.log('\n--- Test 7: Unknown Tool ---');
  {
    const result = await executeTool({ name: 'deleteStudentRecords', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === false, 'success is false for unregistered tool');
    assert(result.error === 'Unknown tool: deleteStudentRecords', 'controlled error message returned');
  }

  console.log('\n--- Test 8: Invalid Arguments ---');
  {
    const result = await executeTool({ name: 'searchAnnouncements', arguments: 'invalid' }, studentA);
    console.log(result);
    assert(result.success === false, 'success is false for non-object arguments');
    assert(typeof result.error === 'string', 'controlled error message, no crash');
  }

  console.log('\n--- Test 9: Missing Required Argument ---');
  {
    const result = await executeTool({ name: 'submitComplaint', arguments: { title: 'No description here' } }, studentA);
    console.log(result);
    assert(result.success === false, 'success is false when description is missing');
    assert(result.error === 'Missing required argument: description', 'exact missing-field error returned');
  }

  console.log('\n--- Test 10: Existing Backend Error ---');
  {
    mockDb.errorMode = 'searchAnnouncements';
    const result = await executeTool({ name: 'searchAnnouncements', arguments: {} }, studentA);
    console.log(result);
    assert(result.success === false, 'success is false on DB error');
    assert(typeof result.error === 'string' && result.error.length > 0, 'controlled error message returned, not a crash');
    mockDb.errorMode = null;

    const followUp = await executeTool({ name: 'searchAnnouncements', arguments: {} }, studentA);
    assert(followUp.success === true, 'Node process kept running — subsequent calls still work after an error');
  }

  console.log('\n--- Test 11: Missing User Context ---');
  {
    const result1 = await executeTool({ name: 'submitComplaint', arguments: { title: 'X', description: 'Y' } }, null);
    assert(result1.success === false, 'submitComplaint rejected when userContext is null');

    const result2 = await executeTool({ name: 'getComplaintStatus', arguments: {} }, undefined);
    assert(result2.success === false, 'getComplaintStatus rejected when userContext is undefined');

    const result3 = await executeTool({ name: 'checkVotingEligibility', arguments: {} }, {});
    assert(result3.success === false, 'checkVotingEligibility rejected when userContext has no id');
  }

  console.log('\n--- Test 12: Zero Gemini Interaction ---');
  {
    const fs = require('fs');
    const source = fs.readFileSync(executorPath, 'utf8');
    assert(!source.includes('@google/genai'), 'toolExecutor.js does not import @google/genai');
    assert(!/generateContent|GoogleGenAI/.test(source), 'toolExecutor.js makes no Gemini API calls');
  }

  console.log('\n--- Test 13: User Data Isolation ---');
  {
    const resultA = await executeTool({ name: 'getComplaintStatus', arguments: { complaintId: 'c-2' } }, studentA);
    console.log(resultA);
    assert(resultA.success === true, 'query succeeds without crashing');
    assert(
      resultA.data.length === 0,
      'Student A cannot access Student B\'s complaint even by guessing its complaintId',
      `got: ${JSON.stringify(resultA.data)}`
    );

    const resultB = await executeTool({ name: 'getComplaintStatus', arguments: { complaintId: 'c-2' } }, studentB);
    assert(
      resultB.data.length === 1 && resultB.data[0]._id === 'c-2',
      'Student B can access their own complaint by the same complaintId'
    );
  }

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
  process.exit(failCount > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});