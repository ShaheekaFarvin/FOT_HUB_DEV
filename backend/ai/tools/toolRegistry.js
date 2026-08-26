const tools = [
  {
    name: 'searchAnnouncements',
    description: 'Retrieve and search active faculty announcements from the database. Call with {} for latest announcements, or provide query/category.',
  },
  {
    name: 'checkVotingEligibility',
    description: 'Check whether the current student is eligible to vote in ongoing faculty elections.',
  },
  {
    name: 'searchLostItems',
    description: 'Retrieve and search reported active lost and found items from the database. Call with {} for recent items, or provide query/type/category.',
  },
  {
    name: 'submitComplaint',
    description: 'Submit a student complaint to the appropriate administrator.',
  },
  {
    name: 'getComplaintStatus',
    description: 'Get the status of submitted complaints for the current authenticated student.',
  },
  {
    name: 'getNotifications',
    description: 'Retrieve latest announcements and complaint status updates for the current student.',
  },
];

const getAvailableTools = () => tools;

const functionDeclarations = [
  {
    name: 'searchAnnouncements',
    description: 'Retrieve and search active faculty announcements from the live database. Always call this tool with empty arguments {} when the user asks for announcements, latest notices, campus updates, emergency alerts, or academic posts. You can optionally supply query or category.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional search keyword (e.g. "exam", "water", "wifi", "deadline")' },
        category: { type: 'string', description: 'Optional category filter: "General", "Academic", "Event", "Emergency", "Election"' },
      },
    },
  },
  {
    name: 'checkVotingEligibility',
    description: 'Check whether the current student is eligible to vote in faculty elections based on their department.',
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
    description: 'Retrieve and search active lost and found items from the live database. Call with empty arguments {} when user asks for lost/found items, or provide query/type/category filters.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional search query string (e.g. "umbrella", "phone", "wallet")' },
        type: { type: 'string', description: 'Optional type filter: "lost" or "found"' },
        category: { type: 'string', description: 'Optional category filter: "Electronics", "Books", "Clothing", "ID Card", "Keys", "Bag", "Other"' },
      },
    },
  },
  {
    name: 'submitComplaint',
    description: 'Submit a student complaint to faculty administration.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Complaint title' },
        description: { type: 'string', description: 'Detailed complaint description' },
        category: { type: 'string', description: 'Complaint category: "Academic", "Facility", "Staff", "Administration", "Other"' },
        targetAdminType: { type: 'string', description: 'Target admin authority: "hostel_warden", "union_member", "librarian", "super_admin"' },
        isAnonymous: { type: 'boolean', description: 'Whether to submit anonymously' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'getComplaintStatus',
    description: 'Get the status of submitted complaints for the current authenticated user.',
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
    description: 'Retrieve recent notifications and updates for the current user.',
    parameters: {
      type: 'object',
      properties: {
        unreadOnly: {
          type: 'boolean',
          description: 'Optional flag. Omit to retrieve all recent notifications and updates.',
        },
      },
    },
  },
];

const getGeminiFunctionDeclarations = () => functionDeclarations;

module.exports = { getAvailableTools, getGeminiFunctionDeclarations };