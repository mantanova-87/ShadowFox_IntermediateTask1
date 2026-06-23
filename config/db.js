const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const isDev = process.env.NODE_ENV !== 'production';
  let retries = isDev ? 3 : 5;

  while (retries > 0) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri, options);
      console.log('✅ MongoDB connected successfully!');
      return;
    } catch (err) {
      retries -= 1;
      console.error('MongoDB connection error:', err);
      if (retries === 0) {
        if (isDev) {
          console.warn('⚠️  MongoDB unavailable — running without DB. Routes requiring a database will fail.');
          return; // Stay alive in dev so EJS/static pages still work
        } else {
          console.error('❌ Failed to connect to MongoDB after retries. Exiting...');
          process.exit(1);
        }
      }
      console.log(`Retrying connection in 5 seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
