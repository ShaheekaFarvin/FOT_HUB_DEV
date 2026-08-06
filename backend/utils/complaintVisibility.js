// Shared helper: decides whether the real submitter identity of a complaint
// should be shown to the requesting user, or masked as "Anonymous".
//
// Rule: if a complaint is marked isAnonymous, ONLY the super_admin can see
// who actually submitted it. Every other viewer (other admin types,
// other students) sees it labelled as Anonymous. Non-anonymous complaints
// always show the real submitter to everyone (complaints are public, like
// announcements).

const canSeeRealIdentity = (requester) =>
  requester?.role === 'admin' && requester?.adminType === 'super_admin';

// complaint: a Mongoose doc (already populated with submittedBy) or plain object.
// requester: req.user
const maskComplaint = (complaint, requester) => {
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };

  if (obj.isAnonymous && !canSeeRealIdentity(requester)) {
    obj.submittedBy = { _id: null, name: 'Anonymous', anonymous: true };
  }

  return obj;
};

const maskComplaints = (complaints, requester) => complaints.map((c) => maskComplaint(c, requester));

module.exports = { maskComplaint, maskComplaints, canSeeRealIdentity };
