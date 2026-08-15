const toIdString = (id) => {
  if (id === undefined || id === null) {
    return '';
  }
  return typeof id.toString === 'function' ? id.toString() : String(id);
};

const buildAnnouncementDocument = (record) => {
  if (!record || record.isActive !== true) {
    return null;
  }

  const title = record.title || '';
  const category = record.category || 'General';
  const priority = record.priority || 'medium';
  const content = record.content || '';

  const textBlock = [
    `Title: ${title}`,
    `Category: ${category}`,
    `Priority: ${priority}`,
    `Content: ${content}`,
  ].join('\n');

  return {
    source: 'announcement',
    sourceId: toIdString(record._id),
    title,
    content: textBlock,
    metadata: {
      category,
      priority,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  };
};

const ELIGIBLE_ELECTION_STATUSES = ['upcoming', 'ongoing', 'completed'];

const buildElectionDocument = (record) => {
  if (!record || !ELIGIBLE_ELECTION_STATUSES.includes(record.status)) {
    return null;
  }

  const title = record.title || '';
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];

  const candidateBlocks = candidates.map(
    (candidate) =>
      `Candidate:\nName: ${candidate.name || 'N/A'}\nPosition: ${candidate.position || 'N/A'}\nManifesto: ${candidate.manifesto ? candidate.manifesto : 'No manifesto provided.'}`
  );

  const textBlock = [
    `Election: ${title}`,
    `Type: ${record.type || ''}`,
    `Department Scope: ${record.department || 'All'}`,
    `Status: ${record.status}`,
    candidates.length ? candidateBlocks.join('\n\n') : 'Candidates: None listed.',
  ].join('\n');

  return {
    source: 'election',
    sourceId: toIdString(record._id),
    title,
    content: textBlock,
    metadata: {
      type: record.type,
      department: record.department || 'All',
      eligibleDepartments: Array.isArray(record.eligibleDepartments) ? record.eligibleDepartments : [],
      startDate: record.startDate,
      endDate: record.endDate,
      status: record.status,
      candidateCount: candidates.length,
    },
  };
};

const buildLostFoundDocument = (record) => {
  if (!record || record.status !== 'active') {
    return null;
  }

  const title = record.title || '';

  const textBlock = [
    `Title: ${title}`,
    `Type: ${record.type || ''}`,
    `Category: ${record.category || 'Other'}`,
    `Location: ${record.location || ''}`,
    `Date: ${record.date instanceof Date ? record.date.toISOString() : record.date || ''}`,
    `Description: ${record.description || ''}`,
    record.contactInfo ? `Contact: ${record.contactInfo}` : null,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');

  return {
    source: 'lostFound',
    sourceId: toIdString(record._id),
    title,
    content: textBlock,
    metadata: {
      type: record.type,
      category: record.category || 'Other',
      location: record.location,
      status: record.status,
      date: record.date,
      createdAt: record.createdAt,
    },
  };
};

const KNOWLEDGE_BUILDERS = {
  announcement: buildAnnouncementDocument,
  election: buildElectionDocument,
  lostFound: buildLostFoundDocument,
};

const buildKnowledgeDocument = (record, source) => {
  const builder = KNOWLEDGE_BUILDERS[source];
  if (!builder) {
    return null;
  }
  return builder(record);
};

const buildKnowledgeBatch = (records, source) => {
  if (!Array.isArray(records)) {
    return [];
  }
  return records.map((record) => buildKnowledgeDocument(record, source)).filter((doc) => doc !== null);
};

module.exports = {
  buildAnnouncementDocument,
  buildElectionDocument,
  buildLostFoundDocument,
  buildKnowledgeDocument,
  buildKnowledgeBatch,
};