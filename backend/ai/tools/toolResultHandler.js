const FALLBACK_TEXT =
  "I found the information but couldn't summarize it right now. Please try again shortly.";

const normalizeToolResult = (toolResult) => {
  if (!toolResult || typeof toolResult !== 'object' || Array.isArray(toolResult)) {
    return { success: false, error: 'Tool did not return a valid result.' };
  }

  if (typeof toolResult.success !== 'boolean') {
    return { success: false, error: 'Tool result is missing a success flag.' };
  }

  if (toolResult.success) {
    return {
      success: true,
      data: toolResult.data !== undefined ? toolResult.data : null,
    };
  }

  const rawErr = typeof toolResult.error === 'string' ? toolResult.error : '';
  const isTechnicalErr = /mongo|sql|stack|syntaxerror|typeerror|connection|econnrefused|failed to connect/i.test(rawErr);
  const sanitizedError = isTechnicalErr
    ? 'Unable to retrieve information due to a temporary service issue.'
    : (rawErr.trim() || 'Tool execution failed.');

  return {
    success: false,
    error: sanitizedError,
  };
};

const formatDirectToolFallback = (toolName, safeToolResult) => {
  if (!safeToolResult || !safeToolResult.success) {
    return safeToolResult?.error || FALLBACK_TEXT;
  }
  const data = safeToolResult.data;
  if (data === null || data === undefined) {
    return 'No records were returned.';
  }

  if (toolName === 'searchLostItems' && Array.isArray(data)) {
    if (!data.length) return 'No matching active lost or found items were found.';
    const items = data.map((item) => `- ${item.title || 'Item'} (${item.type || 'lost'}): Location: ${item.location || 'N/A'}`);
    return items.join('\n');
  }

  if (toolName === 'searchAnnouncements' && Array.isArray(data)) {
    if (!data.length) return 'No matching announcements were found.';
    const items = data.map((ann) => `- [${ann.category || 'General'}] ${ann.title || 'Announcement'}: ${ann.content || ''}`);
    return items.join('\n');
  }

  if (toolName === 'getComplaintStatus' && Array.isArray(data)) {
    if (!data.length) return 'You have not submitted any complaints matching this account.';
    const items = data.map((c) => `- ${c.title || 'Complaint'}: Status is ${c.status || 'Pending'}.`);
    return items.join('\n');
  }

  if (toolName === 'getNotifications' && typeof data === 'object') {
    const annCount = Array.isArray(data.announcements) ? data.announcements.length : 0;
    const compCount = Array.isArray(data.complaintUpdates) ? data.complaintUpdates.length : 0;
    return `You have ${annCount} active announcement(s) and ${compCount} complaint update(s).`;
  }

  if (toolName === 'checkVotingEligibility') {
    if (typeof data === 'object' && data.title) {
      return `For ${data.title}, you are ${data.eligible ? 'eligible' : 'not eligible'} to vote.`;
    }
    if (Array.isArray(data)) {
      if (!data.length) return 'There are currently no ongoing elections available for voting.';
      const items = data.map((e) => `- ${e.title}: ${e.status}`);
      return items.join('\n');
    }
  }

  if (toolName === 'submitComplaint' && typeof data === 'object') {
    return `Your complaint "${data.title || 'Complaint'}" has been submitted successfully.`;
  }

  return FALLBACK_TEXT;
};

const buildModelTurn = (geminiResponse, toolCall) => {
  const candidateContent = geminiResponse?.candidates?.[0]?.content;
  if (candidateContent && typeof candidateContent === 'object') {
    return candidateContent;
  }
  return {
    role: 'model',
    parts: [{ functionCall: { name: toolCall.name, args: toolCall.arguments || {} } }],
  };
};

const buildContents = (prompt, geminiResponse, toolCall, safeToolResult) => [
  { role: 'user', parts: [{ text: prompt }] },
  buildModelTurn(geminiResponse, toolCall),
  {
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: toolCall.name,
          response: safeToolResult,
        },
      },
    ],
  },
];

const handleToolResult = async ({
  client,
  model,
  prompt,
  geminiResponse,
  toolCall,
  toolResult,
  functionDeclarations,
}) => {
  try {
    if (!toolCall || typeof toolCall.name !== 'string' || !toolCall.name.trim()) {
      return FALLBACK_TEXT;
    }
    if (!client || !client.models || typeof client.models.generateContent !== 'function') {
      return FALLBACK_TEXT;
    }

    const safeToolResult = normalizeToolResult(toolResult);
    const contents = buildContents(prompt, geminiResponse, toolCall, safeToolResult);

    // Hardening H4: Omit functionDeclarations from config during the summary turn
    // to force Gemini into a text-only turn and prevent recursive tool call loops.
    const config = {};

    const finalResponse = await client.models.generateContent({
      model,
      contents,
      config,
    });

    const text = finalResponse?.text?.trim();
    if (!text) {
      console.error('[TOOL RESULT HANDLER] Gemini returned empty text for tool summary turn. Executing direct safe tool fallback.');
      return formatDirectToolFallback(toolCall.name, safeToolResult);
    }
    return text;
  } catch (err) {
    console.error('[TOOL RESULT HANDLER] Error in Gemini tool summary generation:', err?.message || err);
    const safeToolResult = normalizeToolResult(toolResult);
    return formatDirectToolFallback(toolCall.name, safeToolResult);
  }
};

module.exports = { handleToolResult, normalizeToolResult, buildContents, formatDirectToolFallback };