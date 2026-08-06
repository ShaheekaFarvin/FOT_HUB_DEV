const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
  message:   { type: String, required: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  repliedAt: { type: Date, default: Date.now },
});
const complaintSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['Academic','Facility','Staff','Administration','Other'], default: 'Other' },
  status:      { type: String, enum: ['pending','in-progress','resolved','rejected'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: false },
  isPublic:    { type: Boolean, default: false },  // true = all students can see, false = admin only
  // Which admin type this complaint is addressed to. The student picks this
  // on submission. Only that admin type (+ super_admin, who sees everything)
  // can view/manage it.
  targetAdminType: {
    type: String,
    enum: ['hostel_warden', 'union_member', 'librarian', 'super_admin'],
    required: true,
    default: 'super_admin',
  },
  imageUrl:    { type: String, default: '' },
  replies:     [replySchema],
}, { timestamps: true });
module.exports = mongoose.model('Complaint', complaintSchema);
