import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Bus } from '../models/Bus.js';
import { Route } from '../models/Route.js';
import { Booking } from '../models/Booking.js';
import { hashPassword } from '../utils/auth.js';
import { USER_ROLES, BUS_STATUS, BOOKING_STATUS, PAYMENT_STATUS } from '../constants/index';
import { logInfo, logError } from './logger.js';

export class DatabaseSeeder {
  async seedUsers(): Promise<void> {
    try {
      // Check if users already exist
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        logInfo('Users already seeded, skipping...');
        return;
      }

      const users = [
        {
          name: 'Admin User',
          email: 'admin@busexpress.com',
          password: await hashPassword('admin123'),
          phone: '+919876543210',
          role: USER_ROLES.ADMIN,
          isActive: true,
          isEmailVerified: true,
        },
        {
          name: 'Bus Operator 1',
          email: 'operator1@busexpress.com',
          password: await hashPassword('operator123'),
          phone: '+919876543211',
          role: USER_ROLES.OPERATOR,
          isActive: true,
          isEmailVerified: true,
        },
        {
          name: 'Bus Operator 2',
          email: 'operator2@busexpress.com',
          password: await hashPassword('operator123'),
          phone: '+919876543212',
          role: USER_ROLES.OPERATOR,
          isActive: true,
          isEmailVerified: true,
        },
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: await hashPassword('customer123'),
          phone: '+919876543213',
          role: USER_ROLES.CUSTOMER,
          isActive: true,
          isEmailVerified: true,
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: await hashPassword('customer123'),
          phone: '+919876543214',
          role: USER_ROLES.CUSTOMER,
          isActive: true,
          isEmailVerified: true,
        },
      ];

      await User.insertMany(users);
      logInfo('Users seeded successfully', { count: users.length });
    } catch (error) {
      logError('Error seeding users', error);
      throw error;
    }
  }

  async seedRoutes(): Promise<void> {
    try {
      // Check if routes already exist
      const routeCount = await Route.countDocuments();
      if (routeCount > 0) {
        logInfo('Routes already seeded, skipping...');
        return;
      }

      const routes = [
        {
          routeName: 'Mumbai to Delhi',
          from: {
            city: 'Mumbai',
            state: 'Maharashtra',
            coordinates: { latitude: 19.0760, longitude: 72.8777 },
          },
          to: {
            city: 'Delhi',
            state: 'Delhi',
            coordinates: { latitude: 28.7041, longitude: 77.1025 },
          },
          distance: 1419,
          duration: 1440, // 24 hours
          stops: [
            {
              name: 'Pune',
              city: 'Pune',
              coordinates: { latitude: 18.5204, longitude: 73.8567 },
              arrivalTime: '02:00',
              departureTime: '02:15',
            },
            {
              name: 'Indore',
              city: 'Indore',
              coordinates: { latitude: 22.7196, longitude: 75.8577 },
              arrivalTime: '08:00',
              departureTime: '08:15',
            },
          ],
          isActive: true,
        },
        {
          routeName: 'Bangalore to Chennai',
          from: {
            city: 'Bangalore',
            state: 'Karnataka',
            coordinates: { latitude: 12.9716, longitude: 77.5946 },
          },
          to: {
            city: 'Chennai',
            state: 'Tamil Nadu',
            coordinates: { latitude: 13.0827, longitude: 80.2707 },
          },
          distance: 346,
          duration: 360, // 6 hours
          stops: [
            {
              name: 'Vellore',
              city: 'Vellore',
              coordinates: { latitude: 12.9202, longitude: 79.1500 },
              arrivalTime: '03:00',
              departureTime: '03:10',
            },
          ],
          isActive: true,
        },
        {
          routeName: 'Kolkata to Hyderabad',
          from: {
            city: 'Kolkata',
            state: 'West Bengal',
            coordinates: { latitude: 22.5726, longitude: 88.3639 },
          },
          to: {
            city: 'Hyderabad',
            state: 'Telangana',
            coordinates: { latitude: 17.3850, longitude: 78.4867 },
          },
          distance: 1492,
          duration: 1200, // 20 hours
          stops: [
            {
              name: 'Bhubaneswar',
              city: 'Bhubaneswar',
              coordinates: { latitude: 20.2961, longitude: 85.8245 },
              arrivalTime: '04:00',
              departureTime: '04:15',
            },
            {
              name: 'Vijayawada',
              city: 'Vijayawada',
              coordinates: { latitude: 16.5062, longitude: 80.6480 },
              arrivalTime: '16:00',
              departureTime: '16:15',
            },
          ],
          isActive: true,
        },
      ];

      await Route.insertMany(routes);
      logInfo('Routes seeded successfully', { count: routes.length });
    } catch (error) {
      logError('Error seeding routes', error);
      throw error;
    }
  }

  async seedBuses(): Promise<void> {
    try {
      // Check if buses already exist
      const busCount = await Bus.countDocuments();
      if (busCount > 0) {
        logInfo('Buses already seeded, skipping...');
        return;
      }

      // Get operators
      const operators = await User.find({ role: USER_ROLES.OPERATOR });
      if (operators.length === 0) {
        throw new Error('No operators found. Please seed users first.');
      }

      const buses = [
        {
          busNumber: 'BE001',
          busName: 'Luxury Express',
          operator: operators[0]._id,
          type: 'AC',
          totalSeats: 40,
          availableSeats: 40,
          amenities: ['WiFi', 'Charging Points', 'Blankets', 'Water Bottles'],
          features: {
            wifi: true,
            charging: true,
            blankets: true,
            water: true,
            snacks: false,
          },
          status: BUS_STATUS.ACTIVE,
          images: [],
        },
        {
          busNumber: 'BE002',
          busName: 'Comfort Plus',
          operator: operators[0]._id,
          type: 'Semi-Sleeper',
          totalSeats: 35,
          availableSeats: 35,
          amenities: ['Charging Points', 'Blankets'],
          features: {
            wifi: false,
            charging: true,
            blankets: true,
            water: false,
            snacks: false,
          },
          status: BUS_STATUS.ACTIVE,
          images: [],
        },
        {
          busNumber: 'BE003',
          busName: 'Budget Travel',
          operator: operators[1]._id,
          type: 'Non-AC',
          totalSeats: 50,
          availableSeats: 50,
          amenities: ['Water Bottles'],
          features: {
            wifi: false,
            charging: false,
            blankets: false,
            water: true,
            snacks: false,
          },
          status: BUS_STATUS.ACTIVE,
          images: [],
        },
        {
          busNumber: 'BE004',
          busName: 'Premium Sleeper',
          operator: operators[1]._id,
          type: 'Sleeper',
          totalSeats: 30,
          availableSeats: 30,
          amenities: ['WiFi', 'Charging Points', 'Blankets', 'Water Bottles', 'Snacks'],
          features: {
            wifi: true,
            charging: true,
            blankets: true,
            water: true,
            snacks: true,
          },
          status: BUS_STATUS.ACTIVE,
          images: [],
        },
      ];

      await Bus.insertMany(buses);
      logInfo('Buses seeded successfully', { count: buses.length });
    } catch (error) {
      logError('Error seeding buses', error);
      throw error;
    }
  }

  async seedBookings(): Promise<void> {
    try {
      // Check if bookings already exist
      const bookingCount = await Booking.countDocuments();
      if (bookingCount > 0) {
        logInfo('Bookings already seeded, skipping...');
        return;
      }

      // Get sample data
      const customers = await User.find({ role: USER_ROLES.CUSTOMER });
      const buses = await Bus.find();
      const routes = await Route.find();

      if (customers.length === 0 || buses.length === 0 || routes.length === 0) {
        logInfo('Insufficient data for seeding bookings, skipping...');
        return;
      }

      const bookings = [
        {
          bookingReference: 'BE20240101001',
          user: customers[0]._id,
          bus: buses[0]._id,
          route: routes[0]._id,
          journeyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          seats: [
            {
              seatNumber: 1,
              passengerName: 'John Doe',
              passengerAge: 30,
              passengerGender: 'Male',
              passengerPhone: '+919876543213',
            },
          ],
          totalAmount: 500,
          bookingStatus: BOOKING_STATUS.CONFIRMED,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          paymentMethod: 'UPI',
          boardingPoint: 'Mumbai Central',
          droppingPoint: 'Delhi Terminal',
        },
        {
          bookingReference: 'BE20240101002',
          user: customers[1]._id,
          bus: buses[1]._id,
          route: routes[1]._id,
          journeyDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          seats: [
            {
              seatNumber: 5,
              passengerName: 'Jane Smith',
              passengerAge: 25,
              passengerGender: 'Female',
              passengerPhone: '+919876543214',
            },
            {
              seatNumber: 6,
              passengerName: 'Bob Johnson',
              passengerAge: 35,
              passengerGender: 'Male',
              passengerPhone: '+919876543215',
            },
          ],
          totalAmount: 1000,
          bookingStatus: BOOKING_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.PENDING,
          boardingPoint: 'Bangalore Bus Stand',
          droppingPoint: 'Chennai Central',
        },
      ];

      await Booking.insertMany(bookings);
      logInfo('Bookings seeded successfully', { count: bookings.length });
    } catch (error) {
      logError('Error seeding bookings', error);
      throw error;
    }
  }

  async seedAll(): Promise<void> {
    try {
      logInfo('Starting database seeding...');
      
      await this.seedUsers();
      await this.seedRoutes();
      await this.seedBuses();
      await this.seedBookings();
      
      logInfo('Database seeding completed successfully');
    } catch (error) {
      logError('Database seeding failed', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      logInfo('Clearing all data...');
      
      await Booking.deleteMany({});
      await Bus.deleteMany({});
      await Route.deleteMany({});
      await User.deleteMany({});
      
      logInfo('All data cleared successfully');
    } catch (error) {
      logError('Error clearing data', error);
      throw error;
    }
  }
}

export const databaseSeeder = new DatabaseSeeder();
