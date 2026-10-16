# Implementation Plan —  Role Verification

Build and formalize **Role Verification**, the AI Orchestrator component responsible for identifying the authenticated user's application role (`Student` vs `Admin`), normalizing it into a standardized Role Object (`{ userId, role, roleType, adminType? }`), preserving `adminType` for Admin users (if present), and rejecting invalid/missing user roles without performing authorization or database lookups.


## User Review Required

> [!IMPORTANT]
> **Strict Scope Boundary (No Authorization)**
> The Role Verifier only identifies and normalizes user role metadata (`Student` / `Admin` + `adminType`). It does **NOT** check permissions, execute tools, authorize tool usage, interface with Gemini, or make MongoDB database queries.

> [!IMPORTANT]
> **Case Normalization & Optional adminType Handling**
> - **Role Normalization**: Accepts both `'student'` / `'Student'` and `'admin'` / `'Admin'` via case-insensitive matching (`String(user.role).toLowerCase()`), producing standardized `role: "Student"` / `roleType: "STUDENT"` and `role: "Admin"` / `roleType: "ADMIN"`.
> - **Admin Type**: Preserved **if present** on the `Admin` user object (`user.adminType`). If an Admin user does not have `adminType`, it is omitted. `Student` users strictly never receive `adminType`.
> - **Error Handling**: Missing user objects, missing roles, or unsupported roles (e.g. `"Teacher"`) are rejected by throwing a standard `Error`.


## Proposed Changes

### AI Orchestrator Roles (`backend/ai/roles`)

#### [MODIFY] [roleVerifier.js]
- Validate `user` input (ensure `user` object, valid `_id`/`id`, and non-empty `role` string exist).
- Extract and stringify `userId` (`user._id?.toString() || user.id?.toString()`).
- Map role case-insensitively (`rawRole.toLowerCase()`):
  - `'student'` $\rightarrow$ `role: "Student"`, `roleType: "STUDENT"`
  - `'admin'` $\rightarrow$ `role: "Admin"`, `roleType: "ADMIN"`
  - Any other value $\rightarrow$ throw clean `Error('Role Verifier: Unsupported role')`.
- For `Admin` users: include `adminType` if present on `user` (`user.adminType`).
- For `Student` users: strictly ensure `adminType` key is NOT included in the returned object.
- Export `verifyRole`.

---

### Verification & Testing (`backend/scratch`)

#### [NEW] [testRoleVerifier.js]
- Create a standalone Node.js verification script executing 6 test cases:
  1. **Test Case 1 — Student Role**: Input `{ _id: "123", role: "Student" }` or `{ _id: "123", role: "student" }` returns `{ userId: "123", role: "Student", roleType: "STUDENT" }`.
  2. **Test Case 2 — Admin Role**: Input `{ _id: "456", role: "Admin", adminType: "SuperAdmin" }` returns `{ userId: "456", role: "Admin", roleType: "ADMIN", adminType: "SuperAdmin" }`.
  3. **Test Case 3 — Student Has No adminType**: Asserts `!("adminType" in result)` for Student users.
  4. **Test Case 4 — User ID Normalization**: Handles MongoDB `ObjectId` or string IDs converted consistently to string.
  5. **Test Case 5 — Invalid Role Rejection**: Asserts throwing an error when role is unsupported (e.g. `"Teacher"`).
  6. **Test Case 6 — Missing User Rejection**: Asserts throwing an error when user is `null`, `undefined`, or missing `role`.

---

## Verification Plan

### Automated / Scripted Verification
- Run the node test script:
  ```powershell
  node backend/scratch/testRoleVerifier.js
  ```
- Confirm all 6 test cases pass with 0 failures and exit code 0.

### Manual Verification
- Log and inspect output objects for both Student and Admin types to verify exact property key presence/absence.
