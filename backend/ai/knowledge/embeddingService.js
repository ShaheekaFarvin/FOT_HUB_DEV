const { GoogleGenAI } = require('@google/genai');

const EMBEDDING_MODEL = 'text-embedding-004';
const EXPECTED_DIMENSIONS = 768;

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('embeddingService: GEMINI_API_KEY is not set.');
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const isValidVector = (vector) =>
  Array.isArray(vector) &&
  vector.length === EXPECTED_DIMENSIONS &&
  vector.every((n) => typeof n === 'number' && Number.isFinite(n));

const generateEmbedding = async (text, taskType = 'RETRIEVAL_DOCUMENT') => {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('embeddingService.generateEmbedding: text must be a non-empty string.');
  }

  let response;
  try {
    const ai = getClient();
    response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: { taskType },
    });
  } catch (err) {
    throw new Error(`embeddingService.generateEmbedding: API call failed — ${err.message}`);
  }

  const vector = response?.embeddings?.[0]?.values;
  if (!isValidVector(vector)) {
    throw new Error('embeddingService.generateEmbedding: received an invalid embedding vector from the API.');
  }

  return vector;
};

const generateBatchEmbeddings = async (texts, taskType = 'RETRIEVAL_DOCUMENT') => {
  if (!Array.isArray(texts)) {
    throw new Error('embeddingService.generateBatchEmbeddings: texts must be an array of strings.');
  }

  const results = [];
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text, taskType);
      results.push({ text, embedding, success: true });
    } catch (err) {
      results.push({ text, embedding: null, success: false, error: err.message });
    }
  }
  return results;
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  EMBEDDING_MODEL,
  EXPECTED_DIMENSIONS,
};