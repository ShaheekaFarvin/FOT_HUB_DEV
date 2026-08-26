const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { searchAnnouncements, getActiveAnnouncements } = require('../services/announcementService');
const { submitComplaint, getUserComplaints, getPublicComplaints } = require('../services/complaintService');
const { searchLostFoundItems, getActiveItems } = require('../services/lostFoundService');
const { checkStudentVotingEligibility, getOngoingElections } = require('../services/electionService');
const { getUserNotifications } = require('../services/notificationService');

const User = require('../models/User');

const runTests = async () => {
  console.log('🧪 Starting Phase 5 Service Layer Unit Tests...\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for testing.');

  const testUser = await User.findOne({ role: 'student' });
  if (!testUser) {
    throw new Error('No student user found in database for testing.');
  }
  console.log(`👤 Using test user: ${testUser.name} (${testUser.department}, ID: ${testUser._id})`);

  // 1. Test Announcement Service
  console.log('\n--- 1. Testing Announcement Service ---');
  const activeAnnouncements = await getActiveAnnouncements({ limit: 3 });
  console.log(`Active announcements found: ${activeAnnouncements.length}`);
  const searchedAnnouncements = await searchAnnouncements({ query: 'exam' });
  console.log(`Search 'exam' announcements found: ${searchedAnnouncements.length}`);

  // 2. Test Complaint Service
  console.log('\n--- 2. Testing Complaint Service ---');
  const newComplaint = await submitComplaint(
    {
      title: 'Service Layer Test Complaint',
      description: 'Testing shared complaintService submission.',
      category: 'Facility',
      targetAdminType: 'super_admin',
    },
    testUser
  );
  console.log(`✅ Complaint submitted: ${newComplaint._id} (submittedBy: ${newComplaint.submittedBy})`);

  const userComplaints = await getUserComplaints(testUser, { limit: 5 });
  console.log(`User complaints retrieved: ${userComplaints.length}`);
  const ownsAll = userComplaints.every((c) => c.submittedBy.toString() === testUser._id.toString());
  console.log(`Strict ownership check: ${ownsAll ? 'PASS ✅' : 'FAIL ❌'}`);

  // Clean up test complaint
  await mongoose.model('Complaint').findByIdAndDelete(newComplaint._id);
  console.log('🧹 Cleaned up test complaint.');

  // 3. Test Lost & Found Service
  console.log('\n--- 3. Testing Lost & Found Service ---');
  const activeLostFound = await getActiveItems({ limit: 3 });
  console.log(`Active lost/found items found: ${activeLostFound.length}`);
  const searchedItems = await searchLostFoundItems({ query: 'umbrella' });
  console.log(`Search 'umbrella' items found: ${searchedItems.length}`);

  // 4. Test Election Service
  console.log('\n--- 4. Testing Election Service ---');
  const eligibility = await checkStudentVotingEligibility(testUser);
  console.log(`Voting eligibility for ${testUser.department}:`, JSON.stringify(eligibility));

  // 5. Test Notification Service
  console.log('\n--- 5. Testing Notification Service ---');
  const notifications = await getUserNotifications(testUser);
  console.log(
    `Notifications retrieved: ${notifications.announcements.length} announcements, ${notifications.complaintUpdates.length} complaint updates`
  );

  console.log('\n🎉 ALL PHASE 5 SERVICE LAYER TESTS COMPLETED SUCCESSFULLY!\n');
  await mongoose.disconnect();
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
