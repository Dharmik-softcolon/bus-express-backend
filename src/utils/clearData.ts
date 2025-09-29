import connectDB from '../config/database';
import { databaseSeeder } from './seeder';
import { logInfo, logError } from './logger';

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
