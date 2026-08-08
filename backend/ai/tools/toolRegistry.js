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

module.exports = { getAvailableTools };