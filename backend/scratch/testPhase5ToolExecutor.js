const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { executeTool } = require('../ai/tools/toolExecutor');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const runTests = async () => {
  console.log('🧪 Starting Phase 5 Tool Executor Integration & Security Tests...\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for testing.');

  const students = await User.find({ role: 'student' }).limit(2);
  if (students.length < 2) {
    throw new Error('Requires at least 2 student users in DB for two-user security tests.');
  }

  const userA = students[0];
  const userB = students[1];

  console.log(`👤 User A: ${userA.name} (Dept: ${userA.department}, ID: ${userA._id})`);
  console.log(`👤 User B: ${userB.name} (Dept: ${userB.department}, ID: ${userB._id})`);

  // 1. Tool: searchAnnouncements
  console.log('\n--- 1. Testing searchAnnouncements Tool ---');
  const annRes = await executeTool({ name: 'searchAnnouncements', arguments: { query: 'exam' } }, userA);
  console.log(`Success: ${annRes.success}, Records: ${annRes.data?.length}`);
  if (!annRes.success) throw new Error('searchAnnouncements failed');

  // 2. Tool: checkVotingEligibility
  console.log('\n--- 2. Testing checkVotingEligibility Tool ---');
  const voteRes = await executeTool({ name: 'checkVotingEligibility', arguments: {} }, userA);
  console.log(`Success: ${voteRes.success}, Data:`, JSON.stringify(voteRes.data));
  if (!voteRes.success) throw new Error('checkVotingEligibility failed');

  // 3. Tool: searchLostItems
  console.log('\n--- 3. Testing searchLostItems Tool ---');
  const lostRes = await executeTool({ name: 'searchLostItems', arguments: { type: 'lost' } }, userA);
  console.log(`Success: ${lostRes.success}, Records: ${lostRes.data?.length}`);
  if (!lostRes.success) throw new Error('searchLostItems failed');

  // 4. Tool: submitComplaint
  console.log('\n--- 4. Testing submitComplaint Tool ---');
  const compRes = await executeTool(
    {
      name: 'submitComplaint',
      arguments: {
        title: 'Phase 5 Service Tool Test',
        description: 'Testing submitComplaint via toolExecutor and complaintService.',
        category: 'Facility',
        targetAdminType: 'super_admin',
      },
    },
    userA
  );
  console.log(`Success: ${compRes.success}, Complaint ID: ${compRes.data?._id}`);
  if (!compRes.success || !compRes.data?._id) throw new Error('submitComplaint failed');

  const createdComplaintId = compRes.data._id;

  // 5. Tool: getComplaintStatus (Security & Isolation Checks)
  console.log('\n--- 5. Testing getComplaintStatus Tool (Data Isolation & Probing) ---');
  // User A retrieves own complaints
  const userAComplaints = await executeTool({ name: 'getComplaintStatus', arguments: {} }, userA);
  const userAOwnsAll = userAComplaints.data.every((c) => c.submittedBy.toString() === userA._id.toString());
  console.log(`User A owns all returned complaints: ${userAOwnsAll ? 'PASS ✅' : 'FAIL ❌'}`);

  // User B probes User A's complaint ID explicitly
  const userBProbe = await executeTool(
    { name: 'getComplaintStatus', arguments: { complaintId: createdComplaintId.toString() } },
    userB
  );
  console.log(`User B probing User A complaint: returned count = ${userBProbe.data?.length} (Expected: 0)`);
  if (userBProbe.data?.length !== 0) {
    throw new Error('SECURITY VIOLATION: User B was able to view User A complaint!');
  }
  console.log('User Data Isolation: PASS ✅');

  // Clean up test complaint
  await Complaint.findByIdAndDelete(createdComplaintId);
  console.log('🧹 Cleaned up test complaint.');

  // 6. Tool: getNotifications
  console.log('\n--- 6. Testing getNotifications Tool ---');
  const notifRes = await executeTool({ name: 'getNotifications', arguments: {} }, userA);
  console.log(
    `Success: ${notifRes.success}, Announcements: ${notifRes.data?.announcements?.length}, Complaint Updates: ${notifRes.data?.complaintUpdates?.length}`
  );
  if (!notifRes.success) throw new Error('getNotifications failed');

  // 7. Error Handling & Validation
  console.log('\n--- 7. Testing Parameter Validation & Error Handling ---');
  const badTool = await executeTool({ name: 'nonExistentTool', arguments: {} }, userA);
  console.log(`Unknown tool handled gracefully: ${!badTool.success ? 'PASS ✅' : 'FAIL ❌'} (${badTool.error})`);

  const missingArgs = await executeTool({ name: 'submitComplaint', arguments: { title: 'No description' } }, userA);
  console.log(`Missing required args handled: ${!missingArgs.success ? 'PASS ✅' : 'FAIL ❌'} (${missingArgs.error})`);

  console.log('\n🎉 ALL PHASE 5 TOOL EXECUTOR & SERVICE INTEGRATION TESTS PASSED!\n');
  await mongoose.disconnect();
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
