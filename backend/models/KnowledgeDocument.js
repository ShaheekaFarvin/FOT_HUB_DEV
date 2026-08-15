const mongoose = require('mongoose');


const knowledgeDocumentSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['announcement', 'election', 'lostFound'],
    required: true,
    index: true,
  },
  sourceId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length === 768,
      message: 'Embedding vector must be an array of exactly 768 numbers.',
    },
  },
}, { timestamps: true });


knowledgeDocumentSchema.index({ source: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);