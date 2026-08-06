const INTENT_RULES = [
  { intent: 'CHECK_VOTING_ELIGIBILITY', tool: 'checkVotingEligibility', keywords: ['vote', 'election', 'candidate'] },
  { intent: 'SEARCH_ANNOUNCEMENTS', tool: 'searchAnnouncements', keywords: ['announcement', 'notice'] },
  { intent: 'SEARCH_LOST_ITEMS', tool: 'searchLostItems', keywords: ['lost', 'found', 'item'] },
  { intent: 'SUBMIT_COMPLAINT', tool: 'submitComplaint', keywords: ['complaint', 'complain', 'issue'] },
  { intent: 'GET_COMPLAINT_STATUS', tool: 'getComplaintStatus', keywords: ['complaint status', 'my complaint'] },
  { intent: 'GET_NOTIFICATIONS', tool: 'getNotifications', keywords: ['notification'] },
];

/**
 * @param {string} message - the user's current message
 * @returns { intent: string, tool: string|null }
 */
const routeIntent = (message) => {
  const lower = message.toLowerCase();

  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { intent: rule.intent, tool: rule.tool };
    }
  }

  return { intent: 'GENERAL_CONVERSATION', tool: null };
};

module.exports = { routeIntent };