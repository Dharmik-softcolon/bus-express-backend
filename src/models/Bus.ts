import mongoose, { Schema, Document } from 'mongoose';
import { BUS_STATUS } from '../constants/index';

// Bus interface
export interface IBus extends Document {
  _id: string;
  busNumber: string;
  busName: string;
  operator: mongoose.Types.ObjectId;
  type: string; // AC, Non-AC, Sleeper, Semi-Sleeper
  totalSeats: number;
  availableSeats: number;
  amenities: string[];
  status: string;
  images: string[];
  features: {
    wifi: boolean;
    charging: boolean;
    blankets: boolean;
    water: boolean;
    snacks: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Bus schema
const busSchema = new Schema<IBus>({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  busName: {
    type: String,
    required: [true, 'Bus name is required'],
    trim: true,
    maxlength: [100, 'Bus name cannot exceed 100 characters'],
  },
  operator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Operator is required'],
  },
  type: {
    type: String,
    required: [true, 'Bus type is required'],
    enum: ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Volvo', 'Luxury'],
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1'],
    max: [100, 'Total seats cannot exceed 100'],
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    default: function() {
      return this.totalSeats;
    },
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: Object.values(BUS_STATUS),
    default: BUS_STATUS.ACTIVE,
  },
  images: [{
    type: String,
  }],
  features: {
    wifi: {
      type: Boolean,
      default: false,
    },
    charging: {
      type: Boolean,
      default: false,
    },
    blankets: {
      type: Boolean,
      default: false,
    },
    water: {
      type: Boolean,
      default: false,
    },
    snacks: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Index for better performance
busSchema.index({ operator: 1 });
busSchema.index({ status: 1 });
busSchema.index({ type: 1 });

export const Bus = mongoose.model<IBus>('Bus', busSchema);
