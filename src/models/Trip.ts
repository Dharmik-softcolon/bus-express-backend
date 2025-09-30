import mongoose, { Schema, Document } from 'mongoose';
import { TRIP_STATUS } from '../constants';

// Trip interface
export interface ITrip extends Document {
  _id: string;
  tripNumber: string;
  route: mongoose.Types.ObjectId;
  bus: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  helper?: mongoose.Types.ObjectId;
  departureTime: string;
  arrivalTime: string;
  departureDate: Date;
  pickupPoints: Array<{
    name: string;
    address: string;
    time: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  dropPoints: Array<{
    name: string;
    address: string;
    time: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  status: string;
  totalBookings: number;
  availableSeats: number;
  fare: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trip schema
const tripSchema = new Schema<ITrip>({
  tripNumber: {
    type: String,
    required: [true, 'Trip number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required'],
  },
  bus: {
    type: Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required'],
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Driver is required'],
  },
  helper: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
  },
  arrivalTime: {
    type: String,
    required: [true, 'Arrival time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
  },
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required'],
    min: [new Date(), 'Departure date cannot be in the past'],
  },
  pickupPoints: [{
    name: {
      type: String,
      required: [true, 'Pickup point name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Pickup point address is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Pickup time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
  }],
  dropPoints: [{
    name: {
      type: String,
      required: [true, 'Drop point name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Drop point address is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Drop time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
  }],
  status: {
    type: String,
    enum: Object.values(TRIP_STATUS),
    default: TRIP_STATUS.SCHEDULED,
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: [0, 'Total bookings cannot be negative'],
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: [0, 'Fare cannot be negative'],
  },
}, {
  timestamps: true,
});

// Index for better performance
tripSchema.index({ route: 1 });
tripSchema.index({ bus: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ departureDate: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ tripNumber: 1 });

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
