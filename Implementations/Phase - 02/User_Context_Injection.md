# Implementation Plan — User Context Injection

Build and formalize **User Context Injection**, the AI Orchestrator component responsible for ensuring that the authenticated user's identity context (`Name`, `Role`, `Department`) is injected into the prompt constructed for Gemini alongside their current question, while enforcing strict data privacy boundaries.

---

## User Review Required

> [!IMPORTANT]
> **Strict Data Privacy Boundary (Topic 5 Contract)**
> User Context Injection strictly injects **only**:
> - `Name`
> - `Role`
> - `Department`
> 
> Private or sensitive fields (`userId`, `email`, `phone`, `password`, `jwt`, `permissions`, `accountStatus`, `adminType`) MUST NOT be injected into the Topic 5 user prompt context.

> [!IMPORTANT]
> **No Auxiliary Dependencies or Side Effects**
> User Context Injection operates purely within the prompt-building pipeline. It does **NOT** query MongoDB, invoke the Gemini API, execute tools, filter tools, or perform authorization.

---

## Proposed Changes

### AI Orchestrator Prompt (`backend/ai/prompt`)

#### [MODIFY] [promptBuilder.js]
- Ensure robust handling of user context fields (`name`, `role`, `department`) during injection into the `Current User` section.
- Enforce strict exclusion of non-contract fields (e.g. `userId`, `email`, `password`, `jwt`, `permissions`, `accountStatus`).

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [testUserContextInjection.js]
- Create a standalone Node.js verification script executing 6 test cases:
  1. **Test Case 1 — Student Context Injection**: Validates that injecting `{ name: "John Perera", role: "Student", department: "ICT" }` produces `Name: John Perera`, `Role: Student`, `Department: ICT`.
  2. **Test Case 2 — Admin Context Injection**: Validates that injecting `{ name: "Nimal Silva", role: "Admin", department: "Administration" }` produces `Name: Nimal Silva`, `Role: Admin`, `Department: Administration`.
  3. **Test Case 3 — Current Message Separation**: Asserts that `Current User` section and `Current User Message` section (`Can I vote?`) are distinctly formatted under separate section headers.
  4. **Test Case 4 — Strict Boundary (No Extra User Data)**: Given a user object containing `{ name, role, department, userId, email, phone, password, jwt, permissions, accountStatus }`, asserts that none of the extra/sensitive fields appear in the prompt string.
  5. **Test Case 5 — Context Builder Consistency**: Asserts that Context Builder output (`buildContext(user, message, [])`) flows into the User Context Injection pipeline without altering user identity values.
  6. **Test Case 6 — Environment & Service Independence**: Verifies that context injection runs synchronously in-memory without database access, HTTP requests, or Gemini API keys.

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testUserContextInjection.js
  ```
- Confirm all 6 test cases pass with 0 failures and exit code 0.

### Manual Verification
- Inspect generated test prompt string logs to verify clean header separation and absence of sensitive user fields.
