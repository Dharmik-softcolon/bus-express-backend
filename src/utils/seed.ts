import connectDB from '../config/database';
import { databaseSeeder } from './seeder';
import { logInfo, logError } from './logger';

async function seedDatabase() {
  try {
    logInfo('Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Seed all data
    await databaseSeeder.seedAll();
    
    logInfo('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logError('Database seeding failed', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
