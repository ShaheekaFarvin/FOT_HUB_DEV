const Announcement = require('../../models/Announcement');
const Election = require('../../models/Election');
const LostFound = require('../../models/LostFound');
const Complaint = require('../../models/Complaint');
const { getAvailableTools } = require('./toolRegistry');

const USER_SCOPED_TOOLS = ['submitComplaint', 'getComplaintStatus', 'checkVotingEligibility', 'getNotifications'];

const REQUIRED_ARGS = {
  submitComplaint: ['title', 'description'],
};

const ALLOWED_COMPLAINT_TARGETS = ['hostel_warden', 'union_member', 'librarian', 'super_admin'];

const getUserId = (userContext) => {
  if (!userContext || typeof userContext !== 'object') {
    return null;
  }
  const raw = userContext._id !== undefined && userContext._id !== null ? userContext._id : userContext.id;
  if (raw === undefined || raw === null) {
    return null;
  }
  return raw.toString();
};

const runSearchAnnouncements = async (args) => {
  const filter = { isActive: true };
  if (args.category) {
    filter.category = args.category;
  }
  if (args.query) {
    filter.$or = [
      { title: { $regex: args.query, $options: 'i' } },
      { content: { $regex: args.query, $options: 'i' } },
    ];
  }
  const results = await Announcement.find(filter).sort({ createdAt: -1 }).limit(10);
  return { success: true, data: results };
};

const runCheckVotingEligibility = async (args, userContext) => {
  const department = userContext.department;

  if (args.electionId) {
    const election = await Election.findById(args.electionId);
    if (!election) {
      return { success: false, error: 'Election not found.' };
    }
    return {
      success: true,
      data: {
        electionId: args.electionId,
        title: election.title,
        status: election.status,
        eligible: election.isDepartmentEligible(department),
      },
    };
  }

  const elections = await Election.find({ status: 'ongoing' });
  const eligible = elections
    .filter((election) => election.isDepartmentEligible(department))
    .map((election) => ({
      id: election._id?.toString(),
      title: election.title,
      status: election.status,
    }));

  return { success: true, data: eligible };
};

const runSearchLostItems = async (args) => {
  const filter = { status: 'active' };
  if (args.type) {
    filter.type = args.type;
  }
  if (args.category) {
    filter.category = args.category;
  }
  if (args.query) {
    filter.title = { $regex: args.query, $options: 'i' };
  }
  const results = await LostFound.find(filter).sort({ createdAt: -1 }).limit(10);
  return { success: true, data: results };
};

const runSubmitComplaint = async (args, userContext) => {
  const userId = getUserId(userContext);
  const targetAdminType = ALLOWED_COMPLAINT_TARGETS.includes(args.targetAdminType)
    ? args.targetAdminType
    : 'super_admin';

  const complaint = await Complaint.create({
    title: args.title,
    description: args.description,
    category: args.category,
    targetAdminType,
    isAnonymous: Boolean(args.isAnonymous),
    submittedBy: userId,
  });

  return { success: true, data: complaint };
};

const runGetComplaintStatus = async (args, userContext) => {
  const userId = getUserId(userContext);
  const filter = { submittedBy: userId };
  if (args.complaintId) {
    filter._id = args.complaintId;
  }
  const results = await Complaint.find(filter).sort({ createdAt: -1 });
  return { success: true, data: results };
};

const runGetNotifications = async (args, userContext) => {
  const userId = getUserId(userContext);
  const [announcements, complaintUpdates] = await Promise.all([
    Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
    Complaint.find({ submittedBy: userId }).sort({ updatedAt: -1 }).limit(5),
  ]);
  return {
    success: true,
    data: { announcements, complaintUpdates },
  };
};

const TOOL_HANDLERS = {
  searchAnnouncements: (args) => runSearchAnnouncements(args),
  checkVotingEligibility: (args, userContext) => runCheckVotingEligibility(args, userContext),
  searchLostItems: (args) => runSearchLostItems(args),
  submitComplaint: (args, userContext) => runSubmitComplaint(args, userContext),
  getComplaintStatus: (args, userContext) => runGetComplaintStatus(args, userContext),
  getNotifications: (args, userContext) => runGetNotifications(args, userContext),
};

const executeTool = async (toolCall, userContext) => {
  try {
    if (!toolCall || typeof toolCall !== 'object') {
      return { success: false, error: 'Invalid tool call: expected { name, arguments }.' };
    }

    const { name } = toolCall;
    if (typeof name !== 'string' || !name.trim()) {
      return { success: false, error: 'Invalid tool call: missing tool name.' };
    }

    const registeredNames = getAvailableTools().map((tool) => tool.name);
    if (!registeredNames.includes(name)) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    const rawArgs = toolCall.arguments;
    let safeArgs;
    if (rawArgs === undefined || rawArgs === null) {
      safeArgs = {};
    } else if (typeof rawArgs === 'object' && !Array.isArray(rawArgs)) {
      safeArgs = rawArgs;
    } else {
      return { success: false, error: `Invalid arguments for tool: ${name}` };
    }

    const requiredFields = REQUIRED_ARGS[name] || [];
    for (const field of requiredFields) {
      if (typeof safeArgs[field] !== 'string' || !safeArgs[field].trim()) {
        return { success: false, error: `Missing required argument: ${field}` };
      }
    }

    if (USER_SCOPED_TOOLS.includes(name)) {
      const userId = getUserId(userContext);
      if (!userId) {
        return { success: false, error: 'A valid user context is required for this action.' };
      }
    }

    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    return await handler(safeArgs, userContext);
  } catch (err) {
    return { success: false, error: err?.message || 'Tool execution failed.' };
  }
};

module.exports = { executeTool };