const { routeIntent } = require('../ai/routing/intentRouter');

const results = [];

const runTest = (label, actualIntent, expectedIntent) => {
  const pass = actualIntent === expectedIntent;
  results.push(pass);
  console.log(`${label}: ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass) {
    console.log(`       expected: "${expectedIntent}" | got: "${actualIntent}"`);
  }
};

runTest('Test 1', routeIntent('What are the latest announcements?').intent, 'ANNOUNCEMENTS');
runTest('Test 2', routeIntent('Can I vote?').intent, 'VOTING_ELIGIBILITY');
runTest('Test 3', routeIntent('Can you help me find a lost item?').intent, 'LOST_AND_FOUND');
runTest('Test 4', routeIntent('I want to submit a complaint.').intent, 'SUBMIT_COMPLAINT');
runTest('Test 5', routeIntent('Can I check my complaint status?').intent, 'COMPLAINT_STATUS');
runTest('Test 6', routeIntent('Show my notifications.').intent, 'NOTIFICATIONS');
runTest('Test 7', routeIntent('Help me write a Java program.').intent, 'UNKNOWN');
runTest('Test 8', routeIntent('   Can I vote?   ').intent, 'VOTING_ELIGIBILITY');

{
  const nullResult = routeIntent(null).intent === 'UNKNOWN';
  const undefinedResult = routeIntent(undefined).intent === 'UNKNOWN';
  const emptyResult = routeIntent('').intent === 'UNKNOWN';
  const pass = nullResult && undefinedResult && emptyResult;
  results.push(pass);
  console.log(`Test 9: ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass) {
    console.log(`       null->${routeIntent(null).intent}, undefined->${routeIntent(undefined).intent}, ""->${routeIntent('').intent}`);
  }
}

{
  const start = Date.now();
  let threw = false;
  let result;
  try {
    result = routeIntent('Can I vote?');
  } catch (err) {
    threw = true;
  }
  const elapsed = Date.now() - start;
  const isPlainObject = result && typeof result === 'object' && !(result instanceof Promise);
  const pass = !threw && isPlainObject && elapsed < 50;
  results.push(pass);
  console.log(`Test 10: ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass) {
    console.log(`       threw: ${threw}, isPlainObject: ${isPlainObject}, elapsed: ${elapsed}ms`);
  }
}

console.log('');
if (results.every(Boolean)) {
  console.log('All Intent Router tests passed.');
  process.exit(0);
} else {
  const failedCount = results.filter((r) => !r).length;
  console.log(`${failedCount} Intent Router test(s) failed.`);
  process.exit(1);
}