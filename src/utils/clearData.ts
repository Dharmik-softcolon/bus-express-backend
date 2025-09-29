import connectDB from '../config/database.js';
import { databaseSeeder } from './seeder.js';
import { logInfo, logError } from './logger.js';

async function clearDatabase() {
  try {
    logInfo('Starting database clearing...');
    
    // Connect to database
    await connectDB();
    
    // Clear all data
    await databaseSeeder.clearAll();
    
    logInfo('Database clearing completed successfully');
    process.exit(0);
  } catch (error) {
    logError('Database clearing failed', error);
    process.exit(1);
  }
}

// Run clearing
clearDatabase();
