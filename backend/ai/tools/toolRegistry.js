const tools = [
  {
    name: 'searchAnnouncements',
    description: 'Search faculty announcements',
  },
  {
    name: 'checkVotingEligibility',
    description: 'Check whether the current student is eligible to vote',
  },
  {
    name: 'searchLostItems',
    description: 'Search reported lost and found items',
  },
  {
    name: 'submitComplaint',
    description: 'Submit a student complaint',
  },
  {
    name: 'getComplaintStatus',
    description: 'Get the status of a submitted complaint',
  },
  {
    name: 'getNotifications',
    description: 'Retrieve notifications for the current user',
  },
];

const getAvailableTools = () => tools;

const functionDeclarations = [
  {
    name: 'searchAnnouncements',
    description: 'Search faculty announcements',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword or query string' },
        category: { type: 'string', description: 'Category filter' },
      },
    },
  },
  {
    name: 'checkVotingEligibility',
    description: 'Check whether the current student is eligible to vote',
    parameters: {
      type: 'object',
      properties: {
        electionId: {
          type: 'string',
          description: 'Optional election ID. Omit when the user asks generally about their voting eligibility.',
        },
      },
    },
  },
  {
    name: 'searchLostItems',
    description: 'Search reported lost and found items',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        type: { type: 'string', description: 'Type filter (e.g. lost, found)' },
        category: { type: 'string', description: 'Category filter' },
      },
    },
  },
  {
    name: 'submitComplaint',
    description: 'Submit a student complaint',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Complaint title' },
        description: { type: 'string', description: 'Detailed complaint description' },
        category: { type: 'string', description: 'Complaint category' },
        targetAdminType: { type: 'string', description: 'Target admin authority' },
        isAnonymous: { type: 'boolean', description: 'Whether to submit anonymously' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'getComplaintStatus',
    description: 'Get the status of a submitted complaint',
    parameters: {
      type: 'object',
      properties: {
        complaintId: {
          type: 'string',
          description: 'Optional complaint ID. Omit when the user asks generally about their complaint statuses.',
        },
      },
    },
  },
  {
    name: 'getNotifications',
    description: 'Retrieve notifications for the current user',
    parameters: {
      type: 'object',
      properties: {
        unreadOnly: {
          type: 'boolean',
          description: 'Optional flag. Omit to retrieve all recent notifications and updates for the user.',
        },
      },
    },
  },
];

const getGeminiFunctionDeclarations = () => functionDeclarations;

module.exports = { getAvailableTools, getGeminiFunctionDeclarations };