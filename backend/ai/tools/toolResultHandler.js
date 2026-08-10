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

  return {
    success: false,
    error: typeof toolResult.error === 'string' && toolResult.error ? toolResult.error : 'Tool execution failed.',
  };
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

    const config = {};
    if (Array.isArray(functionDeclarations) && functionDeclarations.length > 0) {
      config.tools = [{ functionDeclarations }];
    }

    const finalResponse = await client.models.generateContent({
      model,
      contents,
      config,
    });

    const text = finalResponse?.text?.trim();
    if (!text) {
      return FALLBACK_TEXT;
    }
    return text;
  } catch (err) {
    return FALLBACK_TEXT;
  }
};

module.exports = { handleToolResult, normalizeToolResult, buildContents };