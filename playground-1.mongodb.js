/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('sexappeal'); // Adjust if your database name is different

// Approve "test pro 12" account
const aliasToApprove = 'Test Pro 12';

const updateResult = db.getCollection('users').updateOne(
  { 'professionalProfile.alias': { $regex: new RegExp(`^${aliasToApprove}$`, 'i') }, role: 'professional' },
  { $set: { verificationStatus: 'approved', isVerified: true } }
);

console.log(`Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
if (updateResult.modifiedCount > 0) {
  console.log(`Successfully approved professional with alias: "${aliasToApprove}".`);
} else {
  console.log(`Could not approve. Professional with alias "${aliasToApprove}" not found or already approved.`);
}
