const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set strictQuery to avoid deprecation warning
    mongoose.set('strictQuery', false);
    
    console.log('⏳ Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your MONGODB_URI in .env file');
    console.error('2. Make sure your IP is whitelisted in MongoDB Atlas (0.0.0.0/0 for all IPs)');
    console.error('3. Verify your username and password are correct');
    console.error('4. Check if your cluster is active');
    console.error('');
    console.error('Your current MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

module.exports = connectDB;
