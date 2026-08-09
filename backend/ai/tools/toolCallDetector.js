const { getAvailableTools } = require('./toolRegistry');

const extractRawFunctionCall = (geminiResponse) => {
  if (!geminiResponse || typeof geminiResponse !== 'object') {
    return null;
  }

  const fnCalls =
    typeof geminiResponse.functionCalls === 'function'
      ? geminiResponse.functionCalls()
      : geminiResponse.functionCalls;

  if (Array.isArray(fnCalls) && fnCalls.length > 0) {
    return fnCalls[0];
  }

  if (geminiResponse.functionCall && typeof geminiResponse.functionCall === 'object') {
    return geminiResponse.functionCall;
  }

  const parts = geminiResponse.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const part = parts.find((p) => p && typeof p === 'object' && p.functionCall);
    if (part) {
      return part.functionCall;
    }
  }

  return null;
};

const detectToolCall = (geminiResponse) => {
  const rawCall = extractRawFunctionCall(geminiResponse);

  if (!rawCall || typeof rawCall !== 'object') {
    return { isToolCall: false, toolCall: null };
  }

  const name = rawCall.name;
  if (typeof name !== 'string' || !name.trim()) {
    return { isToolCall: false, toolCall: null, error: 'Malformed tool call: missing function name' };
  }

  const availableNames = getAvailableTools().map((tool) => tool.name);
  if (!availableNames.includes(name)) {
    return { isToolCall: false, toolCall: null, error: `Unknown tool: ${name}` };
  }

  const rawArgs = rawCall.args !== undefined ? rawCall.args : rawCall.arguments;

  let normalizedArgs;
  if (rawArgs === undefined || rawArgs === null) {
    normalizedArgs = {};
  } else if (typeof rawArgs === 'object' && !Array.isArray(rawArgs)) {
    normalizedArgs = rawArgs;
  } else {
    return { isToolCall: false, toolCall: null, error: `Invalid arguments type for tool call: ${name}` };
  }

  return {
    isToolCall: true,
    toolCall: {
      name,
      arguments: normalizedArgs,
    },
  };
};

module.exports = { detectToolCall };