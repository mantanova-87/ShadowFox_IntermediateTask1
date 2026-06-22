const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');
const mongoose = require('mongoose');

// Connect to MongoDB
connectDB();

// Start Listening
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful Shutdown Logic
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch((err) => {
      console.error('Error during MongoDB connection shutdown:', err);
      process.exit(1);
    });
  });
  
  // Force exit after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Force exiting...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
