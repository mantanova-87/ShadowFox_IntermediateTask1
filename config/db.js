const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  const options = {
    // Standard Mongoose options for stable connection (v6+ and v8+ handles these natively, but we can set timeouts)
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`Connecting to MongoDB...`);
      await mongoose.connect(mongoUri, options);
      console.log('MongoDB successfully connected!');
      break;
    } catch (err) {
      retries -= 1;
      console.error(`MongoDB connection error: ${err.message}`);
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after 5 attempts. Exiting...');
        process.exit(1);
      }
      console.log(`Retrying connection in 5 seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
