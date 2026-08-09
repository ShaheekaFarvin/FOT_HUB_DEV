const INTENT_RULES = [
  {
    intent: 'COMPLAINT_STATUS',
    keywords: ['status of my complaint', 'complaint status', 'check my complaint status', 'track complaint'],
  },
  {
    intent: 'SUBMIT_COMPLAINT',
    keywords: ['submit a complaint', 'report a problem', 'report a complaint', 'file a complaint', 'complain'],
  },
  {
    intent: 'ANNOUNCEMENTS',
    keywords: ['announcement', 'announcements', 'notice', 'notices', 'faculty news'],
  },
  {
    intent: 'VOTING_ELIGIBILITY',
    keywords: ['can i vote', 'voting', 'election', 'eligible to vote', 'voter'],
  },
  {
    intent: 'LOST_AND_FOUND',
    keywords: ['lost item', 'lost my', 'find a lost', 'found item', 'lost & found', 'lost and found'],
  },
  {
    intent: 'NOTIFICATIONS',
    keywords: ['notification', 'notifications', 'unread alerts', 'my notifications'],
  },
];

const routeIntent = (message) => {
  if (typeof message !== 'string') {
    return { intent: 'UNKNOWN' };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: 'UNKNOWN' };
  }

  const lower = trimmed.toLowerCase();

  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return { intent: rule.intent };
    }
  }

  return { intent: 'UNKNOWN' };
};

module.exports = { routeIntent };