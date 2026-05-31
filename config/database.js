const mongoose = require('mongoose');
const config = require('./appConfig');

const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(config.mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error('Could not connect to MongoDB after multiple attempts. Exiting...');
        process.exit(1);
      }
      console.log(`Retries left: ${retries}. Waiting ${delay / 1000} seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
