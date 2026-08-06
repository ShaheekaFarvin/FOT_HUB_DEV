const { RegistrationConfig, AdminLimit } = require('../models/RegistrationConfig');
const User = require('../models/User');

// ── Get all dept+year configs ─────────────────────────────────────────
exports.getConfigs = async (req, res) => {
  try {
    const configs = await RegistrationConfig.find().sort({ department: 1, year: 1 });
    res.json(configs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Upsert a dept+year config ─────────────────────────────────────────
exports.upsertConfig = async (req, res) => {
  const { department, year, prefix, minSeq, maxSeq, isActive } = req.body;
  try {
    if (!department || !year || !prefix || !maxSeq)
      return res.status(400).json({ message: 'department, year, prefix and maxSeq are required.' });
    if (Number(minSeq) >= Number(maxSeq))
      return res.status(400).json({ message: 'minSeq must be less than maxSeq.' });

    const config = await RegistrationConfig.findOneAndUpdate(
      { department, year },
      { prefix, minSeq: Number(minSeq) || 1, maxSeq: Number(maxSeq), isActive: isActive !== false },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(config);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ── Delete a config ───────────────────────────────────────────────────
exports.deleteConfig = async (req, res) => {
  try {
    await RegistrationConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Config deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get admin limits ──────────────────────────────────────────────────
exports.getAdminLimits = async (req, res) => {
  try {
    let limits = await AdminLimit.findOne();
    if (!limits) limits = await AdminLimit.create({ wardenLimit: 10, unionLimit: 20, librarianLimit: 5 });

    // Also count current warden + union + librarian accounts
    const [wardenCount, unionCount, librarianCount] = await Promise.all([
      User.countDocuments({ role: 'admin', adminType: 'hostel_warden' }),
      User.countDocuments({ role: 'admin', adminType: 'union_member' }),
      User.countDocuments({ role: 'admin', adminType: 'librarian' }),
    ]);

    res.json({ ...limits.toObject(), wardenCount, unionCount, librarianCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Update admin limits ───────────────────────────────────────────────
exports.updateAdminLimits = async (req, res) => {
  const { wardenLimit, unionLimit, librarianLimit } = req.body;
  try {
    let limits = await AdminLimit.findOne();
    if (!limits) limits = new AdminLimit();
    if (wardenLimit    !== undefined) limits.wardenLimit    = Number(wardenLimit);
    if (unionLimit     !== undefined) limits.unionLimit     = Number(unionLimit);
    if (librarianLimit !== undefined) limits.librarianLimit = Number(librarianLimit);
    await limits.save();
    res.json(limits);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ── Public: validate a registration number during register ────────────
// Called from authController — not a route
exports.validateRegNumber = async (regNumber, department, year) => {
  // Find active config for this dept+year
  const config = await RegistrationConfig.findOne({ department, year, isActive: true });
  if (!config) return null; // no config set = no restriction

  // Parse the submitted reg number: prefix + /seq
  // e.g. "ICT/2024/001" — prefix="ICT/2024", seq=1
  // Clean up both sides so stray spaces (from admin config or user typing)
  // never cause a false "doesn't match" error.
  const prefix    = String(config.prefix || '').trim().replace(/\s+/g, '');
  const regClean  = String(regNumber || '').trim().replace(/\s+/g, '').toUpperCase();
  const prefixUp  = prefix.toUpperCase();
  if (!regClean.startsWith(prefixUp + '/')) {
    return `Registration number must start with "${prefix}/" for ${department} ${year}.`;
  }
  const seqStr = regClean.slice(prefixUp.length + 1); // "001"
  const seq    = parseInt(seqStr, 10);
  if (isNaN(seq)) return `Invalid sequence number in registration number.`;
  if (seq < config.minSeq || seq > config.maxSeq) {
    return `Registration number sequence must be between ${String(config.minSeq).padStart(3,'0')} and ${String(config.maxSeq).padStart(3,'0')} for ${department} ${year}.`;
  }
  return null; // valid
};

// ── Public: validate admin count ──────────────────────────────────────
exports.validateAdminCount = async (adminType) => {
  const limits = await AdminLimit.findOne();
  if (!limits) return null; // no limits set

  if (adminType === 'hostel_warden') {
    const count = await User.countDocuments({ role: 'admin', adminType: 'hostel_warden' });
    if (count >= limits.wardenLimit)
      return `Maximum number of Hostel Wardens (${limits.wardenLimit}) has been reached.`;
  }
  if (adminType === 'union_member') {
    const count = await User.countDocuments({ role: 'admin', adminType: 'union_member' });
    if (count >= limits.unionLimit)
      return `Maximum number of Union Members (${limits.unionLimit}) has been reached.`;
  }
  if (adminType === 'librarian') {
    const count = await User.countDocuments({ role: 'admin', adminType: 'librarian' });
    if (count >= limits.librarianLimit)
      return `Maximum number of Librarians (${limits.librarianLimit}) has been reached.`;
  }
  return null;
};
