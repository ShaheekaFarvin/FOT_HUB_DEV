# Implementation Plan — Tool Registry

Build and formalize **Tool Registry**, the AI Orchestrator component responsible for maintaining a centralized single-source-of-truth list of available AI tools and returning their standardized definitions (`Array<{ name: string, description: string }>`) to the Prompt Builder without executing any tools or calling external services/databases.

---

## User Review Required

> [!IMPORTANT]
> **Strict Single Responsibility Principle (SRP) Compliance**
> The Tool Registry only provides tool definitions (`name` and `description`). It does **NOT** execute tools, perform function calling, query MongoDB, call Express controllers/APIs, invoke Gemini, or perform role authorization.

> [!IMPORTANT]
> **Clean Minimal API Surface (`getAvailableTools`)**
> Since `getRegisteredTools` is not referenced anywhere else in the codebase, the public interface will export **only** `getAvailableTools()`.

> [!IMPORTANT]
> **Locked Public Interface & Descriptions**
> `getAvailableTools()` returns an array of 6 tool definition objects with exact tool names and standardized descriptions:
> 1. `searchAnnouncements`: `"Search faculty announcements"`
> 2. `checkVotingEligibility`: `"Check whether the current student is eligible to vote"`
> 3. `searchLostItems`: `"Search reported lost and found items"`
> 4. `submitComplaint`: `"Submit a student complaint"`
> 5. `getComplaintStatus`: `"Get the status of a submitted complaint"`
> 6. `getNotifications`: `"Retrieve notifications for the current user"`

---

## Open Questions

> [!NOTE]
> None. All contracts and user feedback have been incorporated.

---

## Proposed Changes

### AI Orchestrator Tools (`backend/ai/tools`)

#### [MODIFY] [toolRegistry.js]
- Define static `tools` collection with the exact 6 standardized definitions.
- Implement and export strictly `getAvailableTools()` returning the tool array.
- Standard CommonJS export: `module.exports = { getAvailableTools }`.

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [testToolRegistry.js]
- Create a standalone Node.js verification script executing 6 test cases:
  1. **Test Case 1 — Registry Returns Tools**: Calling `getAvailableTools()` returns an array of exactly 6 tool objects.
  2. **Test Case 2 — Tool Names**: Verifies exact matching tool names with no spelling discrepancies or duplicates.
  3. **Test Case 3 — Tool Structure**: Asserts every entry satisfies `{ name: string, description: string }`.
  4. **Test Case 4 — Descriptions**: Asserts every description is non-empty and matches specification.
  5. **Test Case 5 — Unique Tool Names**: Validates zero duplicate tool names in the registry.
  6. **Test Case 6 — Environment Independence**: Verifies `getAvailableTools()` returns definitions synchronously without requiring database connections, HTTP servers/requests, Gemini API keys, or external services.

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testToolRegistry.js
  ```
- Confirm all 6 test cases pass with 0 failures and exit code 0.

### Manual Verification
- Output `console.log(getAvailableTools())` and verify formatting strictly matches `Array<{ name, description }>`.
