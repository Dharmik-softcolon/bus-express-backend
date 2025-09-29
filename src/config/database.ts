import mongoose from 'mongoose';
import config from './config';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = config.mongodb.URL || 'mongodb://127.0.0.1:27017/bus-express';
    
    // Validate connection string format
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error(`Invalid MongoDB URI format: ${mongoURI}. Must start with 'mongodb://' or 'mongodb+srv://'`);
    }
    
    console.log('Started connecting to MongoDB');
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MONGODB CONNECTED: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Please check:');
    console.error('1. MongoDB is running locally (mongodb://localhost:27017)');
    console.error('2. Or update MONGODB_URI in .env file with valid connection string');
    console.error('3. Or use MongoDB Atlas cloud database');
    process.exit(1);
  }
};

export default connectDB;
