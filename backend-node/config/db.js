const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tradeguard';
    
    // Fallback to local if environment has unresolved credentials placeholder
    if (uri.includes('<db_password>') || uri.includes('<password>') || !uri) {
      console.log('No valid cloud credentials found in MONGO_URI env. Connecting to local MongoDB...');
      uri = 'mongodb://localhost:27017/tradeguard';
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
