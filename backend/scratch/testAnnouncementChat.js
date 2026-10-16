const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { processUserRequest } = require('../ai/knowledge/ragOrchestrator');
const User = require('../models/User');

const testChat = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const testUser = await User.findOne({ role: 'student' });
  console.log(`👤 Testing with user: ${testUser.name}`);

  console.log('\n--- Asking: "What are the latest announcements?" ---');
  const res = await processUserRequest(testUser, 'What are the latest announcements?');
  console.log('\n🤖 AI Reply:\n', res.reply);

  await mongoose.disconnect();
};

testChat().catch(console.error);
