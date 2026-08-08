# Implementation Plan — Conversation Memory

Build and formalize **Conversation Memory**, an in-memory session-based conversation store that maintains active chatbot session history (`{ role: "user" | "assistant", content: string }`) across turns and provides previous history to Context Builder / Prompt Builder without database persistence, Redis, or external service dependencies.

---

## User Review Required

> [!IMPORTANT]
> **Strict In-Memory Session Boundary**
> Conversation Memory exists strictly in server memory (`Map<sessionId, messages[]>`). It does **NOT** query or save to MongoDB, call Redis, summarize history, persist across server restarts, execute tools, perform authorization, or invoke Gemini.

> [!IMPORTANT]
> **Order of Operations (No Duplicate Messages)**
> To avoid duplicating the current user message in prompt history, the orchestrator turn sequence MUST be:
> 1. Retrieve history via `getHistory(sessionId)`.
> 2. Build Context (`buildContext`).
> 3. Construct Prompt (`buildPrompt`).
> 4. Dispatch to Gemini & receive response.
> 5. Store current turn via `addMessage(sessionId, 'user', userMsg)` and `addMessage(sessionId, 'assistant', botResponse)`.

---


## Proposed Changes

### AI Orchestrator Memory (`backend/ai/memory`)

#### [MODIFY] [conversationMemory.js]
- Maintain `sessions = new Map()`.
- Refactor `getHistory(sessionId)`: Returns a shallow copy `[...history]` of `{ role, content }` entries for `sessionId` (or `[]` if non-existent).
- Refactor `addMessage(sessionId, role, content)`: Validates non-empty `sessionId`, normalized `role` (`"user"` or `"assistant"`), and non-empty `content`, then appends entry.
- Refactor `clearSession(sessionId)`: Deletes `sessionId` from `sessions` Map.
- Export `{ getHistory, addMessage, clearSession }`.

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [testConversationMemory.js]
- Create a standalone Node.js test script executing 7 test cases:
  1. **Test Case 1 — New Session**: Calling `getHistory("session-001")` returns `[]`.
  2. **Test Case 2 — Add User Message**: Adding `"Hello"` returns `[{ role: "user", content: "Hello" }]`.
  3. **Test Case 3 — Add Assistant Message**: Adding `"Hi! How can I help?"` returns both user and assistant entries in exact sequence.
  4. **Test Case 4 — Conversation Continuity**: Adding subsequent turn (`"Can I vote?"` $\rightarrow$ `"Let me check that for you."`) maintains all 4 messages in exact turn order.
  5. **Test Case 5 — Session Isolation**: Asserts that `session-A` and `session-B` maintain completely independent message arrays without cross-talk.
  6. **Test Case 6 — Clear Session**: Calling `clearSession("session-A")` deletes its history (`getHistory` returns `[]`) while `session-B` remains intact.
  7. **Test Case 7 — Offline / In-Memory Only**: Asserts that memory operations run synchronously in-memory with zero external imports (no MongoDB, Redis, HTTP APIs, or Gemini SDK dependencies).

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testConversationMemory.js
  ```
- Confirm all 7 test cases pass with 0 failures and exit code 0.

### Manual Verification
- Log and inspect history outputs across multi-session operations to verify turn ordering and isolated session states.
