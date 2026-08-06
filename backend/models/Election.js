const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  position:  { type: String, required: true, default: 'Member' }, // e.g. President, Secretary...
  manifesto: { type: String, default: '' },
  avatar:    { type: String, default: '' },
  votes:     { type: Number, default: 0 },
});

const voteSchema = new mongoose.Schema({
  voter:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  position:    { type: String, required: true }, // snapshot of candidate's position at vote time
  votedAt:     { type: Date, default: Date.now },
});

const electionSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  type:       { type: String, enum: ['University Level','Department Level'], required: true },
  department: { type: String, default: 'All' },
  // Which student departments are allowed to vote in this election.
  // Empty array = every department is eligible (no restriction).
  eligibleDepartments: {
    type: [String],
    enum: ['BPT', 'EET', 'FDT', 'ICT', 'MTT', 'ENT', 'BST'],
    default: [],
  },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  status:     { type: String, enum: ['upcoming','ongoing','completed'], default: 'upcoming' },
  candidates: [candidateSchema],
  votes:      [voteSchema],
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// A student is eligible to vote in this election if eligibleDepartments is
// empty (no restriction) or contains the student's department.
electionSchema.methods.isDepartmentEligible = function (studentDepartment) {
  if (!this.eligibleDepartments || this.eligibleDepartments.length === 0) return true;
  return this.eligibleDepartments.includes(studentDepartment);
};

// All distinct positions contested in this election.
electionSchema.methods.getPositions = function () {
  return [...new Set(this.candidates.map(c => c.position))];
};

electionSchema.methods.refreshStatus = function () {
  const now = new Date();
  if (now < this.startDate)       this.status = 'upcoming';
  else if (now <= this.endDate)   this.status = 'ongoing';
  else                            this.status = 'completed';
};

module.exports = mongoose.model('Election', electionSchema);
