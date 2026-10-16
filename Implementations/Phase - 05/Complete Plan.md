# Implementation Plan — Phase 5: Tool Execution & Backend Service Layer Integration

## Overview & Goal
Refactor the backend architecture so that **FOT Buddy AI Chat Agent** and the **Express REST Controllers** share a single source of truth for business logic in `backend/services/`.

Currently, `backend/ai/tools/toolExecutor.js` directly executes raw Mongoose queries that duplicate logic found across `studentController.js` and `adminController.js`. Phase 5 introduces a unified, modular Service Layer, refactors both the REST controllers and `toolExecutor.js` to consume these services, and enforces strict authentication, authorization, and data sanitization across all operations.

---

## Target Architecture

```
                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │   (REST UI & FOT Buddy) │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ REST Endpoints                │ AI Chat Endpoint
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │  studentController /  │       │   ragOrchestrator     │
     │   adminController     │       │          │            │
     └───────────┬───────────┘       │          ▼            │
                 │                   │      toolExecutor     │
                 │                   └──────────┬────────────┘
                 │                              │
                 └───────────────┬──────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Shared Service Layer  │
                     │  (backend/services/)  │
                     │                       │
                     │ • announcementService │
                     │ • complaintService    │
                     │ • electionService     │
                     │ • lostFoundService    │
                     │ • notificationService │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │    Mongoose Models    │
                     │       & MongoDB       │
                     └───────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Zero Breaking Changes to REST API**: All existing frontend REST endpoints (`/api/student/*`, `/api/admin/*`, `/api/elections/*`) must maintain their exact HTTP status codes and JSON response shapes. Controllers will simply delegate to the new service methods.

> [!NOTE]
> **Data Sanitization for AI**: When services return data to `toolExecutor`, internal MongoDB fields (`_id`, `__v`, internal passwords/hashes) are stripped or transformed into safe business views before being handed over to Gemini in `toolResultHandler`.

---

## Proposed Changes

### 1. New Backend Service Layer (`backend/services/`)

#### [NEW] [announcementService.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/services/announcementService.js)
- `searchAnnouncements({ query, category, limit = 10 })`: Case-insensitive regex search over `title` and `content` for active announcements.
- `getActiveAnnouncements({ limit = 10, populate = 'createdBy' })`: Returns latest active announcements sorted by creation date.
- `createAnnouncement(data, user)`: Announcement creation logic used by admin controllers.

#### [NEW] [complaintService.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/services/complaintService.js)
- `submitComplaint({ title, description, category, targetAdminType, isAnonymous, imageUrl }, userContext)`: Validates required fields, checks target admin types (`hostel_warden`, `union_member`, `librarian`, `super_admin`), and binds `submittedBy: userContext._id`.
- `getUserComplaints(userContext, { complaintId, limit } = {})`: Queries complaints strictly scoped to `submittedBy: userContext._id` (enforces strict cross-user security isolation).
- `getPublicComplaints(userContext)`: Queries public complaints and applies masking via `maskComplaints`.

#### [NEW] [lostFoundService.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/services/lostFoundService.js)
- `searchLostFoundItems({ query, type, category, limit = 10 })`: Multi-field search over `title`, `description`, `category` with case-insensitive filtering for active items.
- `getActiveItems({ limit = 20, populate = 'submittedBy' })`: Retrieves all active lost & found items.
- `submitItem(data, userContext)`: Submits new lost/found item bound to user.

#### [NEW] [electionService.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/services/electionService.js)
- `checkStudentVotingEligibility(userContext, { electionId } = {})`:
  - If `electionId` is provided, verifies election existence and tests `election.isDepartmentEligible(userContext.department)`.
  - If omitted, returns all ongoing elections the student's department is eligible to vote in.
- `getOngoingElections()`: Retrieves ongoing election metadata without leaking confidential tallies.

#### [NEW] [notificationService.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/services/notificationService.js)
- `getUserNotifications(userContext, { unreadOnly = false } = {})`: Aggregates active announcements and user-specific complaint updates (`submittedBy: userContext._id`).

---

### 2. Refactor AI Tool Execution Adapter (`backend/ai/tools/`)

#### [MODIFY] [toolExecutor.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/ai/tools/toolExecutor.js)
- Remove direct Mongoose `Model.find()` / `Model.create()` queries.
- Import and invoke corresponding methods from `backend/services/*`.
- Standardize error wrapping into safe business errors (`NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_ERROR`).
- Enforce strict authentication context validation prior to service invocation.

#### [MODIFY] [toolRegistry.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/ai/tools/toolRegistry.js)
- Verify alignment of tool definitions with service parameter schemas.

#### [MODIFY] [toolResultHandler.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/ai/tools/toolResultHandler.js)
- Ensure safe formatting and sanitization of service responses before feeding back into Gemini or fallback summaries.

---

### 3. Refactor REST API Controllers (`backend/controllers/`)

#### [MODIFY] [studentController.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/controllers/studentController.js)
- Delegate `getMyComplaints` and `submitComplaint` to `complaintService`.
- Delegate `getLostFoundItems` and `submitLostFound` to `lostFoundService`.
- Delegate `getAnnouncements` to `announcementService`.
- Preserve existing HTTP response contracts and error status codes (200, 201, 400, 403, 404, 500).

---

### 4. Documentation & Verification Suite

#### [NEW] [Phase - 05/1. Backend Audit and Service Mapping.md](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/Implementations/Phase%20-%2005/1.%20Backend%20Audit%20and%20Service%20Mapping.md)
- Complete technical mapping matrix showing `AI Tool → Express Service → Controller → MongoDB Collection`.

#### [NEW] [Phase - 05/2. Service Layer Implementation.md](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/Implementations/Phase%20-%2005/2.%20Service%20Layer%20Implementation.md)
- Documentation of service method signatures, validation constraints, and security boundary guarantees.

#### [NEW] [Phase - 05/3. End-to-End Verification and Security Matrix.md](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/Implementations/Phase%20-%2005/3.%20End-to-End%20Verification%20and%20Security%20Matrix.md)
- Comprehensive test results and security isolation proofs.

---

## Verification Plan

### Automated Test Scripts (`backend/scratch/`)
1. **Service Unit Tests (`testPhase5Services.js`)**:
   - Verify `announcementService`, `complaintService`, `lostFoundService`, `electionService`, and `notificationService` methods directly.
2. **Tool Executor Integration Tests (`testPhase5ToolExecutor.js`)**:
   - Test all 6 tools running via `toolExecutor.js` delegating to backend services.
3. **Security & Data Isolation Tests (`testPhase5Security.js`)**:
   - Two-user isolation (User A cannot view User B's complaints via service or tool executor).
   - Cross-ID probing with foreign complaint IDs.
   - Injection of unauthorized user IDs in Gemini tool arguments (assert ignored in favor of `userContext`).
   - Unauthorized department voting requests.
4. **End-to-End AI Chat Turn Tests (`testPhase5E2E.js`)**:
   - Test full flow: `User prompt → Gemini → Tool Call → Shared Service → MongoDB → Service Result → Gemini → Final Reply`.
5. **REST API Regression Tests (`testPhase5RESTRegression.js`)**:
   - Verify student REST API endpoints continue to return expected payloads and HTTP status codes.

---

## Incremental Execution Steps
1. **Step 5.1**: Create `backend/services/` and implement the 5 core domain services (`announcementService`, `complaintService`, `lostFoundService`, `electionService`, `notificationService`).
2. **Step 5.2**: Write and run service-level unit tests (`testPhase5Services.js`).
3. **Step 5.3**: Refactor `backend/ai/tools/toolExecutor.js` to delegate to the new service layer.
4. **Step 5.4**: Refactor `backend/controllers/studentController.js` to use the new service layer.
5. **Step 5.5**: Run security isolation tests & multi-user verification.
6. **Step 5.6**: Run full E2E AI agent integration and REST regression suite.
7. **Step 5.7**: Create Phase 5 documentation in `Implementations/Phase - 05/`.
