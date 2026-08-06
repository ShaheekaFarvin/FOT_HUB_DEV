const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },   // e.g. "Created Election", "Deleted User"
  category: {
    type: String,
    enum: ['election', 'announcement', 'complaint', 'lost-found', 'user'],
    required: true,
  },
  detail: { type: String, default: '' },       // e.g. election title, user name
  icon: { type: String, default: 'activity' }, // icon key for frontend
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
