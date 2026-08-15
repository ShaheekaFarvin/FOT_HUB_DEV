# 1. Knowledge Data Preparation

This document outlines the implementation plan for **Knowledge Data Preparation** in Phase 4 of FOT Hub. The goal of Topic 1 is to select, filter, normalize, and format existing MongoDB data into clean **Retrieval Documents** ready for vector embedding in Topic 2, without embedding private or operational database overhead.

---

## Model Inspection & Knowledge Source Selection

Based on an inspection of all 7 Mongoose schemas in `backend/models/`:

| Collection / Model | Model File | Selected for RAG? | Rationale |
| :--- | :--- | :--- | :--- |
| **Announcement** | [`Announcement.js`] | ✅ **YES** (Candidate) | Contains campus announcements, academic updates, event notices. |
| **Election** | [`Election.js`] | ✅ **YES** (Candidate) | Contains public election details, positions, and candidate manifestos. |
| **LostFound** | [`LostFound.js`] | ✅ **YES** (Candidate) | Contains public listings of lost and found items across campus. |
| **Complaint** | [`Complaint.js`] | ❌ **EXCLUDED** | Contains private student grievances, target admin communications, and sensitive issues. |
| **User** | [`User.js`] | ❌ **EXCLUDED** | Contains PII, passwords, OTPs, student index numbers, and private credentials. |
| **ActivityLog** | [`ActivityLog.js`] | ❌ **EXCLUDED** | System operational audit logs. Not semantic campus knowledge. |
| **RegistrationConfig**| [`RegistrationConfig.js`] | ❌ **EXCLUDED** | Internal system setup settings. |

---

## Controlled Identifier Mapping (`sourceId`)

To avoid ambiguity regarding MongoDB internal fields:
- Raw `_id` (ObjectId object) and `__v` are excluded from the output document's body and content string.
- `sourceId` is assigned as a controlled string representation of `record._id.toString()`. This provides a clean, controlled reference so later RAG phases (Topics 2 & 3) can map retrieved documents back to their source MongoDB records.

```text
Raw MongoDB Document
    ├── _id             → converted to string metadata (sourceId)
    ├── __v             → excluded
    ├── createdBy       → excluded
    └── ...
            ↓
Normalized Knowledge Document
    ├── source          → "announcement" | "election" | "lostFound"
    ├── sourceId        → "507f1f77bcf86cd799439011" (controlled identifier string)
    ├── title           → clean title
    ├── content         → semantic text block
    └── metadata        → model-specific metadata object
```

---

## Eligibility Rules & Data Privacy Rules

### 1. Announcement Rules
* **Eligibility Rule**: Only records where `isActive === true` are included.
* **Exclusions**: Creator references (`createdBy`), media links (`imageUrl`), internal schema fields (`__v`).
* **Text Construction**: Concatenate `title`, `category`, `priority`, and `content`.
* **Source-Specific Metadata**:
  ```json
  {
    "category": "Academic",
    "priority": "high",
    "createdAt": "2026-08-10T10:00:00.000Z",
    "updatedAt": "2026-08-10T10:00:00.000Z"
  }
  ```

### 2. Election Rules
* **Eligibility Rule**: Records where `status` is one of `['upcoming', 'ongoing', 'completed']`.
* **Exclusions**:
  * 🛑 **CRITICAL PRIVACY EXCLUSION**: The `votes` subdocument array (linking student `voter` ObjectIds to votes) is **STRICTLY EXCLUDED**.
  * Individual candidate vote counts (`candidates[].votes`) are excluded from semantic text to preserve vote secrecy and neutrality.
  * Internal fields (`createdBy`, `__v`).
* **Text Construction**: Title, election type, department scope, status, and candidate details (Name, Position, Manifesto).
* **Source-Specific Metadata**:
  ```json
  {
    "type": "University Level",
    "department": "All",
    "eligibleDepartments": ["ICT", "EET"],
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-02T00:00:00.000Z",
    "status": "upcoming",
    "candidateCount": 4
  }
  ```

### 3. LostFound Rules
* **Eligibility Rule**: Only records where `status === 'active'` are included (claimed or closed items are excluded from active retrieval).
* **Exclusions**: Internal fields (`__v`), submitter reference (`submittedBy`).
* **Text Construction**: Title, item type (lost/found), category, location, date reported, description, and contact info.
* **Source-Specific Metadata**:
  ```json
  {
    "type": "lost",
    "category": "Electronics",
    "location": "Lab 02",
    "status": "active",
    "date": "2026-08-14T00:00:00.000Z",
    "createdAt": "2026-08-14T08:30:00.000Z"
  }
  ```

---

## User Review Required

> [!IMPORTANT]
> **Data Privacy & Security Guarantee**
> - `User`, `Complaint`, `ActivityLog`, and `RegistrationConfig` models are completely barred from the Knowledge Pipeline.
> - In `Election`, student voting logs (`votes` array) are stripped before any document formatting or processing occurs.

> [!NOTE]
> **Strict Source-Specific Metadata**
> Metadata is extracted purely from the actual fields present in each respective model. No artificial or empty placeholder metadata fields are generated.

---

## Proposed Changes

### AI Knowledge Module

#### [NEW] [`knowledgeDocumentBuilder.js`]
Create the dedicated transformer component responsible for converting MongoDB records into normalized retrieval documents.

Key Functions:
- `buildAnnouncementDocument(record)`: Validates `isActive === true`, constructs clean text, extracts announcement-specific metadata.
- `buildElectionDocument(record)`: Validates status, formats election & candidate manifestos, strips `votes` array and vote tallies, extracts election-specific metadata.
- `buildLostFoundDocument(record)`: Validates `status === 'active'`, formats item description & contact details, extracts lost/found-specific metadata.
- `buildKnowledgeDocument(record, source)`: Unified entry point dispatches based on `source`. Returns `null` for ineligible records.
- `buildKnowledgeBatch(records, source)`: Utility to process arrays of MongoDB records and filter out `null` results.

---



### Manual Verification
- Verify output logs to confirm text formatting (e.g. `Title: ...`, `Category: ...`, `Content: ...`) is readable, clean, and optimized.
