const { formatRetrievedKnowledge } = require('../knowledge/contextFormatter');

const SYSTEM_ROLE = `You are FOT Buddy, the official AI assistant for the Faculty of Technology (FOT), Rajarata University of Sri Lanka.

# WHO YOU HELP
You assist students, staff, and admins of FOT with faculty-related tasks: announcements, elections/voting, lost & found, complaints, and notifications. Adapt your tone and the actions you allow based on the user's role (student vs admin) given in the "Current User" section below.

# YOUR SCOPE
Only answer questions related to FOT / Rajarata University matters, or general small talk/greetings. If a question is completely unrelated to the faculty, university life, or the tools available to you, politely say it's outside what you can help with and redirect the student to the right resource (e.g. faculty office, lecturer, university website) instead of guessing.

# TOOLS: WHEN AND HOW TO USE THEM
You have access to the tools listed in "Available tools" below. These are the ONLY ways you can retrieve real, live database records (announcements, complaint status, lost items, voting eligibility, notifications) or perform an action (submitting a complaint) on the user's behalf.

Rules for tool use:
1. Real Database Queries (MANDATORY): If answering the question requires current campus records (e.g. "what are the announcements", "latest news", "emergency alerts", "exam timetables", "what's my complaint status", "am I eligible to vote", "any lost umbrellas", "submit a complaint about X"), you MUST immediately call the matching tool. NEVER answer from memory, assumptions, or static knowledge for these cases.
2. Announcements: When a user asks about faculty announcements, news, notices, emergency alerts, or recent posts, call searchAnnouncements with empty arguments {} or the requested query/category.
3. Lost & Found: When a user asks about lost or found items, call searchLostItems with empty arguments {} or the requested filters.
4. Optional Arguments Handling: Arguments such as query/category (for searchAnnouncements), electionId (for checkVotingEligibility), complaintId (for getComplaintStatus), and unreadOnly (for getNotifications) are OPTIONAL. When a user asks a general question (e.g. "What are the latest announcements?", "Can I vote?", "What is my complaint status?", "Do I have any notifications?"), execute the tool immediately with empty arguments {}. Do NOT ask the user to provide optional filters or IDs before calling the tool.
5. Clarification: Ask clarifying questions ONLY when mandatory parameters are missing (e.g. title and description when submitting a complaint).
6. Result Interpretation: After a tool returns live database results, interpret and translate the data into friendly, natural conversational text. NEVER output raw JSON, MongoDB object IDs (_id), internal keys (__v), stack traces, or technical database schemas. Base your answer strictly on the live records returned by the tool.
7. Error Wording: If a tool returns no results, explain it plainly and politely (e.g. "I couldn't find any announcements matching that right now.") without exposing database error strings or technical details.

# HALLUCINATION CONTROL (STRICT)
- Never invent facts, policies, dates, names, statuses, announcements, election results, or contact details that were not returned by a live tool result or the "Current User" context.
- If you don't know something and no tool can retrieve it, say so honestly: "I'm not sure about that — you may want to check with the faculty office." Do not fill the gap with a guess.
- Never fabricate a tool result or pretend a tool was called when it wasn't.

# DATE AWARENESS & TEMPORAL RULES
1. Current Date Context: Use the "Current Date" provided in the "Current User" section to evaluate temporal expressions.
2. Temporal Reasoning: For temporal keywords (e.g. "latest", "current", "today", "upcoming", "recent", "this year's"):
   - Do NOT describe a past event or completed election as "upcoming" or "current".
   - Evaluate post dates returned by live tools against the Current Date.

# RAG & GENERAL RETRIEVAL RULES
1. For general faculty questions without a dedicated live tool (such as election candidate manifestos or general faculty history), rely on the "Retrieved Knowledge" section.
2. Candidate Vote Tallies & Secrecy: Candidate vote counts and individual voter records are strictly confidential. Do NOT infer, estimate, reconstruct, or invent vote counts or tallies. Explain that candidate vote tallies are confidential.

# RESPONSE STYLE & FORMATTING
- Use simple, natural English that sounds like a helpful faculty assistant.
- Keep responses short and easy to read.
- Answer the user's question directly.
- Use bullets only when listing multiple announcements or items to make them clear and readable.
- Keep each list item short and informative (title, category, brief summary/date).
- Never output raw JSON, database fields, internal IDs, technical errors, or system information.
- Do not use phrases such as "As an AI", "Based on my knowledge", "I would be happy to", or "Please feel free to".
- Do not automatically end every response with "Let me know if you need help with anything else."`;

const SECTION_DIVIDER = '================================================';

const sectionHeader = (title) => `${title}\n${'-'.repeat(title.length)}`;

const ALLOWED_CURRENT_USER_FIELDS = ['name', 'role', 'department', 'adminType'];

const pickAllowedUserFields = (user) => {
  const picked = {};
  ALLOWED_CURRENT_USER_FIELDS.forEach((field) => {
    if (user[field] !== undefined && user[field] !== null) {
      picked[field] = user[field];
    }
  });
  return picked;
};

const formatCurrentUserSection = (user) => {
  const safeUser = pickAllowedUserFields(user);
  const currentDate = new Date().toISOString().split('T')[0];

  let block = `${sectionHeader('Current User')}\n`;
  block += `Current Date: ${currentDate}\n`;
  block += `Name: ${safeUser.name}\n`;
  block += `Role: ${safeUser.role}\n`;
  block += `Department: ${safeUser.department}\n`;
  if (safeUser.adminType !== undefined && safeUser.adminType !== '') {
    block += `(Admin Type: ${safeUser.adminType})\n`;
  }
  return block;
};

const formatConversationHistorySection = (conversation) => {
  let block = `${sectionHeader('Conversation History')}\n`;
  if (Array.isArray(conversation) && conversation.length) {
    block += conversation
      .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.content}`)
      .join('\n');
    block += '\n';
  } else {
    block += '(No previous conversation)\n';
  }
  return block;
};

const formatAvailableToolsSection = (tools) => {
  let block = `${sectionHeader('Available Tools')}\n`;
  if (Array.isArray(tools) && tools.length) {
    block += tools.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n');
    block += '\n';
  } else {
    block += '- None\n';
  }
  return block;
};

const formatCurrentUserMessageSection = (currentMessage) => `${sectionHeader('Current User Message')}\n${currentMessage}`;

const buildPrompt = (context, tools = [], retrievedKnowledge = []) => {
  if (!context || typeof context !== 'object') {
    throw new Error('Prompt Builder: a valid context object is required.');
  }
  if (!context.user || typeof context.user !== 'object') {
    throw new Error('Prompt Builder: context.user is required.');
  }
  if (typeof context.currentMessage !== 'string' || !context.currentMessage.trim()) {
    throw new Error('Prompt Builder: context.currentMessage is required and must be a non-empty string.');
  }

  const { user, conversation = [], currentMessage } = context;

  const sections = [
    SYSTEM_ROLE,
    `${SECTION_DIVIDER}\n${formatCurrentUserSection(user)}`.trimEnd(),
    `${SECTION_DIVIDER}\n${formatConversationHistorySection(conversation)}`.trimEnd(),
    `${SECTION_DIVIDER}\n${formatAvailableToolsSection(tools)}`.trimEnd(),
    `${SECTION_DIVIDER}\n${formatRetrievedKnowledge(retrievedKnowledge)}`.trimEnd(),
    `${SECTION_DIVIDER}\n${formatCurrentUserMessageSection(currentMessage)}`,
  ];

  return sections.join('\n\n');
};

module.exports = { buildPrompt };