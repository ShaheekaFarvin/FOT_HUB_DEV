# Implementation Plan - Prompt Builder

Build and formalize **Topic 2 – Prompt Builder**, the AI Orchestrator component responsible for generating a deterministic, structured prompt string from the standardized **Context Object** (produced by Context Builder) and **Tool Registry** definitions before dispatching to Gemini.

---

## User Review Required

> [!IMPORTANT]
> **Single Responsibility Principle (SRP) Compliance**
> The Prompt Builder is strictly responsible for prompt string formatting. It does **NOT** communicate with Gemini, execute tools, retrieve database records, classify intent, or modify user context data.

> [!IMPORTANT]
> **Locked Interface Specification**
> 1. **Context Object**: `{ user: { id, name, role, department, adminType? }, conversation: [{ role, content }], currentMessage: string }`
> 2. **Tool Registry Output**: Array of tool objects `Array<{ name: string, description: string }>` e.g.:
>    ```json
>    [
>      { "name": "searchAnnouncements", "description": "Search faculty announcements" },
>      { "name": "submitComplaint", "description": "Submit a student complaint" }
>    ]
>    ```

> [!NOTE]
> **Prompt Template Specification**
> `buildPrompt(context, tools)` deterministically produces the exact structured layout below:
> ```text
> You are FOT Buddy, the official AI assistant for the Faculty of Technology (FOT), Rajarata University of Sri Lanka...
>
> ================================================
> Current User
> ------------
> Name: John Perera
> Role: Student
> Department: ICT
> (Admin Type: SuperAdmin)
>
> ================================================
> Conversation History
> --------------------
> User: Hello
> Assistant: Hi! How can I help?
>
> ================================================
> Available Tools
> ---------------
> - searchAnnouncements: Search faculty announcements
> - submitComplaint: Submit a student complaint
>
> ================================================
> Current User Message
> --------------------
> Can I vote?
> ```

---

## Open Questions

> [!NOTE]
> None. All contracts and specifications are locked.

---

## Proposed Changes

### AI Orchestrator Core (`backend/ai`)

#### [MODIFY] [promptBuilder.js]
- Refactor `buildPrompt(context, tools = [])`:
  1. Validate `context` input (ensure `context.user` and `context.currentMessage` are present).
  2. Extract `user`, `conversation`, and `currentMessage` from the standardized Context Object.
  3. Format **Current User** section cleanly (`Name`, `Role`, `Department`, and optional `Admin Type`).
  4. Format **Conversation History** section by mapping `{ role, content }` objects to `User: ...` / `Assistant: ...` lines (or `(No previous conversation)` if empty).
  5. Format **Available Tools** section by iterating the locked `Array<{ name, description }>` format (or `- None` if empty).
  6. Append **Current User Message** under its dedicated header.
  7. Return the final structured prompt string matching the Prompt Template Specification.

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [testPromptBuilder.js]
- Create a standalone Node.js verification script testing `buildPrompt`:
  1. **Scenario 1**: Student user context with history and tool list.
  2. **Scenario 2**: Admin user context with `adminType` and empty history.
  3. **Scenario 3**: Context with empty conversation history.
  4. **Scenario 4**: Context with empty tool list.
  5. Assertion checks verifying exact section sequence, clean tool description formatting, absence of `[object Object]` artifacts, and deterministic string generation.

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testPromptBuilder.js
  ```
- Confirm all scenario assertions pass with 0 failures.

### Manual Verification
- Review generated test prompt logs to verify section headers, sequence, and formatting aesthetics against the template specification.
