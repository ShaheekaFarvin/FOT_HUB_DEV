const mongoose = require('mongoose');
const lostFoundSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['lost','found'], required: true },
  category:    { type: String, enum: ['Electronics','Books','Clothing','ID Card','Keys','Bag','Other'], default: 'Other' },
  location:    { type: String, required: true },
  date:        { type: Date, required: true },
  contactInfo: { type: String },
  imageUrl:    { type: String },
  status:      { type: String, enum: ['active','claimed','closed'], default: 'active' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('LostFound', lostFoundSchema);
