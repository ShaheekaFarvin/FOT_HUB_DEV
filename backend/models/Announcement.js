const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  content:   { type: String, required: true },
  category:  { type: String, enum: ['General','Academic','Event','Emergency','Election'], default: 'General' },
  priority:  { type: String, enum: ['low','medium','high'], default: 'medium' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl:  { type: String },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Announcement', announcementSchema);
