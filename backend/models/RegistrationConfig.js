const mongoose = require('mongoose');

/*
  Stores registration number range config per department + year batch.
  Example:
    department: 'ICT', year: '1st Year',
    prefix: 'ICT/2024', minSeq: 1, maxSeq: 124
  → allows ICT/2024/001 to ICT/2024/124
  
  Also stores count limits for admin types:
    wardenLimit, unionLimit
*/

const deptYearConfigSchema = new mongoose.Schema({
  department: { type: String, required: true, enum: ['BPT','EET','FDT','ICT','MTT'] },
  year:       { type: String, required: true, enum: ['1st Year','2nd Year','3rd Year','4th Year'] },
  prefix:     { type: String, required: true },   // e.g. "ICT/2024"
  minSeq:     { type: Number, required: true, default: 1 },
  maxSeq:     { type: Number, required: true },   // e.g. 124
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

// Unique per dept+year
deptYearConfigSchema.index({ department: 1, year: 1 }, { unique: true });

const adminLimitSchema = new mongoose.Schema({
  wardenLimit:    { type: Number, default: 10 },   // max hostel_warden accounts
  unionLimit:     { type: Number, default: 20 },   // max union_member accounts
  librarianLimit: { type: Number, default: 5 },    // max librarian accounts
}, { timestamps: true });

module.exports = {
  RegistrationConfig: mongoose.model('RegistrationConfig', deptYearConfigSchema),
  AdminLimit:         mongoose.model('AdminLimit', adminLimitSchema),
};
