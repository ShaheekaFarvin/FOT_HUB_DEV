const { getAvailableTools } = require('./toolRegistry');
const { searchAnnouncements } = require('../../services/announcementService');
const { checkStudentVotingEligibility } = require('../../services/electionService');
const { searchLostFoundItems } = require('../../services/lostFoundService');
const { submitComplaint, getUserComplaints } = require('../../services/complaintService');
const { getUserNotifications } = require('../../services/notificationService');

const USER_SCOPED_TOOLS = ['submitComplaint', 'getComplaintStatus', 'checkVotingEligibility', 'getNotifications'];

const REQUIRED_ARGS = {
  submitComplaint: ['title', 'description'],
};

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

/**
 * Adapter tool handlers connecting Gemini function calls to the shared backend service layer.
 */
const TOOL_HANDLERS = {
  searchAnnouncements: async (args) => {
    const results = await searchAnnouncements({
      query: args.query,
      category: args.category,
      limit: 25,
    });
    return { success: true, data: results };
  },

  checkVotingEligibility: async (args, userContext) => {
    try {
      const result = await checkStudentVotingEligibility(userContext, {
        electionId: args.electionId,
      });
      return { success: true, data: result };
    } catch (err) {
      if (err.statusCode === 404 || err.message.includes('not found')) {
        return { success: false, error: 'Election not found.' };
      }
      throw err;
    }
  },

  searchLostItems: async (args) => {
    const results = await searchLostFoundItems({
      query: args.query,
      type: args.type,
      category: args.category,
      limit: 10,
    });
    return { success: true, data: results };
  },

  submitComplaint: async (args, userContext) => {
    const complaint = await submitComplaint(
      {
        title: args.title,
        description: args.description,
        category: args.category,
        targetAdminType: args.targetAdminType,
        isAnonymous: args.isAnonymous,
      },
      userContext
    );
    return { success: true, data: complaint };
  },

  getComplaintStatus: async (args, userContext) => {
    const results = await getUserComplaints(userContext, {
      complaintId: args.complaintId,
    });
    return { success: true, data: results };
  },

  getNotifications: async (args, userContext) => {
    const data = await getUserNotifications(userContext, {
      unreadOnly: args.unreadOnly,
      limit: 5,
    });
    return { success: true, data };
  },
};

/**
 * Validates and executes tool calls against the shared backend service layer.
 *
 * @param {object} toolCall - { name: string, arguments: object }
 * @param {object} userContext - Authenticated user context
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
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