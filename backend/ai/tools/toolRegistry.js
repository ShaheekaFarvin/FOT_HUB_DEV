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
        query: { type: 'string' },
        category: { type: 'string' },
      },
    },
  },
  {
    name: 'checkVotingEligibility',
    description: 'Check whether the current student is eligible to vote',
    parameters: {
      type: 'object',
      properties: {
        electionId: { type: 'string' },
      },
    },
  },
  {
    name: 'searchLostItems',
    description: 'Search reported lost and found items',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string' },
        category: { type: 'string' },
      },
    },
  },
  {
    name: 'submitComplaint',
    description: 'Submit a student complaint',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        targetAdminType: { type: 'string' },
        isAnonymous: { type: 'boolean' },
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
        complaintId: { type: 'string' },
      },
    },
  },
  {
    name: 'getNotifications',
    description: 'Retrieve notifications for the current user',
    parameters: {
      type: 'object',
      properties: {
        unreadOnly: { type: 'boolean' },
      },
    },
  },
];

const getGeminiFunctionDeclarations = () => functionDeclarations;

module.exports = { getAvailableTools, getGeminiFunctionDeclarations };