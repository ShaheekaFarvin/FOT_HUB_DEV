require('dotenv').config();
const mongoose = require('mongoose');

const Announcement = require('../models/Announcement');
const Election = require('../models/Election');
const LostFound = require('../models/LostFound');

const { buildVectorizedBatch } = require('../ai/knowledge/vectorizedKnowledgeBuilder');
const knowledgeRepository = require('../ai/knowledge/knowledgeRepository');


const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

const loadEligibleRecords = async () => {
  const [announcements, elections, lostFoundItems] = await Promise.all([
    Announcement.find({ isActive: true }),
    Election.find({ status: { $in: ['upcoming', 'ongoing', 'completed'] } }),
    LostFound.find({ status: 'active' }),
  ]);

  return { announcements, elections, lostFoundItems };
};

const runPipeline = async () => {
  const summary = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  const { announcements, elections, lostFoundItems } = await loadEligibleRecords();
  const totalRecords = announcements.length + elections.length + lostFoundItems.length;
  console.log(`📄 Found ${totalRecords} eligible records to index ` +
    `(announcements: ${announcements.length}, elections: ${elections.length}, lostFound: ${lostFoundItems.length}).`);

  const sourceGroups = [
    { source: 'announcement', records: announcements },
    { source: 'election', records: elections },
    { source: 'lostFound', records: lostFoundItems },
  ];

  for (const { source, records } of sourceGroups) {
    if (!records.length) continue;

    
    const vectorizedDocs = await buildVectorizedBatch(records, source);
    const droppedCount = records.length - vectorizedDocs.length;
    if (droppedCount > 0) {
      summary.errors.push({
        source,
        sourceId: null,
        error: `${droppedCount} record(s) were dropped during build/embedding (ineligible or embedding failure).`,
      });
    }

    if (vectorizedDocs.length) {
      const result = await knowledgeRepository.upsertBatch(vectorizedDocs);
      summary.inserted += result.inserted;
      summary.updated += result.updated;
      summary.skipped += vectorizedDocs.length - result.inserted - result.updated;
    }

    console.log(`   … indexed ${vectorizedDocs.length}/${records.length} "${source}" records.`);
  }

  return summary;
};

/* ─── report ─────────────────────────────────────────────────────── */
const printSummary = (summary) => {
  console.log('\n=== Knowledge Indexing Summary ===');
  console.table([
    { Inserted: summary.inserted, Updated: summary.updated, Skipped: summary.skipped, Errors: summary.errors.length },
  ]);

  if (summary.errors.length) {
    console.log('\n⚠️  Errors:');
    summary.errors.forEach((e) => {
      console.log(`   [${e.source}${e.sourceId ? `:${e.sourceId}` : ''}] ${e.error}`);
    });
  }
};

/* ─── entry point ────────────────────────────────────────────────── */
(async () => {
  try {
    await connectDB();
    const summary = await runPipeline();
    printSummary(summary);
    process.exit(summary.errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Indexing pipeline failed:', err.message);
    process.exit(1);
  }
})();