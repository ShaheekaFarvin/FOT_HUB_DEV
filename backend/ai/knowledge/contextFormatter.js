
const SOURCE_LABELS = {
  announcement: 'Announcement',
  election: 'Election',
  lostFound: 'Lost & Found',
};

const formatSourceLabel = (source) => SOURCE_LABELS[source] || source;

const EMPTY_MESSAGE =
  '(No relevant campus knowledge documents were retrieved from the database for this query.)';


const formatSingleResult = (result) => {
  const label = formatSourceLabel(result.source);
  return `[Source: ${label}]\nTitle: ${result.title}\nContent:\n${result.content}`;
};


const formatNumberedResult = (result, index) => {
  const label = formatSourceLabel(result.source);
  return `--- Result ${index + 1} ---\nSource: ${label}\nTitle: ${result.title}\nContent:\n${result.content}`;
};

/**
 * Formats an array of semantic search results into the "Retrieved
 * Knowledge:" block consumed by promptBuilder.buildPrompt().
 *
 * Only `source`, `title`, and `content` are ever read from each result —
 * this guarantees internal fields (Mongo `_id`, `__v`, raw `embedding`
 * vectors, `metadata`, similarity `score`) can never leak into the prompt,
 * even if a caller accidentally passes a raw document through.
 *
 * @param {Array<{ source: string, title: string, content: string }>} results
 * @returns {string}
 */
const formatRetrievedKnowledge = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return `Retrieved Knowledge:\n${EMPTY_MESSAGE}`;
  }

  if (results.length === 1) {
    return `Retrieved Knowledge:\n\n${formatSingleResult(results[0])}`;
  }

  const blocks = results.map(formatNumberedResult).join('\n\n');
  return `Retrieved Knowledge:\n\n${blocks}`;
};

module.exports = { formatRetrievedKnowledge, SOURCE_LABELS };