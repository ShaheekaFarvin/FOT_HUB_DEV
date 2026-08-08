const { verifyRole } = require('../ai/roles/roleVerifier');

let passCount = 0;
let failCount = 0;

const log = (label, ok, details) => {
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passCount += 1;
  else failCount += 1;
  console.log(`[${status}] ${label}${details ? `\n       ${details}` : ''}`);
};

const assert = (condition, label, details) => {
  log(label, Boolean(condition), details);
};

const expectThrow = (label, fn) => {
  try {
    fn();
    assert(false, label, 'expected an Error to be thrown, but none was');
  } catch (err) {
    assert(err instanceof Error, label, `threw: "${err.message}"`);
  }
};

console.log('\n--- Test Case 1: Student Role ---');
{
  const result1 = verifyRole({ _id: '123', role: 'Student' });
  console.log(result1);
  assert(result1.userId === '123', 'Test 1a: userId is "123"');
  assert(result1.role === 'Student', 'Test 1a: role is "Student"');
  assert(result1.roleType === 'STUDENT', 'Test 1a: roleType is "STUDENT"');
  assert(!('adminType' in result1), 'Test 1a: no adminType key present');

  const result2 = verifyRole({ _id: '123', role: 'student' });
  console.log(result2);
  assert(result2.role === 'Student', 'Test 1b: lowercase "student" normalizes to "Student"');
  assert(result2.roleType === 'STUDENT', 'Test 1b: roleType is "STUDENT"');
}

console.log('\n--- Test Case 2: Admin Role ---');
{
  const result = verifyRole({ _id: '456', role: 'Admin', adminType: 'SuperAdmin' });
  console.log(result);
  assert(result.userId === '456', 'userId is "456"');
  assert(result.role === 'Admin', 'role is "Admin"');
  assert(result.roleType === 'ADMIN', 'roleType is "ADMIN"');
  assert(result.adminType === 'SuperAdmin', 'adminType is preserved as "SuperAdmin"');

  const resultLower = verifyRole({ _id: '789', role: 'admin', adminType: 'ContentAdmin' });
  assert(resultLower.role === 'Admin', 'lowercase "admin" normalizes to "Admin"');
  assert(resultLower.adminType === 'ContentAdmin', 'adminType preserved on lowercase input');
}

console.log('\n--- Test Case 3: Student Has No adminType ---');
{
  const result = verifyRole({ _id: '1', role: 'Student' });
  assert(!('adminType' in result), 'Student result has no "adminType" key');

  const resultWithStray = verifyRole({ _id: '2', role: 'Student', adminType: 'ShouldBeIgnored' });
  assert(!('adminType' in resultWithStray), 'Student result ignores stray adminType on input object');
}

console.log('\n--- Test Case 4: User ID Normalization ---');
{
  const fakeObjectId = { toString: () => '64f1a2b3c4d5e6f7a8b9c0d1' };
  const resultObjectId = verifyRole({ _id: fakeObjectId, role: 'Student' });
  assert(
    resultObjectId.userId === '64f1a2b3c4d5e6f7a8b9c0d1',
    'ObjectId-like _id is converted to string',
    `got: ${resultObjectId.userId}`
  );
  assert(typeof resultObjectId.userId === 'string', 'userId type is string for ObjectId-like input');

  const resultStringId = verifyRole({ _id: 'plain-string-id', role: 'Admin' });
  assert(resultStringId.userId === 'plain-string-id', 'plain string _id passes through unchanged');

  const resultFallbackId = verifyRole({ id: 'fallback-id', role: 'Student' });
  assert(resultFallbackId.userId === 'fallback-id', 'falls back to user.id when _id is absent');
}

console.log('\n--- Test Case 5: Invalid Role Rejection ---');
{
  expectThrow('throws for unsupported role "Teacher"', () => verifyRole({ _id: '1', role: 'Teacher' }));
  expectThrow('throws for unsupported role "SuperUser"', () => verifyRole({ _id: '1', role: 'SuperUser' }));
  expectThrow('throws for empty-string role', () => verifyRole({ _id: '1', role: '' }));
}

console.log('\n--- Test Case 6: Missing User Rejection ---');
{
  expectThrow('throws when user is null', () => verifyRole(null));
  expectThrow('throws when user is undefined', () => verifyRole(undefined));
  expectThrow('throws when user has no role', () => verifyRole({ _id: '1' }));
  expectThrow('throws when user has no _id or id', () => verifyRole({ role: 'Student' }));
}

console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`);
process.exit(failCount > 0 ? 1 : 0);