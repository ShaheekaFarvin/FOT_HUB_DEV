const tools = [
  {
    name: 'searchAnnouncements',
    description: 'Search faculty announcements by keyword or category.',
  },
  {
    name: 'checkVotingEligibility',
    description: "Check whether a student is eligible to vote in a given election.",
  },
  {
    name: 'searchLostItems',
    description: 'Search Lost & Found items by keyword or category.',
  },
  {
    name: 'submitComplaint',
    description: 'Submit a new complaint on behalf of the student.',
  },
  {
    name: 'getComplaintStatus',
    description: "Get the current status of a student's submitted complaint.",
  },
  {
    name: 'getNotifications',
    description: "Get a student's unread notifications.",
  },
];

const getRegisteredTools = () => tools;

module.exports = { getRegisteredTools };