# Implementation Plan - Context Builder

Build and formalize **Topic 1 – Context Builder**, the foundational component of the AI Orchestrator that gathers authenticated user identity, conversation history, and the current message into a standardized context object before sending any request to Gemini.

---

## User Review Required

> [!IMPORTANT]
> The `Context Builder` strictly serves as an information aggregator and normalizer. It does NOT make API calls to Gemini, assemble final prompt strings, inspect tools, execute tools, or modify message contents.

> [!IMPORTANT]
> **Structural Validation & Sanitization**
> Structural check & trimming on `currentMessage`:
> - Enforce `currentMessage` is a valid string (throws a clean `TypeError` / `Error` if missing or non-string).
> - Trims leading and trailing whitespace.
> - Does **NOT** perform business rules (e.g. prompt injection checks, length limits, or intent checking).

> [!NOTE]
> **Output Specification**
> The Context Builder produces a standardized object:
> ```json
> {
>   "user": {
>     "id": "65f4...",
>     "name": "John Perera",
>     "role": "Student",
>     "department": "ICT"
>   },
>   "conversation": [
>     { "role": "user", "content": "Hello" },
>     { "role": "assistant", "content": "Hi! How can I help?" }
>   ],
>   "currentMessage": "Can I vote?"
> }
> ```

---

## Proposed Changes

### AI Orchestrator (`backend/ai`)

#### [MODIFY] [contextBuilder.js]
- Refactor `buildContext(user, currentMessage, previousMessages = [])`:
  1. Validate `user` object existence.
  2. Normalize user object with `id`, `name`, `role`, `department` (null if undefined), and include `adminType` conditionally if present.
  3. Validate and trim `currentMessage` (throw clear Error if missing or not a string).
  4. Normalize `previousMessages` array to standardize entries into `{ role, content }` objects (handling plain strings or objects with `{ role, content }`, `{ role, text }`, or `{ sender, text }`).
  5. Return standard context object `{ user, conversation, currentMessage }`.

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [backend/scratch/testContextBuilder.js]
- Create a standalone Node.js verification script that tests `buildContext`:
  1. **Scenario 1**: Student user context with valid department & history.
  2. **Scenario 2**: Admin user context with `adminType` present & empty history.
  3. **Scenario 3**: Trimming of `currentMessage` whitespace.
  4. **Scenario 4**: Error handling for invalid/missing `currentMessage` or missing `user`.
  5. Assertion checks to ensure output strictly matches required schema.

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testContextBuilder.js
  ```
- Verify all assertion test cases pass without errors.

### Manual Verification
- Review script output logs to verify payload structure against contract requirements.
