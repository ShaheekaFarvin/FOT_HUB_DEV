const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Announcement = require('../models/Announcement');
const KnowledgeDocument = require('../models/KnowledgeDocument');

const inspect = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  console.log('\n--- Real Announcements in MongoDB (Announcement Collection) ---');
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  console.log(`Total announcements: ${announcements.length}`);
  announcements.forEach((a, i) => {
    console.log(`[${i+1}] Title: "${a.title}" | Category: ${a.category} | Active: ${a.isActive} | CreatedAt: ${a.createdAt}`);
  });

  console.log('\n--- Knowledge Documents in MongoDB (KnowledgeDocument Collection) ---');
  const knowledge = await KnowledgeDocument.find({ source: 'announcement' });
  console.log(`Total announcement knowledge documents: ${knowledge.length}`);
  knowledge.forEach((k, i) => {
    console.log(`[${i+1}] Title: "${k.title}" | SourceId: ${k.sourceId} | Metadata:`, k.metadata);
  });

  await mongoose.disconnect();
};

inspect().catch(console.error);
