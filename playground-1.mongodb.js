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

// 1. Find 4 random professionals who currently have the "Standard" quality
const professionalsToUpgrade = db.getCollection('users').aggregate([
  { $match: { role: 'professional', 'professionalProfile.quality': 'Standard' } },
  { $sample: { size: 4 } }
]).toArray();

// 2. Extract their unique IDs
const idsToUpgrade = professionalsToUpgrade.map(p => p._id);

// 3. Perform the bulk update to change their quality to "Elite"
if (idsToUpgrade.length > 0) {
  const updateResult = db.getCollection('users').updateMany(
    { _id: { $in: idsToUpgrade } },
    { $set: { 'professionalProfile.quality': 'Elite' } }
  );
  console.log(`Success! Upgraded ${updateResult.modifiedCount} professionals to the Elite category.`);
} else {
  console.log("No professionals found in the Standard category to upgrade.");
}
