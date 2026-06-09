/* global use, db */
// Select the database to use.
use('sexappeal'); // Adjust if your database name is different

// This script renames the location fields to lowercase for all users.
const updateResult = db.getCollection('users').updateMany(
  { }, // Match all users
  {
    $set: {
      "professionalProfile.location.Street": "professionalProfile.location.street",
      "professionalProfile.location.Number": "professionalProfile.location.number",
      "professionalProfile.location.Floor": "professionalProfile.location.floor",
      "professionalProfile.location.Appartment": "professionalProfile.location.apartment",
      "professionalProfile.location.PostalCode": "professionalProfile.location.postalCode"
    }
  } 
);

console.log(`Success! Renamed location fields to lowercase for ${updateResult.modifiedCount} users.`);