# Phase 2 Final Integration — AI Orchestrator

Connect the seven completed Phase 2 AI Orchestrator responsibilities through the six implementation modules in `aiChatController.js` so that an authenticated user's message flows through the full orchestration pipeline before Gemini is called.

## Flow Architecture

```
React Chat UI
      │
      ▼
Authentication Middleware (req.user)
      │
      ▼
AI Chat Controller (aiChatController.js)
      │
      ├── Conversation Memory (getHistory)
      ├── Context Builder (buildContext)
      ├── Role Verification (verifyRole)
      ├── Intent Router (routeIntent)
      ├── Tool Registry (getAvailableTools)
      └── Prompt Builder (buildPrompt)
              │
              ▼
           Gemini API (generateContent)
              │
              ├── FAILURE ──→ 500 (No assistant message stored)
              │
              ▼
           Gemini Reply
              │
              ▼
           Conversation Memory (addMessage user + assistant)
              │
              ▼
         Response to React Chat UI
```

---

## User Review & Design Alignment

> [!IMPORTANT]
> - **Seven Responsibilities, Six Modules:** The 7 Phase 2 responsibilities are connected via 6 module imports (Conversation Memory, Context Builder, Role Verification, Intent Router, Tool Registry, Prompt Builder) because User Context Injection is embedded into Prompt Builder / Context Builder. No module signatures will be modified.
> - **Role & Intent in Pipeline:** `verifyRole(req.user)` and `routeIntent(message)` run during orchestration to verify user identity and detect intent. `buildPrompt(context, tools)` consumes `context` (which already includes `user.role`) and `tools`. `buildPrompt` signature remains unchanged.
> - **Session ID Mapping:** `sessionId = req.user._id?.toString() || req.user.id` maps chat memory per authenticated user.
> - **API Response Contract:** The HTTP response schema `{ reply: "..." }` returned to the React frontend remains identical to Phase 1 so no frontend refactoring is needed.
> - **Error Handling:** If Gemini fails or throws an exception, no partial/fake assistant message is stored in Conversation Memory, and a `500` status error is returned to the user.


## Proposed Changes

### Backend AI Controller

#### [MODIFY] [aiChatController.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/controllers/aiChatController.js)

- Import the 6 AI Orchestrator modules:
  - `getHistory`, `addMessage` from `../ai/memory/conversationMemory`
  - `buildContext` from `../ai/context/contextBuilder`
  - `verifyRole` from `../ai/roles/roleVerifier`
  - `routeIntent` from `../ai/routing/intentRouter`
  - `getAvailableTools` from `../ai/tools/toolRegistry`
  - `buildPrompt` from `../ai/prompt/promptBuilder`
- In `exports.sendMessage`:
  1. Validate incoming `message` string (presence & length <= 2000).
  2. Extract session ID: `sessionId = req.user._id?.toString() || req.user.id`.
  3. Fetch previous history: `const history = getHistory(sessionId)`.
  4. Build standardized context: `const context = buildContext(req.user, message, history)`.
  5. Verify user role: `const roleInfo = verifyRole(req.user)`.
  6. Detect intent: `const intentInfo = routeIntent(message)`.
  7. Retrieve tools: `const tools = getAvailableTools()`.
  8. Build complete prompt: `const prompt = buildPrompt(context, tools)`.
  9. Execute Gemini call with structured `prompt`.
  10. On success, store turns:
      - `addMessage(sessionId, 'user', message)`
      - `addMessage(sessionId, 'assistant', reply)`
  11. Add step-by-step debug logging (`[AI ORCHESTRATOR]`) for development monitoring.
  12. Return `{ reply }` JSON response.

### Backend Scratch / Integration Test Script

#### [NEW] [testOrchestratorIntegration.js](file:///c:/Users/shaki/Desktop/FOT_HUB_DEV/backend/scratch/testOrchestratorIntegration.js)

- Create a comprehensive verification script that validates all 12 integration test cases:
  1. Authenticated Student Chat Flow
  2. Student Context reach to Prompt
  3. Intent Routing for all 6 intents
  4. Tool Registry presence in prompt
  5. First turn (empty history)
  6. Second turn (history persistence)
  7. No duplicate current message
  8. Student vs Admin role recognition
  9. Session isolation between two distinct users
  10. Unknown intent routing
  11. Sensitive data exclusion (passwords/JWT omitted from prompt)
  12. Error handling on Gemini failure (no fake assistant storage)

---

## Verification Plan

### Automated Tests
Run the integration test suite in `backend/scratch/`:
```bash
node backend/scratch/testOrchestratorIntegration.js
```

### Manual Verification
1. Start backend server: `cd backend && npm start` (or `node server.js`).
2. Log in as a Student in the React UI, send "Hello", verify response.
3. Send "Can I vote?" in the second turn, verify history awareness.
4. Check backend console logs for the formatted `[AI ORCHESTRATOR]` debug stage logs.
