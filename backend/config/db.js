const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // ── Drop stale indexes left over from old schema ──────────────────
    try {
      const usersCol = conn.connection.collection('users');
      const indexes  = await usersCol.indexes();

      // Drop any index on the old 'studentId' field
      for (const idx of indexes) {
        if (idx.key && idx.key.studentId !== undefined) {
          await usersCol.dropIndex(idx.name);
          console.log(`🧹 Dropped stale index: ${idx.name}`);
        }
      }
    } catch (idxErr) {
      // Non-fatal — log and continue
      console.warn('⚠️  Index cleanup skipped:', idxErr.message);
    }
    // ─────────────────────────────────────────────────────────────────

  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
